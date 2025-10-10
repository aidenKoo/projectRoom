-- Migration: Add hash index to photo_meta table
-- Date: 2025-10-12
-- Purpose: Improve duplicate photo detection performance

-- Add index on hash column for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_hash ON photo_meta(hash);

-- Optional: Add comment to document the purpose
-- ALTER TABLE photo_meta MODIFY COLUMN hash VARCHAR(64) COMMENT 'Image hash for duplicate detection';
