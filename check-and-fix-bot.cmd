@echo off
REM Check and Fix Bot System
REM This script checks bot status and fixes common issues

echo ========================================
echo Bot System Check and Fix
echo ========================================
echo.

echo Step 1: Checking bot status...
echo.
cd server
node check-bot-status.js
echo.

echo ========================================
echo.
echo Do you want to run the seed script to fix bot messages?
echo This will create/update bot trigger rules and messages.
echo.
set /p CONFIRM="Type 'yes' to continue: "

if /i "%CONFIRM%"=="yes" (
    echo.
    echo Step 2: Running seed script...
    echo.
    npx ts-node prisma/seeds/bot-messages.seed.ts
    echo.
    
    echo Step 3: Checking status again...
    echo.
    node check-bot-status.js
    echo.
    
    echo ========================================
    echo Fix Complete!
    echo ========================================
    echo.
    echo Next Steps:
    echo 1. Restart your server: npm run dev
    echo 2. Test in browser:
    echo    - Login as user
    echo    - Open live chat
    echo    - Send a message
    echo    - Check if bot responds
    echo.
) else (
    echo.
    echo Cancelled. No changes made.
    echo.
)

cd ..
pause
