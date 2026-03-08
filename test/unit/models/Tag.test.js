const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Tag Model', () => {
  let Tag;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      execute: sinon.stub(),
    };
    Tag = proxyquire('../../../src/models/Tag', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findOrCreate', () => {
    it('should return existing tag when found', async () => {
      const existingTag = { id: 1, name: 'Science', normalized_name: 'science' };
      mockPool.execute.resolves([[existingTag]]);
      const result = await Tag.findOrCreate('Science');
      expect(result).to.deep.equal(existingTag);
      expect(mockPool.execute.calledOnce).to.be.true;
    });

    it('should create a new tag when not found', async () => {
      mockPool.execute.onFirstCall().resolves([[]]);
      mockPool.execute.onSecondCall().resolves([{ insertId: 5 }]);
      const result = await Tag.findOrCreate('History');
      expect(result).to.deep.equal({ id: 5, name: 'History', normalized_name: 'history' });
      expect(mockPool.execute.calledTwice).to.be.true;
    });

    it('should normalize tag name to lowercase and trim', async () => {
      mockPool.execute.onFirstCall().resolves([[]]);
      mockPool.execute.onSecondCall().resolves([{ insertId: 6 }]);
      const result = await Tag.findOrCreate('  Math  ');
      expect(result.name).to.equal('Math');
      expect(result.normalized_name).to.equal('math');
    });

    it('should throw error for empty tag name', async () => {
      try {
        await Tag.findOrCreate('   ');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Tag name cannot be empty.');
      }
    });
  });

  describe('findById', () => {
    it('should return tag when found', async () => {
      const tag = { id: 1, name: 'Science', normalized_name: 'science' };
      mockPool.execute.resolves([[tag]]);
      const result = await Tag.findById(1);
      expect(result).to.deep.equal(tag);
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Tag.findById(999);
      expect(result).to.be.null;
    });
  });

  describe('search', () => {
    it('should return matching tags', async () => {
      const tags = [
        { id: 1, name: 'Science', normalized_name: 'science' },
        { id: 2, name: 'Sports', normalized_name: 'sports' },
      ];
      mockPool.execute.resolves([tags]);
      const result = await Tag.search('s');
      expect(result).to.deep.equal(tags);
      expect(mockPool.execute.calledOnce).to.be.true;
    });

    it('should return empty array for empty prefix', async () => {
      const result = await Tag.search('   ');
      expect(result).to.deep.equal([]);
      expect(mockPool.execute.called).to.be.false;
    });

    it('should normalize the search prefix', async () => {
      mockPool.execute.resolves([[]]);
      await Tag.search('  SCI  ');
      const args = mockPool.execute.firstCall.args;
      expect(args[1][0]).to.equal('sci%');
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const tags = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      mockPool.execute.resolves([tags]);
      const result = await Tag.findAll();
      expect(result).to.deep.equal(tags);
    });
  });

  describe('addToQuestion', () => {
    it('should insert a question-tag association', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.addToQuestion(10, 5);
      expect(mockPool.execute.calledOnce).to.be.true;
      const args = mockPool.execute.firstCall.args;
      expect(args[1]).to.deep.equal([10, 5]);
    });
  });

  describe('removeFromQuestion', () => {
    it('should delete a question-tag association', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.removeFromQuestion(10, 5);
      expect(mockPool.execute.calledOnce).to.be.true;
      const args = mockPool.execute.firstCall.args;
      expect(args[1]).to.deep.equal([10, 5]);
    });
  });

  describe('setQuestionTags', () => {
    it('should delete existing tags and insert new ones', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.setQuestionTags(10, [1, 2, 3]);
      // 1 delete + 3 inserts = 4 calls
      expect(mockPool.execute.callCount).to.equal(4);
    });

    it('should only delete when tagIds is empty', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.setQuestionTags(10, []);
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('getQuestionTags', () => {
    it('should return tags for a question', async () => {
      const tags = [{ id: 1, name: 'Science' }];
      mockPool.execute.resolves([tags]);
      const result = await Tag.getQuestionTags(10);
      expect(result).to.deep.equal(tags);
    });
  });

  describe('addToQuiz', () => {
    it('should insert a quiz-tag association', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.addToQuiz(20, 5);
      expect(mockPool.execute.calledOnce).to.be.true;
      const args = mockPool.execute.firstCall.args;
      expect(args[1]).to.deep.equal([20, 5]);
    });
  });

  describe('removeFromQuiz', () => {
    it('should delete a quiz-tag association', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.removeFromQuiz(20, 5);
      expect(mockPool.execute.calledOnce).to.be.true;
      const args = mockPool.execute.firstCall.args;
      expect(args[1]).to.deep.equal([20, 5]);
    });
  });

  describe('setQuizTags', () => {
    it('should delete existing tags and insert new ones', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.setQuizTags(20, [1, 2]);
      // 1 delete + 2 inserts = 3 calls
      expect(mockPool.execute.callCount).to.equal(3);
    });

    it('should only delete when tagIds is empty', async () => {
      mockPool.execute.resolves([{}]);
      await Tag.setQuizTags(20, []);
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('getQuizTags', () => {
    it('should return tags for a quiz', async () => {
      const tags = [{ id: 2, name: 'History' }];
      mockPool.execute.resolves([tags]);
      const result = await Tag.getQuizTags(20);
      expect(result).to.deep.equal(tags);
    });
  });

  describe('deleteById', () => {
    it('should return true when tag is deleted', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Tag.deleteById(1);
      expect(result).to.be.true;
    });

    it('should return false when tag not found', async () => {
      mockPool.execute.resolves([{ affectedRows: 0 }]);
      const result = await Tag.deleteById(999);
      expect(result).to.be.false;
    });
  });
});
