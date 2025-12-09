# Login Navigation Issue - Debug Guide

## 🔴 সমস্যা
Login form থেকে login করার পর blank page দেখাচ্ছে এবং dashboard যাচ্ছে না।

## 🔍 Debug Steps

### Step 1: Browser Console Check করুন
1. Browser এ F12 press করুন
2. Console tab এ যান
3. Login করার চেষ্টা করুন
4. কোনো error message দেখা যাচ্ছে কিনা check করুন

### Step 2: Network Tab Check করুন
1. F12 > Network tab
2. Login button click করুন
3. Check করুন:
   - `/api/admin/auth/login` - Status 200 হওয়া উচিত
   - `/api/admin/auth/profile` - Status 200 হওয়া উচিত
   - Response এ `accessToken` এবং `user` data আছে কিনা

### Step 3: LocalStorage Check করুন
1. F12 > Application tab (Chrome) বা Storage tab (Firefox)
2. Local Storage > `http://localhost:5173`
3. Check করুন:
   - `accessToken` key আছে কিনা
   - Token value আছে কিনা

### Step 4: Backend Server Check করুন
```bash
# Server চালু আছে কিনা check করুন
cd server
npm run dev
```

Server console এ login request আসছে কিনা দেখুন।

## 🛠️ সম্ভাব্য সমাধান

### Solution 1: Hard Reload
1. Ctrl + Shift + R (Windows) বা Cmd + Shift + R (Mac)
2. Cache clear করে page reload করুন

### Solution 2: Clear Browser Data
1. F12 > Application > Clear Storage
2. "Clear site data" button click করুন
3. Page reload করুন

### Solution 3: Check BASE_URL Configuration
```bash
# clean-care-admin/.env file check করুন
VITE_API_BASE_URL=http://localhost:4000
VITE_BASE_URL=/admin
```

### Solution 4: Server Restart
```bash
# Backend server restart করুন
cd server
npm run dev

# Frontend restart করুন (নতুন terminal এ)
cd clean-care-admin
npm run dev
```

## 📝 পরিবর্তন করা হয়েছে

### File: `clean-care-admin/src/pages/Login/Login.tsx`

**Change:** `navigate()` এর পরিবর্তে `window.location.href` ব্যবহার করা হয়েছে

**কারণ:** 
- React Router এর `navigate()` state update এর জন্য wait করে
- `window.location.href` immediate redirect করে
- এটা page reload করে এবং fresh authentication check করে

```typescript
// Before
navigate(from, { replace: true });

// After
window.location.href = redirectPath;
```

## 🧪 Test করার নিয়ম

### Test 1: Fresh Login
1. Browser এ `http://localhost:5173/admin/login` যান
2. Email: `superadmin@demo.com`
3. Password: `Demo123!@#`
4. "Sign in to Dashboard" click করুন
5. **Expected:** Dashboard page load হবে

### Test 2: Console Check
Login করার সময় console এ এই messages দেখা উচিত:
```
POST http://localhost:4000/api/admin/auth/login 200
GET http://localhost:4000/api/admin/auth/profile 200
```

### Test 3: Token Verification
Login successful হলে localStorage এ `accessToken` থাকবে:
```javascript
// Console এ run করুন
localStorage.getItem('accessToken')
// Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (একটা JWT token)
```

## ❌ Common Errors এবং সমাধান

### Error 1: "Network Error"
**কারণ:** Backend server চালু নেই
**সমাধান:** `cd server && npm run dev`

### Error 2: "401 Unauthorized"
**কারণ:** Wrong credentials বা token expired
**সমাধান:** Correct credentials ব্যবহার করুন

### Error 3: "CORS Error"
**কারণ:** Backend CORS configuration সমস্যা
**সমাধান:** `server/src/app.ts` এ CORS settings check করুন

### Error 4: Blank Page
**কারণ:** JavaScript error বা routing issue
**সমাধান:** 
1. Console check করুন
2. Hard reload করুন (Ctrl + Shift + R)
3. Browser cache clear করুন

## 🔧 Additional Debugging

### Enable Verbose Logging
`clean-care-admin/src/contexts/AuthContext.tsx` এ logging add করুন:

```typescript
const login = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log('🔐 Login started...');
    const response = await authService.login({ email, password, rememberMe });
    console.log('✅ Login successful, user:', response.user);
    setUser(response.user);
    console.log('✅ User state updated');
};
```

### Check Router Configuration
`clean-care-admin/src/App.tsx` এ routing check করুন:
```typescript
<Router basename={import.meta.env.BASE_URL}>
```

## 📞 যদি এখনও কাজ না করে

1. **Screenshot নিন:** Console errors এর
2. **Network tab screenshot:** Login request/response এর
3. **Server logs:** Backend console output এর
4. **Browser:** কোন browser ব্যবহার করছেন (Chrome/Firefox/Edge)
5. **OS:** Windows/Mac/Linux

এই information দিয়ে আরো specific help পাবেন।

---

**Last Updated:** December 9, 2025
**Status:** 🔧 Debugging
