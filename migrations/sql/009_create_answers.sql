CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_question_id INT NOT NULL,
  user_id INT NOT NULL,
  team_id INT,
  answer_type ENUM('choice', 'text', 'drawing') NOT NULL,
  answer_value TEXT,
  drawing_path VARCHAR(500),
  is_correct BOOLEAN,
  marked_by ENUM('auto', 'quizmaster'),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (round_question_id) REFERENCES round_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  UNIQUE KEY unique_answer_per_player (round_question_id, user_id),
  INDEX idx_answers_round_question_id (round_question_id),
  INDEX idx_answers_user_id (user_id),
  INDEX idx_answers_team_id (team_id)
);
