const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const QuestionController = require('../controllers/questionController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { handleValidationErrors } = require('../middleware/validation');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = express.Router();

router.use(ensureAuthenticated);
router.use(requireRole('quizmaster', 'admin'));

router.get('/', QuestionController.list);
router.get('/create', QuestionController.getCreate);
router.post('/create', upload.single('media'), [
  body('text').notEmpty().withMessage('Question text required.'),
  body('contentType').isIn(['text', 'image', 'audio', 'video']).withMessage('Invalid content type.'),
  body('answerType').isIn(['multiple_choice', 'freeform_text', 'drawing']).withMessage('Invalid answer type.'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty.'),
], handleValidationErrors, QuestionController.postCreate);

router.get('/:id/edit', QuestionController.getEdit);
router.post('/:id/edit', upload.single('media'), QuestionController.postUpdate);
router.post('/:id/delete', QuestionController.delete);

module.exports = router;
