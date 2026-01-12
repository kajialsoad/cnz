@echo off
echo ========================================
echo  Clear Rate Limits and Restart Server
echo ========================================
echo.

echo Stopping any running server on port 4000...
node server/kill-port-4000.cmd

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo.
echo Starting server (rate limits will be cleared)...
cd server
npm run dev
