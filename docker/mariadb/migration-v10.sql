-- Add location and photo quality to profiles
ALTER TABLE `profiles`
ADD COLUMN `latitude` DECIMAL(10, 8) NULL COMMENT '위도',
ADD COLUMN `longitude` DECIMAL(11, 8) NULL COMMENT '경도',
ADD COLUMN `avg_photo_quality` FLOAT NULL DEFAULT 0 COMMENT '평균 사진 품질 점수';

-- Add last active timestamp to users
ALTER TABLE `users`
ADD COLUMN `last_active_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 활동 시간';
