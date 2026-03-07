const pool = require('../config/database');

const Round = {
  async create({ quizId, roundNumber, numQuestions = 0 }) {
    const [result] = await pool.execute(
      'INSERT INTO rounds (quiz_id, round_number, num_questions) VALUES (?, ?, ?)',
      [quizId, roundNumber, numQuestions],
    );
    return { id: result.insertId, quizId, roundNumber, numQuestions };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM rounds WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByQuiz(quizId) {
    const [rows] = await pool.execute(
      'SELECT * FROM rounds WHERE quiz_id = ? ORDER BY round_number',
      [quizId],
    );
    return rows;
  },

  async update(id, { numQuestions }) {
    const [result] = await pool.execute(
      'UPDATE rounds SET num_questions = ? WHERE id = ?',
      [numQuestions, id],
    );
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM rounds WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async addQuestion({ roundId, questionId, questionOrder }) {
    const [result] = await pool.execute(
      'INSERT INTO round_questions (round_id, question_id, question_order) VALUES (?, ?, ?)',
      [roundId, questionId, questionOrder],
    );
    return { id: result.insertId };
  },

  async removeQuestion(roundQuestionId) {
    const [result] = await pool.execute(
      'DELETE FROM round_questions WHERE id = ?',
      [roundQuestionId],
    );
    return result.affectedRows > 0;
  },

  async getQuestions(roundId) {
    const [rows] = await pool.execute(
      `SELECT rq.id AS round_question_id, rq.question_order, q.*
       FROM round_questions rq
       JOIN questions q ON rq.question_id = q.id
       WHERE rq.round_id = ?
       ORDER BY rq.question_order`,
      [roundId],
    );
    return rows.map((row) => {
      if (row.options && typeof row.options === 'string') {
        row.options = JSON.parse(row.options);
      }
      return row;
    });
  },
};

module.exports = Round;
