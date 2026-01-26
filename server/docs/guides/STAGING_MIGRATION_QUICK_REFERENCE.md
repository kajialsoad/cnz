# Staging Migration Quick Reference
## Admin Complaint Status Enhancement

**Migration**: `20241220_add_others_and_reviews`

---

## 🚀 Quick Start

### Linux/Mac
```bash
cd server
chmod +x migrate-staging-complaint-status-enhancement.sh
./migrate-staging-complaint-status-enhancement.sh
```

### Windows
```cmd
cd server
migrate-staging-complaint-status-enhancement.cmd
```

### Manual
```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

---

## ✅ Pre-Flight Checklist

- [ ] Backup database
- [ ] Test on dev environment
- [ ] Notify team
- [ ] Check `.env` file
- [ ] Verify database access

---

## 🔍 Quick Verification

```sql
-- Check Complaint table
SHOW COLUMNS FROM Complaint WHERE Field IN ('othersCategory', 'othersSubcategory');

-- Check reviews table
SHOW TABLES LIKE 'reviews';

-- Check Notification table
SHOW COLUMNS FROM Notification WHERE Field IN ('complaintId', 'statusChange', 'metadata');
```

---

## 🔄 Quick Rollback

```bash
# Restore from backup
mysql -h [HOST] -u [USER] -p [DATABASE] < backups/staging_backup_[TIMESTAMP].sql

# Regenerate Prisma Client
npx prisma db pull
npx prisma generate
```

---

## 📊 What Changes

### New Columns
- `Complaint.othersCategory` (VARCHAR 191, NULL)
- `Complaint.othersSubcategory` (VARCHAR 191, NULL)
- `Notification.complaintId` (INT, NULL)
- `Notification.statusChange` (VARCHAR 191, NULL)
- `Notification.metadata` (TEXT, NULL)

### New Table
- `reviews` (id, complaintId, userId, rating, comment, timestamps)

### New Indexes
- `Complaint_othersCategory_idx`
- `Complaint_othersSubcategory_idx`
- `Complaint_status_othersCategory_idx`
- `reviews_complaintId_idx`
- `reviews_userId_idx`
- `reviews_rating_idx`
- `reviews_createdAt_idx`
- `Notification_complaintId_idx`

### New Constraints
- `reviews_complaintId_userId_key` (UNIQUE)
- `reviews_complaintId_fkey` (FK to Complaint)
- `reviews_userId_fkey` (FK to users)
- `Notification_complaintId_fkey` (FK to Complaint)

---

## 🧪 Quick Test

```bash
# Test Others marking
curl -X PATCH http://staging-api/api/admin/complaints/1/mark-others \
  -H "Authorization: Bearer TOKEN" \
  -d '{"othersCategory":"CORPORATION_INTERNAL","othersSubcategory":"Engineering"}'

# Test review submission
curl -X POST http://staging-api/api/complaints/1/review \
  -H "Authorization: Bearer TOKEN" \
  -d '{"rating":5,"comment":"Great!"}'
```

---

## ⏱️ Estimated Time

- **Backup**: 1-2 minutes
- **Migration**: 2-5 minutes
- **Verification**: 1-2 minutes
- **Total**: 5-10 minutes

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Table already exists" | Migration already applied |
| "Permission denied" | Check database user privileges |
| "Connection refused" | Verify DATABASE_URL in .env |
| "Backup failed" | Check disk space |

---

## 📞 Emergency Contacts

- **Development Team**: [Contact Info]
- **Database Admin**: [Contact Info]
- **DevOps**: [Contact Info]

---

## 📝 Quick Log

```
Date: _______________
Time: _______________
Status: [ ] Success [ ] Failed
Duration: _______________
Notes: _______________
```

---

**Version**: 1.0  
**Date**: December 21, 2024
