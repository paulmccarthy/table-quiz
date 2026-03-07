const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('User Model', () => {
  let User;
  let mockPool;
  let bcryptStub;

  beforeEach(() => {
    mockPool = {
      execute: sinon.stub(),
    };
    bcryptStub = {
      hash: sinon.stub().resolves('hashedpassword'),
      compare: sinon.stub().resolves(true),
    };
    User = proxyquire('../../../src/models/User', {
      '../config/database': mockPool,
      'bcryptjs': bcryptStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await User.create({
        email: 'test@test.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'player',
      });
      expect(result.id).to.equal(1);
      expect(result.email).to.equal('test@test.com');
      expect(bcryptStub.hash.calledOnce).to.be.true;
      expect(mockPool.execute.calledOnce).to.be.true;
    });

    it('should create a user without password for OAuth', async () => {
      mockPool.execute.resolves([{ insertId: 2 }]);
      const result = await User.create({
        email: 'oauth@test.com',
        displayName: 'OAuth User',
      });
      expect(result.id).to.equal(2);
      expect(bcryptStub.hash.called).to.be.false;
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      mockPool.execute.resolves([[mockUser]]);
      const result = await User.findById(1);
      expect(result).to.deep.equal(mockUser);
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await User.findById(999);
      expect(result).to.be.null;
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      mockPool.execute.resolves([[mockUser]]);
      const result = await User.findByEmail('test@test.com');
      expect(result).to.deep.equal(mockUser);
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await User.findByEmail('none@test.com');
      expect(result).to.be.null;
    });
  });

  describe('findByOAuth', () => {
    it('should find user by provider and id', async () => {
      const mockUser = { id: 1, oauth_provider: 'github', oauth_id: '123' };
      mockPool.execute.resolves([[mockUser]]);
      const result = await User.findByOAuth('github', '123');
      expect(result).to.deep.equal(mockUser);
    });
  });

  describe('createOAuth', () => {
    it('should create OAuth user with email verified', async () => {
      mockPool.execute.resolves([{ insertId: 3 }]);
      const result = await User.createOAuth({
        email: 'oauth@test.com',
        displayName: 'OAuth',
        provider: 'github',
        oauthId: '456',
      });
      expect(result.id).to.equal(3);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await User.verifyEmail('valid-token');
      expect(result).to.be.true;
    });

    it('should return false for invalid token', async () => {
      mockPool.execute.resolves([{ affectedRows: 0 }]);
      const result = await User.verifyEmail('invalid-token');
      expect(result).to.be.false;
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const result = await User.comparePassword('password', 'hash');
      expect(result).to.be.true;
      expect(bcryptStub.compare.calledWith('password', 'hash')).to.be.true;
    });

    it('should return false for non-matching password', async () => {
      bcryptStub.compare.resolves(false);
      const result = await User.comparePassword('wrong', 'hash');
      expect(result).to.be.false;
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      await User.updatePassword(1, 'newpass');
      expect(bcryptStub.hash.calledOnce).to.be.true;
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('setResetToken', () => {
    it('should set reset token', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await User.setResetToken('test@test.com', 'token', new Date());
      expect(result).to.be.true;
    });
  });

  describe('findByResetToken', () => {
    it('should find user by valid reset token', async () => {
      const mockUser = { id: 1, reset_token: 'token' };
      mockPool.execute.resolves([[mockUser]]);
      const result = await User.findByResetToken('token');
      expect(result).to.deep.equal(mockUser);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      await User.updateRole(1, 'quizmaster');
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('updatePasskeyCredential', () => {
    it('should update passkey credential', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      await User.updatePasskeyCredential(1, { key: 'value' });
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1 }, { id: 2 }];
      mockPool.execute.resolves([users]);
      const result = await User.findAll();
      expect(result).to.have.length(2);
    });
  });

  describe('deleteById', () => {
    it('should delete user and return true', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await User.deleteById(1);
      expect(result).to.be.true;
    });

    it('should return false when user not found', async () => {
      mockPool.execute.resolves([{ affectedRows: 0 }]);
      const result = await User.deleteById(999);
      expect(result).to.be.false;
    });
  });
});
