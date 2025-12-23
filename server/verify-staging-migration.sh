#!/bin/bash

# =============================================================================
# Staging Migration Verification Script
# Feature: Admin Complaint Status Enhancement
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Migration Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load environment
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

source .env

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set${NC}"
    exit 1
fi

# Extract database credentials
DB_URL_REGEX="mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Verification checks
PASS=0
FAIL=0

echo -e "${YELLOW}Running verification checks...${NC}"
echo ""

# Check 1: Complaint.othersCategory
echo -n "1. Checking Complaint.othersCategory... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Complaint LIKE 'othersCategory';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 2: Complaint.othersSubcategory
echo -n "2. Checking Complaint.othersSubcategory... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Complaint LIKE 'othersSubcategory';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 3: reviews table
echo -n "3. Checking reviews table... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES LIKE 'reviews';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 4: reviews.complaintId
echo -n "4. Checking reviews.complaintId... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM reviews LIKE 'complaintId';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 5: reviews.rating
echo -n "5. Checking reviews.rating... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM reviews LIKE 'rating';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 6: Notification.complaintId
echo -n "6. Checking Notification.complaintId... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Notification LIKE 'complaintId';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 7: Notification.statusChange
echo -n "7. Checking Notification.statusChange... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Notification LIKE 'statusChange';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 8: Notification.metadata
echo -n "8. Checking Notification.metadata... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM Notification LIKE 'metadata';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 9: Complaint indexes
echo -n "9. Checking Complaint indexes... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEXES FROM Complaint WHERE Key_name LIKE '%others%';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
fi

# Check 10: reviews indexes
echo -n "10. Checking reviews indexes... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEXES FROM reviews;" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
fi

# Check 11: Foreign keys
echo -n "11. Checking foreign keys... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'reviews' AND CONSTRAINT_NAME LIKE '%fkey';" 2>/dev/null | tail -n 1)
if [ "$RESULT" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Check 12: Unique constraint
echo -n "12. Checking unique constraint... "
RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEXES FROM reviews WHERE Key_name = 'reviews_complaintId_userId_key';" 2>/dev/null | wc -l)
if [ "$RESULT" -gt 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Verification Results${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}Migration is successful.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed.${NC}"
    echo -e "${YELLOW}Please review the migration.${NC}"
    exit 1
fi
