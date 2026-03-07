/* eslint-env browser */
/* global socket, quizId */
(function initQuizMaster() {
  var btnStart = document.getElementById('btnStart');
  var btnNext = document.getElementById('btnNext');
  var btnPause = document.getElementById('btnPause');
  var btnResume = document.getElementById('btnResume');

  if (btnStart) {
    btnStart.addEventListener('click', function () {
      socket.emit('quiz:start', { quizId: quizId });
      btnStart.disabled = true;
      btnStart.textContent = 'Started';
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      socket.emit('quiz:nextQuestion', { quizId: quizId });
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', function () {
      socket.emit('quiz:pause', { quizId: quizId });
      btnPause.style.display = 'none';
      btnResume.style.display = 'block';
      btnResume.disabled = false;
    });
  }

  if (btnResume) {
    btnResume.addEventListener('click', function () {
      socket.emit('quiz:resume', { quizId: quizId });
      btnResume.style.display = 'none';
      btnPause.style.display = 'block';
    });
  }

  socket.on('round:complete', function (data) {
    if (data.pendingDrawings > 0) {
      var area = document.getElementById('drawingReviewArea');
      if (area) {
        area.innerHTML = '<p>' + data.pendingDrawings + ' drawing(s) need review.</p>';
        area.innerHTML += '<a href="/answers/' + quizId + '/round/' +
          document.getElementById('currentRound').textContent +
          '/drawings" class="btn btn-sm btn-outline-primary" target="_blank">Review Drawings</a>';
      }
    }
  });
}());
