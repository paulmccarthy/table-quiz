const sinon = require('sinon');
const { expect } = require('chai');
const { ensureAuthenticated, ensureEmailVerified } = require('../../../src/middleware/auth');

describe('Auth Middleware', () => {
  describe('ensureAuthenticated', () => {
    it('should call next when authenticated', () => {
      const req = { isAuthenticated: sinon.stub().returns(true) };
      const res = {};
      const next = sinon.stub();
      ensureAuthenticated(req, res, next);
      expect(next.calledOnce).to.be.true;
    });

    it('should redirect when not authenticated', () => {
      const req = {
        isAuthenticated: sinon.stub().returns(false),
        flash: sinon.stub(),
      };
      const res = { redirect: sinon.stub() };
      const next = sinon.stub();
      ensureAuthenticated(req, res, next);
      expect(next.called).to.be.false;
      expect(res.redirect.calledWith('/auth/login')).to.be.true;
    });
  });

  describe('ensureEmailVerified', () => {
    it('should call next when email is verified', () => {
      const req = { user: { email_verified: true } };
      const res = {};
      const next = sinon.stub();
      ensureEmailVerified(req, res, next);
      expect(next.calledOnce).to.be.true;
    });

    it('should redirect when email is not verified', () => {
      const req = {
        user: { email_verified: false },
        flash: sinon.stub(),
      };
      const res = { redirect: sinon.stub() };
      const next = sinon.stub();
      ensureEmailVerified(req, res, next);
      expect(res.redirect.calledWith('/auth/verify-email')).to.be.true;
    });
  });
});
