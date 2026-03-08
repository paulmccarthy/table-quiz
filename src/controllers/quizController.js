const Quiz = require('../models/Quiz');
const QuizService = require('../services/quizService');
const EmailService = require('../services/emailService');
const TagService = require('../services/tagService');
const pool = require('../config/database');

const QuizController = {
  async list(req, res) {
    let quizzes;
    if (req.user.role === 'admin') {
      quizzes = await Quiz.findAll();
    } else if (req.user.role === 'quizmaster') {
      quizzes = await Quiz.findByQuizmaster(req.user.id);
    } else {
      // Players see public quizzes
      quizzes = await Quiz.findPublic();
    }
    res.render('quiz/manage', { title: 'My Quizzes', quizzes });
  },

  async getCreate(req, res) {
    res.render('quiz/create', { title: 'Create Quiz', quiz: null, tags: [] });
  },

  async postCreate(req, res) {
    try {
      const {
        title, isPublic, numRounds, tags,
      } = req.body;
      const quiz = await QuizService.createQuiz({
        title,
        quizmasterId: req.user.id,
        isPublic: isPublic === 'on' || isPublic === 'true',
        numRounds: parseInt(numRounds, 10) || 1,
      });
      const tagNames = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      if (tagNames.length > 0) {
        await TagService.setQuizTags(quiz.id, tagNames);
      }
      req.flash('success', 'Quiz created successfully.');
      res.redirect(`/quiz/${quiz.id}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/quiz/create');
    }
  },

  async getEdit(req, res) {
    const quiz = await QuizService.getQuizWithRounds(req.params.id);
    if (!quiz) {
      req.flash('error', 'Quiz not found.');
      return res.redirect('/quiz');
    }
    const tags = await TagService.getQuizTags(quiz.id);
    res.render('quiz/create', { title: 'Edit Quiz', quiz, tags });
  },

  async postUpdate(req, res) {
    try {
      const {
        title, isPublic, numRounds, tags,
      } = req.body;
      await Quiz.update(req.params.id, {
        title,
        is_public: isPublic === 'on' || isPublic === 'true',
        num_rounds: parseInt(numRounds, 10) || 1,
      });
      const tagNames = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      await TagService.setQuizTags(req.params.id, tagNames);
      req.flash('success', 'Quiz updated.');
      res.redirect(`/quiz/${req.params.id}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.id}/edit`);
    }
  },

  async delete(req, res) {
    try {
      await Quiz.deleteById(req.params.id);
      req.flash('success', 'Quiz deleted.');
      res.redirect('/quiz');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/quiz');
    }
  },

  async activate(req, res) {
    try {
      await QuizService.activateQuiz(req.params.id, req.user.id);
      req.flash('success', 'Quiz moved to lobby.');
      res.redirect(`/quiz/${req.params.id}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.id}/edit`);
    }
  },

  async getLobby(req, res) {
    const quiz = await QuizService.getQuizWithRounds(req.params.id);
    if (!quiz) {
      req.flash('error', 'Quiz not found.');
      return res.redirect('/quiz');
    }
    const [participants] = await pool.execute(
      `SELECT qp.*, u.display_name, u.email
       FROM quiz_participants qp
       JOIN users u ON qp.user_id = u.id
       WHERE qp.quiz_id = ?`,
      [req.params.id],
    );
    const TeamService = require('../services/teamService');
    const teams = await TeamService.getTeamsWithMembers(quiz.id);
    res.render('quiz/lobby', {
      title: `Lobby: ${quiz.title}`, quiz, participants, teams,
    });
  },

  async getInvite(req, res) {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash('error', 'Quiz not found.');
      return res.redirect('/quiz');
    }
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/quiz/join/${quiz.invite_token}`;
    res.render('quiz/invite', {
      title: `Invite: ${quiz.title}`, quiz, inviteUrl,
    });
  },

  async sendInviteEmail(req, res) {
    try {
      const quiz = await Quiz.findById(req.params.id);
      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/quiz/join/${quiz.invite_token}`;
      await EmailService.sendQuizInvitation(req.body.email, quiz.title, inviteUrl);
      req.flash('success', 'Invitation sent.');
      res.redirect(`/quiz/${req.params.id}/invite`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.id}/invite`);
    }
  },

  async regenerateInviteToken(req, res) {
    try {
      await Quiz.regenerateInviteToken(req.params.id);
      req.flash('success', 'Invite link regenerated.');
      res.redirect(`/quiz/${req.params.id}/invite`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.id}/invite`);
    }
  },

  // Per-quiz login page
  async getQuizLogin(req, res) {
    const quiz = await Quiz.findByInviteToken(req.params.inviteToken);
    if (!quiz) {
      req.flash('error', 'Invalid or expired quiz link.');
      return res.redirect('/auth/login');
    }
    if (quiz.invite_token_expires_at && new Date(quiz.invite_token_expires_at) < new Date()) {
      req.flash('error', 'This quiz link has expired.');
      return res.redirect('/auth/login');
    }
    if (quiz.status === 'completed') {
      req.flash('error', 'This quiz has already ended.');
      return res.redirect('/auth/login');
    }
    res.render('quiz/quizLogin', { title: `Join: ${quiz.title}`, quiz });
  },

  // Join via access code
  async postJoinByCode(req, res) {
    try {
      const quiz = await Quiz.findByAccessCode(req.body.accessCode);
      if (!quiz) {
        req.flash('error', 'Invalid access code.');
        return res.redirect('/quiz');
      }
      if (quiz.status === 'completed') {
        req.flash('error', 'This quiz has already ended.');
        return res.redirect('/quiz');
      }
      // Add as participant
      await pool.execute(
        `INSERT IGNORE INTO quiz_participants (quiz_id, user_id, admitted)
         VALUES (?, ?, ?)`,
        [quiz.id, req.user.id, quiz.is_public ? true : false],
      );
      if (quiz.is_public) {
        req.flash('success', 'Joined quiz successfully.');
      } else {
        req.flash('info', 'Request sent. Waiting for quizmaster to admit you.');
      }
      res.redirect(`/quiz/${quiz.id}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/quiz');
    }
  },

  // Join via invite token
  async postJoinByToken(req, res) {
    try {
      const quiz = await Quiz.findByInviteToken(req.params.inviteToken);
      if (!quiz) {
        req.flash('error', 'Invalid quiz link.');
        return res.redirect('/auth/login');
      }
      if (quiz.invite_token_expires_at && new Date(quiz.invite_token_expires_at) < new Date()) {
        req.flash('error', 'This quiz link has expired.');
        return res.redirect('/auth/login');
      }
      await pool.execute(
        `INSERT IGNORE INTO quiz_participants (quiz_id, user_id, admitted)
         VALUES (?, ?, ?)`,
        [quiz.id, req.user.id, quiz.is_public ? true : false],
      );
      if (quiz.is_public) {
        req.flash('success', 'Joined quiz successfully.');
      } else {
        req.flash('info', 'Request sent. Waiting for quizmaster to admit you.');
      }
      res.redirect(`/quiz/${quiz.id}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/quiz');
    }
  },

  async admitPlayer(req, res) {
    try {
      await pool.execute(
        'UPDATE quiz_participants SET admitted = TRUE WHERE quiz_id = ? AND user_id = ?',
        [req.params.id, req.params.userId],
      );
      req.flash('success', 'Player admitted.');
      res.redirect(`/quiz/${req.params.id}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.id}/lobby`);
    }
  },

  async getPlay(req, res) {
    const quiz = await QuizService.getQuizWithRounds(req.params.id);
    if (!quiz) {
      req.flash('error', 'Quiz not found.');
      return res.redirect('/quiz');
    }
    const isQuizmaster = quiz.quizmaster_id === req.user.id || req.user.role === 'admin';
    res.render('quiz/play', { title: quiz.title, quiz, isQuizmaster });
  },
};

module.exports = QuizController;
