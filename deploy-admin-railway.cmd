@echo off
echo ========================================
echo Railway Admin Panel Deployment
echo ========================================
echo.

cd clean-care-admin

echo Step 1: Checking Railway login status...
railway whoami
if errorlevel 1 (
    echo Please login to Railway first: railway login
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying admin panel to Railway...
railway up

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Check your Railway dashboard for the deployment URL
echo https://railway.app/dashboard
echo.
pause
