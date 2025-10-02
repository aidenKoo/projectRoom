-- MariaDB Schema for Dating App
-- Based on 작업서.txt data model

CREATE DATABASE IF NOT EXISTS projectroom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projectroom;

-- Users table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    gender ENUM('M', 'F', 'N') NOT NULL,
    birth_year INT NOT NULL,
    region_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_region_code (region_code),
    INDEX idx_gender_birth (gender, birth_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table
CREATE TABLE profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    height_cm INT,
    job_group VARCHAR(50),
    edu_level VARCHAR(50),
    religion VARCHAR(50),
    drink VARCHAR(50),
    smoke VARCHAR(50),
    intro_text TEXT,
    values_json JSON,
    active_time_band INT,
    visibility_flags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preferences table
CREATE TABLE preferences (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    age_min INT,
    age_max INT,
    distance_km INT,
    religion_ok VARCHAR(255),
    drink_ok VARCHAR(255),
    smoke_ok VARCHAR(255),
    want_children VARCHAR(50),
    tags_include JSON,
    tags_exclude JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Photos table (Firebase Storage URLs)
CREATE TABLE photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    object_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(50),
    width INT,
    height INT,
    bytes BIGINT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_primary (user_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Swipes table
CREATE TABLE swipes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    action ENUM('like', 'pass', 'superlike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_swipe (actor_id, target_id),
    INDEX idx_actor_created (actor_id, created_at DESC),
    INDEX idx_target (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches table
CREATE TABLE matches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_a BIGINT UNSIGNED NOT NULL,
    user_b BIGINT UNSIGNED NOT NULL,
    status ENUM('active', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_match (user_a, user_b),
    INDEX idx_user_a (user_a, status),
    INDEX idx_user_b (user_b, status),
    CHECK (user_a < user_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    match_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    body TEXT,
    type ENUM('text', 'image') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_match_created (match_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports table (for safety)
CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    reason TEXT NOT NULL,
    evidence_url VARCHAR(1000),
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_target (target_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blocks table
CREATE TABLE blocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    blocker_id BIGINT UNSIGNED NOT NULL,
    blocked_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User activity metrics (for matching algorithm)
CREATE TABLE user_metrics (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time_minutes INT DEFAULT 0,
    ghost_rate DECIMAL(5,2) DEFAULT 0.00,
    report_count INT DEFAULT 0,
    block_count INT DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 50.00,
    last_active_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger to create match when mutual like occurs
DELIMITER //
CREATE TRIGGER create_match_on_mutual_like
AFTER INSERT ON swipes
FOR EACH ROW
BEGIN
    DECLARE reciprocal_exists INT;

    IF NEW.action = 'like' THEN
        SELECT COUNT(*) INTO reciprocal_exists
        FROM swipes
        WHERE actor_id = NEW.target_id
          AND target_id = NEW.actor_id
          AND action = 'like';

        IF reciprocal_exists > 0 THEN
            INSERT IGNORE INTO matches (user_a, user_b, status)
            VALUES (
                LEAST(NEW.actor_id, NEW.target_id),
                GREATEST(NEW.actor_id, NEW.target_id),
                'active'
            );
        END IF;
    END IF;
END//
DELIMITER ;
