const sinon = require('sinon');
const { expect } = require('chai');
const { socketRateLimiter, checkRate } = require('../../../src/websockets/socketRateLimiter');

describe('Socket Rate Limiter', () => {
  describe('checkRate', () => {
    it('should allow first request', () => {
      const socket = { id: 'test-1' };
      expect(checkRate(socket, 'test', 5)).to.be.true;
    });

    it('should allow requests within limit', () => {
      const socket = { id: 'test-2' };
      for (let i = 0; i < 5; i++) {
        expect(checkRate(socket, 'limit', 5)).to.be.true;
      }
    });

    it('should block requests exceeding limit', () => {
      const socket = { id: 'test-3' };
      for (let i = 0; i < 10; i++) {
        checkRate(socket, 'block', 5);
      }
      expect(checkRate(socket, 'block', 5)).to.be.false;
    });
  });

  describe('socketRateLimiter', () => {
    it('should call next', () => {
      const socket = { id: 'test-4', onevent: sinon.stub() };
      const next = sinon.stub();
      socketRateLimiter(socket, next);
      expect(next.calledOnce).to.be.true;
    });
  });
});
