-- Add BOT to SenderType enum
ALTER TABLE `chat_messages` MODIFY COLUMN `senderType` ENUM('ADMIN', 'CITIZEN', 'BOT') NOT NULL DEFAULT 'CITIZEN';
ALTER TABLE `complaint_chat_messages` MODIFY COLUMN `senderType` ENUM('ADMIN', 'CITIZEN', 'BOT') NOT NULL;

-- Create ChatType enum (will be used in new tables)
-- Note: MySQL doesn't have standalone enums, they're defined per column

-- Create bot_message_configs table
CREATE TABLE `bot_message_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatType` ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
    `messageKey` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `content_bn` TEXT NOT NULL,
    `step_number` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bot_message_configs_messageKey_key`(`messageKey`),
    INDEX `bot_message_configs_chatType_is_active_display_order_idx`(`chatType`, `is_active`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create bot_trigger_rules table
CREATE TABLE `bot_trigger_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatType` ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `reactivation_threshold` INTEGER NOT NULL DEFAULT 5,
    `reset_steps_on_reactivate` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bot_trigger_rules_chatType_key`(`chatType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create bot_conversation_states table
CREATE TABLE `bot_conversation_states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatType` ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
    `conversationId` VARCHAR(100) NOT NULL,
    `current_step` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_admin_reply_at` DATETIME(3) NULL,
    `user_message_count` INTEGER NOT NULL DEFAULT 0,
    `last_bot_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bot_conversation_states_chatType_conversationId_key`(`chatType`, `conversationId`),
    INDEX `bot_conversation_states_chatType_is_active_idx`(`chatType`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create bot_message_analytics table
CREATE TABLE `bot_message_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatType` ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
    `messageKey` VARCHAR(100) NOT NULL,
    `step_number` INTEGER NOT NULL,
    `trigger_count` INTEGER NOT NULL DEFAULT 0,
    `admin_reply_count` INTEGER NOT NULL DEFAULT 0,
    `avg_response_time` INTEGER NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bot_message_analytics_chatType_date_idx`(`chatType`, `date`),
    INDEX `bot_message_analytics_messageKey_idx`(`messageKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
