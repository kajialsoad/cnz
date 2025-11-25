# ✅ Complaint List Fix - Complete Solution

## Problem Identified
আপনার mobile app এ complaint list দেখাচ্ছে না কারণ:

1. **Port Mismatch** - App configured for port 4000, but server runs on port 3000
2. **Wrong Android Emulator URL** - Using `192.168.0.100` instead of `10.0.2.2`
3. **Offline Mode** - App thinks it's offline because it can't reach the server

## ✅ Fix Applied

### File: `lib/config/api_config.dart`

**Changed:**
```dart
// OLD (WRONG)
static const String localAndroidUrl = 'http://192.168.0.100:4000';

// NEW (CORRECT)
static const String localAndroidUrl = 'http://10.0.2.2:3000';
```

**Why `10.0.2.2`?**
- Android emulator এর জন্য `10.0.2.2` হল host machine এর localhost
- `192.168.0.100` শুধুমাত্র physical device এর জন্য (same network এ থাকলে)

## 🚀 How to Test

### Step 1: Make Sure Server is Running
```bash
cd server
npm run dev
```

Server should show:
```
🚀 Server running on port 3000
```

### Step 2: Rebuild and Run the App

**Option A: Hot Restart (Recommended)**
```bash
# In your Flutter terminal, press:
r  # for hot reload
R  # for hot restart (better for config changes)
```

**Option B: Full Rebuild**
```bash
flutter clean
flutter pub get
flutter run
```

### Step 3: Test the Fix

1. **Login** to the app
2. **Navigate** to complaint list page (আমার অভিযোগ)
3. **Pull down** to refresh
4. You should see:
   - ✅ Offline banner disappears
   - ✅ Complaints load from server
   - ✅ List shows your complaints

## 📱 Platform-Specific URLs

### Android Emulator
```dart
http://10.0.2.2:3000  // ✅ Use this
```

### Android Physical Device
```dart
http://192.168.0.100:3000  // Your computer's IP on same WiFi
```

To find your computer's IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### iOS Simulator
```dart
http://localhost:3000  // ✅ Works directly
```

### Web (Chrome)
```dart
http://localhost:3000  // ✅ Works directly
```

## 🔧 If Still Not Working

### Check 1: Server is Accessible
Test from your device browser:
```
http://10.0.2.2:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Check 2: User Has Complaints
Run this to check:
```bash
cd server
node test-mobile-complaint-fetch.js
```

Update credentials in the script first!

### Check 3: Token is Valid
In the app:
1. Go to Profile
2. Logout
3. Login again
4. Try complaint list again

### Check 4: Clear App Cache
```bash
flutter clean
flutter pub get
flutter run
```

## 🎯 Quick Test Script

Create a test complaint to verify everything works:

```bash
cd server
node -e "
const axios = require('axios');

async function test() {
  // Login
  const login = await axios.post('http://localhost:3000/api/auth/login', {
    phone: '01712345678',  // Change to your test user
    password: 'password123'
  });
  
  const token = login.data.data.accessToken;
  console.log('✅ Logged in');
  
  // Get complaints
  const complaints = await axios.get('http://localhost:3000/api/complaints', {
    headers: { Authorization: 'Bearer ' + token }
  });
  
  console.log('✅ Complaints:', complaints.data.data.complaints.length);
  complaints.data.data.complaints.forEach(c => {
    console.log('  -', c.id, c.description.substring(0, 30));
  });
}

test().catch(console.error);
"
```

## 📋 Checklist

Before testing, make sure:

- [ ] Server is running on port 3000
- [ ] `api_config.dart` has correct URLs
- [ ] App is rebuilt/restarted
- [ ] User is logged in
- [ ] User has at least one complaint in database
- [ ] Device/emulator can reach the server

## 🐛 Common Errors and Solutions

### Error: "Network error. Please check your internet connection"
**Solution:** 
- Check if server is running
- Verify URL in `api_config.dart`
- For emulator, use `10.0.2.2:3000`
- For physical device, use your computer's IP

### Error: "You are offline" banner shows
**Solution:**
- This means app can't reach server
- Check URL configuration
- Test server accessibility from browser

### Error: "Authentication required" (401)
**Solution:**
- Token expired
- Logout and login again

### Error: Empty list but no error
**Solution:**
- User has no complaints
- Create a test complaint
- Or check if API is returning data

## 🎉 Expected Result

After fix, you should see:

```
আমার অভিযোগ (My Complaints)
┌─────────────────────────────┐
│ #123                 Pending │
│ রাস্তায় গর্ত                │
│ 📍 Dhaka, Bangladesh         │
│ 🕐 2 hours ago              │
└─────────────────────────────┘
┌─────────────────────────────┐
│ #122            In Progress │
│ ময়লা জমে আছে               │
│ 📍 Dhaka, Bangladesh         │
│ 🕐 1 day ago                │
└─────────────────────────────┘
```

## 📞 Need More Help?

1. Share Flutter logs: `flutter logs > debug.log`
2. Share server logs
3. Run test script and share output
4. Check if user exists in database:
   ```bash
   cd server
   node check-user.js  # Create this if needed
   ```

## 🔄 Next Steps

After complaints load successfully:

1. **Test offline mode:**
   - Load complaints while online
   - Turn off WiFi
   - Complaints should still show from cache
   - "You are offline" banner should appear

2. **Test pull-to-refresh:**
   - Pull down on complaint list
   - Should fetch fresh data

3. **Test complaint details:**
   - Tap on a complaint
   - Should open detail view

4. **Test chat:**
   - Open complaint detail
   - Try sending a message

---

## Summary

**Main Issue:** Port mismatch (4000 vs 3000) and wrong Android emulator URL

**Fix:** Updated `lib/config/api_config.dart` with correct URLs and port

**Action Required:** Rebuild app and test

**Expected Time:** 2-3 minutes to rebuild and test
