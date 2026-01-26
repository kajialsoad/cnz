# Railway Staging Deployment Guide
## Admin Complaint Status Enhancement - Backend

**Feature**: Enhanced Complaint Status Management with Others Category and User Feedback  
**Date**: December 21, 2024  
**Status**: Ready for Deployment

---

## 📋 Overview

This guide covers deploying the Admin Complaint Status Enhancement backend to Railway staging environment. The deployment includes:

1. **New API Endpoints**
   - Others status management
   - Review submission and retrieval
   - Enhanced notifications
   - Others analytics

2. **Database Migration**
   - New `reviews` table
   - Enhanced `Complaint` table (othersCategory, othersSubcategory)
   - Enhanced `Notification` table (complaintId, statusChange, metadata)

3. **Service Updates**
   - NotificationService
   - ReviewService
   - AdminComplaintService enhancements

---

## ⚠️ Pre-Deployment Checklist

### Required Tools

- [ ] **Railway CLI** installed (`npm install -g @railway/cli`)
- [ ] **Node.js 18+** installed
- [ ] **Git** installed and configured
- [ ] **Railway account** with project access

### Required Preparations

- [ ] **Database backup** created
- [ ] **Environment variables** configured in Railway
- [ ] **Local build** tested successfully
- [ ] **Unit tests** passing
- [ ] **Integration tests** passing
- [ ] **Team notified** about deployment
- [ ] **Downtime window** scheduled (5-10 minutes)

### Environment Variables Required

```env
# Database (Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Cloudinary Configuration
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=djeguy5v5
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cleancare.com

# Server Configuration
NODE_ENV=production
PORT=3000
```

---

## 🚀 Deployment Methods

### Method 1: Automated Script (Linux/Mac) - RECOMMENDED

```bash
# Navigate to server directory
cd server

# Make script executable
chmod +x deploy-staging-railway.sh

# Run deployment
./deploy-staging-railway.sh
```

**What the script does:**
1. ✅ Verifies Railway CLI installation
2. ✅ Checks authentication
3. ✅ Validates project files
4. ✅ Installs dependencies
5. ✅ Generates Prisma Client
6. ✅ Builds TypeScript
7. ✅ Runs tests
8. ✅ Checks environment variables
9. ✅ Reminds about database backup
10. ✅ Deploys to Railway
11. ✅ Runs database migration
12. ✅ Verifies deployment
13. ✅ Tests endpoints
14. ✅ Provides summary and next steps

### Method 2: Automated Script (Windows)

```cmd
REM Navigate to server directory
cd server

REM Run deployment
deploy-staging-railway.cmd
```

### Method 3: Manual Deployment

If you prefer manual control:

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Build TypeScript
npm run build

# 5. Run tests
npm test

# 6. Deploy to Railway
railway up

# 7. Run database migration
railway run npx prisma migrate deploy

# 8. Verify deployment
railway status
```

---

## 🔧 Railway Configuration

### Build Configuration

Railway automatically detects the build configuration from `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Build Process

1. **Install Dependencies**: `npm install`
2. **Generate Prisma Client**: `npx prisma generate` (automatic)
3. **Compile TypeScript**: `npm run build`
4. **Start Server**: `npm start` (runs `node dist/index.js`)

### Environment Setup

Set environment variables in Railway dashboard:

1. Go to Railway dashboard
2. Select your project
3. Click on "Variables" tab
4. Add all required variables
5. Deploy will automatically restart with new variables

---

## 🗄️ Database Migration

### Migration Details

**Migration Name**: `20241220_add_others_and_reviews`

**Changes**:
- New `reviews` table
- `Complaint.othersCategory` (VARCHAR 191, NULL)
- `Complaint.othersSubcategory` (VARCHAR 191, NULL)
- `Notification.complaintId` (INT, NULL)
- `Notification.statusChange` (VARCHAR 191, NULL)
- `Notification.metadata` (TEXT, NULL)
- Multiple indexes for performance
- Foreign key constraints

### Running Migration

The deployment script automatically runs the migration:

```bash
railway run npx prisma migrate deploy
```

### Manual Migration (if needed)

```bash
# Connect to Railway shell
railway shell

# Run migration
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

---

## 🔍 Verification Steps

### 1. Check Deployment Status

```bash
# Check deployment status
railway status

# View recent logs
railway logs --tail 100

# Follow logs in real-time
railway logs --follow
```

### 2. Test Health Endpoint

```bash
# Get your Railway URL
RAILWAY_URL=$(railway status | grep "URL" | awk '{print $2}')

