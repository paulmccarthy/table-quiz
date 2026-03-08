const passport = require('passport');
const AuthService = require('../services/authService');
const AppSettings = require('../models/AppSettings');

const AuthController = {
  async getLogin(req, res) {
    const oauth = await AppSettings.getOAuthSettings();
    res.render('auth/login', { title: 'Login', oauth });
  },

  postLogin(req, res, next) {
    passport.authenticate('local', {
      successRedirect: '/quiz',
      failureRedirect: '/auth/login',
      failureFlash: true,
    })(req, res, next);
  },

  getRegister(req, res) {
    res.render('auth/register', { title: 'Register' });
  },

  async postRegister(req, res) {
    try {
      const { email, password, displayName } = req.body;
      await AuthService.register({ email, password, displayName });
      req.flash('success', 'Registration successful. Please check your email to verify your account.');
      res.redirect('/auth/login');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/auth/register');
    }
  },

  logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      req.flash('success', 'You have been logged out.');
      res.redirect('/auth/login');
    });
  },

  getResetPassword(req, res) {
    res.render('auth/resetPassword', { title: 'Reset Password', token: null });
  },

  async postRequestReset(req, res) {
    try {
      await AuthService.requestPasswordReset(req.body.email);
      req.flash('success', 'If an account exists with that email, a reset link has been sent.');
      res.redirect('/auth/login');
    } catch { // error intentionally not used - generic message shown
      req.flash('error', 'An error occurred.');
      res.redirect('/auth/reset-password');
    }
  },

  getResetPasswordToken(req, res) {
    res.render('auth/resetPassword', { title: 'Reset Password', token: req.params.token });
  },

  async postResetPassword(req, res) {
    try {
      await AuthService.resetPassword(req.params.token, req.body.password);
      req.flash('success', 'Password has been reset. Please log in.');
      res.redirect('/auth/login');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/auth/reset-password');
    }
  },

  async getVerifyEmail(req, res) {
    if (!req.params.token) {
      return res.render('auth/verifyEmail', { title: 'Verify Email' });
    }
    try {
      await AuthService.verifyEmail(req.params.token);
      req.flash('success', 'Email verified successfully.');
      res.redirect('/auth/login');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/auth/login');
    }
  },

  // OAuth callbacks
  facebookAuth: passport.authenticate('facebook', { scope: ['email'] }),
  facebookCallback(req, res, next) {
    passport.authenticate('facebook', {
      successRedirect: '/quiz',
      failureRedirect: '/auth/login',
      failureFlash: true,
    })(req, res, next);
  },

  githubAuth: passport.authenticate('github', { scope: ['user:email'] }),
  githubCallback(req, res, next) {
    passport.authenticate('github', {
      successRedirect: '/quiz',
      failureRedirect: '/auth/login',
      failureFlash: true,
    })(req, res, next);
  },
};

module.exports = AuthController;
