const TagService = require('../services/tagService');

const TagController = {
  async search(req, res) {
    try {
      const tags = await TagService.search(req.query.q || '');
      res.json(tags);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async searchQuestions(req, res) {
    try {
      const query = req.query.q || '';
      const tagIds = req.query.tags ? req.query.tags.split(',').map(Number).filter(Boolean) : [];
      const questions = await TagService.searchQuestions(query, tagIds);
      res.json(questions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = TagController;
