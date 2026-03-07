const ScoreService = require('../services/scoreService');
const Quiz = require('../models/Quiz');

const LeaderboardController = {
  async getLeaderboard(req, res) {
    const quiz = await Quiz.findById(req.params.quizId);
    const leaderboard = await ScoreService.getLeaderboard(req.params.quizId);
    res.render('leaderboard/board', { title: 'Leaderboard', quiz, leaderboard });
  },

  async getLeaderboardData(req, res) {
    const leaderboard = await ScoreService.getLeaderboard(req.params.quizId);
    res.json(leaderboard);
  },
};

module.exports = LeaderboardController;
