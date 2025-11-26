# Complaint List Offline Issue - Fix Guide

## Problem
The mobile app complaint list page shows "এখনও কোন অভিযোগ নেই" (No complaints yet) and displays "You are offline" banner, even though the server is running.

## Root Causes

### 1. **Network Connectivity Issue**
The app detects that it's offline, so it's not fetching data from the server.

**Solution:**
- Check if your device/emulator can reach the server
- Verify the API base URL in the app configuration
- Make sure the server is running on the correct port

### 2. **No Cached Data**
The app hasn't successfully loaded complaints before, so there's no offline cache to display.

**Solution:**
- Connect to the internet first
- Let the app load complaints successfully
- Then the offline cache will work

### 3. **Authentication Token Expired**
The user's access token may have expired.

**Solution:**
- Log out and log back in
- The app should automatically refresh the token

## Step-by-Step Fix

### Step 1: Check Server Status
```bash
cd server
npm run dev
```

Make sure the server is running on `http://localhost:3000`

### Step 2: Test API Connectivity
Run the test script to verify the API is working:

```bash
node test-mobile-complaint-fetch.js
```

Update the test credentials in the script first:
```javascript
const TEST_USER = {
  phone: '01712345678', // Your test user phone
  password: 'password123' // Your test user password
};
```

### Step 3: Check Mobile App Configuration

**File:** `lib/main.dart` or wherever API client is initialized

Look for the base URL configuration:
```dart
final apiClient = ApiClient('http://localhost:3000');
```

**For Android Emulator:**
- Use `http://10.0.2.2:3000` instead of `localhost:3000`

**For iOS Simulator:**
- Use `http://localhost:3000` or your computer's IP address

**For Physical Device:**
- Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Make sure both devices are on the same network

### Step 4: Create Test Complaints

If the user has no complaints, create some test data:

```bash
cd server
node create-test-complaints.js
```

Or manually create a complaint through the app when online.

### Step 5: Clear App Cache and Retry

In the mobile app:
1. Log out
2. Clear app data (or reinstall)
3. Log back in
4. Navigate to complaint list

### Step 6: Check Network Permissions

**Android:** `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**iOS:** `ios/Runner/Info.plist`
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## Quick Diagnostic Commands

### 1. Check if server is accessible from device
```bash
# From your computer
ipconfig  # Windows
ifconfig  # Mac/Linux

# Note your IP address, then test from device browser:
# http://YOUR_IP:3000/api/health
```

### 2. Check Flutter app logs
```bash
flutter logs
```

Look for:
- Network errors
- API call failures
- Authentication errors

### 3. Test API endpoint directly
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"01712345678","password":"password123"}'

# Test complaints (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/complaints \
  -H "Authorization: Bearer TOKEN"
```

## Common Issues and Solutions

### Issue 1: "Network error. Please check your internet connection"
**Cause:** App can't reach the server
**Fix:** 
- Use correct IP address for your platform
- Check firewall settings
- Ensure server is running

### Issue 2: "Authentication required" or 401 error
**Cause:** Token expired or invalid
**Fix:**
- Log out and log back in
- Check token refresh logic in `api_client.dart`

### Issue 3: Empty complaint list but API returns data
**Cause:** JSON parsing error or model mismatch
**Fix:**
- Check `Complaint.fromJson()` in `complaint.dart`
- Verify API response structure matches model

### Issue 4: Offline banner always shows
**Cause:** Connectivity service not detecting network
**Fix:**
- Check `connectivity_service.dart`
- Verify connectivity_plus package is installed
- Test on real device (emulator connectivity detection can be unreliable)

## Testing Checklist

- [ ] Server is running
- [ ] API endpoints respond correctly
- [ ] User can log in successfully
- [ ] Token is saved in SharedPreferences
- [ ] API base URL is correct for platform
- [ ] Network permissions are granted
- [ ] User has at least one complaint in database
- [ ] Complaint list API returns data
- [ ] App can parse the response correctly
- [ ] Offline cache is working

## Debug Mode

Enable debug logging in the app:

**File:** `lib/services/api_client.dart`

Add logging to see what's happening:
```dart
Future<Map<String, dynamic>> get(String path) async {
  print('🌐 API GET: $baseUrl$path');
  final token = await _getAccessToken();
  print('🔑 Token: ${token?.substring(0, 20)}...');
  
  try {
    final res = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    ).timeout(timeout);
    
    print('✅ Response: ${res.statusCode}');
    print('📦 Body: ${res.body}');
    
    return _handleResponse(res);
  } catch (e) {
    print('❌ Error: $e');
    rethrow;
  }
}
```

## Need More Help?

1. Run the test script and share the output
2. Check Flutter logs: `flutter logs > flutter_debug.log`
3. Check server logs for incoming requests
4. Verify the user exists and has complaints in the database
