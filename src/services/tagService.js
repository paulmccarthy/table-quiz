const Tag = require('../models/Tag');

const TagService = {
  async search(prefix) {
    return Tag.search(prefix);
  },

  async findOrCreateByNames(names) {
    const validNames = names.map((n) => n.trim()).filter(Boolean);
    const results = await validNames.reduce(async (accPromise, name) => {
      const acc = await accPromise;
      const tag = await Tag.findOrCreate(name);
      acc.push(tag);
      return acc;
    }, Promise.resolve([]));
    return results;
  },

  async setQuestionTags(questionId, tagNames) {
    const tags = await this.findOrCreateByNames(tagNames);
    const tagIds = tags.map((t) => t.id);
    await Tag.setQuestionTags(questionId, tagIds);
    return tags;
  },

  async getQuestionTags(questionId) {
    return Tag.getQuestionTags(questionId);
  },

  async setQuizTags(quizId, tagNames) {
    const tags = await this.findOrCreateByNames(tagNames);
    const tagIds = tags.map((t) => t.id);
    await Tag.setQuizTags(quizId, tagIds);
    return tags;
  },

  async getQuizTags(quizId) {
    return Tag.getQuizTags(quizId);
  },

  async searchQuestions(query, tagIds) {
    const pool = require('../config/database');
    let sql = 'SELECT DISTINCT q.* FROM questions q';
    const params = [];
    let hasTagJoin = false;

    if (tagIds && tagIds.length > 0) {
      sql += ' JOIN question_tags qt ON q.id = qt.question_id';
      hasTagJoin = true;
    }

    const conditions = [];

    if (tagIds && tagIds.length > 0) {
      conditions.push(`qt.tag_id IN (${tagIds.map(() => '?').join(', ')})`);
      params.push(...tagIds);
    }

    if (query && query.trim()) {
      conditions.push('q.text LIKE ?');
      params.push(`%${query.trim()}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY q.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    return rows.map((row) => {
      if (row.options && typeof row.options === 'string') {
        row.options = JSON.parse(row.options);
      }
      return row;
    });
  },
};

module.exports = TagService;
