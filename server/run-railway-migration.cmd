@echo off
echo Running Railway migration for preferredLanguage...
echo.

cd server
railway run npx prisma migrate deploy

echo.
echo Migration complete!
pause
