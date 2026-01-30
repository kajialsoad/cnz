@echo off
REM ============================================
REM Clean Care Mobile App - Release APK Builder
REM ============================================

echo.
echo ========================================
echo Clean Care Mobile App - Release Build
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

REM Step 4: Build Release APK
echo.
echo [4/5] Building Release APK...
echo This may take several minutes...
call flutter build apk --release
if errorlevel 1 (
    echo ERROR: APK build failed!
    pause
    exit /b 1
)

REM Step 5: Show output location
echo.
echo [5/5] Build Complete!
echo.
echo ========================================
echo APK Location:
echo build\app\outputs\flutter-apk\app-release.apk
echo ========================================
echo.
echo File size:
dir build\app\outputs\flutter-apk\app-release.apk | find "app-release.apk"
echo.

REM Optional: Open output folder
echo Opening output folder...
start "" "build\app\outputs\flutter-apk"

echo.
echo Build completed successfully!
pause
