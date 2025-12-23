@echo off
echo ========================================
echo Clean Care - Startup Verification
echo ========================================
echo.

REM Check if backend server is running
echo [1/3] Checking backend server...
curl -s http://localhost:4000/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend server is NOT running
    echo.
    echo Starting backend server...
    echo Please open a new terminal and run:
    echo   cd server
    echo   npm run dev
    echo.
    pause
    goto :check_backend
) else (
    echo ✅ Backend server is running on port 4000
)

:check_backend
echo.

REM Check if admin panel is accessible
echo [2/3] Checking admin panel...
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Admin panel is NOT running
    echo.
    echo Starting admin panel...
    echo Please open a new terminal and run:
    echo   cd clean-care-admin
    echo   npm run dev
    echo.
    pause
) else (
    echo ✅ Admin panel is running on port 5173
)

echo.

REM Test API endpoint
echo [3/3] Testing API endpoint...
curl -s -X GET http://localhost:4000/api/admin/complaints -H "Content-Type: application/json" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Could not test API endpoint (might need authentication)
) else (
    echo ✅ API endpoint is accessible
)

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open browser: http://localhost:5173
echo 2. Login to admin panel
echo 3. Test status update feature
echo.
echo If you encounter "not valid JSON" error:
echo - Make sure backend server is running
echo - Check browser console (F12) for details
echo - See FIX_STATUS_UPDATE_ERROR.md for help
echo.
pause
