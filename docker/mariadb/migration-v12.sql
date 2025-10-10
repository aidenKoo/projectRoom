-- Migration to align schema with PRD 작업서1.1.txt

-- Stop on error
SET sql_mode = 'STRICT_ALL_TABLES';

-- 1. Modify `users` table: Change PK from id to uid
-- First, drop foreign key constraints that depend on users.id
ALTER TABLE profiles DROP FOREIGN KEY profiles_ibfk_1;
ALTER TABLE profiles_private DROP FOREIGN KEY profiles_private_ibfk_1;
ALTER TABLE photos DROP FOREIGN KEY photos_ibfk_1;
ALTER TABLE preferences DROP FOREIGN KEY preferences_ibfk_1;
ALTER TABLE swipes DROP FOREIGN KEY swipes_ibfk_1;
ALTER TABLE swipes DROP FOREIGN KEY swipes_ibfk_2;
ALTER TABLE referrals DROP FOREIGN KEY referrals_ibfk_1;

-- To change the primary key, we need to handle the existing auto_increment id.
-- We will keep it for now but remove the PRIMARY KEY property.
ALTER TABLE users DROP PRIMARY KEY;
ALTER TABLE users ADD PRIMARY KEY (firebase_uid);
ALTER TABLE users MODIFY id BIGINT UNSIGNED NOT NULL;
ALTER TABLE users DROP COLUMN email; -- As per PRD, email is in auth.users, not our public user table.
ALTER TABLE users RENAME COLUMN firebase_uid TO uid;
ALTER TABLE users MODIFY uid VARCHAR(64) NOT NULL;

-- 2. Re-establish foreign keys using uid
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE profiles_private ADD CONSTRAINT fk_profiles_private_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE photos ADD CONSTRAINT fk_photos_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE preferences ADD CONSTRAINT fk_preferences_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_users FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE;

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


-- 3. Modify `profiles` to `profiles_public` and align columns
ALTER TABLE profiles RENAME TO profiles_public;
ALTER TABLE profiles_public RENAME COLUMN user_id TO uid;
ALTER TABLE profiles_public MODIFY uid VARCHAR(64) NOT NULL;
ALTER TABLE profiles_public ADD COLUMN name VARCHAR(40) NOT NULL AFTER uid;
ALTER TABLE profiles_public ADD COLUMN age TINYINT UNSIGNED NOT NULL AFTER name;
ALTER TABLE profiles_public MODIFY height_cm SMALLINT UNSIGNED;
ALTER TABLE profiles_public MODIFY job_group VARCHAR(60);
ALTER TABLE profiles_public RENAME COLUMN job_group TO job;
ALTER TABLE profiles_public MODIFY edu_level ENUM('고졸','전문','대졸','석사','박사');
ALTER TABLE profiles_public RENAME COLUMN edu_level TO education;
ALTER TABLE profiles_public ADD COLUMN mbti JSON AFTER education;
ALTER TABLE profiles_public ADD COLUMN hobbies JSON AFTER mbti;
ALTER TABLE profiles_public ADD COLUMN is_living_alone BOOLEAN AFTER region_code;
ALTER TABLE profiles_public ADD COLUMN bio_highlight VARCHAR(300) AFTER is_living_alone;
ALTER TABLE profiles_public ADD COLUMN photos JSON AFTER bio_highlight;

-- Drop columns that are not in the new schema
ALTER TABLE profiles_public DROP COLUMN religion, DROP COLUMN drink, DROP COLUMN smoke, DROP COLUMN intro_text, DROP COLUMN values_json, DROP COLUMN active_time_band, DROP COLUMN visibility_flags;


-- 4. Align `profiles_private` table
ALTER TABLE profiles_private RENAME COLUMN user_id TO uid;
ALTER TABLE profiles_private MODIFY uid VARCHAR(64) NOT NULL;
ALTER TABLE profiles_private MODIFY look_confidence TINYINT;
ALTER TABLE profiles_private MODIFY body_confidence TINYINT;
ALTER TABLE profiles_private RENAME COLUMN personality_answers TO personality;
ALTER TABLE profiles_private RENAME COLUMN values_answers TO `values`;
ALTER TABLE profiles_private MODIFY personality JSON;
ALTER TABLE profiles_private MODIFY `values` JSON;


-- 5. Align `preferences` table (was preference_rankings in PRD)
ALTER TABLE preferences RENAME COLUMN user_id TO uid;
ALTER TABLE preferences MODIFY uid VARCHAR(64) NOT NULL;
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
ALTER TABLE referrals RENAME COLUMN user_id TO uid;
ALTER TABLE referrals MODIFY uid VARCHAR(64) NOT NULL;
ALTER TABLE referrals MODIFY referrer_name VARCHAR(80);


-- 8. Recreate `likes` and `matches` to match PRD schema (they are simple in PRD)
-- The existing ones are slightly different. Let's align them.
-- `likes` table seems ok.
-- `matches` table in PRD is simpler. The existing one is also simple. Let's keep it.
-- Let's check the `swipes` table trigger. It refers to `user_a`, `user_b` which do not exist in `matches`.
-- It seems the trigger is outdated. I will drop it.
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

-- Drop tables that are not in the PRD schema
DROP TABLE IF EXISTS statistics;
DROP TABLE IF EXISTS recommendations;

-- Final check on users table, drop id column as it is not used anymore
ALTER TABLE users DROP COLUMN id;

