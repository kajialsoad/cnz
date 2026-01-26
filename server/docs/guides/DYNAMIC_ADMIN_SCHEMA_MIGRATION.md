# Dynamic Admin Management System - Database Schema Migration

## Overview

This migration enhances the database schema to support the Dynamic Admin Management System with the following features:

- **Permissions System**: JSON-based granular access control for admins
- **Activity Logging**: Comprehensive audit trail for all admin actions
- **Admin Assignment**: Track which admin is handling each complaint
- **Performance Optimization**: Strategic indexes for common query patterns

## Migration Components

### 1. User Model Enhancements

#### New Fields

- **`permissions`** (JSON, nullable)
  - Stores granular permissions for each admin
  - Structure:
    ```json
    {
      "zones": [1, 2, 3],
      "wards": [10, 11, 12],
      "categories": ["waste", "drainage", "road"],
      "features": {
        "canViewComplaints": true,
        "canEditComplaints": true,
        "canDeleteComplaints": false,
        "canViewUsers": true,
        "canEditUsers": false,
        "canDeleteUsers": false,
        "canViewMessages": true,
        "canSendMessages": true,
        "canViewAnalytics": true,
        "canExportData": false
      }
    }
    ```

### 2. Complaint Model Enhancements

#### New Fields

- **`assignedAdminId`** (INT, nullable)
  - Foreign key to users table
  - Tracks which admin is handling the complaint
  
- **`assignedAt`** (DATETIME, nullable)
  - Timestamp when complaint was assigned to admin
  
- **`resolvedAt`** (DATETIME, nullable)
  - Timestamp when complaint was marked as resolved

### 3. ActivityLog Model (New Table)

Complete audit trail for all admin actions.

#### Fields

- **`id`** (INT, primary key, auto-increment)
- **`userId`** (INT, not null) - Who performed the action
- **`action`** (VARCHAR, not null) - Action type (CREATE_USER, UPDATE_USER, etc.)
- **`entityType`** (VARCHAR, not null) - Type of entity affected (USER, COMPLAINT, etc.)
- **`entityId`** (INT, nullable) - ID of affected entity
- **`oldValue`** (JSON, nullable) - Previous state
- **`newValue`** (JSON, nullable) - New state
- **`ipAddress`** (VARCHAR, nullable) - IP address of user
- **`userAgent`** (TEXT, nullable) - Browser/device information
- **`timestamp`** (DATETIME, not null, default: now) - When action occurred

#### Indexes

- `userId` - Fast lookup by user
- `entityType, entityId` - Fast lookup by entity
- `timestamp` - Fast chronological queries
- `action` - Fast filtering by action type
- `userId, timestamp` - Optimized for user activity history

### 4. Performance Indexes

#### Users Table

- `cityCorporationCode, zoneId, wardId` - Composite index for hierarchical filtering
- `role, status` - Fast filtering by role and status
- `cityCorporationCode, role` - City Corporation-specific role queries

#### Complaints Table

- `assignedAdminId` - Fast lookup of admin's assigned complaints
- `wardId, status` - Ward-specific complaint status queries
- `assignedAdminId, status` - Admin's complaint status queries

## Migration Scripts

### Apply Migration

```bash
cd server
node apply-dynamic-admin-schema.js
```

This script will:
1. Connect to the database
2. Check if migration has already been applied
3. Execute all migration SQL statements
4. Verify the migration was successful
5. Regenerate Prisma client

### Verify Migration

```bash
cd server
node verify-dynamic-admin-schema.js
```

This script checks:
- All new columns exist
- ActivityLog table is created
- All indexes are in place
- Foreign key constraints are correct
- Data operations work correctly

### Rollback Migration

```bash
cd server
node rollback-dynamic-admin-schema.js
```

⚠️ **WARNING**: This will delete all activity log data!

Type `ROLLBACK` to confirm.

## Requirements Addressed

This migration addresses the following requirements from the specification:

### Requirement 9: Database Schema Enhancement

