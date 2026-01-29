-- CreateTable for NoticeCategory
CREATE TABLE `notice_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `name_bn` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#2E8B57',
    `icon` VARCHAR(191) NULL,
    `parent_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notice_categories_parent_id_idx`(`parent_id`),
    INDEX `notice_categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable for Notice
CREATE TABLE `notices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `title_bn` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `description_bn` TEXT NULL,
    `content` TEXT NOT NULL,
    `content_bn` TEXT NULL,
    `category_id` INTEGER NOT NULL,
    `type` ENUM('GENERAL', 'URGENT', 'EVENT', 'SCHEDULED') NOT NULL DEFAULT 'GENERAL',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `publish_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiry_date` DATETIME(3) NULL,
    `image_url` VARCHAR(500) NULL,
    `attachments` JSON NULL,
    `target_zones` JSON NULL,
    `target_wards` JSON NULL,
    `target_cities` JSON NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `read_count` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notices_category_id_idx`(`category_id`),
    INDEX `notices_is_active_publish_date_idx`(`is_active`, `publish_date`),
    INDEX `notices_expiry_date_idx`(`expiry_date`),
    INDEX `notices_created_by_idx`(`created_by`),
    INDEX `notices_type_idx`(`type`),
    INDEX `notices_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notice_categories` ADD CONSTRAINT `notice_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `notice_categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `notice_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default categories
INSERT INTO `notice_categories` (`name`, `name_bn`, `color`, `icon`) VALUES
('Schedule', 'সময়সূচী', '#4A90E2', 'schedule'),
('Event', 'ইভেন্ট', '#3CB371', 'event'),
('Infrastructure', 'অবকাঠামো', '#9B59B6', 'build'),
('Holiday', 'ছুটির দিন', '#FF8C42', 'holiday_village'),
('Campaign', 'ক্যাম্পেইন', '#E86464', 'campaign'),
('Emergency', 'জরুরি', '#FF6B6B', 'emergency');
