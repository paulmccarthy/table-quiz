const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('TagService', () => {
  let TagService;
  let mockTag;
  let mockPool;

  beforeEach(() => {
    mockTag = {
      search: sinon.stub(),
      findOrCreate: sinon.stub(),
      setQuestionTags: sinon.stub().resolves(),
      getQuestionTags: sinon.stub(),
      setQuizTags: sinon.stub().resolves(),
      getQuizTags: sinon.stub(),
    };
    mockPool = {
      execute: sinon.stub(),
    };
    TagService = proxyquire('../../../src/services/tagService', {
      '../models/Tag': mockTag,
      '../config/database': mockPool,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('search', () => {
    it('should delegate to Tag.search', async () => {
      const tags = [{ id: 1, name: 'Science' }];
      mockTag.search.resolves(tags);
      const result = await TagService.search('sci');
      expect(result).to.deep.equal(tags);
      expect(mockTag.search.calledWith('sci')).to.be.true;
    });
  });

  describe('findOrCreateByNames', () => {
    it('should find or create tags for each name', async () => {
      mockTag.findOrCreate
        .onFirstCall().resolves({ id: 1, name: 'Science' })
        .onSecondCall().resolves({ id: 2, name: 'Math' });

      const result = await TagService.findOrCreateByNames(['Science', 'Math']);
      expect(result).to.have.length(2);
      expect(mockTag.findOrCreate.calledTwice).to.be.true;
    });

    it('should skip empty names', async () => {
      mockTag.findOrCreate.resolves({ id: 1, name: 'Science' });
      const result = await TagService.findOrCreateByNames(['Science', '', '  ']);
      expect(result).to.have.length(1);
      expect(mockTag.findOrCreate.calledOnce).to.be.true;
    });
  });

  describe('setQuestionTags', () => {
    it('should find or create tags and set them on the question', async () => {
      mockTag.findOrCreate
        .onFirstCall().resolves({ id: 1, name: 'Science' })
        .onSecondCall().resolves({ id: 2, name: 'Math' });
      mockTag.setQuestionTags.resolves();

      const result = await TagService.setQuestionTags(10, ['Science', 'Math']);
      expect(result).to.have.length(2);
      expect(mockTag.setQuestionTags.calledWith(10, [1, 2])).to.be.true;
    });
  });

  describe('getQuestionTags', () => {
    it('should delegate to Tag.getQuestionTags', async () => {
      const tags = [{ id: 1, name: 'Science' }];
      mockTag.getQuestionTags.resolves(tags);
      const result = await TagService.getQuestionTags(10);
      expect(result).to.deep.equal(tags);
      expect(mockTag.getQuestionTags.calledWith(10)).to.be.true;
    });
  });

  describe('setQuizTags', () => {
    it('should find or create tags and set them on the quiz', async () => {
      mockTag.findOrCreate
        .onFirstCall().resolves({ id: 3, name: 'History' })
        .onSecondCall().resolves({ id: 4, name: 'Geography' });
      mockTag.setQuizTags.resolves();

      const result = await TagService.setQuizTags(20, ['History', 'Geography']);
      expect(result).to.have.length(2);
      expect(mockTag.setQuizTags.calledWith(20, [3, 4])).to.be.true;
    });
  });

  describe('getQuizTags', () => {
    it('should delegate to Tag.getQuizTags', async () => {
      const tags = [{ id: 3, name: 'History' }];
      mockTag.getQuizTags.resolves(tags);
      const result = await TagService.getQuizTags(20);
      expect(result).to.deep.equal(tags);
      expect(mockTag.getQuizTags.calledWith(20)).to.be.true;
    });
  });

  describe('searchQuestions', () => {
    it('should search questions with query and tag ids', async () => {
      const questions = [{ id: 1, text: 'What is 2+2?', options: '["3","4","5"]' }];
      mockPool.execute.resolves([questions]);

      const result = await TagService.searchQuestions('What', [1, 2]);
      expect(result).to.have.length(1);
      expect(result[0].options).to.deep.equal(['3', '4', '5']);
    });

    it('should search questions with query only', async () => {
      const questions = [{ id: 1, text: 'What is 2+2?', options: null }];
      mockPool.execute.resolves([questions]);

      const result = await TagService.searchQuestions('What', []);
      expect(result).to.have.length(1);
      expect(result[0].options).to.be.null;
    });

    it('should search questions with tag ids only', async () => {
      const questions = [{ id: 1, text: 'What is 2+2?' }];
      mockPool.execute.resolves([questions]);

      const result = await TagService.searchQuestions('', [1]);
      expect(result).to.have.length(1);
    });

    it('should return all questions when no filters provided', async () => {
      const questions = [{ id: 1, text: 'Q1' }, { id: 2, text: 'Q2' }];
      mockPool.execute.resolves([questions]);

      const result = await TagService.searchQuestions('', []);
      expect(result).to.have.length(2);
    });

    it('should not parse options when already an object', async () => {
      const questions = [{ id: 1, text: 'Q1', options: ['a', 'b'] }];
      mockPool.execute.resolves([questions]);

      const result = await TagService.searchQuestions('Q1', []);
      expect(result[0].options).to.deep.equal(['a', 'b']);
    });
  });
});
