const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('QuizResult Model', () => {
  let QuizResult;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    QuizResult = proxyquire('../../../src/models/QuizResult', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('create', () => {
    it('should create quiz result', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await QuizResult.create({
        quizId: 1,
        quizTitle: 'Test',
        quizmasterId: 1,
        totalRounds: 3,
        totalQuestions: 15,
        resultData: { leaderboard: [] },
      });
      expect(result.id).to.equal(1);
    });
  });

  describe('findByQuiz', () => {
    it('should return result with parsed JSON', async () => {
      mockPool.execute.resolves([[{
        id: 1,
        result_data: '{"leaderboard":[]}',
      }]]);
      const result = await QuizResult.findByQuiz(1);
      expect(result.result_data).to.deep.equal({ leaderboard: [] });
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await QuizResult.findByQuiz(999);
      expect(result).to.be.null;
    });
  });

  describe('findByQuizmaster', () => {
    it('should return results for quizmaster', async () => {
      mockPool.execute.resolves([[{ id: 1, result_data: '{}' }]]);
      const result = await QuizResult.findByQuizmaster(1);
      expect(result).to.have.length(1);
    });
  });

  describe('findAll', () => {
    it('should return all results', async () => {
      mockPool.execute.resolves([[{ id: 1, result_data: '{}' }]]);
      const result = await QuizResult.findAll();
      expect(result).to.have.length(1);
    });
  });

  describe('findByPlayer', () => {
    it('should return results for player', async () => {
      mockPool.execute.resolves([[{ id: 1, result_data: '{}' }]]);
      const result = await QuizResult.findByPlayer(1);
      expect(result).to.have.length(1);
    });
  });
});
