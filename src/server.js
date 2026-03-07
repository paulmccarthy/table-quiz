const http = require('http');
const app = require('./app');
const setupWebSockets = require('./websockets');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
setupWebSockets(server, app.sessionMiddleware);

server.listen(PORT, () => {
  console.log(`Table Quiz server running on port ${PORT}`);
});

module.exports = server;
