const express = require('express');
const multer = require('multer');
const AdminController = require('../controllers/adminController');
const { ensureAuthenticated } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

router.use(ensureAuthenticated);
router.use(requireRole('admin'));

// Settings
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.postSettings);

// User management
router.get('/users', AdminController.getUserManagement);
router.post('/users/:id/reset-password', AdminController.postResetPassword);

// Bulk upload
router.get('/bulk-upload', AdminController.getBulkUpload);
router.post('/bulk-upload', upload.single('file'), AdminController.postBulkUpload);

module.exports = router;
