@echo off
echo ========================================
echo Admin Panel Configuration Check
echo ========================================
echo.

echo Current .env settings:
echo.
type clean-care-admin\.env | findstr "VITE_USE_PRODUCTION"
type clean-care-admin\.env | findstr "VITE_PRODUCTION_API_URL"
type clean-care-admin\.env | findstr "VITE_LOCAL_API_URL"
echo.

echo ========================================
echo Configuration Meaning:
echo ========================================
echo.
echo VITE_USE_PRODUCTION=false
echo   ^> Admin panel will connect to LOCAL server
echo   ^> URL: http://192.168.0.100:4000
echo   ^> Local server MUST be running
echo.
echo VITE_USE_PRODUCTION=true
echo   ^> Admin panel will connect to PRODUCTION server
echo   ^> URL: https://munna-production.up.railway.app
echo   ^> Works without local server
echo.

echo ========================================
echo To apply changes:
echo ========================================
echo 1. Stop admin panel (Ctrl+C in terminal)
echo 2. Run: restart-admin-with-local-server.cmd
echo 3. Open browser and check console logs
echo.

pause
