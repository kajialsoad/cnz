# Staging Deployment Guide - Categorized Complaint System

## Overview

This guide provides step-by-step instructions for deploying the categorized complaint system to the staging environment. The deployment includes:

1. Database migration (add category fields)
2. Backend API updates
3. Admin panel updates
4. Testing and verification

## Prerequisites

Before starting the deployment, ensure you have:

- [ ] Access to staging server (SSH or cPanel)
- [ ] Staging database credentials
- [ ] Staging environment variables configured
- [ ] Backup of staging database
- [ ] Node.js and npm installed on staging server
- [ ] Git access to pull latest code

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGING ENVIRONMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Database   │◄─────┤   Backend    │◄─────┤  Admin   │ │
│  │   (MySQL)    │      │   (Node.js)  │      │  Panel   │ │
│  │              │      │              │      │ (React)  │ │
│  │ + category   │      │ + Category   │      │ + Filter │ │
│  │ + subcategory│      │   Service    │      │ + Badge  │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Pre-Deployment Checklist

### 1.1 Verify Local Build

```bash
# Backend
cd server
npm run build
# Should complete without errors

# Admin Panel
cd ../clean-care-admin
npm run build
# Should create dist/ folder
```

### 1.2 Create Database Backup

**CRITICAL: Always backup before migration!**

```bash
# SSH into staging server
ssh user@staging-server

# Create backup
mysqldump -u staging_user -p staging_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

### 1.3 Verify Staging Environment Variables

Create or update `.env` file on staging server:

```bash
# server/.env (staging)
NODE_ENV=staging
PORT=4000

# Database
DATABASE_URL="mysql://staging_user:password@localhost:3306/staging_db"

# JWT
JWT_ACCESS_SECRET=staging-jwt-secret-change-this
JWT_REFRESH_SECRET=staging-refresh-secret-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://staging-admin.cleancare.bd

# Email (optional for staging)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=staging@cleancare.bd
SMTP_PASS=app-password-here

# App URLs
APP_URL=https://staging-api.cleancare.bd
FRONTEND_URL=https://staging-admin.cleancare.bd
```

## Step 2: Database Migration

### 2.1 Upload Migration Files

Upload these files to staging server:

```
server/
├── prisma/
│   ├── schema.prisma (updated with category fields)
│   └── migrations/
│       └── 20241119_make_category_optional/
│           └── migration.sql
├── migrate-null-categories.js
└── apply-category-migration.js
```

### 2.2 Run Database Migration

```bash
# SSH into staging server
cd /path/to/server

# Install dependencies (if not already installed)
npm install

# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

**Expected Output:**
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Datasource "db": MySQL database "staging_db" at "localhost:3306"
✓ 1 migration found in prisma/migrations
✓ Applying migration `20241119_make_category_optional`
✓ The migration has been applied successfully.
```

### 2.3 Handle Existing Complaints

**Strategy: Keep as NULL (Recommended for staging)**

```bash
# Run migration script
node migrate-null-categories.js --strategy=null

# Verify
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.complaint.count({ where: { category: null } })
  .then(count => console.log('Uncategorized complaints:', count))
  .finally(() => prisma.\$disconnect());
"
```

## Step 3: Backend Deployment

### 3.1 Upload Backend Code

```bash
# Option 1: Using Git (recommended)
ssh user@staging-server
cd /path/to/server
git pull origin main
npm install
npm run build

# Option 2: Using FTP/SCP
# Upload entire server/ folder to staging
scp -r server/ user@staging-server:/path/to/server/
```

### 3.2 Install Dependencies

```bash
cd /path/to/server
npm install --production
```

### 3.3 Build Backend

```bash
npm run build
```

### 3.4 Restart Backend Service

```bash
# Option 1: Using PM2 (recommended)
pm2 restart clean-care-api

# Option 2: Using systemd
sudo systemctl restart clean-care-api

# Option 3: Manual restart
pkill -f "node dist/index.js"
node dist/index.js &
```

### 3.5 Verify Backend is Running

```bash
# Check if server is running
curl http://localhost:4000/health

# Check category endpoints
curl http://localhost:4000/api/categories

