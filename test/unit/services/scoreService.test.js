const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('ScoreService', () => {
  let ScoreService;
  let mockPool;
  let mockAnswer;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    mockAnswer = {
      findByRoundQuestion: sinon.stub(),
      autoMark: sinon.stub().resolves(true),
    };
    ScoreService = proxyquire('../../../src/services/scoreService', {
      '../config/database': mockPool,
      '../models/Answer': mockAnswer,
    });
  });

  afterEach(() => sinon.restore());

  describe('calculateRoundScores', () => {
    it('should calculate and upsert scores', async () => {
      mockPool.execute.onFirstCall().resolves([[
        { user_id: 1, team_id: null, is_correct: true },
        { user_id: 1, team_id: null, is_correct: true },
        { user_id: 2, team_id: null, is_correct: false },
      ]]);
      mockPool.execute.resolves([{ affectedRows: 1 }]);

      const result = await ScoreService.calculateRoundScores(1, 1);
      expect(result).to.be.an('array');
    });
  });

  describe('getLeaderboard', () => {
    it('should return ranked leaderboard', async () => {
      mockPool.execute.resolves([[
        { name: 'Team A', total_score: 10 },
        { name: 'Team B', total_score: 5 },
      ]]);
      const result = await ScoreService.getLeaderboard(1);
      expect(result).to.have.length(2);
      expect(result[0].total_score).to.equal(10);
    });
  });

  describe('getRoundLeaderboard', () => {
    it('should return round leaderboard', async () => {
      mockPool.execute.resolves([[{ name: 'A', score: 5 }]]);
      const result = await ScoreService.getRoundLeaderboard(1, 1);
      expect(result).to.have.length(1);
    });
  });

  describe('overrideScore', () => {
    it('should override score', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      await ScoreService.overrideScore(1, 10, 1);
      expect(mockPool.execute.calledOnce).to.be.true;
    });
  });

  describe('autoMarkAnswers', () => {
    it('should auto-mark choice answers', async () => {
      mockAnswer.findByRoundQuestion.resolves([
        { id: 1, answer_type: 'choice', answer_value: 'A' },
        { id: 2, answer_type: 'choice', answer_value: 'B' },
      ]);
      await ScoreService.autoMarkAnswers(1, 'A', 'multiple_choice');
      expect(mockAnswer.autoMark.calledTwice).to.be.true;
      expect(mockAnswer.autoMark.firstCall.args[1]).to.be.true;
      expect(mockAnswer.autoMark.secondCall.args[1]).to.be.false;
    });

    it('should auto-mark text answers case-insensitively', async () => {
      mockAnswer.findByRoundQuestion.resolves([
        { id: 1, answer_type: 'text', answer_value: '  Paris  ' },
      ]);
      await ScoreService.autoMarkAnswers(1, 'paris', 'freeform_text');
      expect(mockAnswer.autoMark.calledWith(1, true)).to.be.true;
    });

    it('should skip drawing answers', async () => {
      mockAnswer.findByRoundQuestion.resolves([
        { id: 1, answer_type: 'drawing', answer_value: null },
      ]);
      await ScoreService.autoMarkAnswers(1, 'anything', 'drawing');
      expect(mockAnswer.autoMark.called).to.be.false;
    });
  });
});
