const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

function createSessionMiddleware(pool) {
  const sessionStore = new MySQLStore({}, pool);

  return session({
    key: 'table_quiz_sid',
    secret: process.env.SESSION_SECRET || 'change-me',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  });
}

module.exports = createSessionMiddleware;
