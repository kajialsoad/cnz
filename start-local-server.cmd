@echo off
echo ========================================
echo Starting Clean Care Local Server
echo ========================================
echo.
echo Server will run on:
echo - http://localhost:4000
echo - http://192.168.0.100:4000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd server
npm run dev
