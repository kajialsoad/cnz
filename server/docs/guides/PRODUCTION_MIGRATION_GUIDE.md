# Production Migration Guide: Thana to Zone-Ward Structure

This guide provides step-by-step instructions for executing the Zone-Ward migration in production.

## Prerequisites

Before starting the migration, ensure you have:

1. ✅ Tested the migration on staging database
2. ✅ Verified all zones and wards are correctly defined
3. ✅ Reviewed the migration scripts
4. ✅ Scheduled a maintenance window
5. ✅ Notified all stakeholders
6. ✅ Database backup tools ready

## Migration Overview

The migration consists of three main steps:

1. **Backup Database** - Create a complete backup of the production database
2. **Run Migration** - Execute the migration script to create zones/wards and update users
3. **Verify Migration** - Confirm all data was migrated correctly

## Step-by-Step Instructions

### Step 1: Backup Production Database

**CRITICAL: Always create a backup before running any migration!**

```bash
# Run the backup script
node backup-database.js

# This will create a backup file with timestamp
# Example: backup-2024-12-10-15-30-00.sql
```

The backup script will:
- Export the entire database to a SQL file
- Include timestamp in filename
- Store in `./backups/` directory
- Display backup file location

**Verify the backup:**
```bash
# Check that backup file exists and has reasonable size
ls -lh backups/

# The file should be several MB in size
```

### Step 2: Run Migration Script

Once the backup is complete and verified, run the migration:

```bash
# Run the migration
node migrate-data-thana-to-zone-ward.js
```

The migration will:
1. Create/update 10 zones for DSCC
2. Create/update 75 wards across all zones
3. Update user records with zone and ward assignments
4. Set wardImageCount based on existing complaint images

**Expected Output:**
```
🚀 Starting Complete Data Migration: Thana to Zone-Ward
════════════════════════════════════════════════════════

📍 Step 1: Creating Zones and Wards for DSCC...
✅ Found DSCC: Dhaka South City Corporation
🏢 Processing Zone 1: অঞ্চল-১
   ✅ Zone updated: ID 25
   📋 Processing 7 wards...
   ✅ Wards processed
...

📊 Zone and Ward Creation Summary:
   Zones created: 0
   Zones updated: 10
   Wards created: 0
   Wards updated: 75

👥 Step 2: Updating User Records...
✅ User 123: Updated to Zone 1, Ward 15
...

📊 User Update Summary:
   Users updated: XX
   Users without ward info: XX
   Users skipped: XX

🖼️  Step 3: Updating Ward Image Counts...
✅ User 123: Set wardImageCount to 2
...

📊 Ward Image Count Summary:
   Users updated: XX
   Total images counted: XX

✨ Migration Completed Successfully!
```

**Migration Duration:** Typically 2-5 minutes depending on database size.

### Step 3: Verify Migration

After the migration completes, verify the results:

```bash
# Run verification script
node verify-migration-data.js
```

The verification will check:
- ✅ All 10 zones are created
- ✅ All 75 wards are assigned to correct zones
- ✅ Users have valid zone and ward assignments
- ✅ Ward image counts are accurate
- ✅ Data integrity is maintained

**Expected Output:**
```
🔍 Starting Migration Verification
════════════════════════════════════════════════════════

🔍 Verifying Zones and Wards...
✅ City Corporation: Dhaka South City Corporation
   Total Zones: 10
...

👥 Verifying User Assignments...
📊 User Assignment Statistics:
   Total Users: XX
   Users with Zone: XX
   Users with Ward: XX
   Users with Both: XX

🖼️  Verifying Ward Image Counts...
📊 Ward Image Count Statistics:
   Users checked: XX
   Correct counts: XX
   Incorrect counts: 0

🔐 Verifying Data Integrity...
📊 Data Integrity Check:
   Zone-ward mismatches: 0

✅ All checks passed! Migration is successful.
```

### Step 4: Test Application

After verification, test the application:

1. **Admin Panel:**
   - Login as Master Admin
   - Navigate to City Corporation Management
   - Verify zones and wards are displayed correctly
   - Test adding/editing zones and wards

2. **Mobile App:**
   - Test user signup with zone/ward selection
   - Verify existing users can login
   - Test complaint creation with ward assignment

3. **API Endpoints:**
   - Test zone and ward filtering
   - Verify user management endpoints
   - Check complaint filtering by zone/ward

### Step 5: Monitor for Issues

After deployment, monitor for:
- User login issues
- Complaint creation errors
- Zone/ward filtering problems
- Performance issues

## Rollback Procedure

If issues are discovered, you can rollback the migration:

### Option 1: Rollback User Assignments Only

This clears user zone/ward assignments but keeps zones and wards:

```bash
# Rollback user assignments only
node rollback-zone-ward-migration.js --yes
```

### Option 2: Full Rollback (Delete Zones and Wards)

This removes all zones, wards, and user assignments:

```bash
# Full rollback with confirmation
node rollback-zone-ward-migration.js --delete-zones

# Or skip confirmation (use with caution!)
node rollback-zone-ward-migration.js --delete-zones --yes
```

### Option 3: Restore from Backup

If major issues occur, restore from the backup:

```bash
# Restore from backup file
mysql -u username -p database_name < backups/backup-2024-12-10-15-30-00.sql
```

## Troubleshooting

### Issue: Migration fails with "Unique constraint failed"

**Cause:** Zones or wards already exist in database

**Solution:**
1. The migration script handles existing zones/wards by updating them
2. If error persists, check for duplicate zone numbers
3. Run: `node verify-zone-data.js` to check data structure

### Issue: Users not assigned to zones/wards

**Cause:** Users don't have complaint data with ward information

**Solution:**
1. This is expected for users without complaints
2. Users will be assigned zones/wards when they create complaints
3. Or manually assign through admin panel

### Issue: Ward image count incorrect

**Cause:** Complaint images not properly counted

**Solution:**
1. Run verification to identify affected users
2. Manually update wardImageCount if needed
3. Or re-run migration (it will update counts)

## Post-Migration Checklist

After successful migration:

- [ ] Verify all zones and wards are created
- [ ] Check user assignments are correct
- [ ] Test admin panel zone/ward management
- [ ] Test mobile app signup with zone/ward selection
- [ ] Verify complaint filtering by zone/ward
- [ ] Monitor application logs for errors
- [ ] Update documentation
- [ ] Notify stakeholders of completion
- [ ] Archive backup files securely

## Migration Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `migrate-data-thana-to-zone-ward.js` | Main migration script | `node migrate-data-thana-to-zone-ward.js` |
| `verify-migration-data.js` | Verify migration results | `node verify-migration-data.js` |
| `rollback-zone-ward-migration.js` | Rollback migration | `node rollback-zone-ward-migration.js [--delete-zones] [--yes]` |
| `backup-database.js` | Create database backup | `node backup-database.js` |
| `test-migration-quick.js` | Quick migration test | `node test-migration-quick.js` |

## Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review migration logs for error messages
3. Run verification script to identify specific issues
4. Contact development team with error details

## Important Notes

- **Always backup before migration!**
- **Test on staging first!**
- **Schedule during low-traffic period**
- **Have rollback plan ready**
- **Monitor closely after deployment**

## Success Criteria

Migration is considered successful when:

✅ All 10 DSCC zones are created
✅ All 75 wards are assigned to correct zones
✅ Users have valid zone and ward assignments
✅ Ward image counts are accurate
✅ No data integrity issues
✅ Application functions normally
✅ No user-reported issues

---

**Last Updated:** December 10, 2024
**Version:** 1.0
**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5
