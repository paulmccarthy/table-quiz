CREATE TABLE IF NOT EXISTS quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  quiz_title VARCHAR(255) NOT NULL,
  quizmaster_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_rounds INT NOT NULL,
  total_questions INT NOT NULL,
  result_data JSON,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (quizmaster_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quiz_results_quiz_id (quiz_id),
  INDEX idx_quiz_results_quizmaster_id (quizmaster_id)
);
