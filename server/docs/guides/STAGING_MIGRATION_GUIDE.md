# Staging Database Migration Guide
## Admin Complaint Status Enhancement

**Migration**: `20241220_add_others_and_reviews`  
**Date**: December 21, 2024  
**Status**: Ready for Staging Deployment

---

## 📋 Overview

This migration adds the following features to the staging database:

1. **Others Status Management**
   - `othersCategory` field (CORPORATION_INTERNAL / CORPORATION_EXTERNAL)
   - `othersSubcategory` field (specific department/agency)

2. **Review System**
   - New `reviews` table for user feedback
   - Rating (1-5 stars) and optional comments
   - Unique constraint (one review per user per complaint)

3. **Enhanced Notifications**
   - `complaintId` field for linking notifications to complaints
   - `statusChange` field for tracking status transitions
   - `metadata` field for additional data (JSON)

---

## ⚠️ Pre-Migration Checklist

### Required Actions

- [ ] **Backup Database**: Create a full backup of staging database
- [ ] **Test on Development**: Verify migration works on dev environment
- [ ] **Check Disk Space**: Ensure sufficient space for backup and migration
- [ ] **Notify Team**: Inform team members about scheduled migration
- [ ] **Schedule Downtime**: Plan for brief downtime window (5-10 minutes)
- [ ] **Verify Credentials**: Confirm database access credentials are correct

### Environment Requirements

- [ ] Node.js 18+ installed
- [ ] npm/npx available
- [ ] MySQL client tools installed (for manual backup)
- [ ] Access to staging database
- [ ] `.env` file configured with staging `DATABASE_URL`

---

## 🚀 Migration Steps

### Option 1: Automated Script (Linux/Mac)

```bash
# Navigate to server directory
cd server

# Make script executable
chmod +x migrate-staging-complaint-status-enhancement.sh

# Run migration script
./migrate-staging-complaint-status-enhancement.sh
```

The script will:
1. ✅ Check environment configuration
2. ✅ Create automatic backup
3. ✅ Verify current schema
4. ✅ Generate Prisma Client
5. ✅ Apply migration
6. ✅ Verify changes
7. ✅ Test data integrity
8. ✅ Provide rollback instructions if needed

### Option 2: Automated Script (Windows)

```cmd
REM Navigate to server directory
cd server

REM Run migration script
migrate-staging-complaint-status-enhancement.cmd
```

### Option 3: Manual Migration

If you prefer manual control:

```bash
# 1. Navigate to server directory
cd server

# 2. Create manual backup
mysqldump -h [HOST] -u [USER] -p [DATABASE] > backup_$(date +%Y%m%d).sql

# 3. Generate Prisma Client
npx prisma generate

# 4. Apply migration
npx prisma migrate deploy

# 5. Verify migration
npx prisma db pull
```

---

## 🔍 Verification Steps

After migration, verify the following:

### 1. Check Complaint Table

```sql
-- Verify new columns exist
SHOW COLUMNS FROM Complaint WHERE Field IN ('othersCategory', 'othersSubcategory');

-- Expected: 2 rows returned
```

### 2. Check reviews Table

```sql
-- Verify table exists
SHOW TABLES LIKE 'reviews';

-- Check structure
DESCRIBE reviews;

-- Expected columns:
-- id, complaintId, userId, rating, comment, createdAt, updatedAt
```

### 3. Check Notification Table

```sql
-- Verify new columns exist
SHOW COLUMNS FROM Notification WHERE Field IN ('complaintId', 'statusChange', 'metadata');

-- Expected: 3 rows returned
```

### 4. Check Indexes

```sql
-- Complaint indexes
SHOW INDEXES FROM Complaint WHERE Key_name LIKE '%others%';

-- reviews indexes
SHOW INDEXES FROM reviews;

-- Notification indexes
SHOW INDEXES FROM Notification WHERE Key_name LIKE '%complaint%';
```

### 5. Test Data Integrity

