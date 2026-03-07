const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Question Model', () => {
  let Question;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    Question = proxyquire('../../../src/models/Question', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('create', () => {
    it('should create a question', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await Question.create({
        text: 'What is 2+2?',
        contentType: 'text',
        answerType: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: '4',
        options: ['2', '3', '4', '5'],
        timeLimit: 30,
        createdBy: 1,
      });
      expect(result.id).to.equal(1);
      expect(result.text).to.equal('What is 2+2?');
    });

    it('should handle null options', async () => {
      mockPool.execute.resolves([{ insertId: 2 }]);
      const result = await Question.create({
        text: 'Draw a cat',
        answerType: 'drawing',
        createdBy: 1,
      });
      expect(result.id).to.equal(2);
    });
  });

  describe('findById', () => {
    it('should return question with parsed options', async () => {
      mockPool.execute.resolves([[{
        id: 1,
        text: 'Q1',
        options: '["A","B","C"]',
      }]]);
      const result = await Question.findById(1);
      expect(result.options).to.deep.equal(['A', 'B', 'C']);
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Question.findById(999);
      expect(result).to.be.null;
    });
  });

  describe('findByCreator', () => {
    it('should return questions for creator', async () => {
      mockPool.execute.resolves([[{ id: 1, options: null }]]);
      const result = await Question.findByCreator(1);
      expect(result).to.have.length(1);
    });
  });

  describe('update', () => {
    it('should update allowed fields', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Question.update(1, { text: 'Updated' });
      expect(result).to.be.true;
    });

    it('should return false for no valid fields', async () => {
      const result = await Question.update(1, { invalid: 'field' });
      expect(result).to.be.false;
    });
  });

  describe('deleteById', () => {
    it('should delete question', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Question.deleteById(1);
      expect(result).to.be.true;
    });
  });

  describe('findAll', () => {
    it('should return all questions', async () => {
      mockPool.execute.resolves([[{ id: 1, options: null }, { id: 2, options: '["x"]' }]]);
      const result = await Question.findAll();
      expect(result).to.have.length(2);
    });
  });
});
