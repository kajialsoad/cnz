-- Add composite index for user_zones table
-- This index optimizes queries that filter by both userId and zoneId
-- Required for multi-zone Super Admin management performance

-- Check if index exists before creating
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_zones' 
    AND INDEX_NAME = 'user_zones_userId_zoneId_idx'
);

-- Create index only if it doesn't exist
SET @sql = IF(
    @index_exists = 0,
    'CREATE INDEX `user_zones_userId_zoneId_idx` ON `user_zones`(`userId`, `zoneId`)',
    'SELECT "Index user_zones_userId_zoneId_idx already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
