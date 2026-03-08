const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Roles Middleware', () => {
  let requireRole;
  let requireQuizOwnerOrAdmin;

  beforeEach(() => {
    const roles = proxyquire('../../../src/middleware/roles', {
      '../models/Quiz': {
        findById: sinon.stub().resolves({ id: 1, quizmaster_id: 1 }),
      },
    });
    ({ requireRole, requireQuizOwnerOrAdmin } = roles);
  });

  describe('requireRole', () => {
    it('should call next when user has required role', () => {
      const middleware = requireRole('quizmaster');
      const req = { user: { role: 'quizmaster' } };
      const res = {};
      const next = sinon.stub();
      middleware(req, res, next);
      expect(next.calledOnce).to.be.true;
    });

    it('should allow admin for any role', () => {
      const middleware = requireRole('quizmaster');
      const req = { user: { role: 'admin' } };
      const res = {};
      const next = sinon.stub();
      middleware(req, res, next);
      expect(next.calledOnce).to.be.true;
    });

    it('should deny when user lacks role', () => {
      const middleware = requireRole('quizmaster');
      const req = { user: { role: 'player' } };
      const res = {
        status: sinon.stub().returnsThis(),
        render: sinon.stub(),
      };
      const next = sinon.stub();
      middleware(req, res, next);
      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
    });

    it('should redirect when no user', () => {
      const middleware = requireRole('quizmaster');
      const req = { user: null, flash: sinon.stub() };
      const res = { redirect: sinon.stub() };
      const next = sinon.stub();
      middleware(req, res, next);
      expect(res.redirect.calledWith('/auth/login')).to.be.true;
    });
  });

  describe('requireQuizOwnerOrAdmin', () => {
    it('should allow admin', async () => {
      const middleware = requireQuizOwnerOrAdmin();
      const req = { user: { id: 99, role: 'admin' }, params: { id: 1 } };
      const res = {};
      const next = sinon.stub();
      await middleware(req, res, next);
      expect(next.calledOnce).to.be.true;
    });
  });
});
