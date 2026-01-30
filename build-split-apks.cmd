@echo off
REM ============================================
REM Clean Care Mobile App - Split APKs Builder
REM (Smaller file sizes for different architectures)
REM ============================================

echo.
echo ========================================
echo Clean Care - Split APKs Build
echo ========================================
echo.

REM Step 1: Clean previous builds
echo [1/5] Cleaning previous builds...
call flutter clean
if errorlevel 1 (
    echo ERROR: Flutter clean failed!
    pause
    exit /b 1
)

REM Step 2: Get dependencies
echo.
echo [2/5] Getting dependencies...
call flutter pub get
if errorlevel 1 (
    echo ERROR: Flutter pub get failed!
    pause
    exit /b 1
)

REM Step 3: Clean Android build
echo.
echo [3/5] Cleaning Android build cache...
cd android
call gradlew clean
cd ..

REM Step 4: Build Split APKs (per ABI)
echo.
echo [4/5] Building Split APKs...
echo This creates separate APKs for each architecture (smaller sizes)
call flutter build apk --release --split-per-abi
if errorlevel 1 (
    echo ERROR: Split APK build failed!
    pause
    exit /b 1
)

REM Step 5: Show output location
echo.
echo [5/5] Build Complete!
echo.
echo ========================================
echo APK Locations:
echo build\app\outputs\flutter-apk\
echo.
echo Files created:
dir build\app\outputs\flutter-apk\*.apk /b
echo.
echo File sizes:
dir build\app\outputs\flutter-apk\*.apk | find ".apk"
echo ========================================
echo.
echo Note: Install the appropriate APK for your device:
echo - app-armeabi-v7a-release.apk (32-bit ARM - older devices)
echo - app-arm64-v8a-release.apk (64-bit ARM - most modern devices)
echo - app-x86_64-release.apk (64-bit Intel - emulators/tablets)
echo.

REM Optional: Open output folder
echo Opening output folder...
start "" "build\app\outputs\flutter-apk"

echo.
echo Build completed successfully!
pause
