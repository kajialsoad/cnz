@echo off
echo ========================================
echo Clean Care - সব কিছু চালু করুন
echo ========================================
echo.

echo এটি চালু করবে:
echo   1. Backend Server (port 4000)
echo   2. Admin Panel (port 5173)
echo.
echo চালিয়ে যেতে যেকোনো key চাপুন...
pause >nul

REM পোর্ট পরিষ্কার করুন
echo.
echo পোর্ট পরিষ্কার করা হচ্ছে...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 >nul

REM Backend server চালু করুন
echo.
echo Backend server চালু হচ্ছে...
start "Backend Server" cmd /k "cd server && npm run dev"

REM Backend চালু হওয়ার জন্য অপেক্ষা করুন
echo Backend server চালু হওয়ার জন্য অপেক্ষা করুন...
timeout /t 5 >nul

REM Admin panel চালু করুন
echo.
echo Admin panel চালু হচ্ছে...
start "Admin Panel" cmd /k "cd clean-care-admin && npm run dev"

echo.
echo ========================================
echo ✅ দুটি server চালু হচ্ছে!
echo ========================================
echo.
echo Backend Server: http://localhost:4000
echo Admin Panel: http://localhost:5173
echo.
echo দুটি window খোলা রাখুন।
echo.
pause
