const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('Team Model', () => {
  let Team;
  let mockPool;

  beforeEach(() => {
    mockPool = { execute: sinon.stub() };
    Team = proxyquire('../../../src/models/Team', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('MAX_TEAM_SIZE', () => {
    it('should be 6', () => {
      expect(Team.MAX_TEAM_SIZE).to.equal(6);
    });
  });

  describe('create', () => {
    it('should create a team', async () => {
      mockPool.execute.resolves([{ insertId: 1 }]);
      const result = await Team.create({ quizId: 1, name: 'Test Team' });
      expect(result.id).to.equal(1);
      expect(result.name).to.equal('Test Team');
    });
  });

  describe('addMember', () => {
    it('should add member when team is not full', async () => {
      mockPool.execute.onFirstCall().resolves([[{ count: 3 }]]);
      mockPool.execute.onSecondCall().resolves([{ insertId: 1 }]);
      const result = await Team.addMember(1, 1);
      expect(result).to.equal(1);
    });

    it('should throw when team is full', async () => {
      mockPool.execute.resolves([[{ count: 6 }]]);
      try {
        await Team.addMember(1, 1);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('full');
        expect(err.message).to.include('6');
      }
    });
  });

  describe('getMemberCount', () => {
    it('should return member count', async () => {
      mockPool.execute.resolves([[{ count: 4 }]]);
      const result = await Team.getMemberCount(1);
      expect(result).to.equal(4);
    });
  });

  describe('getMembers', () => {
    it('should return members', async () => {
      mockPool.execute.resolves([[{ id: 1, display_name: 'User' }]]);
      const result = await Team.getMembers(1);
      expect(result).to.have.length(1);
    });
  });

  describe('findByQuiz', () => {
    it('should return teams for quiz', async () => {
      mockPool.execute.resolves([[{ id: 1 }, { id: 2 }]]);
      const result = await Team.findByQuiz(1);
      expect(result).to.have.length(2);
    });
  });

  describe('updateName', () => {
    it('should update team name', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Team.updateName(1, 'New Name');
      expect(result).to.be.true;
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Team.removeMember(1, 1);
      expect(result).to.be.true;
    });
  });

  describe('findByUserAndQuiz', () => {
    it('should find team for user in quiz', async () => {
      mockPool.execute.resolves([[{ id: 1, name: 'Team A' }]]);
      const result = await Team.findByUserAndQuiz(1, 1);
      expect(result.name).to.equal('Team A');
    });

    it('should return null when not in a team', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Team.findByUserAndQuiz(1, 1);
      expect(result).to.be.null;
    });
  });

  describe('deleteById', () => {
    it('should delete team', async () => {
      mockPool.execute.resolves([{ affectedRows: 1 }]);
      const result = await Team.deleteById(1);
      expect(result).to.be.true;
    });
  });

  describe('findById', () => {
    it('should return team when found', async () => {
      mockPool.execute.resolves([[{ id: 1, name: 'Team' }]]);
      const result = await Team.findById(1);
      expect(result.name).to.equal('Team');
    });

    it('should return null when not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await Team.findById(999);
      expect(result).to.be.null;
    });
  });
});
