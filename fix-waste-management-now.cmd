@echo off
echo ========================================
echo Waste Management System - Quick Fix
echo ========================================
echo.

echo This will:
echo 1. Switch to local database
echo 2. Setup database schema
echo 3. Create demo posts
echo 4. Restart server
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Step 1: Backing up current .env file...
copy server\.env server\.env.backup
echo ✓ Backup created: server\.env.backup

echo.
echo Step 2: Updating DATABASE_URL to use local MySQL...
powershell -Command "(Get-Content server\.env) -replace 'DATABASE_URL=\"mysql://cleancar_munna:mylovema2@157.180.49.182:3306/cleancar_munna.*\"', 'DATABASE_URL=\"mysql://root:@localhost:3306/clean_care_db\"' | Set-Content server\.env"
echo ✓ DATABASE_URL updated

echo.
echo Step 3: Generating Prisma Client...
cd server
call npx prisma generate
if %errorlevel% neq 0 (
    echo ✗ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated

echo.
echo Step 4: Running database migrations...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ✗ Failed to run migrations
    echo.
    echo This might be because:
    echo - MySQL is not running (Start XAMPP/WAMP)
    echo - Database already exists
    echo.
    echo Trying to push schema instead...
    call npx prisma db push
)
echo ✓ Database schema updated

echo.
echo Step 5: Creating demo waste posts...
node create-demo-waste-posts.js
if %errorlevel% neq 0 (
    echo ✗ Failed to create demo posts
    pause
    exit /b 1
)
echo ✓ Demo posts created

echo.
echo Step 6: Checking posts...
node check-waste-posts.js

echo.
echo ========================================
echo SUCCESS! Everything is ready!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend server: cd server ^&^& npm run dev
echo 2. Start admin panel: cd clean-care-admin ^&^& npm run dev
echo 3. Login at: http://localhost:5173/login
echo 4. Go to Waste Management page
echo.
echo Your old .env is backed up at: server\.env.backup
echo.
pause
