@echo off
chcp 65001 >nul
echo ========================================
echo Remote Database Connection Fix
echo ========================================
echo.
echo This tool will help you fix the remote database issue.
echo.
echo Choose your option:
echo   [1] Use LOCAL database (Quick fix - Recommended)
echo   [2] Test REMOTE database connection
echo   [3] Fix REMOTE database (Advanced)
echo   [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto local_db
if "%choice%"=="2" goto test_remote
if "%choice%"=="3" goto fix_remote
if "%choice%"=="4" goto end
goto end

:local_db
echo.
echo ========================================
echo Setting up LOCAL Database
echo ========================================
echo.
echo This will:
echo   ✓ Switch to local MySQL database
echo   ✓ Setup database schema
echo   ✓ Create 5 demo waste posts
echo   ✓ Verify everything works
echo.
pause

echo.
echo [1/7] Checking XAMPP/WAMP MySQL...
netstat -an | findstr ":3306" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] MySQL is running on port 3306
) else (
    echo [✗] MySQL is NOT running!
    echo.
    echo Please start XAMPP/WAMP MySQL first:
    echo   1. Open XAMPP Control Panel
    echo   2. Click "Start" next to MySQL
    echo   3. Wait for it to turn green
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)
echo.

echo [2/7] Backing up current configuration...
cd server
if exist .env (
    copy .env .env.backup >nul 2>&1
    echo [✓] Backed up .env to .env.backup
) else (
    echo [✗] .env file not found!
    pause
    exit /b 1
)
echo.

echo [3/7] Updating database configuration...
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"mysql://root:@localhost:3306/clean_care_db\"' | Set-Content .env"
echo [✓] Database URL updated to local MySQL
echo.

echo [4/7] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [✗] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [✓] Prisma client generated
echo.

echo [5/7] Setting up database schema...
call npx prisma migrate dev --name waste_management_init
if %errorlevel% neq 0 (
    echo [!] Migration failed, trying db push...
    call npx prisma db push --accept-data-loss
    if %errorlevel% neq 0 (
        echo [✗] Failed to setup database schema
        pause
        exit /b 1
    )
)
echo [✓] Database schema created
echo.

echo [6/7] Creating demo waste posts...
node create-demo-waste-posts.js
if %errorlevel% neq 0 (
    echo [!] Failed to create demo posts
    echo You can create them manually later
) else (
    echo [✓] Demo posts created successfully
)
echo.

echo [7/7] Verifying setup...
node check-waste-posts.js
echo.

echo ========================================
echo ✓ LOCAL Database Setup Complete!
echo ========================================
echo.
echo Configuration:
echo   Database: Local MySQL
echo   Host: localhost:3306
echo   Database Name: clean_care_db
echo   Demo Posts: Created
echo.
echo Next steps:
echo   1. Start backend: npm run dev
echo   2. Start admin: cd ..\clean-care-admin ^&^& npm run dev
echo   3. Login: http://localhost:5173/login
echo   4. Go to Waste Management page
echo.
echo Note: Your remote database config is saved in .env.backup
echo To restore remote: copy .env.backup .env
echo.
pause
goto end

:test_remote
echo.
echo ========================================
echo Testing REMOTE Database Connection
echo ========================================
echo.

echo [1/4] Checking internet connection...
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Internet connection is working
) else (
    echo [✗] No internet connection!
    echo Please check your network and try again.
    pause
    exit /b 1
)
echo.

echo [2/4] Testing remote server reachability...
ping -n 1 157.180.49.182 >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Remote server 157.180.49.182 is reachable
) else (
    echo [✗] Cannot reach remote server 157.180.49.182
    echo.
    echo Possible issues:
    echo   - Server is down
    echo   - Firewall blocking connection
    echo   - IP address changed
    echo   - ISP blocking port 3306
    echo.
    echo Recommendations:
    echo   1. Contact your hosting provider
    echo   2. Check cPanel server status
    echo   3. Use local database instead (Option 1)
    echo.
    pause
    exit /b 1
)
echo.

