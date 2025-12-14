-- CreateTable: UserZone junction table for many-to-many relationship between Users and Zones
-- This enables Super Admins to be assigned to multiple zones (2-5 zones)

CREATE TABLE `user_zones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `zoneId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_zones_userId_idx`(`userId`),
    INDEX `user_zones_zoneId_idx`(`zoneId`),
    INDEX `user_zones_assignedBy_idx`(`assignedBy`),
    UNIQUE INDEX `user_zones_userId_zoneId_key`(`userId`, `zoneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_zones` ADD CONSTRAINT `user_zones_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_zones` ADD CONSTRAINT `user_zones_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `zones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_zones` ADD CONSTRAINT `user_zones_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing Super Admin zone assignments to UserZone table
-- This ensures backward compatibility by creating UserZone records for existing Super Admins
INSERT INTO `user_zones` (`userId`, `zoneId`, `assignedAt`, `assignedBy`, `createdAt`, `updatedAt`)
SELECT 
    `id` as `userId`,
    `zoneId`,
    `createdAt` as `assignedAt`,
    NULL as `assignedBy`,
    NOW() as `createdAt`,
    NOW() as `updatedAt`
FROM `users`
WHERE `role` = 'SUPER_ADMIN' 
  AND `zoneId` IS NOT NULL;

-- Add composite index for performance optimization
CREATE INDEX `user_zones_userId_zoneId_idx` ON `user_zones`(`userId`, `zoneId`);
