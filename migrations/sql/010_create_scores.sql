CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  round_id INT NOT NULL,
  team_id INT,
  user_id INT,
  score INT DEFAULT 0,
  override_flag BOOLEAN DEFAULT FALSE,
  overridden_by INT,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (overridden_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_scores_quiz_round (quiz_id, round_id),
  INDEX idx_scores_team_id (team_id),
  INDEX idx_scores_user_id (user_id)
);
