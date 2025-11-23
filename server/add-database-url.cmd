@echo off
echo Adding DATABASE_URL to Vercel Production...
echo.
echo When prompted:
echo 1. Type: mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
echo 2. Press Enter
echo.
pause
vercel env add DATABASE_URL production