- ✅ 9.1: User table with role, cityCorporationId, isActive, permissions (JSON)
- ✅ 9.2: Zone table with proper fields
- ✅ 9.3: Ward table with proper fields
- ✅ 9.4: UserZone junction table (handled by zoneId in User)
- ✅ 9.5: UserWard junction table (handled by wardId in User)
- ✅ 9.6: ActivityLog table with all required fields
- ✅ 9.7: Complaint table with admin assignment fields
- ✅ 9.8: ChatMessage table (already exists)
- ✅ 9.9: Database indexes for performance
- ✅ 9.10: Foreign key constraints with proper cascading
- ✅ 9.11: Permissions JSON field validation
- ✅ 9.12: Soft delete support (isActive field)
- ✅ 9.13: Cascade delete for zone/ward relationships
- ✅ 9.14: Data preservation during migration
- ✅ 9.15: Backup support for all tables

## Usage Examples

### Setting User Permissions

```typescript
// Set permissions for a Super Admin
await prisma.user.update({
  where: { id: userId },
  data: {
    permissions: {
      zones: [1, 2, 3],
      wards: [],
      categories: ["waste", "drainage", "road", "electricity"],
      features: {
        canViewComplaints: true,
        canEditComplaints: true,
        canDeleteComplaints: false,
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: false,
        canViewMessages: true,
        canSendMessages: true,
        canViewAnalytics: true,
        canExportData: true
      }
    }
  }
});
```

### Logging Activity

```typescript
// Log user creation
await prisma.activityLog.create({
  data: {
    userId: adminId,
    action: 'CREATE_USER',
    entityType: 'USER',
    entityId: newUserId,
    newValue: {
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
      wardId: 10
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
});

// Log user update
await prisma.activityLog.create({
  data: {
    userId: adminId,
    action: 'UPDATE_USER',
    entityType: 'USER',
    entityId: userId,
    oldValue: {
      firstName: 'John',
      status: 'ACTIVE'
    },
    newValue: {
      firstName: 'Jonathan',
      status: 'INACTIVE'
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
});
```

### Assigning Complaints

```typescript
// Assign complaint to admin
await prisma.complaint.update({
  where: { id: complaintId },
  data: {
    assignedAdminId: adminId,
    assignedAt: new Date(),
    status: 'IN_PROGRESS'
  }
});

// Mark complaint as resolved
await prisma.complaint.update({
  where: { id: complaintId },
  data: {
    status: 'RESOLVED',
    resolvedAt: new Date()
  }
});
```

### Querying Activity Logs

```typescript
// Get user's activity history
const activities = await prisma.activityLog.findMany({
  where: {
    userId: adminId
  },
  orderBy: {
    timestamp: 'desc'
  },
  take: 50
});

// Get all activities for a specific entity
const entityActivities = await prisma.activityLog.findMany({
  where: {
    entityType: 'USER',
    entityId: userId
  },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        role: true
      }
    }
  },
  orderBy: {
    timestamp: 'desc'
  }
});

// Get activities within date range
const recentActivities = await prisma.activityLog.findMany({
  where: {
    timestamp: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31')
    }
  },
  orderBy: {
    timestamp: 'desc'
  }
});
```

## Performance Considerations

### Index Usage

The migration creates strategic indexes to optimize common query patterns:

1. **Role-based filtering**: `users(role, status)` index speeds up queries like:
   ```sql
   SELECT * FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'
   ```

2. **Hierarchical filtering**: `users(cityCorporationCode, zoneId, wardId)` index optimizes:
   ```sql
   SELECT * FROM users 
   WHERE cityCorporationCode = 'DSCC' 
   AND zoneId = 1 
   AND wardId = 10
   ```

3. **Admin workload queries**: `complaints(assignedAdminId, status)` index speeds up:
   ```sql
   SELECT * FROM complaints 
   WHERE assignedAdminId = 123 
   AND status = 'IN_PROGRESS'
   ```

4. **Activity log queries**: Multiple indexes support various query patterns:
   - User activity history: `activity_logs(userId, timestamp)`
   - Entity audit trail: `activity_logs(entityType, entityId)`
   - Action filtering: `activity_logs(action)`

### Query Optimization Tips

