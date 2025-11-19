#!/bin/bash

# Staging Deployment Script for Admin Panel
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
STAGING_PATH="${STAGING_PATH:-/var/www/staging-admin}"
API_URL="${API_URL:-https://staging-api.cleancare.bd}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Staging Deployment - Admin Panel     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create .env file for staging
echo "Creating staging environment configuration..."
cat > .env << EOF
VITE_API_BASE_URL=$API_URL
VITE_APP_ENV=staging
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

# Step 2: Build admin panel
echo ""
echo -e "${YELLOW}Step 2: Building admin panel${NC}"

npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Verify build output
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist/ folder not found${NC}"
    exit 1
fi

echo "Build size:"
du -sh dist/

# Step 3: Create deployment package
echo ""
echo -e "${YELLOW}Step 3: Creating deployment package${NC}"

cd dist
tar -czf ../deploy-admin.tar.gz *
cd ..

echo -e "${GREEN}✓ Package created${NC}"

# Step 4: Upload to staging
echo ""
echo -e "${YELLOW}Step 4: Uploading to staging server${NC}"

# Create staging directory if it doesn't exist
ssh $STAGING_USER@$STAGING_SERVER "mkdir -p $STAGING_PATH"

# Upload package
scp deploy-admin.tar.gz $STAGING_USER@$STAGING_SERVER:$STAGING_PATH/

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Upload failed${NC}"
    rm deploy-admin.tar.gz
    exit 1
fi

echo -e "${GREEN}✓ Upload successful${NC}"

# Cleanup local package
rm deploy-admin.tar.gz

# Step 5: Deploy on staging server
echo ""
echo -e "${YELLOW}Step 5: Deploying on staging server${NC}"

ssh $STAGING_USER@$STAGING_SERVER << ENDSSH
    set -e
    
    cd $STAGING_PATH
    
    echo "Backing up current deployment..."
    if [ -d "backup" ]; then
        rm -rf backup
    fi
    
    # Backup current files (except the new package)
    mkdir -p backup
    find . -maxdepth 1 -type f -not -name "deploy-admin.tar.gz" -exec mv {} backup/ \;
    find . -maxdepth 1 -type d -not -name "." -not -name ".." -not -name "backup" -exec mv {} backup/ \;
    
    echo "Extracting new files..."
    tar -xzf deploy-admin.tar.gz
    rm deploy-admin.tar.gz
    
    echo "Setting permissions..."
    chmod -R 755 .
    
    echo "Deployment complete!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Deployment failed${NC}"
    echo "Rolling back..."
    ssh $STAGING_USER@$STAGING_SERVER "cd $STAGING_PATH && rm -rf * && mv backup/* . && rmdir backup"
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"

# Step 6: Verification
echo ""
echo -e "${YELLOW}Step 6: Verifying deployment${NC}"

# Test if admin panel is accessible
echo "Testing admin panel..."
ADMIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$STAGING_SERVER/)

if [ "$ADMIN_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Admin panel is accessible${NC}"
else
    echo -e "${RED}✗ Admin panel check failed (HTTP $ADMIN_CHECK)${NC}"
fi

# Step 7: Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Summary                   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Server: ${GREEN}$STAGING_SERVER${NC}"
echo -e "Path: ${GREEN}$STAGING_PATH${NC}"
echo -e "URL: ${GREEN}http://$STAGING_SERVER${NC}"
echo -e "API URL: ${GREEN}$API_URL${NC}"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Open browser and test admin panel"
echo "2. Test category filters"
echo "3. Test complaint display with categories"
echo "4. Test category analytics"
echo "5. Monitor browser console for errors"
echo ""
echo "Admin Panel URL:"
echo -e "${BLUE}http://$STAGING_SERVER${NC}"
echo ""
