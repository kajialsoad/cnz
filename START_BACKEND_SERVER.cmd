@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd server

echo Checking if port 4000 is already in use...
netstat -ano | findstr :4000 >nul
if not errorlevel 1 (
    echo.
    echo ⚠️  Port 4000 is already in use!
    echo.
    echo Killing process on port 4000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 >nul
    echo ✅ Port 4000 cleared
    echo.
)

echo Starting backend server...
echo.
echo 📝 Note: Keep this window open while using the admin panel
echo.

npm run dev
