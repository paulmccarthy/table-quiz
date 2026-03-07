const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(ensureAuthenticated);
router.use(requireRole('admin'));

router.get('/', UserController.listUsers);
router.post('/:id/role', [
  body('role').isIn(['admin', 'quizmaster', 'player']).withMessage('Invalid role.'),
], handleValidationErrors, UserController.updateRole);
router.post('/:id/reset-password', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
], handleValidationErrors, UserController.resetUserPassword);
router.post('/:id/delete', UserController.deleteUser);

module.exports = router;
