@echo off
echo ========================================
echo Performance Indexes Deployment
echo ========================================
echo.

echo Step 1: Server folder e jachi...
cd server
echo ✓ Server folder e achi
echo.

echo Step 2: Prisma client generate korchi...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ✗ Prisma generate fail hoyeche!
    pause
    exit /b 1
)
echo ✓ Prisma client generate complete
echo.

echo Step 3: Database e push korchi (indexes add hobe)...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ✗ Database push fail hoyeche!
    echo.
    echo Troubleshooting:
    echo 1. DATABASE_URL check korun .env file e
    echo 2. Railway dashboard e database running ache kina check korun
    echo 3. Internet connection check korun
    pause
    exit /b 1
)
echo ✓ Database push complete! Indexes add hoyeche
echo.

echo ========================================
echo ✓ SUCCESS! Performance indexes deployed
echo ========================================
echo.
echo Next steps:
echo 1. Server restart korun: npm run dev
echo 2. Dashboard load time test korun
echo 3. Complaint list speed check korun
echo.
echo Expected improvement: 3-5x faster! 🚀
echo.
pause
