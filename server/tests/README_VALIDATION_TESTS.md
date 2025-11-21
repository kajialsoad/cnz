# DSCC/DNCC Zone Management - Validation Tests

## Quick Start

### Prerequisites
1. Start the server:
   ```bash
   cd server
   npm run dev
   ```

2. Ensure database is migrated and seeded:
   ```bash
   npx prisma migrate deploy
   node seed-city-corporations.js
   ```

3. Verify super admin exists (phone: 01700000000, password: Admin@123)

### Run All Tests
```bash
cd server
node tests/run-all-validation-tests.js
```

### Run Individual Tests
```bash
# Test 14.1: City Corporation Management
node tests/test-city-corporation-management.js

# Test 14.2: Thana Management
node tests/test-thana-management.js

# Test 14.3: User Signup Validation
node tests/test-signup-city-corporation-validation.js

# Test 14.4: User Management Filtering
node tests/test-user-management-filtering.js

# Test 14.5: Complaint Filtering
node tests/test-complaint-filtering.js

# Test 14.6: Chat Filtering
node tests/test-chat-filtering.js
```

## Test Suite Overview

| Test ID | Test Suite | Test Cases | Requirements |
|---------|-----------|------------|--------------|
| 14.1 | City Corporation Management | 7 | 10.1-10.8 |
| 14.2 | Thana Management | 7 | 11.1-11.8 |
| 14.3 | User Signup Validation | 5 | 1.1-1.5, 12.4-12.5 |
| 14.4 | User Management Filtering | 5 | 2.1-2.7, 13.1-13.3 |
| 14.5 | Complaint Filtering | 4 | 4.1-4.4, 14.1-14.3 |
| 14.6 | Chat Filtering | 4 | 5.1-5.3 |
| **Total** | **6 Test Suites** | **32 Tests** | **All Requirements** |

## Expected Output

### Successful Test Run
```
🎉 All validation tests passed successfully!
✅ Task 14: Testing and Validation - COMPLETE
```

### Failed Test Run
```
⚠️  Some test suites failed. Please review the output above.
❌ Task 14: Testing and Validation - INCOMPLETE
```

## Troubleshooting

### Server Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:4000
```
**Solution:** Start the server with `npm run dev`

### Authentication Failed
```
❌ Failed to get admin token
```
**Solution:** Verify super admin credentials or create admin user

### No Test Data
```
⚠️  No thanas available for testing
```
**Solution:** Run `node seed-city-corporations.js` to populate data

## Test Data

Tests use:
- Existing DSCC/DNCC city corporations
- Existing thanas from seed data
- Temporary test data (cleaned up automatically)

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Validation Tests
  run: |
    cd server
    npm install
    npx prisma migrate deploy
    node seed-city-corporations.js
    npm run dev &
    sleep 5
    node tests/run-all-validation-tests.js
```

## Documentation

See `.kiro/specs/dscc-dncc-zone-management/TASK_14_TESTING_VALIDATION_COMPLETE.md` for detailed documentation.
