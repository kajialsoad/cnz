@echo off
echo ========================================
echo Starting Clean Care Admin Panel
echo ========================================
echo.
echo Admin Panel will run on:
echo - http://localhost:5173
echo.
echo Will automatically connect to:
echo - Local server (if available)
echo - Vercel server (if local not available)
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

cd clean-care-admin
npm run dev
