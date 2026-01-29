@echo off
echo Setting Flutter to use F: drive for temporary files...

REM Create temp directory on F: drive
mkdir F:\flutter_temp 2>nul

REM Set environment variable for this session
set FLUTTER_TEMP=F:\flutter_temp
set TMP=F:\flutter_temp
set TEMP=F:\flutter_temp

echo.
echo Temporary location set to F:\flutter_temp
echo Now running Flutter...
echo.

flutter run

pause
