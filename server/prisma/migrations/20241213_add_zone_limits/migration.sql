-- Add minZone and maxZone columns to city_corporations table
ALTER TABLE `city_corporations` 
ADD COLUMN `minZone` INT NOT NULL DEFAULT 1,
ADD COLUMN `maxZone` INT NOT NULL DEFAULT 20;

-- Update existing records with default values
UPDATE `city_corporations` 
SET `minZone` = 1, `maxZone` = 20 
WHERE `minZone` IS NULL OR `maxZone` IS NULL;
