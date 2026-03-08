const { parse } = require('csv-parse/sync'); // eslint-disable-line import/no-unresolved
const AppSettings = require('../models/AppSettings');
const Question = require('../models/Question');
const Tag = require('../models/Tag');
const User = require('../models/User');
const AuthService = require('./authService');

const VALID_CONTENT_TYPES = ['text', 'image', 'audio', 'video'];
const VALID_ANSWER_TYPES = ['multiple_choice', 'freeform_text', 'drawing'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const AdminService = {
  async getSettings() {
    return AppSettings.getAll();
  },

  async updateSettings(settings, adminId) {
    const allowedKeys = [
      'oauth_facebook_enabled',
      'oauth_microsoft_enabled',
      'oauth_github_enabled',
      'email_verification_enabled',
    ];
    for (const key of allowedKeys) {
      if (key in settings) {
        await AppSettings.set(key, settings[key] === 'on' || settings[key] === 'true' ? 'true' : 'false', adminId);
      }
    }
  },

  async resetUserPassword(userId, { password, sendResetLink }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found.');

    if (sendResetLink) {
      await AuthService.requestPasswordReset(user.email);
      return { method: 'link', email: user.email };
    }

    if (password) {
      await User.updatePassword(userId, password);
      return { method: 'direct' };
    }

    throw new Error('Either password or sendResetLink must be provided.');
  },

  async bulkUploadQuestions(fileBuffer, filename, createdBy) {
    const ext = filename.toLowerCase().split('.').pop();
    let questions;

    if (ext === 'csv') {
      questions = this.parseCSV(fileBuffer.toString('utf8'));
    } else if (ext === 'json') {
      questions = this.parseJSON(fileBuffer.toString('utf8'));
    } else {
      throw new Error('Unsupported file type. Use CSV or JSON.');
    }

    const results = { imported: 0, errors: [] };

    for (let i = 0; i < questions.length; i++) {
      const lineNum = i + 1;
      try {
        const q = questions[i];
        this.validateQuestion(q, lineNum);

        const created = await Question.create({
          text: q.text,
          contentType: q.content_type || 'text',
          answerType: q.answer_type || 'multiple_choice',
          difficulty: q.difficulty || 'medium',
          correctAnswer: q.correct_answer,
          options: q.options || null,
          timeLimit: parseInt(q.time_limit, 10) || 0,
          createdBy,
        });

        if (q.tags && q.tags.length > 0) {
          for (const tagName of q.tags) {
            const tag = await Tag.findOrCreate(tagName.trim());
            await Tag.addToQuestion(created.id, tag.id);
          }
        }

        results.imported += 1;
      } catch (err) {
        results.errors.push({ line: lineNum, error: err.message });
      }
    }

    return results;
  },

  parseCSV(content) {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records.map((r) => ({
      text: r.text,
      content_type: r.content_type || 'text',
      answer_type: r.answer_type || 'multiple_choice',
      difficulty: r.difficulty || 'medium',
      correct_answer: r.correct_answer,
      options: r.options ? r.options.split('|').map((o) => o.trim()) : null,
      tags: r.tags ? r.tags.split('|').map((t) => t.trim()).filter(Boolean) : [],
      time_limit: r.time_limit || '0',
    }));
  },

  parseJSON(content) {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of question objects.');
    }
    return data.map((q) => ({
      text: q.text,
      content_type: q.content_type || 'text',
      answer_type: q.answer_type || 'multiple_choice',
      difficulty: q.difficulty || 'medium',
      correct_answer: q.correct_answer,
      options: q.options || null,
      tags: q.tags || [],
      time_limit: q.time_limit || '0',
    }));
  },

  validateQuestion(q, lineNum) {
    if (!q.text || !q.text.trim()) {
      throw new Error(`Line ${lineNum}: Question text is required.`);
    }
    if (q.content_type && !VALID_CONTENT_TYPES.includes(q.content_type)) {
      throw new Error(`Line ${lineNum}: Invalid content type '${q.content_type}'.`);
    }
    if (q.answer_type && !VALID_ANSWER_TYPES.includes(q.answer_type)) {
      throw new Error(`Line ${lineNum}: Invalid answer type '${q.answer_type}'.`);
    }
    if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty)) {
      throw new Error(`Line ${lineNum}: Invalid difficulty '${q.difficulty}'.`);
    }
  },
};

module.exports = AdminService;
