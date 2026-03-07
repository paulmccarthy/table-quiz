const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Answer Model', () => {
  let Answer;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    Answer = proxyquire('../../../src/models/Answer', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('upsert', () => {
    it('should insert or update an answer', async () => {
      mockPool.execute.resolves([{ insertId: 1, affectedRows: 1 }]);
      const result = await Answer.upsert({
        roundQuestionId: 1,
        userId: 1,
        teamId: null,
        answerType: 'choice',
        answerValue: 'A',
        drawingPath: null,
      });
      expect(result.id).to.exist;
      const sql = mockPool.execute.firstCall.args[0];
      expect(sql).to.include('ON DUPLICATE KEY UPDATE');
    });
  });

  describe('findByRoundQuestion', () => {
    it('should return answers for a round question', async () => {
      mockPool.execute.resolves([[{ id: 1, answer_value: 'A' }]]);
      const result = await Answer.findByRoundQuestion(1);
      expect(result).to.have.length(1);
    });
  });

  describe('findByUserAndRoundQuestion', () => {
    it('should return answer for user', async () => {
      mockPool.execute.resolves([[{ id: 1 }]]);
      const result = await Answer.findByUserAndRoundQuestion(1, 1);
      expect(result.id).to.equal(1);
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Answer.findByUserAndRoundQuestion(1, 1);
      expect(result).to.be.null;
    });
  });

  describe('markCorrect', () => {
    it('should mark answer as correct by quizmaster', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Answer.markCorrect(1, true, 'quizmaster');
      expect(result).to.be.true;
    });
  });

  describe('autoMark', () => {
    it('should auto-mark answer', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Answer.autoMark(1, true);
      expect(result).to.be.true;
      expect(mockPool.execute.firstCall.args[1]).to.include('auto');
    });
  });

  describe('findDrawingsByRound', () => {
    it('should return unreviewed drawings', async () => {
      mockPool.execute.resolves([[{ id: 1, answer_type: 'drawing', is_correct: null }]]);
      const result = await Answer.findDrawingsByRound(1);
      expect(result).to.have.length(1);
    });
  });

  describe('getExistingDrawingPath', () => {
    it('should return drawing path when exists', async () => {
      mockPool.execute.resolves([[{ drawing_path: '/uploads/drawings/test.png' }]]);
      const result = await Answer.getExistingDrawingPath(1, 1);
      expect(result).to.equal('/uploads/drawings/test.png');
    });

    it('should return null when no answer exists', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Answer.getExistingDrawingPath(1, 1);
      expect(result).to.be.null;
    });
  });

  describe('findByQuiz', () => {
    it('should return all answers for a quiz', async () => {
      mockPool.execute.resolves([[{ id: 1 }, { id: 2 }]]);
      const result = await Answer.findByQuiz(1);
      expect(result).to.have.length(2);
    });
  });
});
