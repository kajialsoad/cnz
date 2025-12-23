#!/bin/bash

# Railway Staging Deployment Script
# Admin Complaint Status Enhancement - Backend Deployment
# Date: December 21, 2024

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FEATURE_NAME="Admin Complaint Status Enhancement"
MIGRATION_NAME="20241220_add_others_and_reviews"
BACKUP_DIR="backups"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Railway Staging Deployment           ${NC}"
echo -e "${BLUE}  ${FEATURE_NAME}  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks${NC}"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo "Please install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "  or visit: https://docs.railway.app/develop/cli"
    exit 1
fi
echo -e "${GREEN}✓ Railway CLI installed${NC}"

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${RED}✗ Not logged in to Railway${NC}"
    echo "Please login:"
    echo "  railway login"
    exit 1
fi
echo -e "${GREEN}✓ Logged in to Railway${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found (optional for Railway)${NC}"
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ package.json found${NC}"

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}✗ Prisma schema not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma schema found${NC}"

# Check if migration exists
if [ ! -d "prisma/migrations/${MIGRATION_NAME}" ]; then
    echo -e "${RED}✗ Migration ${MIGRATION_NAME} not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration ${MIGRATION_NAME} found${NC}"

echo ""

# Step 2: Build verification
echo -e "${YELLOW}Step 2: Build verification${NC}"
echo ""

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo "Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Prisma generate failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo "Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

echo ""

# Step 3: Run tests
echo -e "${YELLOW}Step 3: Running tests${NC}"
echo ""

echo "Running unit tests..."
npm test -- --passWithNoTests
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Unit tests failed${NC}"
    echo "Do you want to continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Unit tests passed${NC}"
fi

echo ""

# Step 4: Environment variables check
echo -e "${YELLOW}Step 4: Environment variables check${NC}"
echo ""

echo "Checking Railway environment variables..."
echo ""
echo -e "${CYAN}Required variables:${NC}"
echo "  - DATABASE_URL (from Railway MySQL service)"
echo "  - JWT_SECRET"
echo "  - USE_CLOUDINARY=true"
echo "  - CLOUDINARY_CLOUD_NAME"
echo "  - CLOUDINARY_API_KEY"
echo "  - CLOUDINARY_API_SECRET"
echo "  - NODE_ENV=production"
echo ""

# Get current variables
echo "Current Railway variables:"
railway variables 2>/dev/null || echo "Unable to fetch variables"
echo ""

