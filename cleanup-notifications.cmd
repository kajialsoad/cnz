@echo off
echo ========================================
echo Notification Cleanup Script
echo ========================================
echo.
echo This script will clean up old notifications
echo for Super Admins based on their assigned zones.
echo.
echo IMPORTANT: Make sure you have a database backup!
echo.
pause

cd server

echo.
echo Running cleanup script...
echo.

node cleanup-old-notifications.js

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Please verify:
echo 1. Super Admin notifications are correct
echo 2. Master Admin can see all notifications
echo 3. New notifications are working properly
echo.
pause
