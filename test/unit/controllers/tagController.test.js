const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { createMockReq, createMockRes } = require('../../helpers/setup');

describe('TagController', () => {
  let TagController;
  let mockTagService;

  beforeEach(() => {
    mockTagService = {
      search: sinon.stub(),
      searchQuestions: sinon.stub(),
    };
    TagController = proxyquire('../../../src/controllers/tagController', {
      '../services/tagService': mockTagService,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('search', () => {
    it('should return matching tags as JSON', async () => {
      const tags = [{ id: 1, name: 'Science' }];
      mockTagService.search.resolves(tags);
      const req = createMockReq({ query: { q: 'sci' } });
      const res = createMockRes();

      await TagController.search(req, res);

      expect(res.json.calledWith(tags)).to.be.true;
      expect(mockTagService.search.calledWith('sci')).to.be.true;
    });

    it('should use empty string when no query provided', async () => {
      mockTagService.search.resolves([]);
      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await TagController.search(req, res);

      expect(mockTagService.search.calledWith('')).to.be.true;
      expect(res.json.calledWith([])).to.be.true;
    });

    it('should return 500 on error', async () => {
      mockTagService.search.rejects(new Error('DB failure'));
      const req = createMockReq({ query: { q: 'test' } });
      const res = createMockRes();

      await TagController.search(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'DB failure' })).to.be.true;
    });
  });

  describe('searchQuestions', () => {
    it('should return matching questions as JSON', async () => {
      const questions = [{ id: 1, text: 'Q1' }];
      mockTagService.searchQuestions.resolves(questions);
      const req = createMockReq({ query: { q: 'What', tags: '1,2' } });
      const res = createMockRes();

      await TagController.searchQuestions(req, res);

      expect(res.json.calledWith(questions)).to.be.true;
      expect(mockTagService.searchQuestions.calledWith('What', [1, 2])).to.be.true;
    });

    it('should handle missing query and tags', async () => {
      mockTagService.searchQuestions.resolves([]);
      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await TagController.searchQuestions(req, res);

      expect(mockTagService.searchQuestions.calledWith('', [])).to.be.true;
    });

    it('should filter out invalid tag ids', async () => {
      mockTagService.searchQuestions.resolves([]);
      const req = createMockReq({ query: { tags: '1,abc,3' } });
      const res = createMockRes();

      await TagController.searchQuestions(req, res);

      expect(mockTagService.searchQuestions.calledWith('', [1, 3])).to.be.true;
    });

    it('should return 500 on error', async () => {
      mockTagService.searchQuestions.rejects(new Error('Search failed'));
      const req = createMockReq({ query: { q: 'test' } });
      const res = createMockRes();

      await TagController.searchQuestions(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Search failed' })).to.be.true;
    });
  });
});
