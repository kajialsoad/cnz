@echo off
echo Checking backend server status...
echo.

curl -s http://localhost:4000/health
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Backend server is NOT running!
    echo.
    echo To start the backend server:
    echo   cd server
    echo   npm run dev
) else (
    echo.
    echo ✅ Backend server is running!
)

echo.
pause
