const ExportService = require('../services/exportService');
const Quiz = require('../models/Quiz');

const ExportController = {
  async exportCSV(req, res) {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        req.flash('error', 'Quiz not found.');
        return res.redirect('/quiz');
      }
      const csv = await ExportService.generateCSV(req.params.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}-results.csv"`);
      res.send(csv);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  },

  async exportPDF(req, res) {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        req.flash('error', 'Quiz not found.');
        return res.redirect('/quiz');
      }
      const pdf = await ExportService.generatePDF(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}-results.pdf"`);
      res.send(pdf);
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  },
};

module.exports = ExportController;
