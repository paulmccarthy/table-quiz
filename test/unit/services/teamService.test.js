const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('TeamService', () => {
  let TeamService;
  let mockTeam;
  let mockPool;

  beforeEach(() => {
    mockTeam = {
      create: sinon.stub().resolves({ id: 1, name: 'Team A' }),
      addMember: sinon.stub().resolves(1),
      removeMember: sinon.stub().resolves(true),
      findByQuiz: sinon.stub().resolves([
        { id: 1, name: 'Team A' },
        { id: 2, name: 'Team B' },
      ]),
      getMembers: sinon.stub().resolves([]),
      getMemberCount: sinon.stub().resolves(2),
      MAX_TEAM_SIZE: 6,
    };
    mockPool = { execute: sinon.stub() };
    TeamService = proxyquire('../../../src/services/teamService', {
      '../models/Team': mockTeam,
      '../config/database': mockPool,
    });
  });

  afterEach(() => sinon.restore());

  describe('createTeam', () => {
    it('should create team and add creator', async () => {
      const result = await TeamService.createTeam({ quizId: 1, name: 'Team A', userId: 1 });
      expect(result.name).to.equal('Team A');
      expect(mockTeam.addMember.calledOnce).to.be.true;
    });

    it('should create team without member', async () => {
      await TeamService.createTeam({ quizId: 1, name: 'Team B' });
      expect(mockTeam.addMember.called).to.be.false;
    });
  });

  describe('joinTeam', () => {
    it('should join team', async () => {
      await TeamService.joinTeam(1, 1);
      expect(mockTeam.addMember.calledWith(1, 1)).to.be.true;
    });
  });

  describe('leaveTeam', () => {
    it('should leave team', async () => {
      await TeamService.leaveTeam(1, 1);
      expect(mockTeam.removeMember.calledWith(1, 1)).to.be.true;
    });
  });

  describe('randomAssign', () => {
    it('should assign players to teams', async () => {
      const result = await TeamService.randomAssign(1, [1, 2, 3, 4]);
      expect(result).to.have.length(4);
      expect(mockTeam.addMember.callCount).to.equal(4);
    });

    it('should throw when no teams exist', async () => {
      mockTeam.findByQuiz.resolves([]);
      try {
        await TeamService.randomAssign(1, [1, 2]);
        expect.fail('Should throw');
      } catch (err) {
        expect(err.message).to.include('No teams');
      }
    });
  });

  describe('getTeamsWithMembers', () => {
    it('should return teams with members populated', async () => {
      const result = await TeamService.getTeamsWithMembers(1);
      expect(result).to.have.length(2);
      expect(mockTeam.getMembers.calledTwice).to.be.true;
    });
  });
});
