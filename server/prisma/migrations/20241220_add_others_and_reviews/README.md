# Migration: Add Others Status and Review System

**Date**: December 20, 2024  
**Migration ID**: 20241220_add_others_and_reviews

## Overview

This migration adds support for the "Others" complaint status with categorization and implements a user review system for resolved complaints.

## Changes

### 1. Complaint Model Updates

Added two new fields to categorize "Others" complaints:

- `othersCategory` (String, nullable): Main category - "CORPORATION_INTERNAL" or "CORPORATION_EXTERNAL"
- `othersSubcategory` (String, nullable): Specific department/agency

**Indexes Added**:
- `Complaint_othersCategory_idx`: For filtering by Others category
- `Complaint_othersSubcategory_idx`: For filtering by Others subcategory
- `Complaint_status_othersCategory_idx`: Composite index for status + category queries

### 2. Review Model (New)

Created a new `reviews` table to store user feedback:

**Fields**:
- `id`: Primary key (auto-increment)
- `complaintId`: Foreign key to Complaint
- `userId`: Foreign key to User
- `rating`: Integer (1-5 stars)
- `comment`: Text (optional, max 300 characters)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Constraints**:
- Unique constraint on `(complaintId, userId)`: One review per user per complaint
- Cascade delete: Reviews deleted when complaint or user is deleted

**Indexes**:
- `reviews_complaintId_idx`: For fetching reviews by complaint
- `reviews_userId_idx`: For fetching reviews by user
- `reviews_rating_idx`: For analytics and filtering by rating
- `reviews_createdAt_idx`: For sorting by date

### 3. Notification Model Updates

Enhanced notifications to support complaint status changes:

**New Fields**:
- `complaintId` (Int, nullable): Link to related complaint
- `statusChange` (String, nullable): Status transition (e.g., "PENDING_TO_IN_PROGRESS")
- `metadata` (Text, nullable): JSON string for additional data (images, notes)

**Indexes Added**:
- `Notification_complaintId_idx`: For fetching notifications by complaint

**Constraints**:
- Foreign key to Complaint with cascade delete

## Subcategory Values

### Corporation Internal
- Engineering
- Electricity
- Health
- Property (Eviction)

### Corporation External
- WASA (Water Supply)
- Titas (Gas)
- DPDC (Dhaka Power Distribution Company)
- DESCO (Dhaka Electric Supply Company)
- BTCL (Bangladesh Telecommunications Company Limited)
- Fire Service
- Others

## Migration Steps

### Development Environment

```bash
# 1. Backup database
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql

# 2. Apply migration
npx prisma migrate dev --name add_others_and_reviews

# 3. Generate Prisma Client
npx prisma generate

# 4. Verify migration
npx prisma db pull
```

### Production Environment

```bash
# 1. Backup production database
mysqldump -u username -p production_db > backup_production_$(date +%Y%m%d).sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Restart application
pm2 restart all
```

## Rollback Plan

If issues occur, rollback using the backup:

```bash
# Restore from backup
mysql -u username -p database_name < backup_YYYYMMDD.sql

# Revert Prisma schema
git checkout HEAD~1 server/prisma/schema.prisma

# Regenerate client
npx prisma generate
```

## Testing

After migration, verify:

1. **Complaint Model**:
   - Can set `othersCategory` and `othersSubcategory`
   - Indexes work for filtering Others complaints
   - Existing complaints are not affected

2. **Review Model**:
   - Can create reviews for resolved complaints
   - Unique constraint prevents duplicate reviews
   - Cascade delete works correctly

3. **Notification Model**:
   - Can create notifications with complaint links
   - Can store metadata as JSON
   - Cascade delete works when complaint is deleted

## Related Files

- Schema: `server/prisma/schema.prisma`
- Design Document: `.kiro/specs/admin-complaint-status-enhancement/design.md`
- Requirements: `.kiro/specs/admin-complaint-status-enhancement/requirements.md`

## Notes

- All new fields are nullable to maintain backward compatibility
- Existing complaints will have `NULL` values for Others fields
- Reviews can only be submitted for resolved complaints (enforced in application logic)
- Notification metadata is stored as JSON string (parse before use)
