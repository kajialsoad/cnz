-- Bot System Database Check
-- Run this in your database client

-- 1. Check Bot Trigger Rules
SELECT 
  "chatType",
  "isEnabled",
  "reactivationThreshold",
  "resetStepsOnReactivate",
  "updatedAt"
FROM "BotTriggerRule"
ORDER BY "chatType";

-- 2. Check Bot Messages Count
SELECT 
  "chatType",
  COUNT(*) as message_count,
  COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_count
FROM "BotMessageConfig"
GROUP BY "chatType";

-- 3. Check Recent Bot Conversation States
SELECT 
  "conversationId",
  "chatType",
  "isActive",
  "currentStep",
  "userMessageCount",
  "lastBotMessageAt",
  "lastAdminReplyAt",
  "updatedAt"
FROM "BotConversationState"
ORDER BY "updatedAt" DESC
LIMIT 10;

-- 4. Check if bot is working (recent bot messages)
SELECT 
  COUNT(*) as recent_bot_messages,
  MAX("createdAt") as last_bot_message
FROM "ChatMessage"
WHERE "senderType" = 'BOT'
  AND "createdAt" > NOW() - INTERVAL '24 hours';
