@echo off
echo Cleaning up disk space...

REM Clean Flutter build cache
echo Cleaning Flutter build cache...
flutter clean

REM Clean Dart pub cache (optional - only if really needed)
REM dart pub cache clean

REM Clean Windows temp files
echo Cleaning Windows temp files...
del /q /f /s %TEMP%\* 2>nul
del /q /f /s C:\Users\%USERNAME%\AppData\Local\Temp\* 2>nul

REM Clean Flutter tools temp
echo Cleaning Flutter tools temp...
rmdir /s /q C:\Users\%USERNAME%\AppData\Local\Temp\flutter_tools.* 2>nul

echo.
echo Cleanup complete! Check your disk space and try running Flutter again.
pause