echo [3/4] Checking database configuration...
cd server
if exist .env (
    echo [✓] .env file found
    findstr /C:"DATABASE_URL" .env | findstr /V "#" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [✓] DATABASE_URL is configured
        echo.
        echo Current configuration:
        findstr /C:"DATABASE_URL" .env | findstr /V "#"
    ) else (
        echo [✗] DATABASE_URL not found
    )
) else (
    echo [✗] .env file not found!
    pause
    exit /b 1
)
echo.

echo [4/4] Testing database connection...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Connecting to database...'); prisma.$connect().then(() => { console.log('[✓] Database connection successful!'); return prisma.$disconnect(); }).then(() => process.exit(0)).catch((err) => { console.log('[✗] Database connection failed:'); console.log('Error:', err.message); process.exit(1); });"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✓ Remote Database is Working!
    echo ========================================
    echo.
    echo Your remote database connection is fine.
    echo.
    echo Try these steps:
    echo   1. Check if waste posts exist: node check-waste-posts.js
    echo   2. Restart backend server: npm run dev
    echo   3. Check server logs for errors
    echo   4. Verify admin panel can fetch posts
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ Remote Database Connection Failed
    echo ========================================
    echo.
    echo Common issues and solutions:
    echo.
    echo 1. Remote MySQL not enabled in cPanel
    echo    → Login to cPanel
    echo    → Go to "Remote MySQL"
    echo    → Add your IP address or %% (all IPs)
    echo.
    echo 2. Incorrect database credentials
    echo    → Verify in cPanel MySQL Databases
    echo    → Check username: cleancar_munna
    echo    → Check database: cleancar_munna
    echo.
    echo 3. Firewall blocking connection
    echo    → Check Windows Firewall
    echo    → Check router/ISP firewall
    echo    → Port 3306 must be open
    echo.
    echo 4. Database server is down
    echo    → Contact hosting provider
    echo    → Check server status in cPanel
    echo.
    echo Quick solution: Use local database
    echo   Run this script again and choose Option 1
    echo.
)
pause
goto end

:fix_remote
echo.
echo ========================================
echo Fix REMOTE Database (Advanced)
echo ========================================
echo.
echo This will attempt to fix remote database issues.
echo.
echo Prerequisites:
echo   ✓ cPanel access
echo   ✓ Remote MySQL enabled
echo   ✓ IP address whitelisted
echo   ✓ Correct database credentials
echo.
pause

echo.
echo [1/5] Verifying remote database credentials...
cd server
echo.
echo Current DATABASE_URL:
findstr /C:"DATABASE_URL" .env | findstr /V "#"
echo.
echo Verify these details:
echo   Host: 157.180.49.182
echo   Port: 3306
echo   Database: cleancar_munna
echo   Username: cleancar_munna
echo   Password: mylovema2
echo.
set /p correct="Are these credentials correct? (Y/N): "
if /i not "%correct%"=="Y" (
    echo.
    echo Please update your .env file with correct credentials.
    echo Format: DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
    pause
    exit /b 1
)
echo.

echo [2/5] Testing connection...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('[✓] Connection successful'); return prisma.$disconnect(); }).catch((err) => { console.log('[✗] Connection failed:', err.message); process.exit(1); });"
if %errorlevel% neq 0 (
    echo.
    echo Connection failed. Please check:
    echo   1. cPanel Remote MySQL settings
    echo   2. IP whitelist
    echo   3. Database credentials
    pause
    exit /b 1
)
echo.

echo [3/5] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [✗] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [✓] Prisma client generated
echo.

echo [4/5] Checking database schema...
call npx prisma migrate status
echo.
echo If migrations are pending, run: npx prisma migrate deploy
echo.
pause

echo [5/5] Verifying waste posts...
node check-waste-posts.js
echo.

echo ========================================
echo Remote Database Check Complete
echo ========================================
echo.
echo If posts are missing, create them:
echo   node create-demo-waste-posts.js
echo.
pause
goto end

:end
echo.
echo Exiting...
exit /b 0
