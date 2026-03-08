const Quiz = require('../models/Quiz');
const Round = require('../models/Round');

const QuizService = {
  async createQuiz({ title, quizmasterId, isPublic, numRounds }) {
    const quiz = await Quiz.create({ title, quizmasterId, isPublic, numRounds });
    // Create rounds
    for (let i = 1; i <= numRounds; i++) {
      // eslint-disable-next-line no-await-in-loop
      await Round.create({ quizId: quiz.id, roundNumber: i });
    }
    return quiz;
  },

  async activateQuiz(quizId, quizmasterId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new Error('Quiz not found.');
    if (quiz.quizmaster_id !== quizmasterId) throw new Error('Not authorized.');
    const hasActive = await Quiz.hasActiveQuiz(quizmasterId);
    if (hasActive && quiz.status !== 'paused') {
      throw new Error('You already have an active quiz. Finish it before starting another.');
    }
    await Quiz.updateStatus(quizId, 'lobby');
    return Quiz.findById(quizId);
  },

  async canActivate(quizmasterId, quizId) {
    const [rows] = await require('../config/database').execute(
      "SELECT id FROM quizzes WHERE quizmaster_id = ? AND status IN ('active', 'paused') AND id != ? LIMIT 1",
      [quizmasterId, quizId || 0],
    );
    return rows.length === 0;
  },

  async getQuizWithRounds(quizId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;
    const rounds = await Round.findByQuiz(quizId);
    for (const round of rounds) {
      // eslint-disable-next-line no-await-in-loop
      round.questions = await Round.getQuestions(round.id);
    }
    quiz.rounds = rounds;
    return quiz;
  },
};

module.exports = QuizService;
