const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('StorageService', () => {
  let StorageService;
  let mockAdapter;

  beforeEach(() => {
    mockAdapter = {
      save: sinon.stub().resolves('/uploads/media/test.png'),
      delete: sinon.stub().resolves(),
    };
    StorageService = proxyquire('../../../src/services/storageService', {
      '../storage/storageFactory': {
        getAdapter: () => mockAdapter,
      },
    });
  });

  afterEach(() => sinon.restore());

  describe('saveMedia', () => {
    it('should save media file', async () => {
      const buf = Buffer.from('data');
      const result = await StorageService.saveMedia(buf, 'test.png');
      expect(result).to.equal('/uploads/media/test.png');
      expect(mockAdapter.save.calledOnce).to.be.true;
      expect(mockAdapter.save.firstCall.args[1]).to.equal('test.png');
      expect(mockAdapter.save.firstCall.args[2]).to.equal('media');
    });
  });

  describe('saveDrawing', () => {
    it('should save drawing file', async () => {
      mockAdapter.save.resolves('/uploads/drawings/test.png');
      const buf = Buffer.from('data');
      const result = await StorageService.saveDrawing(buf, 'test.png');
      expect(result).to.equal('/uploads/drawings/test.png');
      expect(mockAdapter.save.calledOnce).to.be.true;
      expect(mockAdapter.save.firstCall.args[1]).to.equal('test.png');
      expect(mockAdapter.save.firstCall.args[2]).to.equal('drawings');
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      await StorageService.deleteFile('/uploads/media/test.png');
      expect(mockAdapter.delete.calledOnce).to.be.true;
    });
  });
});
