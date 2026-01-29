@echo off
echo ========================================
echo Notice Board API Fixes - Server Restart
echo ========================================
echo.

echo Step 1: Killing existing server on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo Found process: %%a
    taskkill /F /PID %%a
)
echo.

echo Step 2: Waiting for port to be released...
timeout /t 3 /nobreak > nul
echo.

echo Step 3: Starting server with fixes applied...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Starting npm run dev...
start "Clean Care Backend Server" cmd /k "npm run dev"
echo.

echo ========================================
echo Server restart initiated!
echo ========================================
echo.
echo The server is starting in a new window.
echo Please check the new window for startup logs.
echo.
echo Once you see "Server is running on port 4000", test:
echo   curl http://127.0.0.1:4000/api/notice-categories
echo.
pause
