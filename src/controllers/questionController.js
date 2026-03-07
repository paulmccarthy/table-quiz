const Question = require('../models/Question');
const QuestionService = require('../services/questionService');

const QuestionController = {
  async list(req, res) {
    let questions;
    if (req.user.role === 'admin') {
      questions = await Question.findAll();
    } else {
      questions = await Question.findByCreator(req.user.id);
    }
    res.render('question/bank', { title: 'Question Bank', questions });
  },

  getCreate(req, res) {
    res.render('question/form', { title: 'Create Question', question: null });
  },

  async postCreate(req, res) {
    try {
      const {
        text, contentType, answerType, difficulty, correctAnswer, options, timeLimit,
      } = req.body;
      const parsedOptions = options ? JSON.parse(options) : null;
      await QuestionService.createQuestion({
        text,
        contentType,
        answerType,
        difficulty,
        correctAnswer,
        options: parsedOptions,
        timeLimit: parseInt(timeLimit, 10) || 0,
        createdBy: req.user.id,
      }, req.file);
      req.flash('success', 'Question created.');
      res.redirect('/questions');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/questions/create');
    }
  },

  async getEdit(req, res) {
    const question = await Question.findById(req.params.id);
    if (!question) {
      req.flash('error', 'Question not found.');
      return res.redirect('/questions');
    }
    res.render('question/form', { title: 'Edit Question', question });
  },

  async postUpdate(req, res) {
    try {
      const {
        text, contentType, answerType, difficulty, correctAnswer, options, timeLimit,
      } = req.body;
      const updates = {
        text,
        content_type: contentType,
        answer_type: answerType,
        difficulty,
        correct_answer: correctAnswer,
        options: options ? JSON.parse(options) : null,
        time_limit: parseInt(timeLimit, 10) || 0,
      };
      await QuestionService.updateQuestion(req.params.id, updates, req.file);
      req.flash('success', 'Question updated.');
      res.redirect('/questions');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect(`/questions/${req.params.id}/edit`);
    }
  },

  async delete(req, res) {
    try {
      await QuestionService.deleteQuestion(req.params.id);
      req.flash('success', 'Question deleted.');
      res.redirect('/questions');
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/questions');
    }
  },
};

module.exports = QuestionController;
