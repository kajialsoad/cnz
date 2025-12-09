@echo off
echo Testing Admin Login API...
echo.

echo Step 1: Login Request
curl -X POST http://localhost:4000/api/admin/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"superadmin@demo.com\",\"password\":\"Demo123!@#\",\"rememberMe\":false}" ^
  -c cookies.txt ^
  -v

echo.
echo.
echo Step 2: Get Profile (check cookies.txt for token)
echo.

pause
