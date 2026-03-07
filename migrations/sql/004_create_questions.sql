CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  content_type ENUM('text', 'image', 'audio', 'video') DEFAULT 'text',
  answer_type ENUM('multiple_choice', 'freeform_text', 'drawing') DEFAULT 'multiple_choice',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  media_path VARCHAR(500),
  correct_answer TEXT,
  options JSON,
  time_limit INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_questions_created_by (created_by)
);
