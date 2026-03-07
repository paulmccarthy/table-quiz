const path = require('path');

const config = {
  backend: process.env.STORAGE_BACKEND || 'local',
  local: {
    uploadDir: path.resolve(process.env.UPLOAD_DIR || 'public/uploads'),
    mediaDir: path.resolve(process.env.UPLOAD_DIR || 'public/uploads', 'media'),
    drawingsDir: path.resolve(process.env.UPLOAD_DIR || 'public/uploads', 'drawings'),
  },
};

module.exports = config;
