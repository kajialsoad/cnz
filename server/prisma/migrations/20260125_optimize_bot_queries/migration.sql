-- Bot Message System Query Optimization Migration
-- Adds composite indexes for the most common query patterns

-- Add composite index for getBotMessageByStep query
-- This query is called on every user message and needs to be fast
-- Pattern: WHERE chatType = ? AND stepNumber = ? AND isActive = ? ORDER BY displayOrder
CREATE INDEX IF NOT EXISTS `bot_msg_cfg_chat_step_active_order_idx` 
ON `bot_message_configs` (`chatType`, `step_number`, `is_active`, `display_order`);

-- Add index for analytics date range queries
-- Pattern: WHERE chatType = ? AND date >= ? AND date <= ?
CREATE INDEX IF NOT EXISTS `bot_message_analytics_chatType_date_idx` 
ON `bot_message_analytics` (`chatType`, `date`);

-- Add index for analytics message key lookups
-- Pattern: WHERE chatType = ? AND messageKey = ? AND date >= ?
CREATE INDEX IF NOT EXISTS `bot_msg_analytics_chat_key_date_idx` 
ON `bot_message_analytics` (`chatType`, `messageKey`, `date`);
