@echo off
echo Stopping Flutter app...
taskkill /F /IM flutter.exe 2>nul
timeout /t 2 /nobreak >nul

echo Cleaning Flutter build cache...
flutter clean

echo Rebuilding Flutter app...
flutter pub get

echo Starting Flutter app in debug mode...
flutter run

pause
