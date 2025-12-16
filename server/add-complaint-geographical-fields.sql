-- Add geographical fields to Complaint table
-- Run this SQL directly on your database

-- Check if columns already exist before adding
SET @dbname = DATABASE();
SET @tablename = 'Complaint';
SET @columnname1 = 'cityCorporationCode';
SET @columnname2 = 'zoneId';

-- Add cityCorporationCode if it doesn't exist
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname1, '` VARCHAR(191) NULL;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add zoneId if it doesn't exist
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname2, '` INT NULL;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes (will fail silently if they already exist)
CREATE INDEX IF NOT EXISTS `Complaint_cityCorporationCode_idx` ON `Complaint`(`cityCorporationCode`);
CREATE INDEX IF NOT EXISTS `Complaint_zoneId_idx` ON `Complaint`(`zoneId`);
CREATE INDEX IF NOT EXISTS `Complaint_cityCorporationCode_zoneId_wardId_idx` ON `Complaint`(`cityCorporationCode`, `zoneId`, `wardId`);

-- Note: Foreign key constraints are optional and may cause issues
-- Add them manually if needed after verifying the data
