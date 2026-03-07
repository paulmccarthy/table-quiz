const pool = require('../config/database');

const Answer = {
  async upsert({
    roundQuestionId, userId, teamId, answerType, answerValue, drawingPath,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO answers (round_question_id, user_id, team_id, answer_type, answer_value, drawing_path)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         answer_type = VALUES(answer_type),
         answer_value = VALUES(answer_value),
         drawing_path = VALUES(drawing_path),
         is_correct = NULL,
         marked_by = NULL,
         submitted_at = CURRENT_TIMESTAMP`,
      [roundQuestionId, userId, teamId || null, answerType, answerValue || null, drawingPath || null],
    );
    return { id: result.insertId || result.affectedRows };
  },

  async findByRoundQuestion(roundQuestionId) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.display_name, u.email
       FROM answers a
       JOIN users u ON a.user_id = u.id
       WHERE a.round_question_id = ?`,
      [roundQuestionId],
    );
    return rows;
  },

  async findByUserAndRoundQuestion(userId, roundQuestionId) {
    const [rows] = await pool.execute(
      'SELECT * FROM answers WHERE user_id = ? AND round_question_id = ?',
      [userId, roundQuestionId],
    );
    return rows[0] || null;
  },

  async markCorrect(id, isCorrect, markedBy = 'quizmaster') {
    const [result] = await pool.execute(
      'UPDATE answers SET is_correct = ?, marked_by = ? WHERE id = ?',
      [isCorrect, markedBy, id],
    );
    return result.affectedRows > 0;
  },

  async autoMark(id, isCorrect) {
    const [result] = await pool.execute(
      'UPDATE answers SET is_correct = ?, marked_by = ? WHERE id = ?',
      [isCorrect, 'auto', id],
    );
    return result.affectedRows > 0;
  },

  async findDrawingsByRound(roundId) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.display_name, u.email, rq.question_order
       FROM answers a
       JOIN users u ON a.user_id = u.id
       JOIN round_questions rq ON a.round_question_id = rq.id
       WHERE rq.round_id = ? AND a.answer_type = 'drawing' AND a.is_correct IS NULL
       ORDER BY rq.question_order`,
      [roundId],
    );
    return rows;
  },

  async findByQuiz(quizId) {
    const [rows] = await pool.execute(
      `SELECT a.*, rq.question_order, r.round_number, q.text AS question_text,
              u.display_name, u.email, t.name AS team_name
       FROM answers a
       JOIN round_questions rq ON a.round_question_id = rq.id
       JOIN rounds r ON rq.round_id = r.id
       JOIN questions q ON rq.question_id = q.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN teams t ON a.team_id = t.id
       WHERE r.quiz_id = ?
       ORDER BY r.round_number, rq.question_order, u.display_name`,
      [quizId],
    );
    return rows;
  },

  async getExistingDrawingPath(userId, roundQuestionId) {
    const [rows] = await pool.execute(
      'SELECT drawing_path FROM answers WHERE user_id = ? AND round_question_id = ?',
      [userId, roundQuestionId],
    );
    return rows[0] ? rows[0].drawing_path : null;
  },
};

module.exports = Answer;
