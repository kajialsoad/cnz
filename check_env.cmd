@echo off
echo Checking .env file content:
echo.
type .env
echo.
echo ================================
echo.
echo If USE_PRODUCTION=true is shown above, then:
echo 1. Stop your Flutter app (press 'q' in terminal)
echo 2. Run: flutter clean
echo 3. Run: flutter pub get
echo 4. Run: flutter run
echo.
pause
