-- Add soft delete support to complaints table
ALTER TABLE `complaints` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `complaints` ADD COLUMN `deletedBy` INT NULL;

-- Add index for better query performance
CREATE INDEX `idx_complaint_deleted` ON `complaints`(`deletedAt`);

-- Add foreign key for deletedBy
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_deletedBy_fkey` 
  FOREIGN KEY (`deletedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
