@echo off
echo ========================================
echo Clearing Admin Panel Cache and Restarting
echo ========================================
echo.

cd clean-care-admin

echo Step 1: Stopping any running dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Vite cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist

echo Step 3: Starting dev server...
echo.
echo ========================================
echo Server starting...
echo After server starts, open browser and press Ctrl+Shift+R
echo ========================================
echo.

npm run dev

pause
