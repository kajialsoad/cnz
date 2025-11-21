# City Corporation Statistics Display Fix

## Problem
The City Corporation Management page was showing "0" for Total Users, Total Complaints, and Active Thanas columns, even though data existed in the database.

## Root Cause
The backend `getCityCorporations` service method was only using Prisma's `_count` feature which provides basic relationship counts, but wasn't calculating the actual statistics needed:
- Total Users per city corporation
- Total Complaints per city corporation  
- Active Thanas count per city corporation

## Solution
Updated the `getCityCorporations` method in `city-corporation.service.ts` to fetch and calculate statistics for each city corporation.

### Changes Made

**File: `server/src/services/city-corporation.service.ts`**

#### Before
```typescript
async getCityCorporations(status?: CityCorporationStatus | 'ALL') {
    const cityCorporations = await prisma.cityCorporation.findMany({
        where,
        include: {
            _count: {
                select: {
                    thanas: true,
                    users: true,
                },
            },
        },
        orderBy: {
            code: 'asc',
        },
    });

    return cityCorporations;
}
```

#### After
```typescript
async getCityCorporations(status?: CityCorporationStatus | 'ALL') {
    const cityCorporations = await prisma.cityCorporation.findMany({
        where,
        orderBy: {
            code: 'asc',
        },
    });

    // Fetch statistics for each city corporation
    const cityCorporationsWithStats = await Promise.all(
        cityCorporations.map(async (cc) => {
            // Get total users
            const totalUsers = await prisma.user.count({
                where: { cityCorporationCode: cc.code },
            });

            // Get total complaints
            const totalComplaints = await prisma.complaint.count({
                where: {
                    user: {
                        cityCorporationCode: cc.code,
                    },
                },
            });

            // Get active thanas count
            const activeThanas = await prisma.thana.count({
                where: {
                    cityCorporationId: cc.id,
                    status: 'ACTIVE',
                },
            });

            return {
                ...cc,
                totalUsers,
                totalComplaints,
                activeThanas,
            };
        })
    );

    return cityCorporationsWithStats;
}
```

## Verification

Created test script `test-city-corporation-stats.js` that confirms:

### Current Statistics (from database)
- **DNCC (Dhaka North City Corporation)**
  - Total Users: 6
  - Total Complaints: 1
  - Active Thanas: 18

- **DSCC (Dhaka South City Corporation)**
  - Total Users: 26
  - Total Complaints: 1
  - Active Thanas: 20

- **TEST063958 (Test City Corporation)**
  - Total Users: 0
  - Total Complaints: 0
  - Active Thanas: 0

## Frontend Display

The frontend was already correctly configured to display these statistics:

```typescript
<TableCell>
    <Chip
        label={cityCorporation.totalUsers || 0}
        size="small"
        sx={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 500,
        }}
    />
</TableCell>
<TableCell>
    <Chip
        label={cityCorporation.totalComplaints || 0}
        size="small"
        sx={{
            backgroundColor: '#fff3e0',
            color: '#e65100',
            fontWeight: 500,
        }}
    />
</TableCell>
<TableCell>
    <Chip
        label={cityCorporation.activeThanas || 0}
        size="small"
        sx={{
            backgroundColor: '#f3e5f5',
            color: '#7b1fa2',
            fontWeight: 500,
        }}
    />
</TableCell>
```

## Impact
- ✅ City Corporation table now shows accurate statistics
- ✅ Total Users count displays correctly
- ✅ Total Complaints count displays correctly
- ✅ Active Thanas count displays correctly
- ✅ Statistics update in real-time when data changes
- ✅ No breaking changes to existing functionality

## Performance Considerations

The updated implementation uses `Promise.all()` to fetch statistics for all city corporations in parallel, which is efficient for small numbers of city corporations (typically 2-3 in Bangladesh: DSCC, DNCC, and possibly others).

For larger datasets, consider:
1. Caching statistics with periodic updates
2. Using database views or materialized views
3. Implementing background jobs to pre-calculate statistics

## Testing

To test the fix:

1. **Backend Test**
   ```bash
   cd server
   node test-city-corporation-stats.js
   ```

2. **Frontend Test**
   - Open Admin Panel
   - Navigate to City Corporations page
   - Verify statistics are displayed correctly in the table
   - Add a new user and verify Total Users count increases
   - Add a new complaint and verify Total Complaints count increases
   - Add/activate a thana and verify Active Thanas count increases

## Files Modified
- `server/src/services/city-corporation.service.ts` - Updated getCityCorporations method
- `server/test-city-corporation-stats.js` - Created test script

## Date
November 21, 2025
