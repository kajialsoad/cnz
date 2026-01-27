@echo off
echo.
echo ========================================
echo   BOT TRIGGER SYSTEM DIAGNOSIS
echo ========================================
echo.
echo Running diagnosis script...
echo.

cd server
node tests/manual/diagnose-bot-trigger-issue.js

echo.
echo ========================================
echo   DIAGNOSIS COMPLETE
echo ========================================
echo.
echo Check the output above to see what's working and what's not.
echo.
echo If you see any errors, please share:
echo 1. The complete output above
echo 2. Database state (run SQL queries from BOT_TRIGGER_VERIFICATION_BANGLA.md)
echo 3. Server logs: pm2 logs clean-care-server --lines 100 ^| findstr BOT
echo.
pause
