@echo off
REM Android Testing Script for Bot Message System
REM Task 3.6: Test on Android devices

echo ========================================
echo Bot Message System - Android Testing
echo ========================================
echo.

REM Check if Flutter is installed
flutter --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Flutter is not installed or not in PATH
    echo Please install Flutter: https://flutter.dev/docs/get-started/install
    pause
    exit /b 1
)

echo [1/6] Checking connected Android devices...
echo.
flutter devices
echo.

REM Check if any Android device is connected
flutter devices | findstr /C:"android" >nul
if errorlevel 1 (
    echo WARNING: No Android devices found!
    echo.
    echo Please connect an Android device or start an emulator:
    echo   - Physical device: Enable USB debugging and connect via USB
    echo   - Emulator: flutter emulators --launch ^<emulator_id^>
    echo.
    pause
    exit /b 1
)

echo [2/6] Cleaning previous builds...
flutter clean
echo.

echo [3/6] Getting dependencies...
flutter pub get
echo.

echo [4/6] Running widget tests...
echo.
flutter test test/widgets/bot_message_bubble_test.dart --reporter=expanded
if errorlevel 1 (
    echo.
    echo ERROR: Widget tests failed!
    pause
    exit /b 1
)
echo.
echo ✅ Widget tests passed!
echo.

echo [5/6] Running integration tests...
echo.
flutter test test/integration/bot_message_flow_test.dart --reporter=expanded
if errorlevel 1 (
    echo.
    echo ERROR: Integration tests failed!
    pause
    exit /b 1
)
echo.
echo ✅ Integration tests passed!
echo.

echo [6/6] Building and running app on Android device...
echo.
echo This will install the app on your Android device.
echo You can then manually test the bot message features.
echo.
set /p CONTINUE="Continue with app installation? (Y/N): "
if /i "%CONTINUE%" NEQ "Y" (
    echo.
    echo Installation cancelled.
    goto :end
)

echo.
echo Building and installing app...
flutter run --release
echo.

:end
echo.
echo ========================================
echo Testing Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review test results above
echo 2. Perform manual testing using the guide:
echo    test/android/ANDROID_TESTING_GUIDE.md
echo 3. Document any issues found
echo 4. Update task status when complete
echo.
pause
