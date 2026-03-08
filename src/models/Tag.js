const pool = require('../config/database');

const Tag = {
  async findOrCreate(name) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) throw new Error('Tag name cannot be empty.');
    const [existing] = await pool.execute(
      'SELECT * FROM tags WHERE normalized_name = ?',
      [normalized],
    );
    if (existing[0]) return existing[0];
    const [result] = await pool.execute(
      'INSERT INTO tags (name, normalized_name) VALUES (?, ?)',
      [name.trim(), normalized],
    );
    return { id: result.insertId, name: name.trim(), normalized_name: normalized };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async search(prefix) {
    const normalized = prefix.trim().toLowerCase();
    if (!normalized) return [];
    const [rows] = await pool.execute(
      'SELECT * FROM tags WHERE normalized_name LIKE ? ORDER BY normalized_name LIMIT 20',
      [`${normalized}%`],
    );
    return rows;
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM tags ORDER BY normalized_name');
    return rows;
  },

  async addToQuestion(questionId, tagId) {
    await pool.execute(
      'INSERT IGNORE INTO question_tags (question_id, tag_id) VALUES (?, ?)',
      [questionId, tagId],
    );
  },

  async removeFromQuestion(questionId, tagId) {
    await pool.execute(
      'DELETE FROM question_tags WHERE question_id = ? AND tag_id = ?',
      [questionId, tagId],
    );
  },

  async setQuestionTags(questionId, tagIds) {
    await pool.execute('DELETE FROM question_tags WHERE question_id = ?', [questionId]);
    await Promise.all(tagIds.map((tagId) => pool.execute(
      'INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)',
      [questionId, tagId],
    )));
  },

  async getQuestionTags(questionId) {
    const [rows] = await pool.execute(
      `SELECT t.* FROM tags t
       JOIN question_tags qt ON t.id = qt.tag_id
       WHERE qt.question_id = ?
       ORDER BY t.normalized_name`,
      [questionId],
    );
    return rows;
  },

  async addToQuiz(quizId, tagId) {
    await pool.execute(
      'INSERT IGNORE INTO quiz_tags (quiz_id, tag_id) VALUES (?, ?)',
      [quizId, tagId],
    );
  },

  async removeFromQuiz(quizId, tagId) {
    await pool.execute(
      'DELETE FROM quiz_tags WHERE quiz_id = ? AND tag_id = ?',
      [quizId, tagId],
    );
  },

  async setQuizTags(quizId, tagIds) {
    await pool.execute('DELETE FROM quiz_tags WHERE quiz_id = ?', [quizId]);
    await Promise.all(tagIds.map((tagId) => pool.execute(
      'INSERT INTO quiz_tags (quiz_id, tag_id) VALUES (?, ?)',
      [quizId, tagId],
    )));
  },

  async getQuizTags(quizId) {
    const [rows] = await pool.execute(
      `SELECT t.* FROM tags t
       JOIN quiz_tags qt ON t.id = qt.tag_id
       WHERE qt.quiz_id = ?
       ORDER BY t.normalized_name`,
      [quizId],
    );
    return rows;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM tags WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Tag;
