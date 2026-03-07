const sinon = require('sinon');
const { expect } = require('chai');
const QuizRuntimeService = require('../../../src/services/quizRuntimeService');
const { QuizRuntime } = require('../../../src/services/quizRuntimeService');

describe('QuizRuntimeService', () => {
  afterEach(() => {
    // Clean up any active runtimes
    QuizRuntimeService.getActiveQuizzes().forEach((id) => {
      QuizRuntimeService.removeRuntime(id);
    });
    sinon.restore();
  });

  describe('QuizRuntime', () => {
    let runtime;
    const quizData = {
      rounds: [
        {
          id: 1,
          questions: [
            { round_question_id: 1, text: 'Q1', time_limit: 10, correct_answer: 'A' },
            { round_question_id: 2, text: 'Q2', time_limit: 0, correct_answer: 'B' },
          ],
        },
        {
          id: 2,
          questions: [
            { round_question_id: 3, text: 'Q3', time_limit: 5, correct_answer: 'C' },
          ],
        },
      ],
    };

    beforeEach(() => {
      runtime = new QuizRuntime(1, quizData);
    });

    afterEach(() => {
      runtime.destroy();
    });

    it('should initialize with lobby status', () => {
      expect(runtime.status).to.equal('lobby');
      expect(runtime.currentRound).to.equal(0);
      expect(runtime.currentQuestion).to.equal(0);
    });

    it('should start quiz', () => {
      runtime.startQuiz();
      expect(runtime.status).to.equal('active');
    });

    it('should get current round data', () => {
      runtime.startQuiz();
      const round = runtime.getCurrentRoundData();
      expect(round).to.exist;
      expect(round.questions).to.have.length(2);
    });

    it('should get current question data', () => {
      runtime.startQuiz();
      const question = runtime.getCurrentQuestionData();
      expect(question.text).to.equal('Q1');
    });

    it('should advance question within round', () => {
      runtime.startQuiz();
      const result = runtime.advanceQuestion();
      expect(result.roundComplete).to.be.false;
      expect(runtime.currentQuestion).to.equal(1);
    });

    it('should detect round completion', () => {
      runtime.startQuiz();
      runtime.advanceQuestion(); // Q1 -> Q2
      const result = runtime.advanceQuestion(); // Q2 -> end of round
      expect(result.roundComplete).to.be.true;
      expect(result.roundIndex).to.equal(0);
    });

    it('should advance round', () => {
      runtime.startQuiz();
      const result = runtime.advanceRound();
      expect(result.quizComplete).to.be.false;
      expect(runtime.currentRound).to.equal(1);
      expect(runtime.currentQuestion).to.equal(0);
    });

    it('should detect quiz completion', () => {
      runtime.startQuiz();
      runtime.advanceRound(); // Round 1 -> 2
      const result = runtime.advanceRound(); // Round 2 -> end
      expect(result.quizComplete).to.be.true;
      expect(runtime.status).to.equal('completed');
    });

    it('should pause and resume', () => {
      runtime.startQuiz();
      runtime.pauseQuiz();
      expect(runtime.status).to.equal('paused');
      runtime.resumeQuiz();
      expect(runtime.status).to.equal('active');
    });

    it('should track players', () => {
      runtime.registerPlayer(1, 'socket1');
      expect(runtime.isPlayerConnected(1)).to.be.true;
      expect(runtime.connectedPlayers.size).to.equal(1);
      runtime.removePlayer(1);
      expect(runtime.isPlayerConnected(1)).to.be.false;
    });

    it('should return state', () => {
      runtime.startQuiz();
      const state = runtime.getState();
      expect(state.quizId).to.equal(1);
      expect(state.status).to.equal('active');
      expect(state.currentRound).to.equal(0);
      expect(state.currentQuestion).to.equal(0);
    });

    it('should handle timer', (done) => {
      runtime.startQuiz();
      let ticked = false;
      runtime.startTimer(2, () => { ticked = true; }, () => {
        expect(ticked).to.be.true;
        done();
      });
    }).timeout(5000);

    it('should stop timer', () => {
      runtime.startQuiz();
      runtime.startTimer(10, () => {}, () => {});
      runtime.stopTimer();
      expect(runtime.timerInterval).to.be.null;
    });

    it('should return null for out-of-bounds round', () => {
      runtime.startQuiz();
      runtime.currentRound = 99;
      expect(runtime.getCurrentRoundData()).to.be.null;
    });

    it('should return null for out-of-bounds question', () => {
      runtime.startQuiz();
      runtime.currentQuestion = 99;
      expect(runtime.getCurrentQuestionData()).to.be.null;
    });
  });

  describe('QuizRuntimeService', () => {
    it('should create and retrieve runtime', () => {
      const runtime = QuizRuntimeService.createRuntime(99, { rounds: [] });
      expect(runtime).to.exist;
      expect(QuizRuntimeService.getRuntime(99)).to.equal(runtime);
    });

    it('should remove runtime', () => {
      QuizRuntimeService.createRuntime(98, { rounds: [] });
      QuizRuntimeService.removeRuntime(98);
      expect(QuizRuntimeService.getRuntime(98)).to.be.null;
    });

    it('should return null for non-existent runtime', () => {
      expect(QuizRuntimeService.getRuntime(999)).to.be.null;
    });

    it('should list active quizzes', () => {
      QuizRuntimeService.createRuntime(97, { rounds: [] });
      const active = QuizRuntimeService.getActiveQuizzes();
      expect(active).to.include(97);
    });

    it('should handle removing non-existent runtime', () => {
      QuizRuntimeService.removeRuntime(888); // Should not throw
    });
  });
});
