@echo off
echo ========================================
echo Clean Care Admin Panel - Complete Startup
echo ========================================
echo.

echo This will start:
echo   1. Backend Server (port 4000)
echo   2. Admin Panel (port 5173)
echo.
echo Press any key to continue...
pause >nul

REM Kill any existing processes on ports
echo.
echo Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 >nul

REM Start backend server in new window
echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd server && npm run dev"

REM Wait for backend to start
echo Waiting for backend server to start...
timeout /t 5 >nul

REM Start admin panel in new window
echo.
echo Starting admin panel...
start "Admin Panel" cmd /k "cd clean-care-admin && npm run dev"

echo.
echo ========================================
echo ✅ Both servers are starting!
echo ========================================
echo.
echo Backend Server: http://localhost:4000
echo Admin Panel: http://localhost:5173
echo.
echo Keep both windows open while using the application.
echo.
pause
