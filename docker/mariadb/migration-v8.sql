-- Migration v8: photo moderation enhancements (작업서 §6.1.3, §7)

-- Ensure photo_meta can reference photos and store moderation state
ALTER TABLE photo_meta
  ADD COLUMN photo_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN bytes BIGINT NULL AFTER height,
  ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'manual' AFTER path,
  ADD COLUMN status ENUM('pending','approved','rejected','auto_flagged') NOT NULL DEFAULT 'pending' AFTER nsfw,
  ADD COLUMN nsfw_score DECIMAL(5,4) NULL AFTER status,
  ADD COLUMN labels JSON NULL AFTER nsfw_score,
  ADD COLUMN review_notes VARCHAR(255) NULL AFTER labels,
  ADD COLUMN reviewed_at DATETIME NULL AFTER review_notes,
  ADD COLUMN reviewed_by VARCHAR(64) NULL AFTER reviewed_at,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Backfill unique reference to avoid duplicates per photo
ALTER TABLE photo_meta
  ADD CONSTRAINT fk_photo_meta_photo
    FOREIGN KEY (photo_id) REFERENCES photos(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE photo_meta
  ADD UNIQUE KEY uniq_photo_id (photo_id),
  ADD UNIQUE KEY uniq_user_path (user_id, path),
  ADD INDEX idx_status (status);

-- Seed existing rows with default timestamps
UPDATE photo_meta SET updated_at = created_at WHERE updated_at IS NULL;
