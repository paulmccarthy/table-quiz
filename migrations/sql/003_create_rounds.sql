CREATE TABLE IF NOT EXISTS rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  round_number INT NOT NULL,
  num_questions INT DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_rounds_quiz_id (quiz_id),
  UNIQUE KEY unique_quiz_round (quiz_id, round_number)
);