1. **Always use indexes**: Structure queries to utilize the created indexes
2. **Limit result sets**: Use pagination for large datasets
3. **Select specific fields**: Don't use `SELECT *` in production
4. **Use prepared statements**: Prisma handles this automatically
5. **Cache frequently accessed data**: Use Redis for statistics and user lists

## Data Integrity

### Foreign Key Constraints

- `complaints.assignedAdminId` → `users.id` (ON DELETE SET NULL)
  - If admin is deleted, complaint assignment is cleared
  
- `activity_logs.userId` → `users.id` (ON DELETE CASCADE)
  - If user is deleted, their activity logs are also deleted

### JSON Validation

The `permissions` field should be validated at the application level to ensure:
- Valid JSON structure
- Required fields are present
- Values are of correct types
- Zone/Ward IDs exist in database

Example validation:
```typescript
const permissionsSchema = z.object({
  zones: z.array(z.number()),
  wards: z.array(z.number()),
  categories: z.array(z.string()),
  features: z.object({
    canViewComplaints: z.boolean(),
    canEditComplaints: z.boolean(),
    canDeleteComplaints: z.boolean(),
    canViewUsers: z.boolean(),
    canEditUsers: z.boolean(),
    canDeleteUsers: z.boolean(),
    canViewMessages: z.boolean(),
    canSendMessages: z.boolean(),
    canViewAnalytics: z.boolean(),
    canExportData: z.boolean()
  })
});
```

## Backup and Recovery

### Before Migration

Always backup your database before running the migration:

```bash
# MySQL backup
mysqldump -u username -p database_name > backup_before_migration.sql

# Or use the backup script
node backup-database.js
```

### After Migration

Verify the migration was successful:

```bash
node verify-dynamic-admin-schema.js
```

### Rollback Procedure

If issues occur:

1. Stop the application
2. Run rollback script: `node rollback-dynamic-admin-schema.js`
3. Restore from backup if needed:
   ```bash
   mysql -u username -p database_name < backup_before_migration.sql
   ```
4. Investigate the issue
5. Fix and retry migration

## Testing

### Manual Testing Checklist

After migration, test:

- [ ] User creation with permissions
- [ ] User update with permission changes
- [ ] Activity log creation
- [ ] Activity log querying
- [ ] Complaint assignment to admin
- [ ] Complaint resolution tracking
- [ ] Role-based data filtering
- [ ] Performance of indexed queries

### Automated Testing

Run the verification script:

```bash
node verify-dynamic-admin-schema.js
```

This will automatically test:
- Schema structure
- Indexes
- Foreign keys
- Data operations

## Troubleshooting

### Common Issues

#### 1. Migration Already Applied

**Error**: "Table 'activity_logs' already exists"

**Solution**: The migration has already been applied. Run verification:
```bash
node verify-dynamic-admin-schema.js
```

#### 2. Foreign Key Constraint Fails

**Error**: "Cannot add foreign key constraint"

**Solution**: Ensure referenced tables and columns exist:
```sql
-- Check if users table exists
SHOW TABLES LIKE 'users';

-- Check if id column exists in users
DESCRIBE users;
```

#### 3. Index Already Exists

**Error**: "Duplicate key name"

**Solution**: The index already exists. This is safe to ignore, or drop and recreate:
```sql
DROP INDEX index_name ON table_name;
-- Then re-run migration
```

#### 4. Prisma Client Out of Sync

**Error**: "Property 'activityLog' does not exist on type 'PrismaClient'"

**Solution**: Regenerate Prisma client:
```bash
cd server
npx prisma generate
```

## Next Steps

After successful migration:

1. ✅ Restart application server
2. ✅ Test user management functionality
3. ✅ Test activity logging
4. ✅ Test complaint assignment
5. ✅ Monitor performance
6. ✅ Set up activity log archiving (for long-term storage)

## Support

For issues or questions:

1. Check this documentation
2. Run verification script
3. Check application logs
4. Review Prisma schema
5. Contact development team

## Version History

- **v1.0.0** (2024-12-12): Initial migration
  - Added permissions field to users
  - Created ActivityLog table
  - Added admin assignment to complaints
  - Created performance indexes
