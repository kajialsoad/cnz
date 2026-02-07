@echo off
echo Fixing Gradle Build Issue...
echo.

echo Step 1: Stopping any running Gradle daemons...
cd android
call gradlew --stop
cd ..

echo.
echo Step 2: Cleaning build directories...
if exist "build\app\intermediates\cxx" (
    echo Removing CMake intermediates...
    rmdir /s /q "build\app\intermediates\cxx" 2>nul
)

if exist "android\.gradle" (
    echo Cleaning Android Gradle cache...
    rmdir /s /q "android\.gradle" 2>nul
)

if exist "android\app\build" (
    echo Cleaning app build directory...
    rmdir /s /q "android\app\build" 2>nul
)

echo.
echo Step 3: Running Flutter clean...
flutter clean

echo.
echo Step 4: Getting dependencies...
flutter pub get

echo.
echo ========================================
echo Fix complete! Now try running:
echo flutter run -d R58NC53EG5M
echo ========================================
pause
