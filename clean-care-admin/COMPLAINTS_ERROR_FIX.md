# All Complaints Error Fix Guide

## Error Details
```
Error in getAdminComplaints: Error: Failed to fetch complaints
at AdminComplaintService.getAdminComplaints
```

## Possible Causes & Solutions

### 1. **Authentication Token Issue**

**Problem:** Frontend token expired বা invalid

**Solution:**
1. Browser console খুলুন (F12)
2. Application tab → Local Storage → Check `accessToken`
3. যদি token না থাকে বা expired হয়:
   - Logout করুন
   - আবার login করুন
   - Token refresh হবে

**Quick Fix:**
```javascript
// Browser console-এ run করুন
localStorage.clear();
location.reload();
// Then login again
```

### 2. **CORS Issue**

**Problem:** Frontend এবং backend different ports-এ চলছে

**Check:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

**Solution:**
Backend `.env` file check করুন:
```env
CORS_ORIGIN=http://localhost:5173
```

যদি different port হয়, update করুন এবং backend restart করুন।

### 3. **Database Connection Issue**

**Problem:** Database connection fail হচ্ছে

**Check:**
```bash
cd server
node test-complaints-endpoint.js
```

যদি এটা কাজ করে, তাহলে database ঠিক আছে।

**Solution:**
- Database credentials check করুন `.env` file-এ
- MySQL server running আছে কিনা check করুন

### 4. **Backend Not Running**

**Problem:** Backend server চালু নেই

**Check:**
```bash
curl http://localhost:4000/health
```

**Solution:**
```bash
cd server
npm run dev
```

### 5. **API Endpoint Mismatch**

**Problem:** Frontend wrong endpoint call করছে

**Check Frontend:**
```typescript
// clean-care-admin/src/config/apiConfig.ts
BASE_URL: 'http://localhost:4000'
ENDPOINTS.COMPLAINTS.LIST: '/api/admin/complaints'
```

**Check Backend:**
```typescript
// server/src/app.ts
app.use('/api/admin/complaints', adminComplaintRoutes);
```

## Debugging Steps

### Step 1: Check Browser Console
```javascript
// Open browser console (F12)
// Look for errors in Console tab
// Check Network tab for failed requests
```

### Step 2: Check Backend Logs
```bash
# Backend terminal-এ error logs দেখুন
# Prisma errors, database errors check করুন
```

### Step 3: Test Backend Directly
```bash
cd server
node test-complaints-endpoint.js
```

যদি এটা কাজ করে, তাহলে backend ঠিক আছে, সমস্যা frontend-এ।

### Step 4: Check Network Request
Browser DevTools → Network tab:
1. Request URL check করুন
2. Request Headers check করুন (Authorization token আছে কিনা)
3. Response check করুন (error message কি)

## Common Error Messages & Fixes

### "Failed to fetch complaints"
- Backend error
- Database query failed
- Check backend logs

### "Network Error"
- Backend not running
- CORS issue
- Wrong API URL

### "Unauthorized" (401)
- Token expired
- Token invalid
- Login again

### "Forbidden" (403)
- User doesn't have admin role
- Check user role in database

## Quick Fixes

### Fix 1: Clear Cache & Reload
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Restart Backend
```bash
# Stop backend (Ctrl+C)
cd server
npm run dev
```

### Fix 3: Restart Frontend
```bash
# Stop frontend (Ctrl+C)
cd clean-care-admin
npm run dev
```

### Fix 4: Check Database
```bash
cd server
npx prisma studio
# Check if complaints table has data
```

## Enhanced Error Logging

আমি এখন enhanced error logging যোগ করেছি:

```typescript
console.log('Fetching complaints with params:', {
  page, limit, filters
});

console.error('Error fetching complaints:', err);
console.error('Error response:', err.response?.data);
console.error('Error status:', err.response?.status);
```

এখন browser console-এ detailed error দেখতে পাবেন।

## Testing

### Test 1: Backend Health
```bash
curl http://localhost:4000/health
# Should return: {"ok":true,"status":"healthy"}
```

### Test 2: Backend Complaints Endpoint
```bash
cd server
node test-complaints-endpoint.js
# Should return complaints data
```

### Test 3: Frontend Login
1. Open `http://localhost:5173/login`
2. Login with: `admin@demo.com` / `Demo123!@#`
3. Should redirect to dashboard

### Test 4: Frontend Complaints Page
1. Navigate to All Complaints
2. Open browser console (F12)
3. Check for errors
4. Check Network tab for API calls

## Next Steps

1. **Browser refresh করুন** - Cache clear হবে
2. **Browser console check করুন** - Detailed error দেখুন
3. **Backend logs check করুন** - Server error দেখুন
4. **Test script run করুন** - Backend working কিনা verify করুন

যদি এখনো error থাকে, browser console-এর screenshot পাঠান।
