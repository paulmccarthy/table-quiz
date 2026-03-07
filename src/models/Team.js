const pool = require('../config/database');

const MAX_TEAM_SIZE = 6;

const Team = {
  MAX_TEAM_SIZE,

  async create({ quizId, name }) {
    const [result] = await pool.execute(
      'INSERT INTO teams (quiz_id, name) VALUES (?, ?)',
      [quizId, name],
    );
    return { id: result.insertId, quizId, name };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByQuiz(quizId) {
    const [rows] = await pool.execute(
      'SELECT * FROM teams WHERE quiz_id = ? ORDER BY created_at',
      [quizId],
    );
    return rows;
  },

  async getMembers(teamId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.display_name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?`,
      [teamId],
    );
    return rows;
  },

  async getMemberCount(teamId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM team_members WHERE team_id = ?',
      [teamId],
    );
    return rows[0].count;
  },

  async addMember(teamId, userId) {
    const count = await Team.getMemberCount(teamId);
    if (count >= MAX_TEAM_SIZE) {
      throw new Error(`Team is full. Maximum ${MAX_TEAM_SIZE} players per team.`);
    }
    const [result] = await pool.execute(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, userId],
    );
    return result.insertId;
  },

  async removeMember(teamId, userId) {
    const [result] = await pool.execute(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId],
    );
    return result.affectedRows > 0;
  },

  async updateName(id, name) {
    const [result] = await pool.execute(
      'UPDATE teams SET name = ? WHERE id = ?',
      [name, id],
    );
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async findByUserAndQuiz(userId, quizId) {
    const [rows] = await pool.execute(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND t.quiz_id = ?`,
      [userId, quizId],
    );
    return rows[0] || null;
  },
};

module.exports = Team;
