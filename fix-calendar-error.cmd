@echo off
echo ========================================
echo Calendar API Error Fix Script
echo ========================================
echo.

echo Step 1: Testing Calendar API...
echo.
cd server
node test-calendar-api.js
echo.

echo Step 2: Checking if calendar exists in database...
echo.
node seed-demo-calendar.js
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your backend server (npm run dev)
echo 2. Restart your Flutter app
echo 3. Navigate to the calendar page
echo.
echo If the error persists, check CALENDAR_API_DEBUG_GUIDE.md
echo.
pause
