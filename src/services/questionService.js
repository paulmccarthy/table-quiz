const Question = require('../models/Question');
const StorageService = require('./storageService');

const QuestionService = {
  async createQuestion(data, mediaFile) {
    let mediaPath = null;
    if (mediaFile) {
      mediaPath = await StorageService.saveMedia(mediaFile.buffer, mediaFile.originalname);
    }
    return Question.create({ ...data, mediaPath });
  },

  async updateQuestion(id, data, mediaFile) {
    if (mediaFile) {
      const existing = await Question.findById(id);
      if (existing && existing.media_path) {
        await StorageService.deleteFile(existing.media_path);
      }
      data.media_path = await StorageService.saveMedia(mediaFile.buffer, mediaFile.originalname);
    }
    return Question.update(id, data);
  },

  async deleteQuestion(id) {
    const existing = await Question.findById(id);
    if (existing && existing.media_path) {
      await StorageService.deleteFile(existing.media_path);
    }
    return Question.deleteById(id);
  },
};

module.exports = QuestionService;
