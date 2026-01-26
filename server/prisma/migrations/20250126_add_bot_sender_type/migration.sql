-- Add BOT to SenderType enum
ALTER TABLE `chat_messages` MODIFY COLUMN `senderType` ENUM('ADMIN', 'CITIZEN', 'BOT') NOT NULL DEFAULT 'CITIZEN';
