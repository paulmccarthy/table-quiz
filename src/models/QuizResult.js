const pool = require('../config/database');

const QuizResult = {
  async create({
    quizId, quizTitle, quizmasterId, totalRounds, totalQuestions, resultData,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO quiz_results (quiz_id, quiz_title, quizmaster_id, total_rounds, total_questions, result_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quizId, quizTitle, quizmasterId, totalRounds, totalQuestions, JSON.stringify(resultData)],
    );
    return { id: result.insertId };
  },

  async findByQuiz(quizId) {
    const [rows] = await pool.execute(
      'SELECT * FROM quiz_results WHERE quiz_id = ?',
      [quizId],
    );
    if (rows[0] && typeof rows[0].result_data === 'string') {
      rows[0].result_data = JSON.parse(rows[0].result_data);
    }
    return rows[0] || null;
  },

  async findByQuizmaster(quizmasterId) {
    const [rows] = await pool.execute(
      'SELECT * FROM quiz_results WHERE quizmaster_id = ? ORDER BY completed_at DESC',
      [quizmasterId],
    );
    return rows.map((row) => {
      if (typeof row.result_data === 'string') {
        row.result_data = JSON.parse(row.result_data);
      }
      return row;
    });
  },

  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM quiz_results ORDER BY completed_at DESC',
    );
    return rows.map((row) => {
      if (typeof row.result_data === 'string') {
        row.result_data = JSON.parse(row.result_data);
      }
      return row;
    });
  },

  async findByPlayer(userId) {
    const [rows] = await pool.execute(
      `SELECT qr.* FROM quiz_results qr
       JOIN quiz_participants qp ON qr.quiz_id = qp.quiz_id
       WHERE qp.user_id = ?
       ORDER BY qr.completed_at DESC`,
      [userId],
    );
    return rows.map((row) => {
      if (typeof row.result_data === 'string') {
        row.result_data = JSON.parse(row.result_data);
      }
      return row;
    });
  },
};

module.exports = QuizResult;
