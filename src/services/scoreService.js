const pool = require('../config/database');
const Answer = require('../models/Answer');

const ScoreService = {
  async calculateRoundScores(quizId, roundId) {
    // Get all answers for this round's questions
    const [answers] = await pool.execute(
      `SELECT a.*, rq.round_id
       FROM answers a
       JOIN round_questions rq ON a.round_question_id = rq.id
       WHERE rq.round_id = ? AND a.is_correct IS NOT NULL`,
      [roundId],
    );

    // Aggregate scores by team/individual
    const scoreMap = {};
    answers.forEach((answer) => {
      const key = answer.team_id ? `team_${answer.team_id}` : `user_${answer.user_id}`;
      if (!scoreMap[key]) {
        scoreMap[key] = {
          teamId: answer.team_id, userId: answer.team_id ? null : answer.user_id, score: 0,
        };
      }
      if (answer.is_correct) {
        scoreMap[key].score += 1;
      }
    });

    // Upsert scores
    for (const entry of Object.values(scoreMap)) {
      // eslint-disable-next-line no-await-in-loop
      await pool.execute(
        `INSERT INTO scores (quiz_id, round_id, team_id, user_id, score)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [quizId, roundId, entry.teamId, entry.userId, entry.score],
      );
    }

    return Object.values(scoreMap);
  },

  async overrideScore(scoreId, newScore, overriddenBy) {
    await pool.execute(
      'UPDATE scores SET score = ?, override_flag = TRUE, overridden_by = ? WHERE id = ?',
      [newScore, overriddenBy, scoreId],
    );
  },

  async getLeaderboard(quizId) {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(t.name, u.display_name) AS name,
         s.team_id, s.user_id,
         SUM(s.score) AS total_score
       FROM scores s
       LEFT JOIN teams t ON s.team_id = t.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.quiz_id = ?
       GROUP BY s.team_id, s.user_id, name
       ORDER BY total_score DESC`,
      [quizId],
    );
    return rows;
  },

  async getRoundLeaderboard(quizId, roundId) {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(t.name, u.display_name) AS name,
         s.team_id, s.user_id, s.score
       FROM scores s
       LEFT JOIN teams t ON s.team_id = t.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.quiz_id = ? AND s.round_id = ?
       ORDER BY s.score DESC`,
      [quizId, roundId],
    );
    return rows;
  },

  // eslint-disable-next-line no-unused-vars
  async autoMarkAnswers(roundQuestionId, correctAnswer, answerType) {
    const answers = await Answer.findByRoundQuestion(roundQuestionId);
    for (const answer of answers) {
      if (answer.answer_type === 'drawing') continue;
      let isCorrect = false;
      if (answer.answer_type === 'choice') {
        isCorrect = answer.answer_value === correctAnswer;
      } else if (answer.answer_type === 'text') {
        isCorrect = answer.answer_value
          && answer.answer_value.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }
      // eslint-disable-next-line no-await-in-loop
      await Answer.autoMark(answer.id, isCorrect);
    }
  },
};

module.exports = ScoreService;
