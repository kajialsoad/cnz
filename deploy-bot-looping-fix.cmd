@echo off
REM Deploy Bot Looping Fix to Production
REM This script deploys the bot looping system fix

echo ========================================
echo Bot Looping Fix Deployment
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding changes...
git add server/src/services/bot-message.service.ts
git add LIVE_CHAT_BOT_LOOP_FIX_COMPLETE.md
git add LIVE_CHAT_BOT_LOOP_QUICK_REFERENCE_BANGLA.md
git add server/tests/manual/test-bot-looping-behavior.js
git add deploy-bot-looping-fix.cmd
echo.

echo Step 3: Committing changes...
git commit -m "Fix: Bot looping system - bot loops back to step 1 when admin doesn't reply"
echo.

echo Step 4: Pushing to repository...
git push origin main
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Server will auto-deploy (if using Railway/Vercel)
echo 2. Test on live server:
echo    - User sends messages without admin reply
echo    - Verify bot loops: Step 1 -^> 2 -^> 3 -^> 1 -^> 2 -^> 3
echo 3. Test admin reply stops loop
echo 4. Test reactivation after 5 messages
echo.
echo Check server logs for [BOT] messages
echo.

pause
