-- Add geographical fields to Complaint table for dynamic city corporation system
-- These fields store the geographical location where the complaint was made

-- Add cityCorporationCode field
ALTER TABLE `Complaint` ADD COLUMN `cityCorporationCode` VARCHAR(191) NULL;

-- Add zoneId field
ALTER TABLE `Complaint` ADD COLUMN `zoneId` INT NULL;

-- Add foreign key constraints
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_cityCorporationCode_fkey` 
  FOREIGN KEY (`cityCorporationCode`) REFERENCES `CityCorporation`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_zoneId_fkey` 
  FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better query performance
CREATE INDEX `Complaint_cityCorporationCode_idx` ON `Complaint`(`cityCorporationCode`);
CREATE INDEX `Complaint_zoneId_idx` ON `Complaint`(`zoneId`);
CREATE INDEX `Complaint_cityCorporationCode_zoneId_wardId_idx` ON `Complaint`(`cityCorporationCode`, `zoneId`, `wardId`);
