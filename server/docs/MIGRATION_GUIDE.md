# Data Migration Guide: Handling Existing Complaints Without Categories

## Overview

This guide explains how to handle existing complaints that were created before the category system was implemented. The database schema now requires `category` and `subcategory` fields, but older complaints may have NULL values.

## Migration Strategies

We provide three strategies for handling uncategorized complaints:

### Strategy 1: Keep as NULL (Recommended)

**Description:** Leave existing complaints with NULL categories. The admin panel has been updated to handle and display these appropriately.

**Pros:**
- No data modification required
- Safest option
- Preserves historical data integrity
- Admin panel shows "Uncategorized" badge
- Admins can manually categorize later

**Cons:**
- Requires admin panel updates to handle NULL values
- May affect analytics if not filtered properly

**Usage:**
```bash
cd server
node migrate-null-categories.js --strategy=null
```

**When to use:** This is the default and recommended strategy for production environments where data integrity is critical.

---

### Strategy 2: Set to Default Category

**Description:** Automatically assign all uncategorized complaints to a default category (`home` / `not_collecting_waste`).

**Pros:**
- All complaints have categories
- Simplifies analytics
- No special handling needed in admin panel

**Cons:**
- Modifies historical data
- May assign incorrect categories
- Cannot be easily undone

**Usage:**
```bash
cd server
node migrate-null-categories.js --strategy=default
```

**Configuration:**
You can change the default category by editing `migrate-null-categories.js`:
```javascript
const DEFAULT_CATEGORY = 'home';
const DEFAULT_SUBCATEGORY = 'not_collecting_waste';
```

**When to use:** Use this strategy in development/staging environments or when you're confident that most complaints fall into a specific category.

---

### Strategy 3: Export for Manual Review

**Description:** Export all uncategorized complaints to a CSV file with suggested categories for manual review.

**Pros:**
- Allows manual review and accurate categorization
- Provides suggested categories based on keywords
- No automatic data modification
- Can be imported back after review

**Cons:**
- Requires manual work
- Time-consuming for large datasets

**Usage:**
```bash
cd server
node migrate-null-categories.js --strategy=export
```

**Output:**
- Creates a CSV file: `uncategorized-complaints-{timestamp}.csv`
- Includes suggested categories based on description keywords
- Can be opened in Excel or Google Sheets

**CSV Columns:**
- ID
- Title
- Description
- Location
- Status
- Citizen Name
- Citizen Phone
- Created At
- Suggested Category
- Suggested Subcategory

**When to use:** Use this strategy when you want accurate categorization and have time for manual review.

---

## Step-by-Step Migration Process

### Pre-Migration Checklist

1. **Backup Database**
   ```bash
   # Create a database backup before migration
   mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check Existing Data**
   ```bash
   cd server
   node migrate-null-categories.js --strategy=export
   ```
   This will show you how many complaints need migration without modifying data.

3. **Test on Staging**
   - Run migration on staging environment first
   - Verify admin panel displays correctly
   - Test analytics endpoints

### Migration Steps

#### For Production (Recommended: Strategy 1)

```bash
# Step 1: Navigate to server directory
cd server

# Step 2: Run migration with NULL strategy (no data changes)
node migrate-null-categories.js --strategy=null

# Step 3: Verify admin panel handles NULL categories
# - Check AllComplaints page
# - Verify "Uncategorized" filter works
# - Test category analytics

# Step 4: Deploy admin panel updates
cd ../clean-care-admin
npm run build
# Deploy to production
```

#### For Development (Optional: Strategy 2)

```bash
# Step 1: Navigate to server directory
cd server

# Step 2: Run migration with default strategy
node migrate-null-categories.js --strategy=default

# Step 3: Verify all complaints have categories
# Check database or use admin panel
```

#### For Manual Categorization (Strategy 3)

```bash
# Step 1: Export uncategorized complaints
cd server
node migrate-null-categories.js --strategy=export

# Step 2: Open the generated CSV file
# File will be named: uncategorized-complaints-{timestamp}.csv

# Step 3: Review and assign categories manually
# - Open in Excel or Google Sheets
# - Review suggested categories
# - Assign correct categories

