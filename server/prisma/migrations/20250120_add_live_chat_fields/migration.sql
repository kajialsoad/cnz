-- Add voiceUrl and senderType fields to ChatMessage for Live Chat support
-- Migration: 20250120_add_live_chat_fields

-- Step 1: Add VOICE to ChatMessageType enum
ALTER TABLE `ChatMessage` 
  MODIFY COLUMN `type` ENUM('TEXT', 'IMAGE', 'FILE', 'VOICE') NOT NULL DEFAULT 'TEXT';

-- Step 2: Add voiceUrl field
ALTER TABLE `ChatMessage` 
  ADD COLUMN `voiceUrl` VARCHAR(500) NULL AFTER `fileUrl`;

-- Step 3: Add senderType field with default value
ALTER TABLE `ChatMessage` 
  ADD COLUMN `senderType` ENUM('ADMIN', 'CITIZEN') NOT NULL DEFAULT 'CITIZEN' AFTER `voiceUrl`;

-- Step 4: Add index for unread messages filtering
ALTER TABLE `ChatMessage` 
  ADD INDEX `idx_receiver_unread` (`receiverId`, `isRead`);

-- Step 5: Rename table to match Prisma mapping
ALTER TABLE `ChatMessage` RENAME TO `chat_messages`;
