-- Dynamic Admin Management System - Database Schema Enhancement
-- This migration adds:
-- 1. permissions JSON field to users table
-- 2. ActivityLog table for audit trail
-- 3. Admin assignment fields to complaints table
-- 4. Performance optimization indexes

-- Step 1: Add permissions field to users table
ALTER TABLE `users` ADD COLUMN `permissions` JSON NULL;

-- Step 2: Add admin assignment fields to Complaint table
ALTER TABLE `Complaint` ADD COLUMN `assignedAdminId` INT NULL;
ALTER TABLE `Complaint` ADD COLUMN `assignedAt` DATETIME(3) NULL;
ALTER TABLE `Complaint` ADD COLUMN `resolvedAt` DATETIME(3) NULL;

-- Step 3: Add foreign key for assignedAdminId
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_assignedAdminId_fkey` 
  FOREIGN KEY (`assignedAdminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Create ActivityLog table
CREATE TABLE `activity_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` INT NULL,
  `oldValue` JSON NULL,
  `newValue` JSON NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `activity_logs_userId_idx` (`userId`),
  INDEX `activity_logs_entityType_entityId_idx` (`entityType`, `entityId`),
  INDEX `activity_logs_timestamp_idx` (`timestamp`),
  INDEX `activity_logs_action_idx` (`action`),
  INDEX `activity_logs_userId_timestamp_idx` (`userId`, `timestamp`),
  CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Add performance optimization indexes to users table
CREATE INDEX `users_cityCorporationCode_zoneId_wardId_idx` ON `users`(`cityCorporationCode`, `zoneId`, `wardId`);

-- Step 6: Add performance optimization index to Complaint table
CREATE INDEX `Complaint_assignedAdminId_idx` ON `Complaint`(`assignedAdminId`);

-- Step 7: Add composite indexes for common query patterns
CREATE INDEX `users_role_status_idx` ON `users`(`role`, `status`);
CREATE INDEX `users_cityCorporationCode_role_idx` ON `users`(`cityCorporationCode`, `role`);
CREATE INDEX `Complaint_wardId_status_idx` ON `Complaint`(`wardId`, `status`);
CREATE INDEX `Complaint_assignedAdminId_status_idx` ON `Complaint`(`assignedAdminId`, `status`);

-- Migration completed successfully