# Test health endpoint
curl ${RAILWAY_URL}/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-21T..."}
```

### 3. Test API Endpoints

```bash
# Test public endpoint
curl ${RAILWAY_URL}/api/public/city-corporations

# Test Others marking (requires auth token)
curl -X PATCH ${RAILWAY_URL}/api/admin/complaints/1/mark-others \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"othersCategory":"CORPORATION_INTERNAL","othersSubcategory":"Engineering"}'

# Test review submission (requires auth token)
curl -X POST ${RAILWAY_URL}/api/complaints/1/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Great service!"}'

# Test notifications (requires auth token)
curl ${RAILWAY_URL}/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Verify Database Migration

```bash
# Connect to Railway shell
railway shell

# Run verification queries
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  // Check reviews table
  const reviews = await prisma.\$queryRaw\`SHOW TABLES LIKE 'reviews'\`;
  console.log('reviews table:', reviews.length > 0 ? 'EXISTS' : 'MISSING');
  
  // Check Complaint columns
  const complaintCols = await prisma.\$queryRaw\`
    SHOW COLUMNS FROM Complaint 
    WHERE Field IN ('othersCategory', 'othersSubcategory')
  \`;
  console.log('Complaint columns:', complaintCols.length === 2 ? 'OK' : 'MISSING');
  
  // Check Notification columns
  const notificationCols = await prisma.\$queryRaw\`
    SHOW COLUMNS FROM Notification 
    WHERE Field IN ('complaintId', 'statusChange', 'metadata')
  \`;
  console.log('Notification columns:', notificationCols.length === 3 ? 'OK' : 'MISSING');
  
  await prisma.\$disconnect();
}

verify();
"
```

---

## 🔄 Rollback Procedure

If issues occur during deployment:

### Automatic Rollback

Railway keeps previous deployments. To rollback:

1. Go to Railway dashboard
2. Click on "Deployments" tab
3. Find the last successful deployment
4. Click "Redeploy"

### Manual Rollback

```bash
# 1. Restore database from backup
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < backup.sql

# 2. Revert to previous git commit
git revert HEAD
git push

# 3. Redeploy
railway up

# 4. Regenerate Prisma Client
railway run npx prisma generate
```

---

## 📊 Performance Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Health endpoint: < 100ms
   - GET /api/notifications: < 500ms
   - POST /api/complaints/:id/review: < 1s
   - PATCH /api/admin/complaints/:id/mark-others: < 500ms
   - GET /api/admin/complaints/analytics/others: < 3s

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Slow query log

3. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Database connection errors

### Monitoring Commands

```bash
# View real-time logs
railway logs --follow

# Check service metrics
railway status

# View environment variables
railway variables

# Open Railway dashboard
railway open
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails

**Symptoms**: Deployment fails during build phase

**Solutions**:
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify dependencies
npm install
```

#### 2. Migration Fails

**Symptoms**: Database migration errors

**Solutions**:
```bash
# Check database connection
railway run npx prisma db pull

# Verify migration file exists
ls prisma/migrations/20241220_add_others_and_reviews/

# Run migration manually
railway run npx prisma migrate deploy --force
```

#### 3. Environment Variables Missing

**Symptoms**: Application crashes on startup

**Solutions**:
```bash
# Check current variables
railway variables

# Add missing variables in Railway dashboard
# Settings > Variables

# Redeploy
railway up
```

#### 4. Database Connection Error

**Symptoms**: "Can't reach database server" error

**Solutions**:
```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Check MySQL service is running
railway status

# Test connection
railway run npx prisma db pull
```

#### 5. Cloudinary Upload Fails

**Symptoms**: Image uploads return errors

**Solutions**:
```bash
# Verify Cloudinary variables
railway variables | grep CLOUDINARY

# Check USE_CLOUDINARY is set to true
railway variables | grep USE_CLOUDINARY

# Test Cloudinary connection
railway run node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.api.ping().then(console.log).catch(console.error);
"
```

---

## 📈 Post-Deployment Tasks

### 1. Update Frontend Applications

#### Admin Panel

Update API base URL in `clean-care-admin/src/config/apiConfig.ts`:

```typescript
export const API_BASE_URL = 'https://your-railway-app.railway.app';
```

#### Mobile App

Update API base URL in `lib/config/api_config.dart`:

```dart
static const String baseUrl = 'https://your-railway-app.railway.app';
```

### 2. Run Integration Tests