# Expected response:
# [
#   {
#     "id": "home",
#     "banglaName": "বাসা/বাড়ি",
#     "englishName": "Home/House",
#     "color": "#3FA564",
#     ...
#   }
# ]
```

## Step 4: Admin Panel Deployment

### 4.1 Update Admin Panel Environment

Create `.env` file in admin panel:

```bash
# clean-care-admin/.env (staging)
VITE_API_BASE_URL=https://staging-api.cleancare.bd
VITE_APP_ENV=staging
```

### 4.2 Build Admin Panel

```bash
cd clean-care-admin

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -lh dist/
```

### 4.3 Upload Admin Panel

```bash
# Option 1: Using SCP
scp -r dist/* user@staging-server:/var/www/staging-admin/

# Option 2: Using rsync
rsync -avz --delete dist/ user@staging-server:/var/www/staging-admin/

# Option 3: Using FTP
# Upload contents of dist/ folder to staging web root
```

### 4.4 Configure Web Server

**For Nginx:**

```nginx
# /etc/nginx/sites-available/staging-admin
server {
    listen 80;
    server_name staging-admin.cleancare.bd;
    
    root /var/www/staging-admin;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**For Apache:**

```apache
# /etc/apache2/sites-available/staging-admin.conf
<VirtualHost *:80>
    ServerName staging-admin.cleancare.bd
    DocumentRoot /var/www/staging-admin
    
    <Directory /var/www/staging-admin>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy API requests
    ProxyPass /api http://localhost:4000/api
    ProxyPassReverse /api http://localhost:4000/api
</VirtualHost>
```

### 4.5 Restart Web Server

```bash
# Nginx
sudo nginx -t
sudo systemctl restart nginx

# Apache
sudo apachectl configtest
sudo systemctl restart apache2
```

## Step 5: Testing on Staging

### 5.1 Backend API Tests

```bash
# Test category endpoints
curl https://staging-api.cleancare.bd/api/categories

# Test complaint creation with category
curl -X POST https://staging-api.cleancare.bd/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Complaint",
    "description": "Testing category system",
    "category": "home",
    "subcategory": "not_collecting_waste",
    "location": "Test Location"
  }'

# Test complaint filtering
curl "https://staging-api.cleancare.bd/api/complaints?category=home"

# Test category analytics
curl https://staging-api.cleancare.bd/api/admin/analytics/categories \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 5.2 Admin Panel Tests

Open browser and test:

1. **Login**
   - Navigate to `https://staging-admin.cleancare.bd`
   - Login with admin credentials
   - Verify successful login

2. **Category Filters**
   - Go to All Complaints page
   - Test category dropdown (should show 8 categories)
   - Select a category
   - Verify complaints are filtered
   - Test subcategory dropdown
   - Verify subcategory filtering works

3. **Complaint Display**
   - Verify category badges appear on complaint cards
   - Check badge colors match category colors
   - Open complaint details modal
   - Verify category information is displayed

4. **Category Analytics**
   - Go to Analytics/Dashboard page
   - Verify category chart displays
   - Check category statistics table
   - Verify counts are accurate

5. **Uncategorized Complaints**
   - Select "Uncategorized" filter
   - Verify old complaints without categories appear
   - Check "Not Categorized" badge displays

### 5.3 Mobile App Integration Test

If mobile app is available on staging:

1. **Create New Complaint**
   - Open mobile app
   - Select a category
   - Select a subcategory
   - Fill in complaint details
   - Submit complaint

2. **Verify in Admin Panel**
   - Refresh admin panel
   - Find the new complaint
   - Verify category and subcategory are correct
   - Check badge color matches

### 5.4 Error Handling Tests

```bash
# Test invalid category
curl -X POST https://staging-api.cleancare.bd/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test",
    "category": "invalid_category",
    "subcategory": "test"
  }'
# Expected: 400 error with validation message

# Test invalid subcategory
curl -X POST https://staging-api.cleancare.bd/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test",
    "category": "home",
    "subcategory": "invalid_subcategory"
  }'
# Expected: 400 error with validation message
```

## Step 6: Verification Checklist

### Backend Verification

- [ ] Server is running without errors
- [ ] Database migration completed successfully
- [ ] Category endpoints return correct data
- [ ] Complaint creation with categories works
- [ ] Complaint filtering by category works
- [ ] Category analytics endpoints work
- [ ] Error handling works correctly
- [ ] Logs show no errors

### Admin Panel Verification

- [ ] Admin panel loads successfully
- [ ] Login works
- [ ] Category filters display correctly
- [ ] Category badges appear on complaints
- [ ] Complaint details show category info
- [ ] Category analytics dashboard works
- [ ] Uncategorized filter works
- [ ] No console errors in browser

### Data Verification

- [ ] Existing complaints preserved
- [ ] New complaints have categories
- [ ] Category counts are accurate
- [ ] No data loss occurred
- [ ] Database indexes created

## Step 7: Monitoring

### 7.1 Check Server Logs

```bash
# PM2 logs
pm2 logs clean-care-api

# System logs
tail -f /var/log/clean-care-api.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 7.2 Monitor Database

```bash
# Check database connections
mysql -u staging_user -p -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -u staging_user -p staging_db -e "
  SELECT 
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'staging_db'
  ORDER BY data_length DESC;
"

# Check category distribution
mysql -u staging_user -p staging_db -e "
  SELECT category, COUNT(*) as count
  FROM Complaint
  GROUP BY category;
"
```

### 7.3 Performance Monitoring

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://staging-api.cleancare.bd/api/categories

# curl-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer:  %{time_pretransfer}\n
# time_redirect:  %{time_redirect}\n
# time_starttransfer:  %{time_starttransfer}\n
# ----------\n
# time_total:  %{time_total}\n
```

## Step 8: Rollback Plan

If issues occur, follow this rollback procedure:

### 8.1 Rollback Database

```bash
# Restore from backup
mysql -u staging_user -p staging_db < backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
mysql -u staging_user -p staging_db -e "SHOW TABLES;"
```

### 8.2 Rollback Backend

```bash
# Using Git
cd /path/to/server
git log --oneline  # Find previous commit
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart clean-care-api
```

### 8.3 Rollback Admin Panel

```bash
# Restore previous build
cd /var/www/staging-admin
rm -rf *
# Upload previous dist/ folder
```

## Troubleshooting

### Issue: Database migration fails

**Solution:**
```bash
# Check database connection
npx prisma db pull

# Check migration status
npx prisma migrate status

# Force reset (CAUTION: data loss)
npx prisma migrate reset
```

### Issue: Backend won't start

**Solution:**
```bash
# Check logs
pm2 logs clean-care-api

# Check port availability
netstat -tulpn | grep 4000

# Check environment variables
cat .env

# Test database connection
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('Connected'))
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.\$disconnect());
"
```

### Issue: Admin panel shows blank page

**Solution:**
```bash
# Check browser console for errors
# Check API URL in .env
# Verify CORS settings in backend
# Check nginx/apache configuration
# Verify build was successful
```

### Issue: Category filters not working

**Solution:**
```bash
# Check API endpoint
curl https://staging-api.cleancare.bd/api/categories

# Check browser network tab
# Verify authentication token
# Check CORS headers
```

## Post-Deployment Tasks

After successful deployment:

1. **Document Deployment**
   - Record deployment date and time
   - Note any issues encountered
   - Update deployment log

2. **Notify Team**
   - Inform QA team staging is ready
   - Share staging URLs
   - Provide test credentials

3. **Schedule Testing**
   - Plan QA testing sessions
   - Create test cases
   - Track bugs and issues

4. **Monitor for 24 Hours**
   - Watch server logs
   - Monitor error rates
   - Check performance metrics

## Success Criteria

Deployment is successful when:

- ✅ All 8 categories are accessible via API
- ✅ All 22 subcategories are accessible
- ✅ New complaints can be created with categories
- ✅ Complaints can be filtered by category
- ✅ Admin panel displays category badges
- ✅ Category analytics work correctly
- ✅ No errors in server logs
- ✅ No errors in browser console
- ✅ Existing complaints still accessible
- ✅ Performance is acceptable

## Next Steps

After staging deployment is verified:

1. **Task 12.3**: Deploy to production
2. Update API documentation
3. Train admin users on new features
4. Monitor production deployment

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review server and application logs
3. Test API endpoints manually
4. Verify database migration status
5. Contact development team if needed

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 19, 2025  
**Feature**: Categorized Complaint System  
**Environment**: Staging
