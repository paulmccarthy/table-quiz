const express = require('express');
const AnswerController = require('../controllers/answerController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(ensureAuthenticated);

router.post('/:answerId/mark', requireRole('quizmaster', 'admin'), AnswerController.markDrawing);
router.get('/:quizId/round/:roundId/drawings', requireRole('quizmaster', 'admin'), AnswerController.getDrawingsForReview);
router.post('/score/:scoreId/override', requireRole('quizmaster', 'admin'), AnswerController.overrideScore);

module.exports = router;
