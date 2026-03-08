const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');
const Answer = require('../models/Answer');
const Quiz = require('../models/Quiz');
const ScoreService = require('./scoreService');

const ExportService = {
  async generateCSV(quizId) {
    const quiz = await Quiz.findById(quizId);
    const answers = await Answer.findByQuiz(quizId);

    const records = answers.map((a) => ({
      quiz_title: quiz.title,
      round_number: a.round_number,
      question_number: a.question_order,
      question_text: a.question_text,
      player_email: a.email,
      player_name: a.display_name,
      team_name: a.team_name || 'Individual',
      answer_value: a.answer_type === 'drawing' ? '[Drawing]' : a.answer_value,
      is_correct: a.is_correct === null ? 'Pending' : (a.is_correct ? 'Yes' : 'No'),
    }));

    return stringify(records, { header: true });
  },

  async generatePDF(quizId) {
    const quiz = await Quiz.findById(quizId);
    const answers = await Answer.findByQuiz(quizId);
    const leaderboard = await ScoreService.getLeaderboard(quizId);

    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));

    // Header
    doc.fontSize(20).text(`Quiz Results: ${quiz.title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Quizmaster ID: ${quiz.quizmaster_id}`);
    doc.moveDown();

    // Leaderboard
    doc.fontSize(16).text('Final Rankings', { underline: true });
    doc.moveDown(0.5);
    leaderboard.forEach((entry, index) => {
      doc.fontSize(12).text(`${index + 1}. ${entry.name} - ${entry.total_score} points`);
    });
    doc.moveDown();

    // Answers by round
    let currentRound = null;
    answers.forEach((a) => {
      if (a.round_number !== currentRound) {
        currentRound = a.round_number;
        doc.moveDown();
        doc.fontSize(14).text(`Round ${currentRound}`, { underline: true });
        doc.moveDown(0.5);
      }
      const correct = a.is_correct === null ? 'Pending' : (a.is_correct ? 'Correct' : 'Incorrect');
      const answerText = a.answer_type === 'drawing' ? '[Drawing]' : a.answer_value;
      doc.fontSize(10).text(
        `Q${a.question_order}: ${a.display_name} (${a.team_name || 'Individual'}) - ${answerText} - ${correct}`,
      );
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  },
};

module.exports = ExportService;
