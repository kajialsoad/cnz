# Chat Not Loading - Debug Guide

## Problem
Rahim Ahmed can see messages were sent in the admin panel, but the mobile app shows "মেসেজ লোড করতে ব্যর্থ" (Failed to load messages).

## Investigation Results

From the database check, Rahim Ahmed (User ID: 1) has these complaints with chat messages:

| Complaint ID | Title | Messages |
|--------------|-------|----------|
| 1 | Garbage not collected | 2 messages |
| 9 | drain is clogged, needs cleaning | 1 message |
| 11 | drain is clogged, needs cleaning | 1 message |
| 13 | munnnaa | 1 message |
| 14 | whshd | 1 message |
| 104 | Test complaint for Road & Environment | 1 message |
| 110 | Test complaint for Office - billing_issue | 1 message |
| **121** | **amar jodi taka nah deo ami kaj kormu nah** | **2 messages** |
| 123 | munna | 1 message |

## Most Likely Issue

Looking at the admin panel screenshot, it shows:
- Complaint: "amar jodi taka nah deo ami kaj kormu nah" (Complaint ID: 121)
- This complaint has 2 admin messages

But the mobile app screenshot shows:
- Title: "munna" (which could be Complaint ID 123 or 13)

**The user might be opening the wrong complaint in the mobile app!**

## How to Debug

### Step 1: Check Console Logs
I've added logging to the mobile app. When you open the chat, check the Flutter console for:
```
🔍 Loading chat for complaint ID: [ID]
   Complaint title: [Title]
   Parsed complaint ID: [Number]
📡 API Request: GET http://...
📥 API Response: [Status Code]
```

### Step 2: Verify Complaint ID
1. In the mobile app, go to the complaint list
2. Find the complaint "amar jodi taka nah deo ami kaj kormu nah" (ID: 121)
3. Open that complaint's chat
4. It should load the 2 admin messages

### Step 3: Test with Known Working Complaint
Try opening chat for Complaint ID 121 which definitely has messages:
- Title: "amar jodi taka nah deo ami kaj kormu nah"
- Has 2 admin messages: "add" and "hai"

## Possible Causes

1. **Wrong Complaint**: User is opening a different complaint than the one shown in admin panel
2. **Complaint ID Mismatch**: The complaint ID being passed is incorrect
3. **Ownership Issue**: The complaint doesn't belong to the logged-in user (though database shows it does)
4. **Network Issue**: API request is failing or timing out

## Quick Fix

To test if the API is working, try this:

1. Login as Rahim Ahmed (phone: 01712345678, password: Demo123!@#)
2. Open complaint ID 121 ("amar jodi taka nah deo ami kaj kormu nah")
3. Click on chat
4. You should see 2 messages from admin

If this works, then the issue is that the user was opening the wrong complaint.

## API Test

You can test the API directly:

```bash
# Login
curl -X POST http://192.168.0.100:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"01712345678","password":"Demo123!@#"}'

# Get chat messages (replace TOKEN with the accessToken from login)
curl -X GET "http://192.168.0.100:4000/api/complaints/121/chat" \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

1. Check the console logs to see which complaint ID is being accessed
2. Verify the user is opening the correct complaint
3. If the API returns 404 or 403, check if the complaint exists and belongs to the user
4. If the API returns 200 but no messages, check the database for that specific complaint
