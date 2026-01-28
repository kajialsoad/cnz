@echo off
echo ========================================
echo Remote Database Diagnostic Tool
echo ========================================
echo.

echo [1/5] Checking Internet Connection...
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Internet connection is working
) else (
    echo [ERROR] No internet connection!
    echo Please check your network connection.
    pause
    exit /b 1
)
echo.

echo [2/5] Testing Remote Database Server...
ping -n 1 157.180.49.182 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Remote server 157.180.49.182 is reachable
) else (
    echo [ERROR] Cannot reach remote server 157.180.49.182
    echo.
    echo Possible reasons:
    echo - Server is down
    echo - Firewall blocking connection
    echo - IP address changed
    echo.
    echo Please check with your hosting provider.
)
echo.

echo [3/5] Checking Database Configuration...
cd server
if exist .env (
    echo [OK] .env file found
    findstr /C:"DATABASE_URL" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] DATABASE_URL is configured
        echo.
        echo Current DATABASE_URL:
        findstr /C:"DATABASE_URL" .env | findstr /V "#"
    ) else (
        echo [ERROR] DATABASE_URL not found in .env
    )
) else (
    echo [ERROR] .env file not found!
)
echo.

echo [4/5] Testing Database Connection with Node.js...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('[OK] Database connection successful!'); process.exit(0); }).catch((err) => { console.log('[ERROR] Database connection failed:'); console.log(err.message); process.exit(1); });" 2>&1
echo.

echo [5/5] Checking Waste Posts Table...
node check-waste-posts.js 2>&1
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo RECOMMENDATIONS:
echo.
echo If remote database is NOT reachable:
echo   1. Contact your hosting provider (cPanel)
echo   2. Check Remote MySQL settings in cPanel
echo   3. Add your IP to Remote MySQL whitelist
echo   4. Verify database credentials
echo.
echo OR use local database for development:
echo   1. Run: fix-waste-management-now.cmd
echo   2. This will switch to local MySQL
echo.
pause
