const express = require('express');
const { body } = require('express-validator');
const QuizController = require('../controllers/quizController');
const RoundController = require('../controllers/roundController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireRole, requireQuizOwnerOrAdmin } = require('../middleware/roles');
const { handleValidationErrors } = require('../middleware/validation');
const { accessCodeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Per-quiz login (public - no auth required)
router.get('/join/:inviteToken', QuizController.getQuizLogin);

// All other routes require auth
router.use(ensureAuthenticated);

router.get('/', QuizController.list);

// Join routes
router.post('/join', accessCodeLimiter, [
  body('accessCode').notEmpty().withMessage('Access code required.'),
], handleValidationErrors, QuizController.postJoinByCode);

router.post('/join/:inviteToken', QuizController.postJoinByToken);

// CRUD - quizmaster/admin only
router.get('/create', requireRole('quizmaster', 'admin'), QuizController.getCreate);
router.post('/create', requireRole('quizmaster', 'admin'), [
  body('title').notEmpty().trim().escape().withMessage('Title required.'),
  body('numRounds').isInt({ min: 1 }).withMessage('At least 1 round required.'),
], handleValidationErrors, QuizController.postCreate);

router.get('/:id/edit', requireQuizOwnerOrAdmin(), QuizController.getEdit);
router.post('/:id/edit', requireQuizOwnerOrAdmin(), QuizController.postUpdate);
router.post('/:id/delete', requireQuizOwnerOrAdmin(), QuizController.delete);

// Quiz flow
router.post('/:id/activate', requireQuizOwnerOrAdmin(), QuizController.activate);
router.get('/:id/lobby', ensureAuthenticated, QuizController.getLobby);
router.get('/:id/play', ensureAuthenticated, QuizController.getPlay);

// Invitations
router.get('/:id/invite', requireQuizOwnerOrAdmin(), QuizController.getInvite);
router.post('/:id/invite/send', requireQuizOwnerOrAdmin(), [
  body('email').isEmail().withMessage('Valid email required.'),
], handleValidationErrors, QuizController.sendInviteEmail);
router.post('/:id/invite/regenerate', requireQuizOwnerOrAdmin(), QuizController.regenerateInviteToken);

// Admit players
router.post('/:id/admit/:userId', requireQuizOwnerOrAdmin(), QuizController.admitPlayer);

// Rounds
router.post('/:quizId/rounds/add', requireQuizOwnerOrAdmin('quizId'), RoundController.addRound);
router.post('/:quizId/rounds/:roundId/delete', requireQuizOwnerOrAdmin('quizId'), RoundController.deleteRound);
router.post('/:quizId/rounds/:roundId/questions/add', requireQuizOwnerOrAdmin('quizId'), RoundController.addQuestion);
router.post('/:quizId/rounds/:roundId/questions/:roundQuestionId/remove', requireQuizOwnerOrAdmin('quizId'), RoundController.removeQuestion);

module.exports = router;
