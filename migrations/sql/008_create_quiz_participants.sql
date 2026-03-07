CREATE TABLE IF NOT EXISTS quiz_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  user_id INT NOT NULL,
  admitted BOOLEAN DEFAULT FALSE,
  is_individual BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_quiz_user (quiz_id, user_id),
  INDEX idx_quiz_participants_quiz_id (quiz_id),
  INDEX idx_quiz_participants_user_id (user_id)
);
