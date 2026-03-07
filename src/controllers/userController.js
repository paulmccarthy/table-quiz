const User = require('../models/User');

const UserController = {
  async listUsers(req, res) {
    const users = await User.findAll();
    res.render('admin/dashboard', { title: 'Admin Dashboard', users });
  },

  async updateRole(req, res) {
    try {
      await User.updateRole(req.params.id, req.body.role);
      req.flash('success', 'User role updated.');
      res.redirect('/admin');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin');
    }
  },

  async resetUserPassword(req, res) {
    try {
      await User.updatePassword(req.params.id, req.body.password);
      req.flash('success', 'Password reset successfully.');
      res.redirect('/admin');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin');
    }
  },

  async deleteUser(req, res) {
    try {
      await User.deleteById(req.params.id);
      req.flash('success', 'User deleted.');
      res.redirect('/admin');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/admin');
    }
  },
};

module.exports = UserController;
