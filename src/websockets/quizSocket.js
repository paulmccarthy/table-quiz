const QuizRuntimeService = require('../services/quizRuntimeService');
const QuizService = require('../services/quizService');
const ScoreService = require('../services/scoreService');
const Answer = require('../models/Answer');
const Quiz = require('../models/Quiz');
const Team = require('../models/Team');
const StorageService = require('../services/storageService');

function emitQuestion(ns, quizId, runtime, question) {
  ns.to(`quiz:${quizId}`).emit('question:show', {
    roundQuestionId: question.round_question_id,
    text: question.text,
    contentType: question.content_type,
    answerType: question.answer_type,
    options: question.options,
    mediaPath: question.media_path,
    questionOrder: question.question_order,
    timeLimit: question.time_limit,
    roundNumber: runtime.currentRound + 1,
  });

  if (question.time_limit && question.time_limit > 0) {
    runtime.startTimer(
      question.time_limit,
      (remaining) => {
        ns.to(`quiz:${quizId}`).emit('timer:tick', { remaining });
      },
      () => handleTimerExpire(ns, quizId, runtime),
    );
  }
}

async function handleTimerExpire(ns, quizId, runtime) {
  await processCurrentQuestion(ns, quizId, runtime);
}

async function processCurrentQuestion(ns, quizId, runtime) {
  const question = runtime.getCurrentQuestionData();
  if (question) {
    await ScoreService.autoMarkAnswers(
      question.round_question_id,
      question.correct_answer,
      question.answer_type,
    );
  }

  const result = runtime.advanceQuestion();

  if (result.roundComplete) {
    const round = runtime.rounds[result.roundIndex];
    await ScoreService.calculateRoundScores(quizId, round.id);
    const leaderboard = await ScoreService.getLeaderboard(quizId);
    const roundLeaderboard = await ScoreService.getRoundLeaderboard(quizId, round.id);
    const pendingDrawings = await Answer.findDrawingsByRound(round.id);

    ns.to(`quiz:${quizId}`).emit('round:complete', {
      roundNumber: result.roundIndex + 1,
      roundLeaderboard,
      leaderboard,
      pendingDrawings: pendingDrawings.length,
    });

    const roundResult = runtime.advanceRound();
    if (roundResult.quizComplete) {
      await Quiz.updateStatus(quizId, 'completed');
      ns.to(`quiz:${quizId}`).emit('quiz:completed', { leaderboard });
      const QuizResult = require('../models/QuizResult');
      const quiz = await Quiz.findById(quizId);
      await QuizResult.create({
        quizId,
        quizTitle: quiz.title,
        quizmasterId: quiz.quizmaster_id,
        totalRounds: runtime.rounds.length,
        totalQuestions: runtime.rounds.reduce((sum, r) => sum + r.questions.length, 0),
        resultData: { leaderboard },
      });
      QuizRuntimeService.removeRuntime(quizId);
    } else {
      const nextQuestion = runtime.getCurrentQuestionData();
      if (nextQuestion) {
        ns.to(`quiz:${quizId}`).emit('round:start', {
          roundNumber: runtime.currentRound + 1,
        });
        emitQuestion(ns, quizId, runtime, nextQuestion);
      }
    }
  } else {
    const nextQuestion = runtime.getCurrentQuestionData();
    if (nextQuestion) {
      emitQuestion(ns, quizId, runtime, nextQuestion);
    }
  }
}

