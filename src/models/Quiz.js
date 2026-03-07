const pool = require('../config/database');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const Quiz = {
  async create({ title, quizmasterId, isPublic = false, numRounds = 1 }) {
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const inviteToken = uuidv4();
    const [result] = await pool.execute(
      `INSERT INTO quizzes (title, access_code, invite_token, quizmaster_id, is_public, num_rounds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, accessCode, inviteToken, quizmasterId, isPublic, numRounds],
    );
    return {
      id: result.insertId, title, accessCode, inviteToken, quizmasterId, isPublic, numRounds, status: 'draft',
    };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByAccessCode(accessCode) {
    const [rows] = await pool.execute('SELECT * FROM quizzes WHERE access_code = ?', [accessCode]);
    return rows[0] || null;
  },

  async findByInviteToken(token) {
    const [rows] = await pool.execute('SELECT * FROM quizzes WHERE invite_token = ?', [token]);
    return rows[0] || null;
  },

  async findByQuizmaster(quizmasterId) {
    const [rows] = await pool.execute(
      'SELECT * FROM quizzes WHERE quizmaster_id = ? ORDER BY created_at DESC',
      [quizmasterId],
    );
    return rows;
  },

  async hasActiveQuiz(quizmasterId) {
    const [rows] = await pool.execute(
      "SELECT id FROM quizzes WHERE quizmaster_id = ? AND status IN ('active', 'paused') LIMIT 1",
      [quizmasterId],
    );
    return rows.length > 0;
  },

  async update(id, fields) {
    const allowed = ['title', 'is_public', 'num_rounds', 'status', 'invite_token', 'invite_token_expires_at'];
    const updates = [];
    const values = [];
    Object.keys(fields).forEach((key) => {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    });
    if (updates.length === 0) return false;
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE quizzes SET status = ? WHERE id = ?',
      [status, id],
    );
    return result.affectedRows > 0;
  },

  async regenerateInviteToken(id) {
    const newToken = uuidv4();
    await pool.execute(
      'UPDATE quizzes SET invite_token = ? WHERE id = ?',
      [newToken, id],
    );
    return newToken;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM quizzes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM quizzes ORDER BY created_at DESC');
    return rows;
  },

  async findPublic() {
    const [rows] = await pool.execute(
      "SELECT * FROM quizzes WHERE is_public = TRUE AND status IN ('lobby', 'draft') ORDER BY created_at DESC",
    );
    return rows;
  },
};

module.exports = Quiz;
