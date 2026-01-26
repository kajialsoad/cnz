# Zone-Ward Migration - Quick Reference Card

## 🚀 Quick Start (Production)

```bash
# 1. Backup
node backup-database.js

# 2. Migrate
node migrate-data-thana-to-zone-ward.js

# 3. Verify
node verify-migration-data.js

# 4. Test & Monitor
```

## 📋 Command Reference

### Migration Commands
```bash
# Run migration
node migrate-data-thana-to-zone-ward.js

# Verify migration
node verify-migration-data.js

# Quick check
node test-migration-quick.js

# Full test (staging)
node test-migration-staging.js
```

### Rollback Commands
```bash
# Rollback user assignments only
node rollback-zone-ward-migration.js --yes

# Full rollback (delete zones/wards)
node rollback-zone-ward-migration.js --delete-zones

# Test rollback
node rollback-zone-ward-migration.js --test
```

### Backup Commands
```bash
# Create backup
node backup-database.js

# Restore from backup
mysql -u username -p database_name < backups/backup-TIMESTAMP.sql
```

## 📊 Expected Results

### Zones
- **Total:** 10 DSCC zones
- **Wards:** 75 total (3-15 per zone)
- **Officers:** All zones have assigned officers

### Users
- **Assigned:** Based on complaint ward data
- **Image Counts:** Calculated from complaint images
- **Unassigned:** Users without complaints (assigned later)

## ⚠️ Important Notes

- **Always backup first!**
- **Test on staging before production**
- **Migration takes 2-5 minutes**
- **Verification takes 1-2 minutes**
- **Have rollback plan ready**

## 🔍 Verification Checklist

After migration, verify:
- [ ] 10 zones created
- [ ] 75 wards created
- [ ] Users assigned to zones/wards
- [ ] Ward image counts accurate
- [ ] No data integrity issues
- [ ] Application works normally

## 🆘 Troubleshooting

### Issue: Unique constraint error
**Solution:** Migration handles existing data automatically

### Issue: Users not assigned
**Solution:** Expected if users have no complaints

### Issue: Image count wrong
**Solution:** Re-run migration or update manually

## 📞 Support

1. Check `PRODUCTION_MIGRATION_GUIDE.md`
2. Review migration logs
3. Run verification script
4. Contact development team

## 📁 Files

- `migrate-data-thana-to-zone-ward.js` - Main migration
- `verify-migration-data.js` - Verification
- `rollback-zone-ward-migration.js` - Rollback
- `PRODUCTION_MIGRATION_GUIDE.md` - Full guide

---

**Status:** ✅ Ready for Production
**Duration:** ~15-27 minutes total
**Risk:** Low (tested, documented, rollback ready)
