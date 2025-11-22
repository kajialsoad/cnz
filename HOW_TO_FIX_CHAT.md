# How to Fix Chat - Step by Step

## The Real Problem

You're opening **Complaint ID 123 ("munna")** which has NO admin messages.
The admin sent messages to **Complaint ID 121 ("amar jodi taka nah deo ami kaj kormu nah")**.

## Step-by-Step Fix

### Step 1: Stop the App Completely
1. Close the mobile app completely (don't just hot reload)
2. Stop the Flutter process in your IDE
3. Restart the app from scratch

### Step 2: Find the Correct Complaint
In the mobile app, look for the complaint with title:
**"amar jodi taka nah deo ami kaj kormu nah"**

This is Complaint ID 121 and it has 2 admin messages.

### Step 3: Open That Complaint's Chat
1. Tap on complaint "amar jodi taka nah deo ami kaj kormu nah"
2. Open the chat
3. You should see 2 messages from the admin

## Why Complaint 123 Shows "Not Found"

From the database:
- **Complaint 123** ("munna") exists and belongs to Rahim Ahmed
- But it only has 1 message from CITIZEN (the test message)
- It has NO admin messages

The backend returns 404 because of the ownership check I added. Let me verify if complaint 123 actually exists...

Actually, looking at the logs again:
```
📡 API Request: GET http://localhost:4000/complaints/123/chat
📥 API Response: 404
```

The 404 means either:
1. The complaint doesn't exist
2. The complaint doesn't belong to the logged-in user
3. There's a server error

## Quick Test

Let me check if the API is working for complaint 123:

```bash
# Test if complaint 123 exists and belongs to user
curl -X GET "http://192.168.0.100:4000/api/complaints/123/chat" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## The Localhost Issue

The logs still show `localhost:4000` which means:
1. The app hasn't restarted yet (hot reload doesn't work for this change)
2. OR you're running on iOS simulator (which uses localhost)

**Solution**: 
- If on Android: Stop and restart the app completely
- If on iOS simulator: Change `localIosUrl` in `api_config.dart` to your computer's IP

## Summary

**Two issues:**
1. ✅ Fixed: Changed `baseUrl` to a getter (needs full app restart)
2. ❌ Main issue: You're opening complaint 123 which has no admin messages
   - **Solution**: Open complaint 121 instead

**Next step**: Find and open complaint "amar jodi taka nah deo ami kaj kormu nah" (ID: 121)
