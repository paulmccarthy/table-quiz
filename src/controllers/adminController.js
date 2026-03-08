const AdminService = require('../services/adminService');
const User = require('../models/User');

const AdminController = {
  async getSettings(req, res) {
    const settings = await AdminService.getSettings();
    res.render('admin/settings', { title: 'App Settings', settings });
  },

  async postSettings(req, res) {
    try {
      const checkboxKeys = [
        'oauth_facebook_enabled',
        'oauth_microsoft_enabled',
        'oauth_github_enabled',
        'email_verification_enabled',
      ];
      const settings = {};
      checkboxKeys.forEach((key) => {
        settings[key] = req.body[key] || 'false';
      });
      await AdminService.updateSettings(settings, req.user.id);
      req.flash('success', 'Settings updated.');
      res.redirect('/admin/settings');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin/settings');
    }
  },

  async getUserManagement(req, res) {
    const users = await User.findAll();
    res.render('admin/userManagement', { title: 'User Management', users });
  },

  async postResetPassword(req, res) {
    try {
      const { password, sendResetLink } = req.body;
      const result = await AdminService.resetUserPassword(req.params.id, {
        password,
        sendResetLink: sendResetLink === 'on' || sendResetLink === 'true',
      });
      if (result.method === 'link') {
        req.flash('success', `Password reset link sent to ${result.email}.`);
      } else {
        req.flash('success', 'Password reset successfully.');
      }
      res.redirect('/admin/users');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin/users');
    }
  },

  async getBulkUpload(req, res) {
    res.render('admin/bulkUpload', { title: 'Bulk Upload Questions', results: null });
  },

  async postBulkUpload(req, res) {
    try {
      if (!req.file) {
        req.flash('error', 'Please select a file to upload.');
        return res.redirect('/admin/bulk-upload');
      }
      const results = await AdminService.bulkUploadQuestions(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
      );
      res.render('admin/bulkUpload', { title: 'Bulk Upload Questions', results });
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin/bulk-upload');
    }
  },
};

module.exports = AdminController;
