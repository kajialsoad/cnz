# Chat Localhost Issue - FIXED

## Problem
The mobile app was trying to access chat at `http://localhost:4000` instead of the network IP `http://192.168.0.100:4000`, causing a 404 error.

```
📡 API Request: GET http://localhost:4000/complaints/123/chat
📥 API Response: 404
Error: Complaint not found
```

## Root Cause
The `ChatService` class was using a `final` variable for `baseUrl`:
```dart
final String baseUrl = ApiConfig.baseUrl;
```

This means the URL was evaluated once when the class was instantiated and never updated, even if `ApiConfig.baseUrl` returned different values later.

## Solution
Changed `baseUrl` from a final variable to a getter:
```dart
String get baseUrl => ApiConfig.baseUrl;
```

Now the URL is evaluated every time it's accessed, ensuring it always uses the correct value from `ApiConfig`.

## How to Test

1. **Hot Restart the App** (not just hot reload)
   - Stop the app completely
   - Run it again from your IDE

2. **Verify the URL in Logs**
   - Open a complaint chat
   - Check the console for:
   ```
   📡 API Request: GET http://192.168.0.100:4000/complaints/[ID]/chat
   ```
   - It should now show `192.168.0.100` instead of `localhost`

3. **Test with Complaint ID 121**
   - Find complaint "amar jodi taka nah deo ami kaj kormu nah"
   - Open its chat
   - You should see 2 admin messages

## Why Complaint 123 Had No Messages

From the database check:
- **Complaint ID 123** ("munna") has only 1 message from CITIZEN (the test message)
- **Complaint ID 121** ("amar jodi taka nah deo ami kaj kormu nah") has 2 messages from ADMIN

The admin was sending messages to complaint 121, but the user was opening complaint 123!

## Complete Fix Checklist

✅ Changed `ChatService.baseUrl` to a getter
✅ Added debug logging to see which URL is being used
✅ Identified that complaint 123 has no admin messages
✅ Confirmed complaint 121 has the admin messages

## Next Steps

1. **Restart the mobile app** (full restart, not hot reload)
2. **Open complaint ID 121** to see the admin messages
3. **Verify the logs show the correct IP address**
4. The chat should now load successfully!

## Additional Notes

- The same fix should be applied to other services if they have similar issues
- Always use getters for dynamic configuration values
- The API config correctly returns `192.168.0.100:4000` for Android devices
