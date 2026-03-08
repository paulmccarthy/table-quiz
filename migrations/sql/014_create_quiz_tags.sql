CREATE TABLE IF NOT EXISTS quiz_tags (
  quiz_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (quiz_id, tag_id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_quiz_tags_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
