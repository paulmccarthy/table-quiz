const Answer = require('../models/Answer');
const ScoreService = require('../services/scoreService');

const AnswerController = {
  async markDrawing(req, res) {
    try {
      const { isCorrect } = req.body;
      await Answer.markCorrect(req.params.answerId, isCorrect === 'true', 'quizmaster');
      req.flash('success', 'Answer marked.');
      res.redirect('back');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  },

  async getDrawingsForReview(req, res) {
    const drawings = await Answer.findDrawingsByRound(req.params.roundId);
    res.render('partials/drawingReview', { drawings, quizId: req.params.quizId });
  },

  async overrideScore(req, res) {
    try {
      await ScoreService.overrideScore(
        req.params.scoreId,
        parseInt(req.body.score, 10),
        req.user.id,
      );
      req.flash('success', 'Score overridden.');
      res.redirect('back');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  },
};

module.exports = AnswerController;
