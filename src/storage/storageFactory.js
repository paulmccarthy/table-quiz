const storageConfig = require('../config/storage');

function getAdapter() {
  switch (storageConfig.backend) {
    case 'local':
    default:
      return require('./localAdapter');
  }
}

module.exports = { getAdapter };
