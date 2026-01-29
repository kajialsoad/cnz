@echo off
echo ========================================
echo Testing Notice Board API Fixes
echo ========================================
echo.

echo Test 1: Categories Endpoint (Public Access)
echo URL: http://127.0.0.1:4000/api/notice-categories
echo Expected: Array of categories WITHOUT authentication
echo.
curl -s http://127.0.0.1:4000/api/notice-categories
echo.
echo.

echo ========================================
echo Test 2: Active Notices Endpoint
echo URL: http://127.0.0.1:4000/api/notices/active
echo Expected: Array of active notices
echo.
curl -s http://127.0.0.1:4000/api/notices/active
echo.
echo.

echo ========================================
echo Test 3: Health Check
echo URL: http://127.0.0.1:4000/api/health
echo Expected: {"ok":true,"status":"healthy"}
echo.
curl -s http://127.0.0.1:4000/api/health
echo.
echo.

echo ========================================
echo All tests complete!
echo ========================================
echo.
echo If you see JSON responses above, the API is working correctly.
echo If you see connection errors, the server may not be running.
echo.
pause
