@echo off
echo.
echo ========================================
echo   BOT SYSTEM SIMPLE CHECK
echo ========================================
echo.
echo Checking bot configuration...
echo.

cd server
node tests/manual/check-bot-system-simple.js

echo.
echo ========================================
echo   CHECK COMPLETE
echo ========================================
echo.
echo Please share the output above.
echo.
echo Also, please tell me:
echo 1. What EXACT problem are you facing?
echo 2. In which chat type? (Live Chat / Complaint Chat)
echo 3. What should happen vs what is happening?
echo.
pause
