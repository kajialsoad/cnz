@echo off
echo ================================
echo Clean Care APK Signing Setup
echo ================================
echo.

REM Get password from user
set /p KEYSTORE_PASSWORD="Enter your keystore password: "
echo.

if "%KEYSTORE_PASSWORD%"=="" (
    echo ERROR: Password cannot be empty!
    pause
    exit /b 1
)

REM Step 1: Create keystore in android/app directory
echo Step 1: Creating keystore...
cd android\app

REM Delete old keystore if exists
if exist clean-care-release-key.jks (
    echo Removing old keystore...
    del clean-care-release-key.jks
)

REM Create new keystore with user's password
keytool -genkey -v -keystore clean-care-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias clean-care-key -storepass %KEYSTORE_PASSWORD% -keypass %KEYSTORE_PASSWORD% -dname "CN=Clean Care Bangladesh, OU=Development, O=Clean Care, L=Dhaka, ST=Dhaka, C=BD"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Keystore creation failed!
    cd ..\..
    pause
    exit /b 1
)

echo.
echo Keystore created successfully!
echo.

REM Go back to root
cd ..\..

REM Step 2: Create key.properties file
echo Step 2: Creating key.properties file...

(
echo storePassword=%KEYSTORE_PASSWORD%
echo keyPassword=%KEYSTORE_PASSWORD%
echo keyAlias=clean-care-key
echo storeFile=clean-care-release-key.jks
) > android\key.properties

echo key.properties created!
echo.

REM Step 3: Clean and build
echo Step 3: Building signed APK...
echo.

flutter clean
flutter pub get
flutter build apk --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo SUCCESS! Signed APK Created
    echo ================================
    echo.
    echo Location: build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo Your Password: %KEYSTORE_PASSWORD%
    echo.
    echo IMPORTANT: Save this password in a safe place!
    echo You will need it for future APK updates!
    echo.
    echo Next Steps:
    echo 1. Test the APK on a device
    echo 2. Share via WhatsApp with user guide
    echo 3. Security warnings will be reduced
    echo.
) else (
    echo.
    echo ================================
    echo ERROR: Build Failed
    echo ================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
