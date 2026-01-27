@echo off
echo ========================================
echo BOT TRIGGER SYSTEM - COMPLETE TEST
echo ========================================
echo.

echo Step 1: Checking database configuration...
cd server
node tests/manual/check-bot-system-simple.js

echo.
echo ========================================
echo.
echo Step 2: Manual Testing Instructions
echo ========================================
echo.
echo Please follow these manual tests:
echo.
echo TEST 1: Bot Active State (Admin hasn't replied)
echo ------------------------------------------------
echo 1. Open Live Chat as a user
echo 2. Send message: "Hello"
echo    Expected: Bot replies with Step 1 message
echo 3. Send message: "Help me"
echo    Expected: Bot replies with Step 2 message
echo 4. Send message: "I need assistance"
echo    Expected: Bot replies with Step 3 message
echo 5. Send message: "Still waiting"
echo    Expected: Bot LOOPS back to Step 1
echo.
echo TEST 2: Bot Deactivation (Admin replies)
echo ------------------------------------------------
echo 1. Continue from TEST 1
echo 2. Admin sends message: "Hi, I'm here to help"
echo    Expected: Bot IMMEDIATELY deactivates
echo 3. User sends message: "Thanks"
echo    Expected: NO bot reply
echo 4. User sends message: "Can you help?"
echo    Expected: NO bot reply
echo.
echo TEST 3: Bot Reactivation (Threshold reached)
echo ------------------------------------------------
echo 1. Continue from TEST 2
echo 2. User sends message: "Hello?" (count = 1)
echo    Expected: NO bot reply
echo 3. User sends message: "Anyone there?" (count = 2)
echo    Expected: NO bot reply
echo 4. User sends message: "Please help" (count = 3)
echo    Expected: Bot REACTIVATES and sends Step 1
echo.
echo ========================================
echo.
echo After testing, check database state:
echo.
echo Run this SQL query:
echo SELECT * FROM "BotConversationState" 
echo WHERE "conversationId" LIKE 'live-chat-user-%%'
echo ORDER BY "updatedAt" DESC LIMIT 5;
echo.
echo ========================================
echo.
pause
