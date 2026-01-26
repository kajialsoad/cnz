@echo off
REM ভাষা ফিচার ডিপ্লয় করুন
REM Deploy Language Feature

echo ========================================
echo ভাষা ভিত্তিক বট মেসেজ ডিপ্লয়মেন্ট
echo Language-Based Bot Message Deployment
echo ========================================
echo.

echo [1/4] মাইগ্রেশন চালানো হচ্ছে...
echo [1/4] Running migration...
cd server
node apply-language-preference-migration.js
if errorlevel 1 (
    echo ❌ মাইগ্রেশন ব্যর্থ হয়েছে!
    echo ❌ Migration failed!
    pause
    exit /b 1
)
echo.

echo [2/4] Prisma Client রিজেনারেট করা হচ্ছে...
echo [2/4] Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate ব্যর্থ হয়েছে!
    echo ❌ Prisma generate failed!
    pause
    exit /b 1
)
echo.

echo [3/4] সার্ভার রিস্টার্ট করা হচ্ছে...
echo [3/4] Restarting server...
REM Kill existing server process
taskkill /F /IM node.exe /FI "WINDOWTITLE eq server*" 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [4/4] সার্ভার শুরু করা হচ্ছে...
echo [4/4] Starting server...
start "Clean Care Server" cmd /k "npm run dev"
echo.

cd ..

echo ========================================
echo ✅ ডিপ্লয়মেন্ট সম্পন্ন!
echo ✅ Deployment Complete!
echo ========================================
echo.
echo পরবর্তী পদক্ষেপ / Next Steps:
echo 1. মোবাইল অ্যাপ আপডেট করুন (flutter pub get)
echo    Update mobile app (flutter pub get)
echo 2. অ্যাপ রিস্টার্ট করুন
echo    Restart the app
echo 3. সেটিংস থেকে ভাষা পরিবর্তন করে টেস্ট করুন
echo    Test by changing language from settings
echo.

pause
