-- MariaDB Schema for Dating App (Generated from TypeORM entities)
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
    INDEX idx_region_code (region_code)
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

-- Profiles-Private table
CREATE TABLE profiles_private (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    wealth_level ENUM('mid', 'quite_high', 'high') COMMENT '재산 수준',
    look_confidence TINYINT COMMENT '외모 자신감 (1~5)',
    body_confidence TINYINT COMMENT '몸매 자신감 (1~5)',
    personality_answers JSON COMMENT '성격 설문 답변',
    values_answers JSON COMMENT '가치관 설문 답변',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Photos table
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
    items JSON COMMENT 'Top ≤5 선호도 랭킹 [{rank, type, value}]',
    weights JSON COMMENT '선호도 가중치 배열 (예: [0.45, 0.35, 0.20])',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    INDEX idx_actor_created (actor_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Likes table
CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_uid VARCHAR(64) NOT NULL,
    to_uid VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (from_uid, to_uid),
    INDEX idx_to_uid_created (to_uid, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches table
CREATE TABLE matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid_a VARCHAR(64) NOT NULL,
    uid_b VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_match (uid_a, uid_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations table
CREATE TABLE recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '추천받는 사용자',
    target_user_id VARCHAR(64) NOT NULL COMMENT '추천된 사용자',
    score DECIMAL(5, 4) NOT NULL COMMENT '매칭 점수 (0~1)',
    score_breakdown JSON COMMENT '점수 분해 (디버깅용)',
    shared_bits JSON COMMENT 'Shared Bits 배지 (공통점)',
    reason VARCHAR(255) COMMENT '추천 이유 (1줄)',
    is_shown BOOLEAN DEFAULT FALSE COMMENT '노출 여부',
    shown_at DATETIME COMMENT '노출 시각',
    is_skipped BOOLEAN DEFAULT FALSE COMMENT '스킵 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_recommendation (user_id, target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations table
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_id BIGINT NOT NULL,
    user_a_id VARCHAR(64) NOT NULL COMMENT '참여자 A (firebase_uid)',
    user_b_id VARCHAR(64) NOT NULL COMMENT '참여자 B (firebase_uid)',
    last_message_at DATETIME COMMENT '마지막 메시지 시각',
    is_ended BOOLEAN DEFAULT FALSE COMMENT '대화 종료 여부 (언매치)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_match_id (match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_uid VARCHAR(64) NOT NULL,
    body TEXT NOT NULL COMMENT '메시지 본문',
    is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
    read_at DATETIME COMMENT '읽은 시각',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monthly Codes table
CREATE TABLE monthly_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    month DATE NOT NULL COMMENT 'YYYY-MM-01 형식',
    max_uses INT COMMENT 'NULL = 무제한',
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_month_active (month, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Referrals table
CREATE TABLE referrals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    referrer_name VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_name (referrer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Survey Options table
CREATE TABLE survey_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('hobby', 'job', 'education', 'region', 'mbti', 'other') NOT NULL COMMENT '옵션 카테고리 (취미/직업/학력 등)',
    value VARCHAR(100) NOT NULL COMMENT '옵션 값',
    label VARCHAR(100) COMMENT '표시 라벨 (다국어 지원용)',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statistics table
CREATE TABLE statistics (
    date DATE PRIMARY KEY,
    daily_signups INT DEFAULT 0,
    daily_matches INT DEFAULT 0,
    total_users INT DEFAULT 0,
    total_matches INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessor_id VARCHAR(255) NOT NULL,
    target_user_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSON
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
