const express = require('express');
const { body } = require('express-validator');
const TeamController = require('../controllers/teamController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireQuizOwnerOrAdmin } = require('../middleware/roles');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();
router.use(ensureAuthenticated);

router.post('/:quizId/create', [
  body('name').notEmpty().trim().escape().withMessage('Team name required.'),
], handleValidationErrors, TeamController.create);

router.post('/:quizId/:teamId/join', TeamController.join);
router.post('/:quizId/:teamId/leave', TeamController.leave);
router.post('/:quizId/:teamId/rename', [
  body('name').notEmpty().trim().escape().withMessage('Team name required.'),
], handleValidationErrors, TeamController.rename);
router.post('/:quizId/random-assign', requireQuizOwnerOrAdmin('quizId'), TeamController.randomAssign);
router.post('/:quizId/individual', TeamController.setIndividual);

module.exports = router;
