-- Ward Uniqueness Per City Corporation Migration
-- This migration changes ward uniqueness from per-zone to per-city-corporation
-- Meaning: Each ward number can only be used once within a city corporation

-- Step 1: Drop the old unique constraint (wardNumber + zoneId)
ALTER TABLE `wards` DROP INDEX `wards_wardNumber_zoneId_key`;

-- Step 2: Add new unique constraint (wardNumber + cityCorporationId)
ALTER TABLE `wards` ADD UNIQUE INDEX `wards_wardNumber_cityCorporationId_key` (`wardNumber`, `cityCorporationId`);
