const {
  generalLimiter,
  loginLimiter,
  accessCodeLimiter,
  passwordResetLimiter,
} = require('../config/rateLimiter');

module.exports = {
  generalLimiter,
  loginLimiter,
  accessCodeLimiter,
  passwordResetLimiter,
};
