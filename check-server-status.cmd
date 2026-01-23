@echo off
echo ========================================
echo Checking Server Status
echo ========================================
echo.

echo Checking if backend server is running on port 4000...
curl -s http://localhost:4000/api/health
if errorlevel 1 (
    echo.
    echo ❌ Backend server is NOT running!
    echo.
    echo Please start the server:
    echo   cd server
    echo   npm run dev
    echo.
) else (
    echo.
    echo ✅ Backend server is running
    echo.
)

echo.
echo Checking database connection...
echo.

pause
