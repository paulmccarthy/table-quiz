const TeamService = require('../services/teamService');
const Team = require('../models/Team');
const pool = require('../config/database');

const TeamController = {
  async create(req, res) {
    try {
      const { name } = req.body;
      const quizId = req.params.quizId;
      await TeamService.createTeam({ quizId, name, userId: req.user.id });
      req.flash('success', 'Team created.');
      res.redirect(`/quiz/${quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },

  async join(req, res) {
    try {
      await TeamService.joinTeam(req.params.teamId, req.user.id);
      req.flash('success', 'Joined team.');
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },

  async leave(req, res) {
    try {
      await TeamService.leaveTeam(req.params.teamId, req.user.id);
      req.flash('success', 'Left team.');
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },

  async rename(req, res) {
    try {
      await Team.updateName(req.params.teamId, req.body.name);
      req.flash('success', 'Team renamed.');
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },

  async randomAssign(req, res) {
    try {
      const quizId = req.params.quizId;
      const [participants] = await pool.execute(
        'SELECT user_id FROM quiz_participants WHERE quiz_id = ? AND admitted = TRUE',
        [quizId],
      );
      const playerIds = participants.map((p) => p.user_id);
      await TeamService.randomAssign(quizId, playerIds);
      req.flash('success', 'Players randomly assigned to teams.');
      res.redirect(`/quiz/${quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },

  async setIndividual(req, res) {
    try {
      await pool.execute(
        'UPDATE quiz_participants SET is_individual = TRUE WHERE quiz_id = ? AND user_id = ?',
        [req.params.quizId, req.user.id],
      );
      req.flash('success', 'Playing as individual.');
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/lobby`);
    }
  },
};

module.exports = TeamController;