```sql
-- Count existing data (should be unchanged)
SELECT COUNT(*) as complaint_count FROM Complaint;
SELECT COUNT(*) as notification_count FROM Notification;
SELECT COUNT(*) as review_count FROM reviews;  -- Should be 0 initially
```

---

## 🔄 Rollback Procedure

If issues occur during migration:

### Automatic Rollback (Script)

The migration script automatically creates a backup and will attempt rollback on failure.

### Manual Rollback

```bash
# 1. Stop the application
pm2 stop clean-care-api  # or your process manager

# 2. Restore from backup
mysql -h [HOST] -u [USER] -p [DATABASE] < backups/staging_backup_[TIMESTAMP].sql

# 3. Verify restoration
mysql -h [HOST] -u [USER] -p [DATABASE] -e "SHOW TABLES;"

# 4. Regenerate Prisma Client for old schema
npx prisma db pull
npx prisma generate

# 5. Restart application
pm2 start clean-care-api
```

---

## 📊 Expected Changes

### Database Schema Changes

#### Complaint Table
```sql
ALTER TABLE `Complaint` 
  ADD COLUMN `othersCategory` VARCHAR(191) NULL,
  ADD COLUMN `othersSubcategory` VARCHAR(191) NULL;

-- Indexes
CREATE INDEX `Complaint_othersCategory_idx` ON `Complaint`(`othersCategory`);
CREATE INDEX `Complaint_othersSubcategory_idx` ON `Complaint`(`othersSubcategory`);
CREATE INDEX `Complaint_status_othersCategory_idx` ON `Complaint`(`status`, `othersCategory`);
```

#### reviews Table (New)
```sql
CREATE TABLE `reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `complaintId` INT NOT NULL,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `reviews_complaintId_userId_key` (`complaintId`, `userId`),
  INDEX `reviews_complaintId_idx` (`complaintId`),
  INDEX `reviews_userId_idx` (`userId`),
  INDEX `reviews_rating_idx` (`rating`),
  INDEX `reviews_createdAt_idx` (`createdAt`),
  CONSTRAINT `reviews_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

#### Notification Table
```sql
ALTER TABLE `Notification`
  ADD COLUMN `complaintId` INT NULL,
  ADD COLUMN `statusChange` VARCHAR(191) NULL,
  ADD COLUMN `metadata` TEXT NULL;

-- Index
CREATE INDEX `Notification_complaintId_idx` ON `Notification`(`complaintId`);

-- Foreign Key
ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_complaintId_fkey` 
  FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE;
```

### Performance Impact

- **Minimal**: New columns are nullable, no data transformation required
- **Indexes**: Improve query performance for Others filtering
- **Foreign Keys**: Ensure referential integrity
- **Estimated Time**: 2-5 minutes depending on data volume

---

## 🧪 Post-Migration Testing

### 1. Backend API Tests

```bash
# Run backend tests
cd server
npm test

# Run integration tests
npm run test:integration

# Expected: All tests should pass
```

### 2. Manual API Testing

Test the new endpoints:

```bash
# Test Others marking
curl -X PATCH http://staging-api.cleancare.bd/api/admin/complaints/1/mark-others \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"othersCategory":"CORPORATION_INTERNAL","othersSubcategory":"Engineering"}'

# Test review submission
curl -X POST http://staging-api.cleancare.bd/api/complaints/1/review \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Great service!"}'

# Test notification retrieval
curl http://staging-api.cleancare.bd/api/notifications \
  -H "Authorization: Bearer [TOKEN]"
```

### 3. Admin Panel Testing

- [ ] Login to staging admin panel
- [ ] Navigate to complaint details
- [ ] Test "Mark as Others" functionality
- [ ] Test status update with images/notes
- [ ] Verify Others analytics widget
- [ ] Verify user satisfaction widget

### 4. Mobile App Testing

