const Question = require('../models/Question');
const QuestionService = require('../services/questionService');
const TagService = require('../services/tagService');

function parseOptions(body) {
  // Collect options from individual text boxes (option_1, option_2, etc.)
  const options = [];
  Object.keys(body).forEach((key) => {
    if (key.startsWith('option_') && body[key] && body[key].trim()) {
      options.push(body[key].trim());
    }
  });
  return options.length > 0 ? options : null;
}

function parseTagNames(tagsString) {
  if (!tagsString || !tagsString.trim()) return [];
  return tagsString.split(',').map((t) => t.trim()).filter(Boolean);
}

const QuestionController = {
  async list(req, res) {
    let questions;
    if (req.user.role === 'admin') {
      questions = await Question.findAll();
    } else {
      questions = await Question.findByCreator(req.user.id);
    }
    // Load tags for each question
    await Promise.all(questions.map(async (q) => {
      q.tags = await TagService.getQuestionTags(q.id);
    }));
    res.render('question/bank', { title: 'Question Bank', questions });
  },

  async getCreate(req, res) {
    res.render('question/form', { title: 'Create Question', question: null, tags: [] });
  },

  async postCreate(req, res) {
    try {
      const {
        text, contentType, answerType, difficulty, correctAnswer, timeLimit, tags,
      } = req.body;
      const options = parseOptions(req.body);
      const question = await QuestionService.createQuestion({
        text,
        contentType,
        answerType,
        difficulty,
        correctAnswer,
        options,
        timeLimit: parseInt(timeLimit, 10) || 0,
        createdBy: req.user.id,
      }, req.file);
      const tagNames = parseTagNames(tags);
      if (tagNames.length > 0) {
        await TagService.setQuestionTags(question.id, tagNames);
      }
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
    const tags = await TagService.getQuestionTags(question.id);
    res.render('question/form', { title: 'Edit Question', question, tags });
  },

  async postUpdate(req, res) {
    try {
      const {
        text, contentType, answerType, difficulty, correctAnswer, timeLimit, tags,
      } = req.body;
      const options = parseOptions(req.body);
      const updates = {
        text,
        content_type: contentType,
        answer_type: answerType,
        difficulty,
        correct_answer: correctAnswer,
        options,
        time_limit: parseInt(timeLimit, 10) || 0,
      };
      await QuestionService.updateQuestion(req.params.id, updates, req.file);
      const tagNames = parseTagNames(tags);
      await TagService.setQuestionTags(req.params.id, tagNames);
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
