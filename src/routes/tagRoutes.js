const express = require('express');
const TagController = require('../controllers/tagController');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.use(ensureAuthenticated);

// Tag autocomplete
router.get('/', TagController.search);

// Question search by tags and content
router.get('/questions/search', TagController.searchQuestions);

module.exports = router;
