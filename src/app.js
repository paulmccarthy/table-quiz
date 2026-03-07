require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const flash = require('connect-flash');
const passport = require('./config/passport');
const createSessionMiddleware = require('./config/session');
const pool = require('./config/database');
const { generalLimiter } = require('./config/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const answerRoutes = require('./routes/answerRoutes');
const exportRoutes = require('./routes/exportRoutes');

const QuizResult = require('./models/QuizResult');
const { ensureAuthenticated } = require('./middleware/auth');
const { requireRole } = require('./middleware/roles');
const LeaderboardController = require('./controllers/leaderboardController');

const app = express();

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
}));
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session
const sessionMiddleware = createSessionMiddleware(pool);
app.use(sessionMiddleware);

// Flash messages
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use(generalLimiter);

// Template locals
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info'),
  };
  next();
});

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/quiz');
  }
  res.redirect('/auth/login');
});

app.use('/auth', authRoutes);
app.use('/admin', userRoutes);
app.use('/quiz', quizRoutes);
app.use('/questions', questionRoutes);
app.use('/teams', teamRoutes);
app.use('/answers', answerRoutes);
app.use('/export', exportRoutes);

// Leaderboard routes
app.get('/quiz/:quizId/leaderboard', ensureAuthenticated, LeaderboardController.getLeaderboard);
app.get('/api/quiz/:quizId/leaderboard', ensureAuthenticated, LeaderboardController.getLeaderboardData);

// History routes
app.get('/history', ensureAuthenticated, async (req, res) => {
  let results;
  if (req.user.role === 'admin') {
    results = await QuizResult.findAll();
  } else if (req.user.role === 'quizmaster') {
    results = await QuizResult.findByQuizmaster(req.user.id);
  } else {
    results = await QuizResult.findByPlayer(req.user.id);
  }
  res.render('history/list', { title: 'Quiz History', results });
});

app.get('/history/:quizId', ensureAuthenticated, async (req, res) => {
  const result = await QuizResult.findByQuiz(req.params.quizId);
  if (!result) {
    req.flash('error', 'Results not found.');
    return res.redirect('/history');
  }
  res.render('history/detail', { title: result.quiz_title, result });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', status: 404, message: 'Page not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    title: 'Error',
    status: err.status || 500,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});

// Export for testing and server
app.sessionMiddleware = sessionMiddleware;
module.exports = app;
