@echo off
echo ========================================
echo Killing process on port 4000...
echo ========================================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process: %%a
    taskkill /F /PID %%a
    echo Process killed successfully!
)

echo.
echo Port 4000 is now free!
echo You can now run: npm run dev
echo ========================================
pause
