@echo off
echo Cleaning project...
call flutter clean
call flutter pub get

echo.
echo Running app (default renderer)...
call flutter run -d chrome --verbose

pause
