-- Migration v3: 매칭 알고리즘, Conversations, Messages 테이블 추가
-- 작성일: 2025-10-02

USE projectroom;

-- Likes 테이블 (좋아요)
CREATE TABLE IF NOT EXISTS likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  from_uid VARCHAR(64) NOT NULL COMMENT '좋아요를 누른 사용자 firebase_uid',
  to_uid VARCHAR(64) NOT NULL COMMENT '좋아요를 받은 사용자 firebase_uid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_like (from_uid, to_uid),
  INDEX idx_to_uid_created (to_uid, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches 테이블 (상호 매칭)
CREATE TABLE IF NOT EXISTS matches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid_a VARCHAR(64) NOT NULL COMMENT '매칭 참여자 A firebase_uid',
  uid_b VARCHAR(64) NOT NULL COMMENT '매칭 참여자 B firebase_uid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pair (uid_a, uid_b),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations 테이블 (추천 후보)
CREATE TABLE IF NOT EXISTS recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL COMMENT '추천받는 사용자 firebase_uid',
  target_user_id VARCHAR(64) NOT NULL COMMENT '추천된 사용자 firebase_uid',
  score DECIMAL(5, 4) NOT NULL COMMENT '매칭 점수 (0~1)',
  score_breakdown JSON COMMENT '점수 분해 (디버깅용)',
  shared_bits JSON COMMENT 'Shared Bits 배지 (공통점)',
  reason VARCHAR(255) COMMENT '추천 이유 (1줄)',
  is_shown BOOLEAN DEFAULT FALSE COMMENT '노출 여부',
  shown_at DATETIME COMMENT '노출 시각',
  is_skipped BOOLEAN DEFAULT FALSE COMMENT '스킵 여부',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_recommendation (user_id, target_user_id),
  INDEX idx_user_shown (user_id, is_shown, is_skipped),
  INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations 테이블 (대화방)
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  match_id BIGINT NOT NULL COMMENT 'matches 테이블 참조',
  user_a_id VARCHAR(64) NOT NULL COMMENT '참여자 A firebase_uid',
  user_b_id VARCHAR(64) NOT NULL COMMENT '참여자 B firebase_uid',
  last_message_at DATETIME COMMENT '마지막 메시지 시각',
  is_ended BOOLEAN DEFAULT FALSE COMMENT '대화 종료 여부 (언매치)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_match (match_id),
  INDEX idx_user_a (user_a_id, is_ended),
  INDEX idx_user_b (user_b_id, is_ended)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages 테이블 (메시지)
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL COMMENT 'conversations 테이블 참조',
  sender_uid VARCHAR(64) NOT NULL COMMENT '발신자 firebase_uid',
  body TEXT NOT NULL COMMENT '메시지 본문',
  is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
  read_at DATETIME COMMENT '읽은 시각',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation_created (conversation_id, created_at),
  INDEX idx_sender (sender_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Survey Options 테이블 수정 (이미 migration-v2에 있으면 스킵)
CREATE TABLE IF NOT EXISTS survey_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('hobby', 'job', 'education', 'region', 'mbti', 'other') NOT NULL COMMENT '옵션 카테고리',
  value VARCHAR(100) NOT NULL COMMENT '옵션 값',
  label VARCHAR(100) COMMENT '표시 라벨 (다국어 지원용)',
  sort_order INT DEFAULT 0 COMMENT '정렬 순서',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_active (category, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입 (취미)
INSERT INTO survey_options (category, value, label, sort_order) VALUES
('hobby', 'tennis', '테니스', 1),
('hobby', 'hiking', '등산', 2),
('hobby', 'reading', '독서', 3),
('hobby', 'cooking', '요리', 4),
('hobby', 'travel', '여행', 5),
('hobby', 'photography', '사진', 6),
('hobby', 'music', '음악감상', 7),
('hobby', 'exercise', '운동', 8),
('hobby', 'movie', '영화', 9),
('hobby', 'cafe', '카페투어', 10)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- 샘플 데이터 삽입 (직업군)
INSERT INTO survey_options (category, value, label, sort_order) VALUES
('job', 'it', 'IT/개발', 1),
('job', 'finance', '금융/투자', 2),
('job', 'education', '교육', 3),
('job', 'medical', '의료/제약', 4),
('job', 'public', '공무원', 5),
('job', 'service', '서비스업', 6),
('job', 'manufacturing', '제조/생산', 7),
('job', 'media', '미디어/출판', 8),
('job', 'design', '디자인/예술', 9),
('job', 'other', '기타', 10)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- 샘플 데이터 삽입 (학력)
INSERT INTO survey_options (category, value, label, sort_order) VALUES
('education', 'high_school', '고졸', 1),
('education', 'associate', '전문대졸', 2),
('education', 'bachelor', '대졸', 3),
('education', 'master', '석사', 4),
('education', 'phd', '박사', 5)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- 샘플 데이터 삽입 (지역)
INSERT INTO survey_options (category, value, label, sort_order) VALUES
('region', 'SEOUL_GANGNAM', '서울 강남', 1),
('region', 'SEOUL_GANGBUK', '서울 강북', 2),
('region', 'GYEONGGI', '경기도', 3),
('region', 'INCHEON', '인천', 4),
('region', 'BUSAN', '부산', 5),
('region', 'DAEGU', '대구', 6),
('region', 'GWANGJU', '광주', 7),
('region', 'DAEJEON', '대전', 8),
('region', 'OTHER', '기타', 9)
ON DUPLICATE KEY UPDATE label = VALUES(label);
