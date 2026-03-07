const express = require('express');
const ExportController = require('../controllers/exportController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireQuizOwnerOrAdmin } = require('../middleware/roles');

const router = express.Router();
router.use(ensureAuthenticated);

router.get('/:id/csv', requireQuizOwnerOrAdmin(), ExportController.exportCSV);
router.get('/:id/pdf', requireQuizOwnerOrAdmin(), ExportController.exportPDF);

module.exports = router;
