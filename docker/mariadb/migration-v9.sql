ALTER TABLE matches ADD COLUMN unmatchedAt DATETIME NULL;

CREATE TABLE reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reporterUserId VARCHAR(64),
  reportedUserId VARCHAR(64),
  reason TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporterUserId) REFERENCES users(uid),
  FOREIGN KEY (reportedUserId) REFERENCES users(uid)
);