# Step 4: Use admin panel to update categories
# - Go to AllComplaints page
# - Use "Uncategorized" filter
# - Click on each complaint and assign category manually
```

---

## Admin Panel Updates

The admin panel has been updated to handle NULL categories:

### 1. Uncategorized Filter

A new filter option "Uncategorized" has been added to the category filter dropdown:

```typescript
<MenuItem value="uncategorized">
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <HelpOutlineIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
    Uncategorized
  </Box>
</MenuItem>
```

### 2. Uncategorized Badge

Complaints without categories display a special badge:

```typescript
{!complaint.category && (
  <Chip
    label="Not Categorized"
    size="small"
    icon={<HelpOutlineIcon />}
    sx={{
      backgroundColor: '#f5f5f5',
      color: '#757575',
      border: '1px dashed #bdbdbd',
    }}
  />
)}
```

### 3. Manual Categorization

Admins can manually assign categories to uncategorized complaints:

1. Open complaint details modal
2. Click "Edit Category" button
3. Select category and subcategory
4. Save changes

---

## Migration Logs

Each migration run creates a log file:

**Filename:** `migration-log-{timestamp}.json`

**Contents:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "strategy": "null",
  "complaintsFound": 150,
  "complaintsUpdated": 0,
  "message": "No changes made. Admin panel will handle NULL categories."
}
```

---

## Rollback Plan

### If Strategy 1 (NULL) was used:
- No rollback needed (no data was modified)
- Simply revert admin panel changes if needed

### If Strategy 2 (Default) was used:
1. Restore from database backup:
   ```bash
   mysql -u username -p database_name < backup_file.sql
   ```

2. Or manually set categories back to NULL:
   ```sql
   UPDATE Complaint 
   SET category = NULL, subcategory = NULL 
   WHERE category = 'home' AND subcategory = 'not_collecting_waste';
   ```

### If Strategy 3 (Export) was used:
- No rollback needed (no data was modified)

---

## Testing Checklist

After migration, verify the following:

### Backend
- [ ] Complaints API returns correct data
- [ ] Category filter works correctly
- [ ] Uncategorized filter returns NULL category complaints
- [ ] Analytics endpoints handle NULL categories
- [ ] Category statistics are accurate

### Admin Panel
- [ ] AllComplaints page displays correctly
- [ ] Uncategorized filter works
- [ ] Uncategorized badge displays for NULL categories
- [ ] Manual categorization works
- [ ] Category analytics dashboard handles NULL values

### Mobile App
- [ ] New complaints are created with categories
- [ ] Complaint list displays correctly
- [ ] No errors when viewing old complaints

---

## Troubleshooting

### Issue: Migration script fails with database connection error

**Solution:**
```bash
# Check .env file has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Test database connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(e => console.error(e));"
```

### Issue: Admin panel shows errors for NULL categories

**Solution:**
- Ensure admin panel code has been updated with NULL handling
- Check CategoryBadge component handles NULL values
- Verify CategoryFilter includes "Uncategorized" option

### Issue: Analytics dashboard shows incorrect counts

**Solution:**
- Update analytics queries to handle NULL categories
- Add filter to exclude/include uncategorized complaints
- Refresh analytics cache

---

## Best Practices

1. **Always backup before migration**
   - Create database backup
   - Test on staging first
   - Have rollback plan ready

2. **Use Strategy 1 (NULL) for production**
   - Safest option
   - No data modification
   - Allows manual review later

3. **Monitor after migration**
   - Check error logs
   - Verify analytics accuracy
   - Test user workflows

4. **Document decisions**
   - Keep migration logs
   - Document which strategy was used
   - Note any issues encountered

---

## Support

If you encounter issues during migration:

1. Check migration logs in `migration-log-{timestamp}.json`
2. Review error messages in console output
3. Verify database connection and permissions
4. Test on staging environment first
5. Contact development team if issues persist

---

## Summary

**Recommended Approach:**
1. Use Strategy 1 (NULL) for production
2. Deploy admin panel updates to handle NULL categories
3. Allow admins to manually categorize over time
4. Use Strategy 3 (Export) for periodic review of uncategorized complaints

This approach maintains data integrity while providing flexibility for future categorization.
