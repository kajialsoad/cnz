@echo off
REM Clean Care App - Vercel Deployment Script (Windows)
REM This script helps deploy both server and admin panel to Vercel

echo.
echo ========================================
echo Clean Care App - Vercel Deployment
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
    echo Vercel CLI installed
)

echo.
echo ========================================
echo Step 1: Deploy Server (Backend)
echo ========================================
cd server

echo Building server...
call npm install
call npm run build

echo Deploying to Vercel...
call vercel --prod

echo.
echo Server deployed!
echo.
echo Copy the server URL and update these files:
echo   1. clean-care-admin\.env.production
echo   2. lib\config\api_config.dart
echo.
pause

cd ..

echo.
echo ========================================
echo Step 2: Deploy Admin Panel (Frontend)
echo ========================================
cd clean-care-admin

echo Building admin panel...
call npm install
call npm run build

echo Deploying to Vercel...
call vercel --prod

echo.
echo Admin Panel deployed!
echo.

cd ..

echo.
echo ========================================
echo Step 3: Build Mobile App
echo ========================================
echo.
echo Run this command to build APK:
echo   flutter build apk --release
echo.
echo APK will be at:
echo   build\app\outputs\flutter-apk\app-release.apk
echo.

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test server: https://your-server-name.vercel.app/api/health
echo 2. Test admin panel: https://your-admin-panel.vercel.app
echo 3. Build and test mobile app
echo.
echo For detailed instructions, see:
echo   - APP_DEPLOYMENT_GUIDE_BANGLA.md
echo   - DEPLOYMENT_CHECKLIST.md
echo.
pause
