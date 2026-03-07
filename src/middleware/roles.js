function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Please log in.');
      return res.redirect('/auth/login');
    }
    // Admins bypass all role checks
    if (req.user.role === 'admin') {
      return next();
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).render('error', { message: 'Access denied. Insufficient permissions.' });
  };
}

function requireQuizOwnerOrAdmin(quizIdParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Please log in.');
      return res.redirect('/auth/login');
    }
    // Admins bypass ownership checks
    if (req.user.role === 'admin') {
      return next();
    }
    const Quiz = require('../models/Quiz');
    const quizId = req.params[quizIdParam];
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).render('error', { message: 'Quiz not found.' });
    }
    if (quiz.quizmaster_id !== req.user.id) {
      return res.status(403).render('error', { message: 'Access denied. You do not own this quiz.' });
    }
    req.quiz = quiz;
    next();
  };
}

module.exports = { requireRole, requireQuizOwnerOrAdmin };
