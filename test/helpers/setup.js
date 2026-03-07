const sinon = require('sinon');

// Common test setup
function createMockPool() {
  return {
    execute: sinon.stub().resolves([[], []]),
    query: sinon.stub().resolves([[], []]),
  };
}

function createMockReq(overrides = {}) {
  return {
    user: { id: 1, email: 'test@test.com', role: 'player', display_name: 'Test', email_verified: true },
    body: {},
    params: {},
    query: {},
    flash: sinon.stub(),
    isAuthenticated: sinon.stub().returns(true),
    logout: sinon.stub().callsFake((cb) => cb()),
    session: { passport: { user: 1 } },
    accepts: sinon.stub().returns(false),
    ...overrides,
  };
}

function createMockRes() {
  const res = {
    status: sinon.stub(),
    json: sinon.stub(),
    render: sinon.stub(),
    redirect: sinon.stub(),
    send: sinon.stub(),
    setHeader: sinon.stub(),
    locals: {},
  };
  res.status.returns(res);
  return res;
}

module.exports = { createMockPool, createMockReq, createMockRes };
