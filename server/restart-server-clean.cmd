@echo off
echo ========================================
echo CLEAN SERVER RESTART
echo ========================================
echo.

echo Step 1: Killing process on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process: %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo Port 4000 cleared!
echo.

echo Step 2: Clearing dist folder (compiled code)...
if exist "dist" (
    rmdir /s /q dist
    echo Dist folder cleared!
) else (
    echo No dist folder found.
)
echo.

echo Step 3: Clearing nodemon cache...
if exist ".nodemon" (
    rmdir /s /q .nodemon
    echo Nodemon cache cleared!
) else (
    echo No nodemon cache found.
)
echo.

echo Step 4: Clearing TypeScript cache...
if exist "tsconfig.tsbuildinfo" (
    del /f /q tsconfig.tsbuildinfo
    echo TypeScript cache cleared!
) else (
    echo No TypeScript cache found.
)
echo.

echo ========================================
echo Server is ready to start!
echo ========================================
echo.
echo Now run: npm run dev
echo.
echo The server will start with the latest code changes.
echo ========================================
pause
