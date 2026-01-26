# Vercel API Test Error Fixes

## Summary of Errors

Your test revealed two issues:
1. ❌ **City Corporations API (500 Error)** - Database connection issue
2. ❌ **Register API (400 Error)** - Outdated field names in test

## Issue 1: City Corporations API - 500 Error

### Problem
```
❌ City Corporations Error: 500 { success: false, message: 'Failed to fetch city corporations' }
```

### Root Cause
The Vercel deployment cannot connect to your cPanel MySQL database. This happens because:

1. **Database Connection String**: Vercel needs the correct `DATABASE_URL` environment variable
2. **SSL/TLS Configuration**: Remote MySQL connections may require SSL
3. **Firewall/IP Whitelist**: cPanel may block Vercel's IP addresses

### Solution Steps

#### Step 1: Verify Vercel Environment Variables
```bash
# Check if DATABASE_URL is set correctly on Vercel
vercel env ls
```

Your DATABASE_URL should be (with SSL disabled):
```
mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
```

**IMPORTANT:** The `?sslmode=disable` parameter is required because cPanel MySQL doesn't support SSL connections.

#### Step 2: Add Environment Variable to Vercel
```bash
# Add the database URL (with SSL disabled)
vercel env add DATABASE_URL

# When prompted, paste:
mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
```

**Critical:** Make sure to include `?sslmode=disable` - without it, you'll get SSL errors.

#### Step 3: Check cPanel Remote MySQL Settings
1. Log into your cPanel
2. Go to **Remote MySQL**
3. Add Vercel's IP ranges or use `%` (wildcard) for testing:
   - Add host: `%` (allows all IPs - for testing only)
   - Or add specific Vercel IPs

#### Step 4: Test Database Connection
Create a simple test endpoint to verify database connectivity:

```javascript
// Add to server/test-db-vercel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        const count = await prisma.cityCorporation.count();
        console.log(`✅ Found ${count} city corporations`);
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

testConnection();
```

## Issue 2: Register API - 400 Validation Error

### Problem
```
❌ Register Error: 400 {
  success: false,
  message: 'ওয়ার্ড নম্বর প্রয়োজন, "cityCorporation" is not allowed, "roadAddress" is not allowed'
}
```

### Root Cause
Your test is using **old field names** from before the zone-based refactoring:
- ❌ `cityCorporation` → ✅ `zone` or `cityCorporationCode`
- ❌ `roadAddress` → ✅ `address`
- ❌ `ward: 10` (number) → ✅ `ward: '10'` (string)

### Solution
I've already fixed the test file. The corrected payload is:

**Before (Old):**
```javascript
{
    firstName: 'Test',
    lastName: 'User',
    phone: '01700000000',
    email: 'test@test.com',
    password: 'Test123!',
    cityCorporation: 'DSCC',  // ❌ Wrong field
    ward: 10,                  // ❌ Wrong type
    roadAddress: 'Test Road'   // ❌ Wrong field
}
```

**After (Fixed):**
```javascript
{
    firstName: 'Test',
    lastName: 'User',
    phone: '01700000000',
    email: 'test@test.com',
    password: 'Test123!',
    zone: 'DSCC',              // ✅ Correct field
    ward: '10',                // ✅ Correct type (string)
    address: 'Test Road, Dhaka' // ✅ Correct field
}
```

## Expected Validation Schema

According to `server/src/utils/validation.ts`, the register endpoint accepts:

### Required Fields:
- `firstName` (string, 2-50 chars)
- `lastName` (string, 2-50 chars)
- `phone` (string, format: 01XXXXXXXXX)
- `password` (string, 6-128 chars)

### Optional Fields:
- `email` (string, valid email)
- `zone` (string, 'DSCC' or 'DNCC')
- `cityCorporationCode` (string, 'DSCC' or 'DNCC')
- `ward` (string)
- `thanaId` (number)
- `address` (string, max 255 chars)
- `role` (string, 'CUSTOMER' or 'SERVICE_PROVIDER')

## Common SSL Error

If you see this error in your mobile app or Vercel logs:
```
Error querying the database: Client asked for SSL but server does not have this capability
```

This means your database URL is missing the `?sslmode=disable` parameter. cPanel MySQL servers typically don't support SSL connections.

**Solution:** Add `?sslmode=disable` to the end of your DATABASE_URL:
```
mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
```

## Quick Fix Commands

### 1. Update Test File (Already Done)
The test file has been updated with correct field names.

### 2. Run Updated Test
```bash
cd server
node test-vercel-api.js
```

### 3. Add Vercel Environment Variables
```bash
# Set DATABASE_URL (with SSL disabled)
vercel env add DATABASE_URL
# Paste: mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable

# Redeploy to apply changes
vercel --prod
```

## Testing Checklist

- [x] Fixed register API test payload
- [ ] Verify DATABASE_URL on Vercel
- [ ] Check cPanel Remote MySQL whitelist
- [ ] Test database connection from Vercel
- [ ] Run updated test script
- [ ] Verify all endpoints return 200 OK

## Next Steps

1. **Add DATABASE_URL to Vercel** (most important)
2. **Whitelist Vercel IPs in cPanel**
3. **Redeploy to Vercel**
4. **Run the test again**

Once the database connection is fixed, all endpoints should work correctly.
ber