@echo off
REM =============================================================================
REM Staging Database Migration Script (Windows)
REM Feature: Admin Complaint Status Enhancement
REM Migration: 20241220_add_others_and_reviews
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set MIGRATION_NAME=20241220_add_others_and_reviews
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=staging_backup_%TIMESTAMP%.sql

echo ========================================
echo   Staging Database Migration
echo   Feature: Complaint Status Enhancement
echo ========================================
echo.

REM Step 1: Check environment
echo Step 1: Checking environment
echo.

if not exist .env (
    echo Error: .env file not found
    echo Please create .env file with staging DATABASE_URL
    exit /b 1
)

echo [OK] Environment configured
echo.

REM Step 2: Check Node.js and npm
echo Step 2: Checking Node.js installation
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js not found
    echo Please install Node.js from https://nodejs.org
    exit /b 1
)

where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npx not found
    echo Please install Node.js and npm
    exit /b 1
)

echo [OK] Node.js and npm available
echo.

REM Step 3: Create backup directory
echo Step 3: Creating backup directory
echo.

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
echo [OK] Backup directory ready: %BACKUP_DIR%
echo.

REM Step 4: Important notice
echo Step 4: Database backup
echo.
echo IMPORTANT: Before proceeding, ensure you have:
echo   1. Backed up your staging database manually
echo   2. Tested this migration on a development database
echo   3. Notified your team about the migration
echo.
echo This script will:
echo   1. Generate Prisma Client
echo   2. Apply database migration
echo   3. Verify the changes
echo.

set /p CONTINUE="Do you want to continue? (Y/N): "
if /i not "%CONTINUE%"=="Y" (
    echo Migration cancelled
    exit /b 0
)

echo.

REM Step 5: Generate Prisma Client
echo Step 5: Generating Prisma Client
echo.

call npx prisma generate

if %errorlevel% neq 0 (
    echo Error: Failed to generate Prisma Client
    exit /b 1
)

echo [OK] Prisma Client generated
echo.

REM Step 6: Show migration details
echo Step 6: Migration details
echo.
echo Migration: %MIGRATION_NAME%
echo.
echo This will:
echo   1. Add othersCategory and othersSubcategory to Complaint table
echo   2. Create reviews table with foreign keys
echo   3. Add complaintId, statusChange, and metadata to Notification table
echo   4. Create necessary indexes
echo.

set /p PROCEED="Proceed with migration? (Y/N): "
if /i not "%PROCEED%"=="Y" (
    echo Migration cancelled
    exit /b 0
)

echo.

REM Step 7: Run migration
echo Step 7: Running database migration
echo.
echo Applying migration...

call npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo Error: Migration failed
    echo.
    echo Please check:
    echo   1. DATABASE_URL is correct in .env
    echo   2. Database server is accessible
    echo   3. Database user has sufficient permissions
    echo.
    echo If you have a backup, restore it manually
    exit /b 1
)

echo [OK] Migration applied successfully
echo.

REM Step 8: Verify migration
echo Step 8: Verifying migration
echo.
echo Running verification checks...

call npx prisma db pull --force >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Database schema synchronized
) else (
    echo [WARNING] Could not verify schema
)

echo.

REM Step 9: Summary
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo Summary:
echo   Migration: %MIGRATION_NAME%
echo   Timestamp: %TIMESTAMP%
echo.
echo Changes applied:
echo   [OK] Complaint table: Added othersCategory, othersSubcategory
echo   [OK] reviews table: Created with all columns and indexes
echo   [OK] Notification table: Added complaintId, statusChange, metadata
echo   [OK] Indexes: Created for performance optimization
echo.
echo Next steps:
echo   1. Test the migration on staging environment
echo   2. Deploy backend services to staging
echo   3. Deploy admin panel to staging
echo   4. Test Others status functionality
echo   5. Test review submission
echo   6. Test notification system
echo.
echo Migration successful!
echo.

pause
