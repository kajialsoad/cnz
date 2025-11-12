-- Add audioUrl column to complaints table
ALTER TABLE `complaints` ADD COLUMN `audioUrl` TEXT NULL AFTER `imageUrl`;
