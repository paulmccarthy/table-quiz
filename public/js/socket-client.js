/* eslint-env browser */
/* global io, quizId, isQuizmaster */
var socket = io('/quiz');

socket.emit('quiz:join', { quizId: quizId });

function renderLeaderboard(container, leaderboard) {
  if (!leaderboard || !leaderboard.length) {
    container.innerHTML = '<p>No scores yet.</p>';
    return;
  }
  var html = '<table class="table table-sm"><thead><tr><th>#</th><th>Name</th><th>Score</th></tr></thead><tbody>';
  leaderboard.forEach(function (entry, i) {
    html += '<tr' + (i < 3 ? ' class="table-success"' : '') + '>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td>' + entry.name + '</td>';
    html += '<td>' + entry.total_score + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

socket.on('quiz:sync', function (data) {
  document.getElementById('quizStatus').textContent = data.status;
  document.getElementById('currentRound').textContent = data.currentRound + 1;
  document.getElementById('currentQuestion').textContent = data.currentQuestion + 1;

  if (data.status === 'active' && data.currentQuestionData) {
    showQuestion({
      text: data.currentQuestionData.text,
      contentType: data.currentQuestionData.content_type,
      answerType: data.currentQuestionData.answer_type,
      options: data.currentQuestionData.options,
      mediaPath: data.currentQuestionData.media_path,
      questionOrder: data.currentQuestionData.question_order,
      timeLimit: data.timerState.remaining,
      roundNumber: data.currentRound + 1,
    });

    if (data.existingAnswer) {
      restoreAnswer(data.existingAnswer);
    }
  }
});

socket.on('quiz:started', function () {
  document.getElementById('waitingMessage').style.display = 'none';
  document.getElementById('quizStatus').textContent = 'Active';
});

socket.on('quiz:paused', function (data) {
  document.getElementById('quizStatus').textContent = 'Paused';
});

socket.on('quiz:resumed', function (data) {
  document.getElementById('quizStatus').textContent = 'Active';
});

socket.on('question:show', function (data) {
  showQuestion(data);
});

socket.on('timer:tick', function (data) {
  var badge = document.getElementById('timerBadge');
  if (badge) badge.textContent = data.remaining + 's';
});

socket.on('round:complete', function (data) {
  document.getElementById('questionDisplay').style.display = 'none';
  var rc = document.getElementById('roundComplete');
  rc.style.display = 'block';
  var rl = document.getElementById('roundLeaderboard');
  renderLeaderboard(rl, data.leaderboard);
  renderLeaderboard(document.getElementById('sideLeaderboard'), data.leaderboard);
  document.getElementById('currentRound').textContent = data.roundNumber;
});

socket.on('round:start', function (data) {
  document.getElementById('roundComplete').style.display = 'none';
  document.getElementById('currentRound').textContent = data.roundNumber;
});

socket.on('quiz:completed', function (data) {
  document.getElementById('questionDisplay').style.display = 'none';
  document.getElementById('roundComplete').style.display = 'none';
  var qc = document.getElementById('quizComplete');
  qc.style.display = 'block';
  renderLeaderboard(document.getElementById('finalLeaderboard'), data.leaderboard);
  renderLeaderboard(document.getElementById('sideLeaderboard'), data.leaderboard);
  document.getElementById('quizStatus').textContent = 'Completed';
});

socket.on('answer:received', function () {
  // Visual feedback
});

socket.on('error', function (data) {
  console.error('Socket error:', data.message);
});

function showQuestion(data) {
  document.getElementById('waitingMessage').style.display = 'none';
  document.getElementById('roundComplete').style.display = 'none';
  var qd = document.getElementById('questionDisplay');
  qd.style.display = 'block';

  document.getElementById('questionText').textContent =
    'Q' + data.questionOrder + ': ' + data.text;
  document.getElementById('timerBadge').textContent =
    data.timeLimit > 0 ? data.timeLimit + 's' : 'Manual';
  document.getElementById('currentQuestion').textContent = data.questionOrder;
  document.getElementById('currentRound').textContent = data.roundNumber;

  // Media
  var mediaArea = document.getElementById('questionMedia');
  mediaArea.innerHTML = '';
  if (data.mediaPath) {
    if (data.contentType === 'image') {
      mediaArea.innerHTML = '<img src="' + data.mediaPath + '" class="img-fluid mb-3" />';
    } else if (data.contentType === 'audio') {
      mediaArea.innerHTML = '<audio controls class="w-100 mb-3"><source src="' + data.mediaPath + '"></audio>';
    } else if (data.contentType === 'video') {
      mediaArea.innerHTML = '<video controls class="w-100 mb-3"><source src="' + data.mediaPath + '"></video>';
    }
  }

  // Answer areas
  document.getElementById('mcArea').style.display = 'none';
  document.getElementById('textArea').style.display = 'none';
  document.getElementById('drawingArea').style.display = 'none';

  if (data.answerType === 'multiple_choice') {
    document.getElementById('mcArea').style.display = 'block';
    var mcOpts = document.getElementById('mcOptions');
    mcOpts.innerHTML = '';
    var options = data.options;
    if (typeof options === 'string') options = JSON.parse(options);
    if (options && options.length) {
      options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary';
        btn.textContent = opt;
        btn.type = 'button';
        btn.addEventListener('click', function () {
          mcOpts.querySelectorAll('button').forEach(function (b) {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline-primary');
          });
          btn.classList.remove('btn-outline-primary');
          btn.classList.add('btn-primary');
          socket.emit('answer:submit', {
            quizId: quizId,
            answerType: 'choice',
            answerValue: opt,
          });
        });
        mcOpts.appendChild(btn);
      });
    }
  } else if (data.answerType === 'freeform_text') {
    document.getElementById('textArea').style.display = 'block';
    document.getElementById('textAnswer').value = '';
  } else if (data.answerType === 'drawing') {
    document.getElementById('drawingArea').style.display = 'block';
  }

  // Enable quizmaster controls
  if (typeof isQuizmaster !== 'undefined' && isQuizmaster) {
    var btnNext = document.getElementById('btnNext');
    var btnPause = document.getElementById('btnPause');
    if (btnNext) btnNext.disabled = false;
    if (btnPause) btnPause.disabled = false;
  }
}

function restoreAnswer(answer) {
  if (answer.answerType === 'choice') {
    var btns = document.querySelectorAll('#mcOptions button');
    btns.forEach(function (btn) {
      if (btn.textContent === answer.answerValue) {
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-primary');
      }
    });
  } else if (answer.answerType === 'text') {
    var ta = document.getElementById('textAnswer');
    if (ta) ta.value = answer.answerValue || '';
  }
}

// Text answer submit
var submitTextBtn = document.getElementById('submitText');
if (submitTextBtn) {
  submitTextBtn.addEventListener('click', function () {
    var val = document.getElementById('textAnswer').value;
    socket.emit('answer:submit', {
      quizId: quizId,
      answerType: 'text',
      answerValue: val,
    });
  });
}

// Drawing submit
var submitDrawingBtn = document.getElementById('submitDrawing');
if (submitDrawingBtn) {
  submitDrawingBtn.addEventListener('click', function () {
    var drawingData = window.getDrawingData ? window.getDrawingData() : null;
    socket.emit('answer:submit', {
      quizId: quizId,
      answerType: 'drawing',
      drawingData: drawingData,
    });
  });
}
