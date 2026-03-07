const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Round Model', () => {
  let Round;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    Round = proxyquire('../../../src/models/Round', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('create', () => {
    it('should create a round', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await Round.create({ quizId: 1, roundNumber: 1, numQuestions: 5 });
      expect(result.id).to.equal(1);
    });
  });

  describe('findById', () => {
    it('should return round', async () => {
      mockPool.execute.resolves([[{ id: 1, round_number: 1 }]]);
      const result = await Round.findById(1);
      expect(result.round_number).to.equal(1);
    });
  });

  describe('findByQuiz', () => {
    it('should return rounds ordered', async () => {
      mockPool.execute.resolves([[{ id: 1 }, { id: 2 }]]);
      const result = await Round.findByQuiz(1);
      expect(result).to.have.length(2);
    });
  });

  describe('addQuestion', () => {
    it('should add question to round', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await Round.addQuestion({ roundId: 1, questionId: 1, questionOrder: 1 });
      expect(result.id).to.equal(1);
    });
  });

  describe('removeQuestion', () => {
    it('should remove question from round', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Round.removeQuestion(1);
      expect(result).to.be.true;
    });
  });

  describe('getQuestions', () => {
    it('should return questions with parsed options', async () => {
      mockPool.execute.resolves([[{ id: 1, options: '["A","B"]' }]]);
      const result = await Round.getQuestions(1);
      expect(result[0].options).to.deep.equal(['A', 'B']);
    });
  });

  describe('update', () => {
    it('should update round', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Round.update(1, { numQuestions: 10 });
      expect(result).to.be.true;
    });
  });

  describe('deleteById', () => {
    it('should delete round', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Round.deleteById(1);
      expect(result).to.be.true;
    });
  });
});
