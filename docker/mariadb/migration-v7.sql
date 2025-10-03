CREATE TABLE users (
  uid VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles_public (
  uid VARCHAR(64) PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  height_cm SMALLINT UNSIGNED NOT NULL,
  job VARCHAR(60),
  education ENUM('고졸','전문','대졸','석사','박사'),
  mbti JSON,
  hobbies JSON,
  region_code VARCHAR(40),
  is_living_alone BOOLEAN,
  bio_highlight VARCHAR(300),
  photos JSON,
  updated_at DATETIME,
  FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE profiles_private (
  uid VARCHAR(64) PRIMARY KEY,
  wealth_level ENUM('mid','quite_high','high'),
  look_confidence TINYINT,
  body_confidence TINYINT,
  personality JSON,
  `values` JSON,
  updated_at DATETIME,
  FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE preferences (
  uid VARCHAR(64) PRIMARY KEY,
  items JSON,   -- [{rank,type,value}]
  weights JSON, -- [..]
  updated_at DATETIME,
  FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE monthly_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) UNIQUE,
  month DATE,
  max_uses INT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE referrals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64),
  referrer_name VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  from_uid VARCHAR(64),
  to_uid VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_like (from_uid, to_uid)
);

CREATE TABLE matches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid_a VARCHAR(64),
  uid_b VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pair (LEAST(uid_a,uid_b), GREATEST(uid_a,uid_b))
);

CREATE TABLE conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  match_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conv_id BIGINT,
  sender_uid VARCHAR(64),
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conv_id) REFERENCES conversations(id)
);

CREATE TABLE photo_meta (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64),
  path VARCHAR(255),
  width INT, height INT,
  `hash` VARCHAR(64),
  nsfw BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ab_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64),
  experiment VARCHAR(40),
  variant VARCHAR(20),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_uid VARCHAR(64),
  action VARCHAR(80),
  target VARCHAR(80),
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
