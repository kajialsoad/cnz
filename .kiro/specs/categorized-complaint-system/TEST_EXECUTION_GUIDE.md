# Test Execution Guide - Categorized Complaint System

## Quick Start

This guide explains how to run the existing test scripts for the categorized complaint system.

## Prerequisites

### 1. Backend Server Running
```bash
cd server
npm run dev
```
The server should be running on `http://localhost:4000`

### 2. Database Setup
Ensure your database has:
- Category fields in Complaint table
- Test complaints with categories
- Admin user account

### 3. Environment Variables
Check `server/.env` has:
```
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
PORT=4000
```

## Backend Tests

### Test 1: Category Service Logic
Tests the core CategoryService methods without requiring a running server.

```bash
cd server
npm run build  # Compile TypeScript first
node test-category-service.js
```

**What it tests:**
- Get all categories (8 categories)
- Get category by ID
- Get subcategories
- Validate category/subcategory combinations
- Get category/subcategory names in English and Bangla
- Get category colors

**Expected output:**
```
Testing Category Service...

1️⃣ Testing getAllCategories():
   Total categories: 8
   - Home/House (বাসা/বাড়ি): 3 subcategories
   - Road & Environment (রাস্তা ও পরিবেশ): 3 subcategories
   ...

✅ All tests completed!
```

### Test 2: Category API Endpoints
Tests the REST API endpoints for categories.

```bash
cd server
node test-category-api-manual.js
```

**What it tests:**
- GET /api/categories
- GET /api/categories/:categoryId
- GET /api/categories/:categoryId/subcategories

**Expected output:**
```
=================================================
Category API Manual Test
=================================================

Test 1: GET /api/categories
----------------------------
✅ Success! Found 8 categories
...
```

### Test 3: Category Analytics
Tests the analytics endpoints for category statistics.

```bash
cd server
node test-category-analytics.js
```

**What it tests:**
- GET /api/admin/analytics/categories
- GET /api/admin/analytics/categories with date filters
- GET /api/admin/analytics/categories/trends
- Different time periods (day, week, month)

**Prerequisites:**
- Admin authentication token
- Complaints with categories in database

**Expected output:**
```
📊 Testing GET /api/admin/analytics/categories...
✅ Success! Retrieved category statistics
...
```

### Test 4: Complaint Category Flow
Tests the complete complaint creation and filtering flow.

```bash
cd server
node test-complaint-category-flow.js
```

**What it tests:**
- Create complaint with valid category
- Invalid category validation
- Create complaints for all 8 categories
- Filter by category
- Filter by subcategory

**Prerequisites:**
- User authentication token
- Database with write access

**Expected output:**
```
=== Test 1: Get All Categories ===
✅ Get All Categories - PASSED
   Found 8 categories

=== Test 2: Create Complaint with Valid Category ===
✅ Create Complaint with Category - PASSED
...
```

### Test 5: Mobile Complaint Submission
Comprehensive end-to-end test simulating mobile app submissions.

```bash
cd server
node test-mobile-complaint-submission.js
```

**What it tests:**
- Submit complaints for all 8 categories
- Submit complaints for all 22 subcategories
- Invalid category validation
- Invalid subcategory validation
- Wrong category-subcategory combinations
- Filter by category
- Category analytics

**Prerequisites:**
- User authentication token
- Image files for upload (optional)
- Database with write access

**Expected output:**
```
🧪 Testing Mobile App Complaint Submission with Categories
==========================================================

📋 Test 1: Submit Complaints for All Categories
-----------------------------------------------------------
Testing category: Home/House (home)
   ✅ home / not_collecting_waste
   ✅ home / worker_behavior
   ✅ home / billing_issue
...
```

## Admin Panel Tests

### Test 6: Category Statistics API
Tests the admin panel's integration with category statistics.

```bash
cd clean-care-admin
node test-category-stats.js
```

**Prerequisites:**
- Update `ADMIN_TOKEN` in the file with a valid admin token
- Backend server running

**How to get admin token:**
1. Login to admin panel
2. Open browser DevTools > Application > Local Storage
3. Copy the `token` value
4. Update the `ADMIN_TOKEN` variable in the test file

**What it tests:**
- Get all category statistics
- Get category statistics with date range
- Get category trends

**Expected output:**
```
🧪 Testing Category Statistics API...

Test 1: Get all category statistics
✅ Success! Retrieved 8 categories with statistics
...
```

### Test 7: Category Filters
Tests the category filter functionality in the admin panel.

```bash
cd clean-care-admin
node test-category-filters.cjs
```

**Prerequisites:**
- Update admin credentials in the file
- Backend server running

**What it tests:**
- Fetch all categories
- Fetch subcategories for each category
- Filter complaints by category
- Filter complaints by category and subcategory
- URL parameter structure

**Expected output:**
```
🧪 Testing Category Filter Functionality

1️⃣ Testing admin login...
✅ Admin login successful

2️⃣ Testing category fetching...
✅ Fetched 8 categories
...
```

## Troubleshooting

### Error: "Cannot find module"
**Solution:** Run `npm run build` in the server directory to compile TypeScript.

### Error: "ECONNREFUSED"
**Solution:** Make sure the backend server is running on port 4000.

### Error: "Unauthorized" or "Invalid token"
**Solution:** Update the authentication token in the test file.

### Error: "Database connection failed"
**Solution:** Check your DATABASE_URL in .env file.

### Error: "Category not found"
**Solution:** Ensure the database has been migrated with category fields.

## Test Data Cleanup

After running tests, you may want to clean up test data:

```sql
-- Delete test complaints (be careful in production!)
DELETE FROM "Complaint" WHERE description LIKE '%Test complaint%';
```

## Automated Testing (Future)

For production, consider setting up:

1. **Jest for Backend**
```bash
npm install --save-dev jest @types/jest ts-jest
```

2. **React Testing Library for Frontend**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

3. **Cypress for E2E**
```bash
npm install --save-dev cypress
```

## Test Coverage Matrix

| Feature | Backend Test | Admin Test | E2E Test |
|---------|-------------|------------|----------|
| Get all categories | ✅ | ✅ | ✅ |
| Get category by ID | ✅ | ✅ | ✅ |
| Get subcategories | ✅ | ✅ | ✅ |
| Validate category | ✅ | ❌ | ✅ |
| Create complaint | ✅ | ❌ | ✅ |
| Filter by category | ✅ | ✅ | ✅ |
| Category analytics | ✅ | ✅ | ✅ |
| Invalid category | ✅ | ❌ | ✅ |
| Invalid subcategory | ✅ | ❌ | ✅ |

## Summary

All tests are **manual scripts** that need to be run individually. They provide comprehensive coverage of:
- ✅ Category service logic
- ✅ Category API endpoints
- ✅ Complaint creation with categories
- ✅ Complaint filtering
- ✅ Category analytics
- ✅ Admin panel integration

Run these tests before deploying to staging or production to ensure the categorized complaint system is working correctly.
