-- Migration v2: 작업서 기반 추가 기능
-- 실행일: 2025-10-02

USE projectroom;

-- 1. Referrals 테이블 추가
CREATE TABLE IF NOT EXISTS referrals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    referrer_name VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_name (referrer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Preferences 테이블에 items, weights 컬럼 추가
ALTER TABLE preferences
ADD COLUMN items JSON COMMENT 'Top ≤5 선호도 랭킹 [{rank, type, value}]' AFTER tags_exclude,
ADD COLUMN weights JSON COMMENT '선호도 가중치 배열 (예: [0.45, 0.35, 0.20])' AFTER items;

-- 3. Monthly codes 테이블 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS monthly_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    month DATE NOT NULL COMMENT 'YYYY-MM-01 형식',
    max_uses INT NULL COMMENT 'NULL = 무제한',
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_month_active (month, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Profiles 공개/비공개 분리를 위한 테이블 추가 (작업서 기준)
CREATE TABLE IF NOT EXISTS profiles_private (
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

-- 5. Audit logs 테이블 (관리자 접근 로깅)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_uid VARCHAR(128) COMMENT '행위자 (관리자)',
    action VARCHAR(80) NOT NULL,
    target VARCHAR(80) COMMENT '대상',
    reason VARCHAR(255) COMMENT '사유',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actor (actor_uid),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Survey options 마스터 테이블 (관리자가 관리하는 옵션)
CREATE TABLE IF NOT EXISTS survey_options (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(40) NOT NULL COMMENT '카테고리 (hobbies, jobs, education, etc.)',
    value VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_category_value (category, value),
    INDEX idx_category (category, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 기본 옵션 데이터 삽입
INSERT IGNORE INTO survey_options (category, value, display_name, sort_order) VALUES
-- 취미
('hobbies', 'fitness', '운동/피트니스', 1),
('hobbies', 'travel', '여행', 2),
('hobbies', 'reading', '독서', 3),
('hobbies', 'music', '음악', 4),
('hobbies', 'movies', '영화', 5),
('hobbies', 'cooking', '요리', 6),
('hobbies', 'gaming', '게임', 7),
('hobbies', 'photography', '사진', 8),
('hobbies', 'art', '미술/예술', 9),
('hobbies', 'sports', '스포츠', 10),

-- 직업군
('job_groups', 'it_tech', 'IT/기술', 1),
('job_groups', 'finance', '금융', 2),
('job_groups', 'medical', '의료', 3),
('job_groups', 'education', '교육', 4),
('job_groups', 'marketing', '마케팅', 5),
('job_groups', 'design', '디자인', 6),
('job_groups', 'service', '서비스', 7),
('job_groups', 'manufacturing', '제조', 8),
('job_groups', 'media', '미디어/방송', 9),
('job_groups', 'government', '공공/정부', 10),

-- 학력
('education', 'high_school', '고졸', 1),
('education', 'associate', '전문대졸', 2),
('education', 'bachelor', '대졸', 3),
('education', 'master', '석사', 4),
('education', 'doctorate', '박사', 5);

-- 완료 메시지
SELECT 'Migration v2 completed successfully!' AS status;
