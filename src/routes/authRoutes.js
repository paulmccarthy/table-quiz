const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { handleValidationErrors } = require('../middleware/validation');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/login', AuthController.getLogin);
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
], handleValidationErrors, AuthController.postLogin);

router.get('/register', AuthController.getRegister);
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('displayName').optional().trim().escape(),
], handleValidationErrors, AuthController.postRegister);

router.get('/logout', AuthController.logout);

router.get('/reset-password', AuthController.getResetPassword);
router.post('/reset-password', passwordResetLimiter, [
  body('email').isEmail().withMessage('Valid email required.'),
], handleValidationErrors, AuthController.postRequestReset);

router.get('/reset-password/:token', AuthController.getResetPasswordToken);
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
], handleValidationErrors, AuthController.postResetPassword);

router.get('/verify-email', AuthController.getVerifyEmail);
router.get('/verify-email/:token', AuthController.getVerifyEmail);

// OAuth
router.get('/facebook', AuthController.facebookAuth);
router.get('/facebook/callback', AuthController.facebookCallback);
router.get('/github', AuthController.githubAuth);
router.get('/github/callback', AuthController.githubCallback);

module.exports = router;
