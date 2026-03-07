/* eslint-env browser */
/* global socket, quizId */
(function initQuizPlayer() {
  socket.on('player:joined', function (data) {
    console.log('Player joined:', data.displayName);
  });

  socket.on('player:disconnected', function (data) {
    console.log('Player disconnected:', data.displayName);
  });
}());
