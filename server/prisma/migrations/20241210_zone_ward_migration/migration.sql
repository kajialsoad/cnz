-- Zone-Ward Management System Migration
-- This migration replaces the Thana structure with Zone and Ward hierarchy

-- Step 1: Create Zone table
CREATE TABLE `zones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `zoneNumber` INT NOT NULL,
  `name` VARCHAR(191) NULL,
  `cityCorporationId` INT NOT NULL,
  `officerName` VARCHAR(191) NULL,
  `officerDesignation` VARCHAR(191) NULL,
  `officerSerialNumber` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `zones_zoneNumber_cityCorporationId_key`(`zoneNumber`, `cityCorporationId`),
  INDEX `zones_cityCorporationId_status_idx`(`cityCorporationId`, `status`),
  CONSTRAINT `zones_cityCorporationId_fkey` FOREIGN KEY (`cityCorporationId`) REFERENCES `city_corporations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Create Ward table
CREATE TABLE `wards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `wardNumber` INT NOT NULL,
  `zoneId` INT NOT NULL,
  `inspectorName` VARCHAR(191) NULL,
  `inspectorSerialNumber` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `wards_wardNumber_zoneId_key`(`wardNumber`, `zoneId`),
  INDEX `wards_zoneId_status_idx`(`zoneId`, `status`),
  CONSTRAINT `wards_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `zones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 3: Add new columns to users table
ALTER TABLE `users` ADD COLUMN `zoneId` INT NULL;
ALTER TABLE `users` ADD COLUMN `wardId` INT NULL;
ALTER TABLE `users` ADD COLUMN `wardImageCount` INT NOT NULL DEFAULT 0;

-- Step 4: Create indexes on users table for new columns
CREATE INDEX `users_zoneId_idx` ON `users`(`zoneId`);
CREATE INDEX `users_wardId_idx` ON `users`(`wardId`);
CREATE INDEX `users_cityCorporationCode_zoneId_wardId_idx` ON `users`(`cityCorporationCode`, `zoneId`, `wardId`);

-- Step 5: Add foreign key constraints for new user columns
ALTER TABLE `users` ADD CONSTRAINT `users_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Drop old indexes and columns (will be done after data migration)
-- Note: These steps are commented out and will be executed after data migration is complete
-- DROP INDEX `users_thanaId_idx` ON `users`;
-- DROP INDEX `users_ward_idx` ON `users`;
-- DROP INDEX `users_cityCorporationCode_ward_idx` ON `users`;
-- ALTER TABLE `users` DROP FOREIGN KEY `users_thanaId_fkey`;
-- ALTER TABLE `users` DROP COLUMN `thanaId`;
-- ALTER TABLE `users` DROP COLUMN `ward`;
-- ALTER TABLE `users` DROP COLUMN `zone`;
-- DROP TABLE `thanas`;
