CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  access_code VARCHAR(20) UNIQUE,
  invite_token VARCHAR(255) UNIQUE,
  invite_token_expires_at TIMESTAMP NULL,
  quizmaster_id INT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'lobby', 'active', 'paused', 'completed') DEFAULT 'draft',
  num_rounds INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quizmaster_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quizzes_quizmaster_status (quizmaster_id, status),
  INDEX idx_quizzes_access_code (access_code),
  INDEX idx_quizzes_invite_token (invite_token)
);
