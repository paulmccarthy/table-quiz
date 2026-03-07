function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/auth/login');
}

function ensureEmailVerified(req, res, next) {
  if (req.user && req.user.email_verified) {
    return next();
  }
  req.flash('error', 'Please verify your email address.');
  res.redirect('/auth/verify-email');
}

module.exports = { ensureAuthenticated, ensureEmailVerified };
