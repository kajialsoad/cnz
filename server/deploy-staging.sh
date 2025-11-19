#!/bin/bash

# Staging Deployment Script for Categorized Complaint System
# This script automates the deployment process to staging environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_SERVER="${STAGING_SERVER:-staging.cleancare.bd}"
STAGING_USER="${STAGING_USER:-deploy}"
STAGING_PATH="${STAGING_PATH:-/var/www/clean-care-api}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/clean-care}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Staging Deployment - Backend API     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with staging configuration"
    exit 1
fi

# Check if build succeeds
echo "Building backend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Create backup
echo ""
echo -e "${YELLOW}Step 2: Creating database backup${NC}"

# Generate backup filename
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Backup will be created as: $BACKUP_FILE"
echo "Run this command on staging server:"
echo -e "${BLUE}mysqldump -u \$DB_USER -p \$DB_NAME > $BACKUP_DIR/$BACKUP_FILE${NC}"
echo ""
read -p "Press Enter after creating backup..."

# Step 3: Upload files
echo ""
echo -e "${YELLOW}Step 3: Uploading files to staging${NC}"

# Create deployment package
echo "Creating deployment package..."
tar -czf deploy-backend.tar.gz \
    dist/ \
    node_modules/ \
    prisma/ \
    package.json \
    package-lock.json \
    .env \
    migrate-null-categories.js \
    apply-category-migration.js

echo -e "${GREEN}✓ Package created${NC}"

# Upload to staging
echo "Uploading to staging server..."
scp deploy-backend.tar.gz $STAGING_USER@$STAGING_SERVER:$STAGING_PATH/

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Upload failed${NC}"
    rm deploy-backend.tar.gz
    exit 1
fi

echo -e "${GREEN}✓ Upload successful${NC}"

# Cleanup local package
rm deploy-backend.tar.gz

# Step 4: Deploy on staging server
echo ""
echo -e "${YELLOW}Step 4: Deploying on staging server${NC}"

ssh $STAGING_USER@$STAGING_SERVER << 'ENDSSH'
    set -e
    
    cd /var/www/clean-care-api
    
    echo "Extracting files..."
    tar -xzf deploy-backend.tar.gz
    rm deploy-backend.tar.gz
    
    echo "Installing dependencies..."
    npm install --production
    
    echo "Generating Prisma client..."
    npx prisma generate
    
    echo "Running database migration..."
    npx prisma migrate deploy
    
    echo "Handling existing complaints..."
    node migrate-null-categories.js --strategy=null
    
    echo "Restarting service..."
    pm2 restart clean-care-api || pm2 start dist/index.js --name clean-care-api
    
    echo "Deployment complete!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"

# Step 5: Verification
echo ""
echo -e "${YELLOW}Step 5: Verifying deployment${NC}"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$STAGING_SERVER:4000/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo -e "${RED}✗ Server health check failed (HTTP $HEALTH_CHECK)${NC}"
fi

# Test category endpoint
echo "Testing category endpoint..."
CATEGORY_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$STAGING_SERVER:4000/api/categories)

if [ "$CATEGORY_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Category endpoint working${NC}"
else
    echo -e "${RED}✗ Category endpoint failed (HTTP $CATEGORY_CHECK)${NC}"
fi

# Step 6: Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Summary                   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Server: ${GREEN}$STAGING_SERVER${NC}"
echo -e "Path: ${GREEN}$STAGING_PATH${NC}"
echo -e "Backup: ${GREEN}$BACKUP_FILE${NC}"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the API endpoints"
echo "2. Deploy admin panel"
echo "3. Run integration tests"
echo "4. Monitor logs for errors"
echo ""
echo "To view logs:"
echo -e "${BLUE}ssh $STAGING_USER@$STAGING_SERVER 'pm2 logs clean-care-api'${NC}"
echo ""
