const { getAdapter } = require('../storage/storageFactory');

const StorageService = {
  async saveMedia(fileBuffer, originalName) {
    const adapter = getAdapter();
    return adapter.save(fileBuffer, originalName, 'media');
  },

  async saveDrawing(fileBuffer, originalName) {
    const adapter = getAdapter();
    return adapter.save(fileBuffer, originalName, 'drawings');
  },

  async deleteFile(relativePath) {
    const adapter = getAdapter();
    return adapter.delete(relativePath);
  },
};

module.exports = StorageService;
