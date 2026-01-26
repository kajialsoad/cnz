@echo off
echo ========================================
echo  CRITICAL FIX: Add BOT to SenderType Enum
echo ========================================
echo.
echo This will fix the admin panel crash caused by missing BOT sender type
echo.
pause

cd server

echo.
echo [1/3] Running Prisma migration...
npx prisma migrate deploy

echo.
echo [2/3] Generating Prisma Client...
npx prisma generate

echo.
echo [3/3] Restarting server...
npm run build

echo.
echo ========================================
echo  Migration Complete!
echo ========================================
echo.
echo The admin panel should now work correctly.
echo Please restart your Railway deployment or local server.
echo.
pause
