const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.accepts('json')) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.flash('error', errors.array().map((e) => e.msg).join(', '));
    return res.redirect('back');
  }
  next();
}

module.exports = { handleValidationErrors };
