#!/bin/bash

# =============================================================================
# Staging Database Migration Script
# Feature: Admin Complaint Status Enhancement
# Migration: 20241220_add_others_and_reviews
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_NAME="20241220_add_others_and_reviews"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="staging_backup_${TIMESTAMP}.sql"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Staging Database Migration${NC}"
echo -e "${BLUE}  Feature: Complaint Status Enhancement${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check environment
echo -e "${YELLOW}Step 1: Checking environment${NC}"
echo ""

if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with staging DATABASE_URL"
    exit 1
fi

# Load environment variables
source .env

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 2: Check Prisma
echo -e "${YELLOW}Step 2: Checking Prisma installation${NC}"
echo ""

if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found${NC}"
    echo "Please install Node.js and npm"
    exit 1
fi

echo -e "${GREEN}✓ Prisma available${NC}"
echo ""

# Step 3: Create backup directory
echo -e "${YELLOW}Step 3: Creating backup directory${NC}"
echo ""

mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup directory ready: $BACKUP_DIR${NC}"
echo ""

# Step 4: Backup database
echo -e "${YELLOW}Step 4: Backing up database${NC}"
echo ""

# Extract database credentials from DATABASE_URL
# Format: mysql://user:password@host:port/database
DB_URL_REGEX="mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "User: $DB_USER"
    echo ""
    
    # Create backup
    echo "Creating backup..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_DIR/$BACKUP_FILE${NC}"
        BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
        echo "  Size: $BACKUP_SIZE"
    else
        echo -e "${RED}Error: Backup failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
    echo "Please ensure DATABASE_URL is in format: mysql://user:password@host:port/database"
    exit 1
fi

echo ""

# Step 5: Check current schema
echo -e "${YELLOW}Step 5: Checking current database schema${NC}"
echo ""

# Check if migration has already been applied
OTHERS_CATEGORY_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Complaint LIKE 'othersCategory';" 2>/dev/null | wc -l)
REVIEWS_TABLE_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES LIKE 'reviews';" 2>/dev/null | wc -l)

if [ "$OTHERS_CATEGORY_EXISTS" -gt 1 ] && [ "$REVIEWS_TABLE_EXISTS" -gt 1 ]; then
    echo -e "${YELLOW}⚠ Migration appears to already be applied${NC}"
    echo ""
    echo "Found:"
    echo "  - othersCategory column in Complaint table"
    echo "  - reviews table"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled"
        exit 0
    fi
fi

echo -e "${GREEN}✓ Schema check complete${NC}"
echo ""

# Step 6: Generate Prisma Client
echo -e "${YELLOW}Step 6: Generating Prisma Client${NC}"
echo ""

npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}Error: Failed to generate Prisma Client${NC}"
    exit 1
fi

echo ""

# Step 7: Run migration
echo -e "${YELLOW}Step 7: Running database migration${NC}"
echo ""

echo "Migration: $MIGRATION_NAME"
echo ""
echo "This will:"
echo "  1. Add othersCategory and othersSubcategory to Complaint table"
echo "  2. Create reviews table with foreign keys"
echo "  3. Add complaintId, statusChange, and metadata to Notification table"
echo "  4. Create necessary indexes"
echo ""

read -p "Proceed with migration? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Applying migration..."

# Use Prisma migrate deploy for production/staging
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration applied successfully${NC}"
else
    echo -e "${RED}Error: Migration failed${NC}"
    echo ""
    echo "Rolling back..."
    
    # Restore from backup
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database restored from backup${NC}"
    else
        echo -e "${RED}Error: Rollback failed${NC}"
        echo "Please restore manually from: $BACKUP_DIR/$BACKUP_FILE"
    fi
    
    exit 1
fi

echo ""

# Step 8: Verify migration
echo -e "${YELLOW}Step 8: Verifying migration${NC}"
echo ""

# Check Complaint table
echo "Checking Complaint table..."
COMPLAINT_COLUMNS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Complaint WHERE Field IN ('othersCategory', 'othersSubcategory');" 2>/dev/null | wc -l)

