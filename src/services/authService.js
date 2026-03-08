const crypto = require('crypto');
const User = require('../models/User');
const EmailService = require('./emailService');
const AppSettings = require('../models/AppSettings');

const AuthService = {
  async register({ email, password, displayName, role = 'player' }) {
    const existing = await User.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered.');
    }
    const user = await User.create({ email, password, displayName, role });
    const emailVerificationEnabled = await AppSettings.isEmailVerificationEnabled();
    if (emailVerificationEnabled) {
      await EmailService.sendVerificationEmail(email, user.verificationToken);
    } else {
      // Auto-verify when email verification is disabled
      await User.verifyEmail(user.verificationToken);
    }
    return user;
  },

  async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password.');
    }
    const valid = await User.comparePassword(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password.');
    }
    return user;
  },

  async requestPasswordReset(email) {
    const user = await User.findByEmail(email);
    if (!user) return; // Silent fail for security
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await User.setResetToken(email, token, expires);
    await EmailService.sendPasswordResetEmail(email, token);
  },

  async resetPassword(token, newPassword) {
    const user = await User.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token.');
    }
    await User.updatePassword(user.id, newPassword);
  },

  async verifyEmail(token) {
    const result = await User.verifyEmail(token);
    if (!result) {
      throw new Error('Invalid verification token.');
    }
    return result;
  },
};

module.exports = AuthService;
