const ScoreService = require('../services/scoreService');

function setupLeaderboardSocket(io) {
  const leaderboardNamespace = io.of('/leaderboard');

  leaderboardNamespace.on('connection', (socket) => {
    socket.on('leaderboard:subscribe', async ({ quizId }) => {
      socket.join(`leaderboard:${quizId}`);
      const leaderboard = await ScoreService.getLeaderboard(quizId);
      socket.emit('leaderboard:update', { leaderboard });
    });
  });
}

module.exports = setupLeaderboardSocket;
