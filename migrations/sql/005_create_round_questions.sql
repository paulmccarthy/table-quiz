CREATE TABLE IF NOT EXISTS round_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  question_id INT NOT NULL,
  question_order INT NOT NULL,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_round_questions_round_id (round_id),
  UNIQUE KEY unique_round_order (round_id, question_order)
);
