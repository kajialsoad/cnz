@echo off
echo ================================
echo Clean Care Signed APK Builder
echo ================================
echo.

REM Check if keystore exists
if not exist "android\app\clean-care-release-key.jks" (
    echo Keystore not found! Creating new keystore...
    echo.
    echo Please provide the following information:
    echo.
    cd android\app
    keytool -genkey -v -keystore clean-care-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias clean-care-key
    cd ..\..
    echo.
    echo Keystore created successfully!
    echo.
    echo IMPORTANT: Save your password in a safe place!
    echo.
    pause
)

REM Check if key.properties exists
if not exist "android\key.properties" (
    echo.
    echo key.properties not found!
    echo Please create android\key.properties with:
    echo.
    echo storePassword=your_password
    echo keyPassword=your_password
    echo keyAlias=clean-care-key
    echo storeFile=clean-care-release-key.jks
    echo.
    pause
    exit /b 1
)

echo.
echo Building signed release APK...
echo.

flutter clean
flutter pub get
flutter build apk --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo SUCCESS! Signed APK created
    echo ================================
    echo.
    echo Location: build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo This APK is signed and ready to distribute!
    echo.
    echo Next steps:
    echo 1. Test the APK on a device
    echo 2. Share via WhatsApp or upload to Play Store
    echo 3. Users will see fewer security warnings
    echo.
) else (
    echo.
    echo ================================
    echo ERROR: Build failed
    echo ================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