- [ ] Install staging build on test device
- [ ] Submit a test complaint
- [ ] Admin marks it as Others
- [ ] Verify notification received
- [ ] Admin resolves with images/notes
- [ ] Verify resolution details displayed
- [ ] Submit a review
- [ ] Verify review appears in admin panel

---

## 📈 Monitoring

After migration, monitor the following:

### Application Logs

```bash
# Check for errors
tail -f /var/log/clean-care-api/error.log

# Check application logs
pm2 logs clean-care-api
```

### Database Performance

```sql
-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'your_database_name'
ORDER BY (data_length + index_length) DESC;
```

### API Response Times

Monitor these endpoints:
- `GET /api/notifications` - Should be < 500ms
- `POST /api/complaints/:id/review` - Should be < 1s
- `PATCH /api/admin/complaints/:id/mark-others` - Should be < 500ms
- `GET /api/admin/complaints/analytics/others` - Should be < 3s

---

## 🐛 Troubleshooting

### Issue: Migration Fails with "Table already exists"

**Solution**: Migration may have been partially applied. Check current schema:

```sql
SHOW TABLES LIKE 'reviews';
SHOW COLUMNS FROM Complaint LIKE 'othersCategory';
```

If tables/columns exist, the migration is already applied.

### Issue: Foreign Key Constraint Fails

**Solution**: Ensure referenced tables exist and have correct structure:

```sql
-- Check Complaint table
DESCRIBE Complaint;

-- Check users table
DESCRIBE users;
```

### Issue: Permission Denied

**Solution**: Ensure database user has sufficient privileges:

```sql
GRANT ALL PRIVILEGES ON database_name.* TO 'user'@'host';
FLUSH PRIVILEGES;
```

### Issue: Backup Fails

**Solution**: Check disk space and permissions:

```bash
# Check disk space
df -h

# Check directory permissions
ls -la backups/
```

---

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review application and database logs
2. **Verify Environment**: Ensure `.env` is correctly configured
3. **Test Connection**: Verify database connectivity
4. **Rollback**: Use backup to restore if needed
5. **Contact Team**: Reach out to development team

---

## ✅ Success Criteria

Migration is successful when:

- [x] All SQL statements execute without errors
- [x] New tables and columns exist in database
- [x] Indexes are created
- [x] Foreign keys are established
- [x] Existing data is intact
- [x] Application starts without errors
- [x] API endpoints respond correctly
- [x] Admin panel loads without errors
- [x] Mobile app connects successfully

---

## 📝 Migration Log Template

Use this template to document your migration:

```
Migration Date: _______________
Migration Time: _______________
Performed By: _______________
Environment: Staging

Pre-Migration:
- Database backup created: [ ] Yes [ ] No
- Backup location: _______________
- Backup size: _______________
- Application stopped: [ ] Yes [ ] No

Migration:
- Start time: _______________
- End time: _______________
- Duration: _______________
- Errors encountered: [ ] Yes [ ] No
- Error details: _______________

Post-Migration:
- Verification completed: [ ] Yes [ ] No
- Tests passed: [ ] Yes [ ] No
- Application restarted: [ ] Yes [ ] No
- Monitoring enabled: [ ] Yes [ ] No

Status: [ ] Success [ ] Failed [ ] Rolled Back

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🎯 Next Steps After Migration

1. **Deploy Backend Services**
   - Update backend code to staging
   - Restart application servers
   - Verify API endpoints

2. **Deploy Admin Panel**
   - Build admin panel with new features
   - Deploy to staging environment
   - Test new UI components

3. **Deploy Mobile App**
   - Build staging version of mobile app
   - Distribute to internal testers
   - Collect feedback

4. **Monitor & Test**
   - Monitor application logs
   - Test all new features
   - Verify performance metrics

5. **Plan Production Migration**
   - Schedule production migration
   - Prepare production backup
   - Notify stakeholders

---

**Document Version**: 1.0  
**Last Updated**: December 21, 2024  
**Status**: Ready for Use