```bash
# Backend integration tests
cd server
npm run test:integration

# Admin panel E2E tests
cd clean-care-admin
npm run test:e2e

# Mobile app integration tests
cd ..
flutter test integration_test/
```

### 3. Smoke Testing

Test critical user flows:

1. **Admin Flow**:
   - Login to admin panel
   - View complaint details
   - Mark complaint as Others
   - Update status with images/notes
   - View Others analytics
   - View user satisfaction metrics

2. **User Flow**:
   - Login to mobile app
   - Submit complaint
   - Receive notification
   - View resolution details
   - Submit review

### 4. Monitor Logs

```bash
# Monitor for errors
railway logs --follow | grep -i error

# Monitor for warnings
railway logs --follow | grep -i warn

# Monitor API requests
railway logs --follow | grep "HTTP"
```

---

## 📚 Related Documentation

- [Railway Deployment Complete Guide](./RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md)
- [Railway Quick Deploy](./RAILWAY_QUICK_DEPLOY.md)
- [Staging Migration Guide](./STAGING_MIGRATION_GUIDE.md)
- [Design Document](../.kiro/specs/admin-complaint-status-enhancement/design.md)
- [Requirements Document](../.kiro/specs/admin-complaint-status-enhancement/requirements.md)

---

## ✅ Success Criteria

Deployment is successful when:

- [x] Railway deployment completes without errors
- [x] Database migration runs successfully
- [x] Health endpoint returns 200 OK
- [x] API endpoints respond correctly
- [x] No errors in application logs
- [x] Admin panel connects successfully
- [x] Mobile app connects successfully
- [x] All integration tests pass
- [x] Performance metrics within acceptable range

---

## 🎯 Next Steps

After successful staging deployment:

1. **Deploy Admin Panel**
   - Build admin panel with staging API URL
   - Deploy to staging environment (Vercel/Netlify)
   - Test all new UI components

2. **Deploy Mobile App**
   - Build staging version of mobile app
   - Distribute via TestFlight (iOS) / Internal Testing (Android)
   - Collect feedback from internal testers

3. **User Acceptance Testing**
   - Conduct UAT with stakeholders
   - Document any issues or feedback
   - Make necessary adjustments

4. **Plan Production Deployment**
   - Schedule production deployment window
   - Prepare production database backup
   - Notify all stakeholders
   - Create production deployment checklist

---

## 📞 Support & Resources

### Railway Resources
- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Prisma on Railway](https://docs.railway.app/guides/prisma)

### Project Resources
- [Cloudinary Setup](../.kiro/specs/cloud-image-storage/CLOUDINARY_SETUP_COMPLETE.md)
- [API Documentation](./docs/)
- [Testing Guide](./tests/README_INTEGRATION_TESTS.md)

### Contact
- **Development Team**: [Contact Info]
- **DevOps**: [Contact Info]
- **Database Admin**: [Contact Info]

---

## 📝 Deployment Log Template

```
========================================
Railway Staging Deployment Log
========================================

Date: _______________
Time: _______________
Performed By: _______________
Feature: Admin Complaint Status Enhancement

Pre-Deployment:
- Railway CLI version: _______________
- Node.js version: _______________
- Database backup created: [ ] Yes [ ] No
- Backup location: _______________
- Environment variables verified: [ ] Yes [ ] No
- Local build tested: [ ] Yes [ ] No
- Tests passed: [ ] Yes [ ] No

Deployment:
- Deployment start time: _______________
- Deployment end time: _______________
- Duration: _______________
- Railway URL: _______________
- Deployment ID: _______________

Migration:
- Migration start time: _______________
- Migration end time: _______________
- Migration status: [ ] Success [ ] Failed
- Errors encountered: [ ] Yes [ ] No
- Error details: _______________

Verification:
- Health check: [ ] Pass [ ] Fail
- API endpoints: [ ] Pass [ ] Fail
- Database schema: [ ] Pass [ ] Fail
- Integration tests: [ ] Pass [ ] Fail

Post-Deployment:
- Admin panel updated: [ ] Yes [ ] No
- Mobile app updated: [ ] Yes [ ] No
- Monitoring enabled: [ ] Yes [ ] No
- Team notified: [ ] Yes [ ] No

Status: [ ] Success [ ] Failed [ ] Rolled Back

Notes:
_______________________________________________
_______________________________________________
_______________________________________________

Signed: _______________
```

---

**Document Version**: 1.0  
**Last Updated**: December 21, 2024  
**Status**: Ready for Deployment  
**Deployment Date**: TBD

