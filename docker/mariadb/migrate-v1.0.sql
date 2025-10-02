-- ============================================================
-- ProjectRoom - 작업서 v1.0 마이그레이션
-- 가입 리서치 페이지 중심 PRD
-- ============================================================

-- 1) profiles_public 테이블 생성 (공개 프로필)
CREATE TABLE IF NOT EXISTS profiles_public (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    age TINYINT UNSIGNED NOT NULL,
    height_cm SMALLINT UNSIGNED NOT NULL,
    job VARCHAR(60),
    education ENUM('고졸', '전문대졸', '대졸', '석사', '박사'),
    mbti JSON COMMENT '배열: ["INTJ"] 또는 ["모름"]',
    hobbies JSON COMMENT '배열: ["테니스", "등산", ...]',
    region_code VARCHAR(40),
    is_living_alone BOOLEAN DEFAULT FALSE,
    bio_highlight VARCHAR(300) COMMENT '기타 장점 어필',
    photos JSON COMMENT '배열: ["/users/uid/photo1.jpg", ...]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_search (age, height_cm, region_code),
    INDEX idx_region (region_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='공개 프로필 - 모든 회원에게 노출';

-- 2) profiles_private 테이블 생성 (비공개 설문 - 민감정보)
CREATE TABLE IF NOT EXISTS profiles_private (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    wealth_level ENUM('mid', 'quite_high', 'high') COMMENT '재산 수준',
    look_confidence TINYINT COMMENT '외모 자신감 1~5',
    body_confidence TINYINT COMMENT '몸매 자신감 1~5',
    personality JSON COMMENT '성격 설문 답변',
    value_answers JSON COMMENT '가치관 설문 답변',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='비공개 설문 - 본인/매칭알고리즘/운영자만 접근';

-- 3) preference_rankings 테이블 생성 (선호도 Top ≤5 랭킹)
CREATE TABLE IF NOT EXISTS preference_rankings (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    items JSON COMMENT '[{rank:1, type:"age_range", value:"27-33"}, ...]',
    weights JSON COMMENT '[0.45, 0.35, 0.20] - 적을수록 가중치 증가',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 선호도 랭킹 및 가중치';

-- 4) monthly_codes 테이블 생성 (월별 가입코드)
CREATE TABLE IF NOT EXISTS monthly_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(32) UNIQUE NOT NULL COMMENT '예: 2025-10-AB12CD',
    month DATE NOT NULL COMMENT 'YYYY-MM-01 형식',
    max_uses INT NULL COMMENT 'NULL = 무제한, 숫자 = 제한',
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_month_active (month, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='월별 가입코드 (관리자 발급)';

-- 5) referrals 테이블 생성 (추천인 입력 로그)
CREATE TABLE IF NOT EXISTS referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    referrer_name VARCHAR(80) COMMENT '추천인 이름 (자유 입력)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referrer (referrer_name),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='추천인 입력 로그 (문자열 기반)';

-- 6) likes 테이블 생성 (좋아요)
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_user_id BIGINT UNSIGNED NOT NULL,
    to_user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_like (from_user_id, to_user_id),
    INDEX idx_to_user (to_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='좋아요 기록';

-- 7) conversations 테이블 생성 (대화방)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    match_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match (match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상호 매칭 후 대화방';

-- 8) photo_meta 테이블 생성 (사진 메타데이터)
CREATE TABLE IF NOT EXISTS photo_meta (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    path VARCHAR(255) NOT NULL,
    width INT,
    height INT,
    hash VARCHAR(64) COMMENT 'perceptual hash',
    nsfw BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사진 메타데이터 (NSFW 필터, 해시)';

-- 9) ab_assignments 테이블 생성 (AB 테스트 할당)
CREATE TABLE IF NOT EXISTS ab_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    experiment VARCHAR(40) NOT NULL COMMENT '실험명',
    variant VARCHAR(20) NOT NULL COMMENT '변형 그룹',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_exp (user_id, experiment),
    INDEX idx_experiment (experiment, variant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AB 테스트 그룹 할당';

-- 10) audit_logs 테이블 생성 (감사 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED COMMENT '행위자 user ID',
    action VARCHAR(80) NOT NULL COMMENT '행동 (view_private, update_profile 등)',
    target VARCHAR(80) COMMENT '대상 (user_id, code_id 등)',
    reason VARCHAR(255) COMMENT '사유 (비공개 데이터 열람 시 필수)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actor (actor_user_id, created_at),
    INDEX idx_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='감사 로그 (비공개 데이터 접근 추적)';

-- 11) survey_options 테이블 생성 (설문 옵션 마스터)
CREATE TABLE IF NOT EXISTS survey_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(40) NOT NULL COMMENT '카테고리: hobby, job, education, region',
    value VARCHAR(100) NOT NULL,
    label_ko VARCHAR(100),
    label_en VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_category_value (category, value),
    INDEX idx_category_active (category, is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='설문 옵션 마스터 (취미, 직업, 학력 등)';

-- ============================================================
-- 기본 데이터 삽입
-- ============================================================

-- 월별 가입코드 초기 데이터 (2025년 10월)
INSERT INTO monthly_codes (code, month, max_uses, is_active) VALUES
('2025-10-ALPHA1', '2025-10-01', NULL, TRUE),
('2025-10-BETA01', '2025-10-01', 100, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- 설문 옵션 마스터 - 취미
INSERT INTO survey_options (category, value, label_ko, label_en, display_order) VALUES
('hobby', 'tennis', '테니스', 'Tennis', 1),
('hobby', 'hiking', '등산', 'Hiking', 2),
('hobby', 'cafe', '카페', 'Cafe', 3),
('hobby', 'movie', '영화', 'Movie', 4),
('hobby', 'reading', '독서', 'Reading', 5),
('hobby', 'cooking', '요리', 'Cooking', 6),
('hobby', 'travel', '여행', 'Travel', 7),
('hobby', 'music', '음악', 'Music', 8),
('hobby', 'fitness', '운동', 'Fitness', 9),
('hobby', 'art', '미술/공예', 'Art/Craft', 10)
ON DUPLICATE KEY UPDATE label_ko = VALUES(label_ko);

-- 설문 옵션 마스터 - 직업군
INSERT INTO survey_options (category, value, label_ko, label_en, display_order) VALUES
('job', 'tech', 'IT/개발', 'Tech/Dev', 1),
('job', 'finance', '금융/투자', 'Finance', 2),
('job', 'medical', '의료/보건', 'Medical', 3),
('job', 'education', '교육/학원', 'Education', 4),
('job', 'design', '디자인', 'Design', 5),
('job', 'marketing', '마케팅/광고', 'Marketing', 6),
('job', 'sales', '영업/유통', 'Sales', 7),
('job', 'service', '서비스업', 'Service', 8),
('job', 'freelance', '프리랜서', 'Freelance', 9),
('job', 'etc', '기타', 'Other', 10)
ON DUPLICATE KEY UPDATE label_ko = VALUES(label_ko);

-- 설문 옵션 마스터 - 지역
INSERT INTO survey_options (category, value, label_ko, label_en, display_order) VALUES
('region', 'SEOUL_GANGNAM', '서울 강남', 'Seoul Gangnam', 1),
('region', 'SEOUL_GANGBUK', '서울 강북', 'Seoul Gangbuk', 2),
('region', 'SEOUL_EAST', '서울 동부', 'Seoul East', 3),
('region', 'SEOUL_WEST', '서울 서부', 'Seoul West', 4),
('region', 'GYEONGGI_BUNDANG', '경기 분당', 'Gyeonggi Bundang', 5),
('region', 'GYEONGGI_ILSAN', '경기 일산', 'Gyeonggi Ilsan', 6),
('region', 'INCHEON', '인천', 'Incheon', 7),
('region', 'BUSAN', '부산', 'Busan', 8),
('region', 'DAEGU', '대구', 'Daegu', 9),
('region', 'GWANGJU', '광주', 'Gwangju', 10)
ON DUPLICATE KEY UPDATE label_ko = VALUES(label_ko);

-- ============================================================
-- 뷰 생성 (편의용)
-- ============================================================

-- 공개 프로필 + 매칭 점수 요약 뷰
CREATE OR REPLACE VIEW v_profile_summary AS
SELECT
    p.user_id,
    p.name,
    p.age,
    p.height_cm,
    p.region_code,
    p.job,
    p.education,
    p.mbti,
    p.hobbies,
    JSON_LENGTH(p.photos) as photo_count,
    pr.items as preferences,
    pr.weights as pref_weights
FROM profiles_public p
LEFT JOIN preference_rankings pr ON p.user_id = pr.user_id;

-- 관리자용 사용자 통계 뷰
CREATE OR REPLACE VIEW v_admin_user_stats AS
SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT pp.user_id) as completed_public_profile,
    COUNT(DISTINCT pv.user_id) as completed_private_profile,
    COUNT(DISTINCT pr.user_id) as completed_preferences,
    DATE(u.created_at) as signup_date
FROM users u
LEFT JOIN profiles_public pp ON u.id = pp.user_id
LEFT JOIN profiles_private pv ON u.id = pv.user_id
LEFT JOIN preference_rankings pr ON u.id = pr.user_id
GROUP BY DATE(u.created_at)
ORDER BY signup_date DESC;

-- ============================================================
-- 완료!
-- ============================================================
