const { Server } = require('socket.io');
const { socketRateLimiter } = require('./socketRateLimiter');
const setupQuizSocket = require('./quizSocket');
const setupLeaderboardSocket = require('./leaderboardSocket');

function setupWebSockets(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: {
      origin: process.env.APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Share session with socket.io
  io.engine.use(sessionMiddleware);

  // Passport deserialization for sockets
  io.use((socket, next) => {
    const { request: req } = socket;
    if (req.session && req.session.passport && req.session.passport.user) {
      const User = require('../models/User');
      User.findById(req.session.passport.user).then((user) => {
        req.user = user;
        socket.request.user = user;
        next();
      }).catch(next);
    } else {
      next(new Error('Authentication required'));
    }
  });

  // Rate limiting
  io.use(socketRateLimiter);

  setupQuizSocket(io);
  setupLeaderboardSocket(io);

  return io;
}

module.exports = setupWebSockets;
