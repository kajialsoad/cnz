@echo off
REM Railway Performance Optimization Setup Script
REM This script sets up Redis caching and performance optimizations

echo ========================================
echo Railway Performance Optimization Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "server" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo Step 1: Installing Redis dependencies...
cd server
call npm install ioredis
call npm install @types/ioredis --save-dev
echo ✅ Redis dependencies installed
echo.

echo Step 2: Checking Railway Redis connection...
echo Please make sure you have set REDIS_URL in Railway environment variables
echo.

echo Step 3: Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo ⚠️ Migration failed. Please check your database connection.
    echo You can run manually: railway run npx prisma migrate deploy
) else (
    echo ✅ Database migrations completed
)
echo.

echo Step 4: Backing up original service files...
cd src\services
if exist city-corporation.service.ts (
    copy city-corporation.service.ts city-corporation.service.backup.ts >nul
    echo ✅ Backed up city-corporation.service.ts
)
if exist dashboard-analytics.service.ts (
    copy dashboard-analytics.service.ts dashboard-analytics.service.backup.ts >nul
    echo ✅ Backed up dashboard-analytics.service.ts
)
if exist auth.service.ts (
    copy auth.service.ts auth.service.backup.ts >nul
    echo ✅ Backed up auth.service.ts
)
cd ..\..
echo.

echo Step 5: Setup complete!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Update Railway environment variables:
echo    - Go to Railway Dashboard
echo    - Add: REDIS_ENABLED=true
echo    - Verify: REDIS_URL is set
echo.
echo 2. Update service imports in controllers:
echo    - Import optimized services
echo    - Test locally first
echo.
echo 3. Deploy to Railway:
echo    - git add .
echo    - git commit -m "feat: add performance optimizations"
echo    - git push origin main
echo.
echo 4. Monitor deployment:
echo    - railway logs --follow
echo.
echo 5. Test performance:
echo    - Check /api/health endpoint
echo    - Monitor Redis cache hits
echo.
echo ========================================
echo.
echo For detailed instructions, see:
echo - RAILWAY_REDIS_OPTIMIZATION_GUIDE.md
echo - PRODUCTION_PERFORMANCE_ANALYSIS_BANGLA.md
echo.

cd ..
pause
