-- Migration: Add Others Status and Review System
-- Date: 2024-12-20
-- Description: Adds othersCategory and othersSubcategory to Complaint model,
--              creates Review model, and enhances Notification model

-- Add new fields to Complaint table
ALTER TABLE `Complaint` 
  ADD COLUMN `othersCategory` VARCHAR(191) NULL,
  ADD COLUMN `othersSubcategory` VARCHAR(191) NULL;

-- Add indexes for Others fields
CREATE INDEX `Complaint_othersCategory_idx` ON `Complaint`(`othersCategory`);
CREATE INDEX `Complaint_othersSubcategory_idx` ON `Complaint`(`othersSubcategory`);
CREATE INDEX `Complaint_status_othersCategory_idx` ON `Complaint`(`status`, `othersCategory`);

-- Create Review table
CREATE TABLE `reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `complaintId` INT NOT NULL,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `reviews_complaintId_userId_key` (`complaintId`, `userId`),
  INDEX `reviews_complaintId_idx` (`complaintId`),
  INDEX `reviews_userId_idx` (`userId`),
  INDEX `reviews_rating_idx` (`rating`),
  INDEX `reviews_createdAt_idx` (`createdAt`),
  CONSTRAINT `reviews_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update Notification table
ALTER TABLE `Notification`
  ADD COLUMN `complaintId` INT NULL,
  ADD COLUMN `statusChange` VARCHAR(191) NULL,
  ADD COLUMN `metadata` TEXT NULL;

-- Add index for Notification complaintId
CREATE INDEX `Notification_complaintId_idx` ON `Notification`(`complaintId`);

-- Add foreign key constraint for Notification complaintId
ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
