const pool = require('../config/database');

const Question = {
  async create({
    text, contentType = 'text', answerType = 'multiple_choice', difficulty = 'medium',
    mediaPath, correctAnswer, options, timeLimit = 0, createdBy,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO questions (text, content_type, answer_type, difficulty, media_path, correct_answer, options, time_limit, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [text, contentType, answerType, difficulty, mediaPath || null,
        correctAnswer, options ? JSON.stringify(options) : null, timeLimit, createdBy],
    );
    return { id: result.insertId, text, contentType, answerType, difficulty };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    if (rows[0] && rows[0].options && typeof rows[0].options === 'string') {
      rows[0].options = JSON.parse(rows[0].options);
    }
    return rows[0] || null;
  },

  async findByCreator(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE created_by = ? ORDER BY created_at DESC',
      [userId],
    );
    return rows.map((row) => {
      if (row.options && typeof row.options === 'string') {
        row.options = JSON.parse(row.options);
      }
      return row;
    });
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM questions ORDER BY created_at DESC');
    return rows.map((row) => {
      if (row.options && typeof row.options === 'string') {
        row.options = JSON.parse(row.options);
      }
      return row;
    });
  },

  async update(id, fields) {
    const allowed = ['text', 'content_type', 'answer_type', 'difficulty', 'media_path', 'correct_answer', 'options', 'time_limit'];
    const updates = [];
    const values = [];
    Object.keys(fields).forEach((key) => {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(key === 'options' && fields[key] ? JSON.stringify(fields[key]) : fields[key]);
      }
    });
    if (updates.length === 0) return false;
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Question;