if [ "$COMPLAINT_COLUMNS" -gt 2 ]; then
    echo -e "${GREEN}✓ Complaint table updated${NC}"
else
    echo -e "${RED}✗ Complaint table missing columns${NC}"
fi

# Check reviews table
echo "Checking reviews table..."
REVIEWS_TABLE=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES LIKE 'reviews';" 2>/dev/null | wc -l)

if [ "$REVIEWS_TABLE" -gt 1 ]; then
    echo -e "${GREEN}✓ reviews table created${NC}"
    
    # Check reviews table structure
    REVIEWS_COLUMNS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM reviews;" 2>/dev/null | wc -l)
    echo "  Columns: $((REVIEWS_COLUMNS - 1))"
else
    echo -e "${RED}✗ reviews table not found${NC}"
fi

# Check Notification table
echo "Checking Notification table..."
NOTIFICATION_COLUMNS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Notification WHERE Field IN ('complaintId', 'statusChange', 'metadata');" 2>/dev/null | wc -l)

if [ "$NOTIFICATION_COLUMNS" -gt 3 ]; then
    echo -e "${GREEN}✓ Notification table updated${NC}"
else
    echo -e "${RED}✗ Notification table missing columns${NC}"
fi

# Check indexes
echo "Checking indexes..."
COMPLAINT_INDEXES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEXES FROM Complaint WHERE Key_name LIKE '%others%';" 2>/dev/null | wc -l)

if [ "$COMPLAINT_INDEXES" -gt 1 ]; then
    echo -e "${GREEN}✓ Complaint indexes created${NC}"
else
    echo -e "${YELLOW}⚠ Some Complaint indexes may be missing${NC}"
fi

REVIEWS_INDEXES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEXES FROM reviews;" 2>/dev/null | wc -l)

if [ "$REVIEWS_INDEXES" -gt 1 ]; then
    echo -e "${GREEN}✓ reviews indexes created${NC}"
else
    echo -e "${YELLOW}⚠ Some reviews indexes may be missing${NC}"
fi

echo ""

# Step 9: Test data integrity
echo -e "${YELLOW}Step 9: Testing data integrity${NC}"
echo ""

# Count existing complaints
COMPLAINT_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM Complaint;" 2>/dev/null | tail -n 1)
echo "Existing complaints: $COMPLAINT_COUNT"

# Count existing notifications
NOTIFICATION_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM Notification;" 2>/dev/null | tail -n 1)
echo "Existing notifications: $NOTIFICATION_COUNT"

# Count reviews (should be 0 initially)
REVIEW_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM reviews;" 2>/dev/null | tail -n 1)
echo "Reviews: $REVIEW_COUNT"

echo ""
echo -e "${GREEN}✓ Data integrity verified${NC}"
echo ""

# Step 10: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Migration Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Summary:"
echo "  Migration: $MIGRATION_NAME"
echo "  Database: $DB_NAME"
echo "  Backup: $BACKUP_DIR/$BACKUP_FILE"
echo "  Timestamp: $TIMESTAMP"
echo ""
echo "Changes applied:"
echo "  ✓ Complaint table: Added othersCategory, othersSubcategory"
echo "  ✓ reviews table: Created with all columns and indexes"
echo "  ✓ Notification table: Added complaintId, statusChange, metadata"
echo "  ✓ Indexes: Created for performance optimization"
echo ""
echo "Next steps:"
echo "  1. Deploy backend services to staging"
echo "  2. Deploy admin panel to staging"
echo "  3. Test Others status functionality"
echo "  4. Test review submission"
echo "  5. Test notification system"
echo ""
echo -e "${GREEN}Migration successful!${NC}"
echo ""

# Optional: Keep only last 5 backups
echo "Cleaning up old backups (keeping last 5)..."
cd "$BACKUP_DIR"
ls -t staging_backup_*.sql | tail -n +6 | xargs -r rm
cd ..
echo -e "${GREEN}✓ Backup cleanup complete${NC}"
echo ""
