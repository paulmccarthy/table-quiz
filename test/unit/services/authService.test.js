const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('AuthService', () => {
  let AuthService;
  let mockUser;
  let mockEmail;
  let mockAppSettings;

  beforeEach(() => {
    mockUser = {
      findByEmail: sinon.stub(),
      create: sinon.stub(),
      findByResetToken: sinon.stub(),
      updatePassword: sinon.stub(),
      verifyEmail: sinon.stub(),
      comparePassword: sinon.stub(),
      setResetToken: sinon.stub(),
    };
    mockEmail = {
      sendVerificationEmail: sinon.stub().resolves(),
      sendPasswordResetEmail: sinon.stub().resolves(),
    };
    mockAppSettings = {
      isEmailVerificationEnabled: sinon.stub().resolves(true),
    };
    AuthService = proxyquire('../../../src/services/authService', {
      '../models/User': mockUser,
      './emailService': mockEmail,
      '../models/AppSettings': mockAppSettings,
    });
  });

  afterEach(() => sinon.restore());

  describe('register', () => {
    it('should register new user and send verification email', async () => {
      mockUser.findByEmail.resolves(null);
      mockUser.create.resolves({ id: 1, email: 'test@test.com', verificationToken: 'tok' });
      const result = await AuthService.register({
        email: 'test@test.com',
        password: 'password',
        displayName: 'Test',
      });
      expect(result.id).to.equal(1);
      expect(mockEmail.sendVerificationEmail.calledOnce).to.be.true;
    });

    it('should auto-verify when email verification is disabled', async () => {
      mockAppSettings.isEmailVerificationEnabled.resolves(false);
      mockUser.findByEmail.resolves(null);
      mockUser.create.resolves({ id: 1, email: 'test@test.com', verificationToken: 'tok' });
      mockUser.verifyEmail.resolves(true);
      const result = await AuthService.register({
        email: 'test@test.com',
        password: 'password',
        displayName: 'Test',
      });
      expect(result.id).to.equal(1);
      expect(mockEmail.sendVerificationEmail.called).to.be.false;
      expect(mockUser.verifyEmail.calledWith('tok')).to.be.true;
    });

    it('should throw when email exists', async () => {
      mockUser.findByEmail.resolves({ id: 1 });
      try {
        await AuthService.register({ email: 'test@test.com', password: 'pass' });
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('already registered');
      }
    });
  });

  describe('login', () => {
    it('should return user for valid credentials', async () => {
      mockUser.findByEmail.resolves({ id: 1, password_hash: 'hash' });
      mockUser.comparePassword.resolves(true);
      const result = await AuthService.login('test@test.com', 'pass');
      expect(result.id).to.equal(1);
    });

    it('should throw for invalid email', async () => {
      mockUser.findByEmail.resolves(null);
      try {
        await AuthService.login('bad@test.com', 'pass');
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('Invalid');
      }
    });

    it('should throw for wrong password', async () => {
      mockUser.findByEmail.resolves({ id: 1, password_hash: 'hash' });
      mockUser.comparePassword.resolves(false);
      try {
        await AuthService.login('test@test.com', 'wrong');
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('Invalid');
      }
    });
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      mockUser.findByEmail.resolves({ id: 1 });
      mockUser.setResetToken.resolves(true);
      await AuthService.requestPasswordReset('test@test.com');
      expect(mockEmail.sendPasswordResetEmail.calledOnce).to.be.true;
    });

    it('should silently succeed for non-existent email', async () => {
      mockUser.findByEmail.resolves(null);
      await AuthService.requestPasswordReset('none@test.com');
      expect(mockEmail.sendPasswordResetEmail.called).to.be.false;
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockUser.findByResetToken.resolves({ id: 1 });
      mockUser.updatePassword.resolves();
      await AuthService.resetPassword('valid-token', 'newpass');
      expect(mockUser.updatePassword.calledOnce).to.be.true;
    });

    it('should throw for invalid token', async () => {
      mockUser.findByResetToken.resolves(null);
      try {
        await AuthService.resetPassword('bad-token', 'newpass');
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('Invalid');
      }
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockUser.verifyEmail.resolves(true);
      const result = await AuthService.verifyEmail('valid-token');
      expect(result).to.be.true;
    });

    it('should throw for invalid token', async () => {
      mockUser.verifyEmail.resolves(false);
      try {
        await AuthService.verifyEmail('bad-token');
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('Invalid');
      }
    });
  });
});
