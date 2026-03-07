const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const storageConfig = require('../config/storage');

const LocalAdapter = {
  async save(fileBuffer, originalName, subdir = 'media') {
    const dir = subdir === 'drawings' ? storageConfig.local.drawingsDir : storageConfig.local.mediaDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const ext = path.extname(originalName);
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    // Return relative path for storage in DB
    const relativePath = path.relative(path.resolve('public'), filePath);
    return `/${relativePath}`;
  },

  async delete(relativePath) {
    if (!relativePath) return;
    const fullPath = path.join(path.resolve('public'), relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  },

  getFullPath(relativePath) {
    return path.join(path.resolve('public'), relativePath);
  },
};

module.exports = LocalAdapter;
