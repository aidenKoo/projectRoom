-- Migration: Create ab_events table for experiment metrics
CREATE TABLE IF NOT EXISTS ab_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  experiment VARCHAR(40) NOT NULL,
  variant VARCHAR(20) NOT NULL,
  event ENUM('exposure','conversion') NOT NULL,
  properties JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_exp_var_event (experiment, variant, event),
  INDEX idx_user_exp (user_id, experiment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='A/B experiment events (exposure, conversion)';

CREATE TABLE IF NOT EXISTS ab_experiments (
  experiment VARCHAR(40) PRIMARY KEY,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='A/B experiment rollout configuration (weights, cohorts)';
