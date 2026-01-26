@echo off
echo ========================================
echo Complaint Chat Bot Blinking Fix
echo ========================================
echo.

echo Step 1: Building Flutter APK...
echo ========================================
flutter build apk --release

echo.
echo Step 2: Build complete!
echo ========================================
echo.
echo APK Location: build\app\outputs\flutter-apk\app-release.apk
echo.
echo Next Steps:
echo 1. Test the APK on a device connected to live server
echo 2. Open complaint chat and verify:
echo    - Bot messages don't blink ✓
echo    - Messages appear smoothly ✓
echo    - Polling doesn't cause flickering ✓
echo.
echo ========================================
echo.
pause
