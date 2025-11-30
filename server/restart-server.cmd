@echo off
echo Stopping any process using port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)
echo Starting server...
npm run dev
