@echo off
echo ========================================
echo Live Chat Message Routing Diagnostic
echo ========================================
echo.
echo This will check why messages from users are not reaching admins
echo.

cd server
node diagnose-live-chat-routing.js

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo Next steps:
echo 1. Review the output above
echo 2. Check if user has assigned admin
echo 3. Check if messages are in database
echo 4. Clear browser cache if needed
echo.
pause
