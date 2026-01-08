-- Add geographical location fields to complaints table
-- These fields store the actual location where the complaint was made
-- Different from user's registered location

ALTER TABLE `complaints` 
ADD COLUMN `complaintCityCorporationCode` VARCHAR(191) NULL AFTER `cityCorporationCode`,
ADD COLUMN `complaintZoneId` INT NULL AFTER `complaintCityCorporationCode`,
ADD COLUMN `complaintWardId` INT NULL AFTER `complaintZoneId`;

-- Add indexes for better query performance
CREATE INDEX `idx_complaint_location_city` ON `complaints`(`complaintCityCorporationCode`);
CREATE INDEX `idx_complaint_location_zone` ON `complaints`(`complaintZoneId`);
CREATE INDEX `idx_complaint_location_ward` ON `complaints`(`complaintWardId`);
CREATE INDEX `idx_complaint_location_composite` ON `complaints`(`complaintCityCorporationCode`, `complaintZoneId`, `complaintWardId`);

-- Add foreign key constraints
ALTER TABLE `complaints`
ADD CONSTRAINT `fk_complaint_location_zone` 
FOREIGN KEY (`complaintZoneId`) REFERENCES `zones`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_complaint_location_ward` 
FOREIGN KEY (`complaintWardId`) REFERENCES `wards`(`id`) ON DELETE SET NULL;
