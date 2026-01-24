@echo off
echo ========================================
echo Notification Endpoint 404 Fix
echo ========================================
echo.

echo Step 1: Testing notification endpoint...
node test-notification-endpoint.js
echo.

echo Step 2: Checking if backend server is running...
curl -s https://munna-production.up.railway.app/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is running
) else (
    echo ❌ Backend server is not responding
    echo Please start the server with: cd server ^&^& npm run dev
)
echo.

echo Step 3: Instructions to fix...
echo.
echo The notification routes have been fixed in:
echo   server/src/routes/notification.routes.ts
echo.
echo To apply the fix:
echo   1. Restart the backend server
echo   2. Or deploy to Railway: cd server ^&^& railway up
echo   3. Clear browser cache and reload Flutter app
echo.

echo ========================================
echo Fix Summary
echo ========================================
echo ✅ Added GET /api/notifications endpoint
echo ✅ Fixed route configuration
echo ✅ Updated to use proper controller
echo ⏳ Waiting for server restart...
echo.

pause
