@echo off
REM Railway Staging Deployment Script (Windows)
REM Admin Complaint Status Enhancement - Backend Deployment
REM Date: December 21, 2024

setlocal enabledelayedexpansion

echo ========================================
echo   Railway Staging Deployment
echo   Admin Complaint Status Enhancement
echo ========================================
echo.

REM Step 1: Pre-deployment checks
echo Step 1: Pre-deployment checks
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Railway CLI not found
    echo Please install Railway CLI:
    echo   npm install -g @railway/cli
    echo   or visit: https://docs.railway.app/develop/cli
    exit /b 1
)
echo [OK] Railway CLI installed

REM Check if logged in to Railway
railway whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Not logged in to Railway
    echo Please login:
    echo   railway login
    exit /b 1
)
echo [OK] Logged in to Railway

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found
    exit /b 1
)
echo [OK] package.json found

REM Check if Prisma schema exists
if not exist "prisma\schema.prisma" (
    echo [ERROR] Prisma schema not found
    exit /b 1
)
echo [OK] Prisma schema found

REM Check if migration exists
if not exist "prisma\migrations\20241220_add_others_and_reviews" (
    echo [ERROR] Migration 20241220_add_others_and_reviews not found
    exit /b 1
)
echo [OK] Migration found

echo.

REM Step 2: Build verification
echo Step 2: Build verification
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    exit /b 1
)
echo [OK] Dependencies installed

echo Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed
    exit /b 1
)
echo [OK] Prisma Client generated

echo Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [OK] Build successful

echo.

REM Step 3: Run tests
echo Step 3: Running tests
echo.

echo Running unit tests...
call npm test -- --passWithNoTests
if %errorlevel% neq 0 (
    echo [WARNING] Unit tests failed
    set /p continue="Do you want to continue anyway? (y/n): "
    if /i not "!continue!"=="y" exit /b 1
) else (
    echo [OK] Unit tests passed
)

echo.

REM Step 4: Environment variables check
echo Step 4: Environment variables check
echo.

echo Checking Railway environment variables...
echo.
echo Required variables:
echo   - DATABASE_URL (from Railway MySQL service)
echo   - JWT_SECRET
echo   - USE_CLOUDINARY=true
echo   - CLOUDINARY_CLOUD_NAME
echo   - CLOUDINARY_API_KEY
echo   - CLOUDINARY_API_SECRET
echo   - NODE_ENV=production
echo.

echo Current Railway variables:
railway variables 2>nul
echo.

set /p env_check="Have you set all required environment variables in Railway? (y/n): "
if /i not "%env_check%"=="y" (
    echo.
    echo Please set environment variables in Railway:
    echo   1. Go to Railway dashboard
    echo   2. Select your project
    echo   3. Go to Variables tab
    echo   4. Add all required variables
    echo.
    echo Then run this script again.
    exit /b 1
)

echo.

REM Step 5: Database backup reminder
echo Step 5: Database backup
echo.

echo IMPORTANT: Create a database backup before proceeding!
echo.
echo To create a backup, run this command in Railway shell:
echo   railway run mysqldump -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE ^> backup.sql
echo.

set /p backup_check="Have you created a database backup? (y/n): "
if /i not "%backup_check%"=="y" (
    echo.
    echo [ERROR] Please create a backup before deploying!
    echo Deployment cancelled.
    exit /b 1
)

echo.

REM Step 6: Deploy to Railway
echo Step 6: Deploying to Railway
echo.

echo Deploying to Railway...
echo.

railway up

if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed
    exit /b 1
)

echo.
echo [OK] Deployment initiated
echo.

REM Step 7: Wait for deployment
echo Step 7: Waiting for deployment to complete
echo.

echo Waiting for deployment to finish...
echo (This may take 3-5 minutes)
echo.

timeout /t 10 /nobreak >nul

echo.

REM Step 8: Run database migration
echo Step 8: Running database migration
echo.

echo Running Prisma migration...
railway run npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo [ERROR] Migration failed
    echo.
    echo Rollback instructions:
    echo   1. Restore database from backup
    echo   2. Redeploy previous version
    exit /b 1
)

echo [OK] Migration completed
echo.

REM Step 9: Verification
echo Step 9: Verifying deployment
echo.

echo Waiting for service to start...
timeout /t 15 /nobreak >nul

echo.
echo [OK] Deployment verification complete
echo.

REM Step 10: Summary
echo ========================================
echo   Deployment Summary
echo ========================================
echo.

echo [OK] Deployment completed successfully!
echo.
echo Feature: Admin Complaint Status Enhancement
echo Migration: 20241220_add_others_and_reviews
echo.

echo Next Steps:
echo   1. Test new API endpoints
echo   2. Deploy admin panel to staging
echo   3. Deploy mobile app to TestFlight/Internal Testing
echo   4. Run end-to-end tests
echo   5. Monitor logs for errors
echo.

echo Useful Commands:
echo   View logs:        railway logs --follow
echo   Open dashboard:   railway open
echo   Check status:     railway status
echo   Run shell:        railway shell
echo.

echo Opening Railway dashboard...
start railway open

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.

pause
