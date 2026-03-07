const Team = require('../models/Team');
const pool = require('../config/database');

const TeamService = {
  async createTeam({ quizId, name, userId }) {
    const team = await Team.create({ quizId, name });
    if (userId) {
      await Team.addMember(team.id, userId);
    }
    return team;
  },

  async joinTeam(teamId, userId) {
    return Team.addMember(teamId, userId);
  },

  async leaveTeam(teamId, userId) {
    return Team.removeMember(teamId, userId);
  },

  async randomAssign(quizId, playerIds) {
    const teams = await Team.findByQuiz(quizId);
    if (teams.length === 0) {
      throw new Error('No teams exist for this quiz.');
    }
    // Shuffle players
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const assignments = [];
    for (let i = 0; i < shuffled.length; i++) {
      const team = teams[i % teams.length];
      const count = await Team.getMemberCount(team.id);
      if (count >= Team.MAX_TEAM_SIZE) {
        throw new Error(`Team "${team.name}" is full.`);
      }
      await Team.addMember(team.id, shuffled[i]);
      assignments.push({ userId: shuffled[i], teamId: team.id, teamName: team.name });
    }
    return assignments;
  },

  async getTeamsWithMembers(quizId) {
    const teams = await Team.findByQuiz(quizId);
    for (const team of teams) {
      team.members = await Team.getMembers(team.id);
    }
    return teams;
  },
};

module.exports = TeamService;
