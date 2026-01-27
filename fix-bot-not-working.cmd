@echo off
REM Fix Bot Not Working - Complete Solution
REM This script diagnoses and fixes bot activation issues

echo ========================================
echo Bot Not Working - Complete Fix
echo ========================================
echo.

echo Step 1: Running Diagnostic...
echo.
cd server
node tests/manual/diagnose-bot-not-working.js
echo.

echo ========================================
echo.
echo Step 2: Setting up Bot Messages...
echo.
node tests/manual/setup-bot-messages.js
echo.

echo ========================================
echo.
echo Step 3: Restarting Server...
echo.
echo Killing existing server...
call npm run kill-port
echo.

echo Starting server...
start cmd /k "npm run dev"
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Server is starting in a new window.
echo.
echo Next Steps:
echo 1. Wait for server to start (check the new window)
echo 2. Open browser and login as user
echo 3. Go to Live Chat
echo 4. Send a message
echo 5. Bot should respond!
echo.
echo If bot still doesn't work:
echo 1. Check server logs in the new window
echo 2. Look for [BOT] messages
echo 3. Run: node server/tests/manual/diagnose-bot-not-working.js
echo 4. Share the output
echo.

pause
