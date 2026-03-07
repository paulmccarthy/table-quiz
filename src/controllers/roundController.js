const Round = require('../models/Round');
const Quiz = require('../models/Quiz');

const RoundController = {
  async addQuestion(req, res) {
    try {
      const { questionId, questionOrder } = req.body;
      await Round.addQuestion({
        roundId: req.params.roundId,
        questionId: parseInt(questionId, 10),
        questionOrder: parseInt(questionOrder, 10),
      });
      // Update round question count
      const questions = await Round.getQuestions(req.params.roundId);
      await Round.update(req.params.roundId, { numQuestions: questions.length });
      req.flash('success', 'Question added to round.');
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    }
  },

  async removeQuestion(req, res) {
    try {
      await Round.removeQuestion(req.params.roundQuestionId);
      const questions = await Round.getQuestions(req.params.roundId);
      await Round.update(req.params.roundId, { numQuestions: questions.length });
      req.flash('success', 'Question removed from round.');
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    }
  },

  async addRound(req, res) {
    try {
      const quiz = await Quiz.findById(req.params.quizId);
      const rounds = await Round.findByQuiz(quiz.id);
      const nextNumber = rounds.length + 1;
      await Round.create({ quizId: quiz.id, roundNumber: nextNumber });
      await Quiz.update(quiz.id, { num_rounds: nextNumber });
      req.flash('success', 'Round added.');
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    }
  },

  async deleteRound(req, res) {
    try {
      await Round.deleteById(req.params.roundId);
      req.flash('success', 'Round deleted.');
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/quiz/${req.params.quizId}/edit`);
    }
  },
};

module.exports = RoundController;
