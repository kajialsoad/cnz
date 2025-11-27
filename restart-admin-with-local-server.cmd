@echo off
echo ========================================
echo Restarting Admin Panel with PRODUCTION Server
echo ========================================
echo.

echo Checking .env configuration...
type clean-care-admin\.env | findstr "VITE_USE_PRODUCTION"
echo.

echo IMPORTANT: 
echo - VITE_USE_PRODUCTION=false means LOCAL server (http://192.168.0.100:4000)
echo - VITE_USE_PRODUCTION=true means PRODUCTION server (Railway)
echo.

echo Starting admin panel...
echo Please open browser and check console for:
echo    "USE_PRODUCTION: false"
echo    "API URL: http://192.168.0.100:4000"
echo.

cd clean-care-admin
npm run dev

pause
