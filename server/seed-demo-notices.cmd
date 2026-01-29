@echo off
echo ========================================
echo   Demo Notices Seeder
echo ========================================
echo.
echo Adding 20 demo notices to database...
echo.

cd /d "%~dp0"

npx ts-node prisma/seeds/demo-notices.seed.ts

echo.
echo ========================================
echo   Seeding Complete!
echo ========================================
echo.
echo You can now view the notices in the admin panel:
echo http://localhost:5173/notices
echo.
pause
