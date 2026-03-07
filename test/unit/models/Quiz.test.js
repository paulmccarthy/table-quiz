const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Quiz Model', () => {
  let Quiz;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    Quiz = proxyquire('../../../src/models/Quiz', {
      '../config/database': mockPool,
      'uuid': { v4: () => 'test-uuid-token' },
      'crypto': { randomBytes: () => ({ toString: () => 'ABCD1234' }) },
    });
  });

  afterEach(() => sinon.restore());

  describe('create', () => {
    it('should create a quiz with access code and invite token', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await Quiz.create({
        title: 'Test Quiz',
        quizmasterId: 1,
        isPublic: false,
        numRounds: 3,
      });
      expect(result.id).to.equal(1);
      expect(result.title).to.equal('Test Quiz');
      expect(result.accessCode).to.be.a('string');
      expect(result.inviteToken).to.be.a('string');
      expect(result.status).to.equal('draft');
    });
  });

  describe('findById', () => {
    it('should return quiz when found', async () => {
      mockPool.execute.resolves([[{ id: 1, title: 'Test' }]]);
      const result = await Quiz.findById(1);
      expect(result.title).to.equal('Test');
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Quiz.findById(999);
      expect(result).to.be.null;
    });
  });

  describe('findByAccessCode', () => {
    it('should find quiz by access code', async () => {
      mockPool.execute.resolves([[{ id: 1, access_code: 'ABC123' }]]);
      const result = await Quiz.findByAccessCode('ABC123');
      expect(result.access_code).to.equal('ABC123');
    });
  });

  describe('findByInviteToken', () => {
    it('should find quiz by invite token', async () => {
      mockPool.execute.resolves([[{ id: 1, invite_token: 'tok' }]]);
      const result = await Quiz.findByInviteToken('tok');
      expect(result.invite_token).to.equal('tok');
    });
  });

  describe('hasActiveQuiz', () => {
    it('should return true when quizmaster has active quiz', async () => {
      mockPool.execute.resolves([[{ id: 1 }]]);
      const result = await Quiz.hasActiveQuiz(1);
      expect(result).to.be.true;
    });

    it('should return false when no active quiz', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Quiz.hasActiveQuiz(1);
      expect(result).to.be.false;
    });
  });

  describe('updateStatus', () => {
    it('should update quiz status', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Quiz.updateStatus(1, 'active');
      expect(result).to.be.true;
    });
  });

  describe('update', () => {
    it('should update allowed fields', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Quiz.update(1, { title: 'Updated', is_public: true });
      expect(result).to.be.true;
    });

    it('should reject disallowed fields', async () => {
      const result = await Quiz.update(1, { id: 999 });
      expect(result).to.be.false;
    });
  });

  describe('regenerateInviteToken', () => {
    it('should generate new invite token', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const token = await Quiz.regenerateInviteToken(1);
      expect(token).to.be.a('string');
    });
  });

  describe('deleteById', () => {
    it('should delete quiz', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Quiz.deleteById(1);
      expect(result).to.be.true;
    });
  });

  describe('findByQuizmaster', () => {
    it('should return quizzes for quizmaster', async () => {
      mockPool.execute.resolves([[{ id: 1 }, { id: 2 }]]);
      const result = await Quiz.findByQuizmaster(1);
      expect(result).to.have.length(2);
    });
  });

  describe('findAll', () => {
    it('should return all quizzes', async () => {
      mockPool.execute.resolves([[{ id: 1 }]]);
      const result = await Quiz.findAll();
      expect(result).to.have.length(1);
    });
  });

  describe('findPublic', () => {
    it('should return public quizzes', async () => {
      mockPool.execute.resolves([[{ id: 1, is_public: true }]]);
      const result = await Quiz.findPublic();
      expect(result[0].is_public).to.be.true;
    });
  });
});
