const activeQuizzes = new Map();

class QuizRuntime {
  constructor(quizId, quizData) {
    this.quizId = quizId;
    this.currentRound = 0;
    this.currentQuestion = 0;
    this.timerState = {
      startedAt: null,
      duration: 0,
      remaining: 0,
      isPaused: false,
    };
    this.connectedPlayers = new Map();
    this.status = 'lobby';
    this.rounds = quizData.rounds || [];
    this.timerInterval = null;
  }

  startQuiz() {
    this.status = 'active';
    this.currentRound = 0;
    this.currentQuestion = 0;
  }

  getCurrentRoundData() {
    if (this.currentRound >= this.rounds.length) return null;
    return this.rounds[this.currentRound];
  }

  getCurrentQuestionData() {
    const round = this.getCurrentRoundData();
    if (!round || this.currentQuestion >= round.questions.length) return null;
    return round.questions[this.currentQuestion];
  }

  startTimer(duration, onTick, onExpire) {
    this.stopTimer();
    this.timerState = {
      startedAt: Date.now(),
      duration,
      remaining: duration,
      isPaused: false,
    };
    this.timerInterval = setInterval(() => {
      this.timerState.remaining -= 1;
      if (onTick) onTick(this.timerState.remaining);
      if (this.timerState.remaining <= 0) {
        this.stopTimer();
        if (onExpire) onExpire();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pauseQuiz() {
    this.status = 'paused';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerState.isPaused = true;
    }
  }

  resumeQuiz(onTick, onExpire) {
    this.status = 'active';
    if (this.timerState.isPaused && this.timerState.remaining > 0) {
      this.timerState.isPaused = false;
      this.timerState.startedAt = Date.now();
      this.timerInterval = setInterval(() => {
        this.timerState.remaining -= 1;
        if (onTick) onTick(this.timerState.remaining);
        if (this.timerState.remaining <= 0) {
          this.stopTimer();
          if (onExpire) onExpire();
        }
      }, 1000);
    }
  }

  advanceQuestion() {
    this.stopTimer();
    this.currentQuestion += 1;
    const round = this.getCurrentRoundData();
    if (!round || this.currentQuestion >= round.questions.length) {
      return { roundComplete: true, roundIndex: this.currentRound };
    }
    return { roundComplete: false };
  }

  advanceRound() {
    this.stopTimer();
    this.currentRound += 1;
    this.currentQuestion = 0;
    if (this.currentRound >= this.rounds.length) {
      this.status = 'completed';
      return { quizComplete: true };
    }
    return { quizComplete: false };
  }

  registerPlayer(userId, socketId) {
    this.connectedPlayers.set(userId, socketId);
  }

  removePlayer(userId) {
    this.connectedPlayers.delete(userId);
  }

  isPlayerConnected(userId) {
    return this.connectedPlayers.has(userId);
  }

  getState() {
    return {
      quizId: this.quizId,
      status: this.status,
      currentRound: this.currentRound,
      currentQuestion: this.currentQuestion,
      timerState: { ...this.timerState },
      connectedPlayerCount: this.connectedPlayers.size,
    };
  }

  destroy() {
    this.stopTimer();
    this.connectedPlayers.clear();
  }
}

const QuizRuntimeService = {
  createRuntime(quizId, quizData) {
    const runtime = new QuizRuntime(quizId, quizData);
    activeQuizzes.set(quizId, runtime);
    return runtime;
  },

  getRuntime(quizId) {
    return activeQuizzes.get(quizId) || null;
  },

  removeRuntime(quizId) {
    const runtime = activeQuizzes.get(quizId);
    if (runtime) {
      runtime.destroy();
      activeQuizzes.delete(quizId);
    }
  },

  getActiveQuizzes() {
    return Array.from(activeQuizzes.keys());
  },
};

module.exports = QuizRuntimeService;
module.exports.QuizRuntime = QuizRuntime;