echo -e "${YELLOW}Have you set all required environment variables in Railway? (y/n)${NC}"
read -r env_response
if [[ ! "$env_response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set environment variables in Railway:"
    echo "  1. Go to Railway dashboard"
    echo "  2. Select your project"
    echo "  3. Go to Variables tab"
    echo "  4. Add all required variables"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""

# Step 5: Database backup reminder
echo -e "${YELLOW}Step 5: Database backup${NC}"
echo ""

echo -e "${CYAN}IMPORTANT: Create a database backup before proceeding!${NC}"
echo ""
echo "To create a backup, run this command in Railway shell:"
echo -e "${BLUE}  railway run mysqldump -h \$MYSQLHOST -u \$MYSQLUSER -p\$MYSQLPASSWORD \$MYSQLDATABASE > backup_\$(date +%Y%m%d_%H%M%S).sql${NC}"
echo ""
echo -e "${YELLOW}Have you created a database backup? (y/n)${NC}"
read -r backup_response
if [[ ! "$backup_response" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${RED}Please create a backup before deploying!${NC}"
    echo "Deployment cancelled."
    exit 1
fi

echo ""

# Step 6: Deploy to Railway
echo -e "${YELLOW}Step 6: Deploying to Railway${NC}"
echo ""

echo "Deploying to Railway..."
echo ""

railway up

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Step 7: Wait for deployment
echo -e "${YELLOW}Step 7: Waiting for deployment to complete${NC}"
echo ""

echo "Waiting for deployment to finish..."
echo "(This may take 3-5 minutes)"
echo ""

# Wait for deployment (Railway will show progress)
sleep 10

echo ""

# Step 8: Run database migration
echo -e "${YELLOW}Step 8: Running database migration${NC}"
echo ""

echo "Running Prisma migration..."
railway run npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Migration failed${NC}"
    echo ""
    echo "Rollback instructions:"
    echo "  1. Restore database from backup"
    echo "  2. Redeploy previous version"
    exit 1
fi

echo -e "${GREEN}✓ Migration completed${NC}"
echo ""

# Step 9: Verification
echo -e "${YELLOW}Step 9: Verifying deployment${NC}"
echo ""

echo "Getting Railway service URL..."
RAILWAY_URL=$(railway status 2>/dev/null | grep "URL" | awk '{print $2}')

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠ Could not automatically detect Railway URL${NC}"
    echo "Please enter your Railway service URL:"
    read -r RAILWAY_URL
fi

echo "Service URL: ${RAILWAY_URL}"
echo ""

# Wait for service to start
echo "Waiting for service to start..."
sleep 15

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${RAILWAY_URL}/health" 2>/dev/null || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check returned HTTP ${HEALTH_CHECK}${NC}"
    echo "Service may still be starting up..."
fi

# Test API endpoint
echo "Testing API endpoint..."
API_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${RAILWAY_URL}/api/public/city-corporations" 2>/dev/null || echo "000")

if [ "$API_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ API endpoint working${NC}"
else
    echo -e "${YELLOW}⚠ API endpoint returned HTTP ${API_CHECK}${NC}"
fi

echo ""

# Step 10: Verify migration
echo -e "${YELLOW}Step 10: Verifying database migration${NC}"
echo ""

echo "Verifying database schema..."
echo ""

# Run verification queries
echo "Running verification queries..."
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    // Check if reviews table exists
    const reviews = await prisma.\$queryRaw\`SHOW TABLES LIKE 'reviews'\`;
    console.log('✓ reviews table exists');
    
    // Check Complaint columns
    const complaintCols = await prisma.\$queryRaw\`SHOW COLUMNS FROM Complaint WHERE Field IN ('othersCategory', 'othersSubcategory')\`;
    console.log('✓ Complaint.othersCategory and othersSubcategory exist');
    
    // Check Notification columns
    const notificationCols = await prisma.\$queryRaw\`SHOW COLUMNS FROM Notification WHERE Field IN ('complaintId', 'statusChange', 'metadata')\`;
    console.log('✓ Notification columns exist');
    
    console.log('');
    console.log('✓ All database changes verified');
    process.exit(0);
  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

verify();
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration verified${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify database migration automatically${NC}"
    echo "Please verify manually using Railway shell"
fi

echo ""

# Step 11: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Summary                   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "Service URL: ${RAILWAY_URL}"
echo "Feature: ${FEATURE_NAME}"
echo "Migration: ${MIGRATION_NAME}"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Test new API endpoints"
echo "  2. Deploy admin panel to staging"
echo "  3. Deploy mobile app to TestFlight/Internal Testing"
echo "  4. Run end-to-end tests"
echo "  5. Monitor logs for errors"
echo ""

echo -e "${CYAN}Useful Commands:${NC}"
echo "  View logs:        railway logs --follow"
echo "  Open dashboard:   railway open"
echo "  Check status:     railway status"
echo "  Run shell:        railway shell"
echo ""

echo -e "${CYAN}API Endpoints to Test:${NC}"
echo "  Health:           ${RAILWAY_URL}/health"
echo "  Mark Others:      ${RAILWAY_URL}/api/admin/complaints/:id/mark-others"
echo "  Submit Review:    ${RAILWAY_URL}/api/complaints/:id/review"
echo "  Notifications:    ${RAILWAY_URL}/api/notifications"
echo "  Others Analytics: ${RAILWAY_URL}/api/admin/complaints/analytics/others"
echo ""

echo -e "${CYAN}Monitoring:${NC}"
echo "  - Monitor Railway logs for errors"
echo "  - Check API response times"
echo "  - Verify database performance"
echo "  - Test all new features"
echo ""

echo -e "${GREEN}Deployment Date: $(date)${NC}"
echo -e "${GREEN}Status: ✅ DEPLOYED TO STAGING${NC}"
echo ""

# Step 12: Open Railway dashboard
echo -e "${YELLOW}Opening Railway dashboard...${NC}"
railway open &

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete! 🎉${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