function setupQuizSocket(io) {
  const quizNamespace = io.of('/quiz');

  quizNamespace.on('connection', (socket) => {
    const { user } = socket.request;
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.on('quiz:join', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found.' });
          return;
        }

        socket.join(`quiz:${quizId}`);
        socket.quizId = quizId;

        const runtime = QuizRuntimeService.getRuntime(quizId);
        if (runtime) {
          runtime.registerPlayer(user.id, socket.id);
          const state = runtime.getState();
          const question = runtime.getCurrentQuestionData();
          const existingAnswer = question
            ? await Answer.findByUserAndRoundQuestion(user.id, question.round_question_id)
            : null;
          socket.emit('quiz:sync', {
            ...state,
            currentQuestionData: question ? {
              text: question.text,
              content_type: question.content_type,
              answer_type: question.answer_type,
              options: question.options,
              media_path: question.media_path,
              question_order: question.question_order,
            } : null,
            existingAnswer: existingAnswer ? {
              answerValue: existingAnswer.answer_value,
              answerType: existingAnswer.answer_type,
            } : null,
          });
        }

        quizNamespace.to(`quiz:${quizId}`).emit('player:joined', {
          userId: user.id,
          displayName: user.display_name,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('quiz:start', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || (quiz.quizmaster_id !== user.id && user.role !== 'admin')) {
          socket.emit('error', { message: 'Not authorized.' });
          return;
        }

        const canActivate = await QuizService.canActivate(user.id, quizId);
        if (!canActivate) {
          socket.emit('error', { message: 'You already have another active quiz.' });
          return;
        }

        const quizData = await QuizService.getQuizWithRounds(quizId);
        const runtime = QuizRuntimeService.createRuntime(quizId, quizData);
        runtime.startQuiz();
        await Quiz.updateStatus(quizId, 'active');

        quizNamespace.to(`quiz:${quizId}`).emit('quiz:started', {
          state: runtime.getState(),
        });

        const question = runtime.getCurrentQuestionData();
        if (question) {
          emitQuestion(quizNamespace, quizId, runtime, question);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('quiz:pause', async ({ quizId }) => {
      const runtime = QuizRuntimeService.getRuntime(quizId);
      if (!runtime) return;
      const quiz = await Quiz.findById(quizId);
      if (quiz.quizmaster_id !== user.id && user.role !== 'admin') return;

      runtime.pauseQuiz();
      await Quiz.updateStatus(quizId, 'paused');
      quizNamespace.to(`quiz:${quizId}`).emit('quiz:paused', { state: runtime.getState() });
    });

    socket.on('quiz:resume', async ({ quizId }) => {
      const runtime = QuizRuntimeService.getRuntime(quizId);
      if (!runtime) return;
      const quiz = await Quiz.findById(quizId);
      if (quiz.quizmaster_id !== user.id && user.role !== 'admin') return;

      runtime.resumeQuiz(
        (remaining) => {
          quizNamespace.to(`quiz:${quizId}`).emit('timer:tick', { remaining });
        },
        () => handleTimerExpire(quizNamespace, quizId, runtime),
      );
      await Quiz.updateStatus(quizId, 'active');
      quizNamespace.to(`quiz:${quizId}`).emit('quiz:resumed', { state: runtime.getState() });
    });

    socket.on('quiz:nextQuestion', async ({ quizId }) => {
      const runtime = QuizRuntimeService.getRuntime(quizId);
      if (!runtime) return;
      const quiz = await Quiz.findById(quizId);
      if (quiz.quizmaster_id !== user.id && user.role !== 'admin') return;

      await processCurrentQuestion(quizNamespace, quizId, runtime);
    });

    socket.on('answer:submit', async ({
      quizId, answerType, answerValue, drawingData,
    }) => {
      try {
        const runtime = QuizRuntimeService.getRuntime(quizId);
        if (!runtime || runtime.status !== 'active') {
          socket.emit('error', { message: 'Quiz is not active.' });
          return;
        }

        const question = runtime.getCurrentQuestionData();
        if (!question) {
          socket.emit('error', { message: 'No active question.' });
          return;
        }

        let drawingPath = null;
        if (answerType === 'drawing' && drawingData) {
          const oldPath = await Answer.getExistingDrawingPath(
            user.id,
            question.round_question_id,
          );
          if (oldPath) {
            await StorageService.deleteFile(oldPath);
          }
          const buffer = Buffer.from(
            drawingData.replace(/^data:image\/\w+;base64,/, ''),
            'base64',
          );
          drawingPath = await StorageService.saveDrawing(buffer, 'drawing.png');
        }

        const team = await Team.findByUserAndQuiz(user.id, quizId);

        await Answer.upsert({
          roundQuestionId: question.round_question_id,
          userId: user.id,
          teamId: team ? team.id : null,
          answerType,
          answerValue: answerType !== 'drawing' ? answerValue : null,
          drawingPath,
        });

        socket.emit('answer:received', { success: true });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('drawing:mark', async ({ answerId, isCorrect }) => {
      try {
        await Answer.markCorrect(answerId, isCorrect, 'quizmaster');
        socket.emit('drawing:marked', { answerId, isCorrect });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      if (socket.quizId) {
        const runtime = QuizRuntimeService.getRuntime(socket.quizId);
        if (runtime) {
          runtime.removePlayer(user.id);
          quizNamespace.to(`quiz:${socket.quizId}`).emit('player:disconnected', {
            userId: user.id,
            displayName: user.display_name,
          });
        }
      }
    });
  });
}

module.exports = setupQuizSocket;
