@echo off
echo ========================================
echo Status Update Fix - Restart and Test
echo ========================================
echo.
echo This script will help you restart the backend
echo server to apply the file field name fix.
echo.
echo ========================================
echo.

echo Step 1: Checking if backend is running...
curl -s http://localhost:4000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is running
    echo.
    echo ⚠️  You need to RESTART the backend server
    echo    to apply the file upload configuration fix.
    echo.
    echo Please:
    echo 1. Go to your backend terminal
    echo 2. Press Ctrl+C to stop the server
    echo 3. Run: npm run dev
    echo 4. Wait for "Server listening on port 4000"
    echo 5. Come back here and press any key
    echo.
    pause
) else (
    echo ❌ Backend is NOT running
    echo.
    echo Please start the backend server:
    echo   cd server
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Verifying backend is running...
curl -s http://localhost:4000/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend is still not running
    echo.
    echo Please start it manually:
    echo   cd server
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo ✅ Backend is running!
echo.

echo Step 3: Checking admin panel...
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Admin panel is not running
    echo.
    echo Please start it:
    echo   cd clean-care-admin
    echo   npm run dev
    echo.
    pause
)

echo ✅ Admin panel is running!
echo.

echo ========================================
echo All systems ready!
echo ========================================
echo.
echo Next steps:
echo 1. Open browser: http://localhost:5173
echo 2. Login to admin panel
echo 3. Go to "All Complaints"
echo 4. Click on any complaint
echo 5. Try "Mark as In Progress" or "Mark as Resolved"
echo.
echo Expected result:
echo ✅ No "Invalid file field" error
echo ✅ No JSON parse errors
echo ✅ Status updates successfully
echo ✅ Files upload correctly
echo.
echo If you still see errors:
echo - Check server terminal for error messages
echo - Check browser console (F12) for details
echo - See ALL_STATUS_UPDATE_FIXES_COMPLETE.md
echo.
pause
