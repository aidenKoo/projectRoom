-- Migration to align schema with PRD 작업서1.1.txt (Part 2)

-- Stop on error
SET sql_mode = 'STRICT_ALL_TABLES';

-- 2. Re-establish foreign keys using uid
ALTER TABLE profiles_public ADD CONSTRAINT fk_profiles_public_users FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE profiles_private ADD CONSTRAINT fk_profiles_private_users FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE photos ADD CONSTRAINT fk_photos_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE preferences ADD CONSTRAINT fk_preferences_users FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_users FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;

-- For swipes, likes, matches, etc., they need to be updated to use VARCHAR(64) for user ids.
ALTER TABLE swipes MODIFY actor_id VARCHAR(64) NOT NULL;
ALTER TABLE swipes MODIFY target_id VARCHAR(64) NOT NULL;
ALTER TABLE likes MODIFY from_uid VARCHAR(64) NOT NULL;
ALTER TABLE likes MODIFY to_uid VARCHAR(64) NOT NULL;
ALTER TABLE matches MODIFY uid_a VARCHAR(64) NOT NULL;
ALTER TABLE matches MODIFY uid_b VARCHAR(64) NOT NULL;

-- Now add back foreign keys for these tables
ALTER TABLE swipes ADD CONSTRAINT fk_swipes_actor FOREIGN KEY (actor_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE swipes ADD CONSTRAINT fk_swipes_target FOREIGN KEY (target_id) REFERENCES users(uid) ON DELETE CASCADE;


-- 3. Align `profiles_public` columns
ALTER TABLE profiles_public ADD COLUMN name VARCHAR(40) NOT NULL AFTER uid;
ALTER TABLE profiles_public ADD COLUMN age TINYINT UNSIGNED NOT NULL AFTER name;
ALTER TABLE profiles_public MODIFY height_cm SMALLINT UNSIGNED;
ALTER TABLE profiles_public MODIFY job VARCHAR(60);
ALTER TABLE profiles_public MODIFY education ENUM('고졸','전문','대졸','석사','박사');
ALTER TABLE profiles_public ADD COLUMN mbti JSON AFTER education;
ALTER TABLE profiles_public ADD COLUMN hobbies JSON AFTER mbti;
ALTER TABLE profiles_public ADD COLUMN is_living_alone BOOLEAN AFTER region_code;
ALTER TABLE profiles_public ADD COLUMN bio_highlight VARCHAR(300) AFTER is_living_alone;
ALTER TABLE profiles_public ADD COLUMN photos JSON AFTER bio_highlight;

-- Drop columns that are not in the new schema
ALTER TABLE profiles_public DROP COLUMN religion, DROP COLUMN drink, DROP COLUMN smoke, DROP COLUMN intro_text, DROP COLUMN values_json, DROP COLUMN active_time_band, DROP COLUMN visibility_flags;


-- 4. Align `profiles_private` table
ALTER TABLE profiles_private MODIFY look_confidence TINYINT;
ALTER TABLE profiles_private MODIFY body_confidence TINYINT;
ALTER TABLE profiles_private RENAME COLUMN personality_answers TO personality;
ALTER TABLE profiles_private RENAME COLUMN values_answers TO `values`;
ALTER TABLE profiles_private MODIFY personality JSON;
ALTER TABLE profiles_private MODIFY `values` JSON;


-- 5. Align `preferences` table
-- `items` and `weights` columns already exist and match the PRD.
-- Drop other columns not in the PRD schema.
ALTER TABLE preferences DROP COLUMN age_min, DROP COLUMN age_max, DROP COLUMN distance_km, DROP COLUMN religion_ok, DROP COLUMN drink_ok, DROP COLUMN smoke_ok, DROP COLUMN want_children, DROP COLUMN tags_include, DROP COLUMN tags_exclude;


-- 6. Align `monthly_codes` table
ALTER TABLE monthly_codes MODIFY id BIGINT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE monthly_codes MODIFY code VARCHAR(32) UNIQUE;
ALTER TABLE monthly_codes MODIFY month DATE;
ALTER TABLE monthly_codes MODIFY max_uses INT NULL;


-- 7. Align `referrals` table
ALTER TABLE referrals MODIFY id BIGINT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE referrals MODIFY referrer_name VARCHAR(80);


-- 8. Drop outdated trigger.
DROP TRIGGER IF EXISTS create_match_on_mutual_like;


-- 9. Create missing tables from PRD
CREATE TABLE IF NOT EXISTS photo_meta (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64),
  path VARCHAR(255),
  width INT, height INT,
  hash VARCHAR(64),
  nsfw BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uid VARCHAR(64),
  experiment VARCHAR(40),
  variant VARCHAR(20),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- The audit_logs table in init.sql is different from the PRD. Let's align it.
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_uid VARCHAR(64),
  action VARCHAR(80),
  target VARCHAR(80),
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Drop obsolete tables
DROP TABLE IF EXISTS statistics;
DROP TABLE IF EXISTS recommendations;

-- 11. Drop `id` column from `users`
ALTER TABLE users DROP COLUMN id;
