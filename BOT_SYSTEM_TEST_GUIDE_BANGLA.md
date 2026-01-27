# Bot System - সম্পূর্ণ টেস্টিং গাইড
## আপনি নিজে টেস্ট করতে পারবেন

**তারিখ:** ২৭ জানুয়ারি, ২০২৬  
**উদ্দেশ্য:** Bot system ঠিকমতো কাজ করছে কিনা verify করা

---

## 🎯 Diagnosis Results থেকে যা জানা গেছে

আপনার diagnosis output দেখে মনে হচ্ছে:

✅ **Bot Trigger Rules:** Configured (Threshold = 3)  
✅ **Bot Messages:** 3 steps configured  
✅ **Bot Conversation States:** Database এ data আছে  
✅ **Bot Deactivation:** complaint-423 এ working (isActive=false after admin reply)

**তাহলে সমস্যা কি?**

আমাকে জানান:
1. কোন specific scenario তে problem হচ্ছে?
2. Expected behavior কি?
3. Actual behavior কি?

---

## 🧪 Manual Testing Steps (আপনি করুন)

### **Test 1: Bot Looping (Admin না থাকলে)**

**Scenario:** Admin reply দেয়নি, bot continuously message পাঠাবে

**Steps:**
1. Live Chat খুলুন (user হিসেবে login করুন)
2. Message পাঠান: "Hello"
   - ✅ **Expected:** Bot reply আসবে (Step 1)
   - ❌ **If not:** Bot message configured নেই
3. Message পাঠান: "I need help"
   - ✅ **Expected:** Bot reply আসবে (Step 2)
4. Message পাঠান: "My issue is..."
   - ✅ **Expected:** Bot reply আসবে (Step 3)
5. Message পাঠান: "When will you help?"
   - ✅ **Expected:** Bot reply আসবে (Step 1 - LOOP back)
6. Message পাঠান: "Still waiting"
   - ✅ **Expected:** Bot reply আসবে (Step 2 - LOOP continues)

**Database Check:**
```sql
SELECT * FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{your-user-id}'
ORDER BY "updatedAt" DESC LIMIT 1;
```

**Expected State:**
- `isActive` = true ✅
- `currentStep` = 2 (অথবা যেখানে আছে)
- `userMessageCount` = 0 (bot active থাকলে increment হয় না)
- `lastAdminReplyAt` = null

---

### **Test 2: Bot Deactivation (Admin Reply)**

**Scenario:** Admin reply দিলে bot তৎক্ষণাৎ deactivate হবে

**Steps:**
1. Continue from Test 1
2. Admin হিসেবে login করুন
3. Live Chat page এ যান
4. User এর conversation select করুন
5. Admin message পাঠান: "Hi, I'm here to help you"
   - ✅ **Expected:** Message পাঠানো হবে
   - ✅ **Expected:** Bot তৎক্ষণাৎ deactivate হবে
6. User হিসেবে message পাঠান: "Thanks for your help"
   - ❌ **Expected:** Bot reply আসবে না
   - ✅ **If bot replies:** এটি সমস্যা! Bot deactivate হয়নি
7. User message পাঠান: "Can you help me?"
   - ❌ **Expected:** Bot reply আসবে না

**Database Check:**
```sql
SELECT * FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{your-user-id}'
ORDER BY "updatedAt" DESC LIMIT 1;
```

**Expected State:**
- `isActive` = false ✅ (CRITICAL!)
- `userMessageCount` = 0 ✅ (reset হয়েছে)
- `lastAdminReplyAt` = recent timestamp ✅
- `currentStep` = যেখানে ছিল (unchanged)

**If bot still sends messages after admin reply:**
- ❌ **Problem:** Bot deactivation synchronous নয়
- ❌ **Problem:** `handleAdminReply()` call হচ্ছে না
- ❌ **Problem:** Admin message create এর পর bot deactivate হচ্ছে (হওয়া উচিত আগে)

---

### **Test 3: Bot Reactivation (Threshold = 3)**

**Scenario:** Admin reply এর পর 3টি user message এ bot reactivate হবে

**Steps:**
1. Continue from Test 2 (bot deactivated)
2. User message পাঠান: "Hello?" (count = 1)
   - ❌ **Expected:** Bot reply আসবে না
   - ✅ **Check:** userMessageCount = 1
3. User message পাঠান: "Anyone there?" (count = 2)
   - ❌ **Expected:** Bot reply আসবে না
   - ✅ **Check:** userMessageCount = 2
4. User message পাঠান: "Please help me" (count = 3)
   - ✅ **Expected:** Bot REACTIVATES!
   - ✅ **Expected:** Bot reply আসবে (Step 1 অথবা continue)
5. User message পাঠান: "Thank you"
   - ✅ **Expected:** Bot reply আসবে (next step)

**Database Check:**
```sql
SELECT * FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{your-user-id}'
ORDER BY "updatedAt" DESC LIMIT 1;
```

**Expected State After Message 2:**
- `isActive` = false
- `userMessageCount` = 2

**Expected State After Message 3:**
- `isActive` = true ✅ (REACTIVATED!)
- `userMessageCount` = 0 ✅ (reset হয়েছে)
- `currentStep` = 1 (অথবা continue)

**If bot doesn't reactivate:**
- ❌ **Problem:** Threshold logic কাজ করছে না
- ❌ **Problem:** `shouldTriggerBot()` এ threshold check ভুল
- ❌ **Problem:** `userMessageCount` increment হচ্ছে না

---

### **Test 4: Dynamic Threshold Change**

**Scenario:** System Control থেকে threshold change করলে কাজ করবে

**Steps:**
1. System Control page এ যান: `/admin/system-control`
2. Live Chat select করুন
3. Reactivation Threshold = 5 set করুন
4. Save changes
5. Database check করুন:
   ```sql
   SELECT * FROM "BotTriggerRule" 
   WHERE "chatType" = 'LIVE_CHAT';
   ```
   - ✅ **Expected:** `reactivationThreshold` = 5
6. Live Chat এ test করুন:
   - Admin reply দিন → Bot deactivate
   - User message 1 → Bot নেই (count = 1)
   - User message 2 → Bot নেই (count = 2)
   - User message 3 → Bot নেই (count = 3)
   - User message 4 → Bot নেই (count = 4)
   - User message 5 → Bot REACTIVATES! ✅

**If threshold change doesn't work:**
- ❌ **Problem:** Frontend API call হচ্ছে না
- ❌ **Problem:** Backend database update করছে না
- ❌ **Problem:** Bot service cache করছে old value

---

## 🔍 Specific Problems to Check

### **Problem 1: Bot sends message AFTER admin reply**

**Symptom:**
```
User: "Hello"
Bot: "Welcome!" ✅
Admin: "Hi, I'm here"
Bot: "Please describe your issue" ❌ (এটি হওয়া উচিত নয়!)
```

**Root Cause:**
- Bot deactivation asynchronous
- Admin message create হচ্ছে bot deactivate এর আগে

**Fix Location:**
- `server/src/services/live-chat.service.ts` → `sendAdminMessage()`
- `server/src/services/chat.service.ts` → `sendChatMessage()`

**Verify:**
```typescript
// ✅ CORRECT ORDER:
await botMessageService.handleAdminReply({ ... }); // FIRST
const message = await prisma.chatMessage.create({ ... }); // SECOND

// ❌ WRONG ORDER:
const message = await prisma.chatMessage.create({ ... }); // FIRST
botMessageService.handleAdminReply({ ... }).catch(...); // SECOND (async!)
```

---

### **Problem 2: Bot doesn't loop**

**Symptom:**
```
User: "Hello"
Bot: "Welcome!" (Step 1) ✅
User: "Help"
Bot: "Please describe" (Step 2) ✅
User: "Issue"
Bot: "We'll help" (Step 3) ✅
User: "When?"
Bot: (nothing) ❌ (Step 1 এ ফিরে যাওয়া উচিত ছিল)
```

**Root Cause:**
- Looping logic missing অথবা ভুল
- `isActive` false হয়ে যাচ্ছে

**Fix Location:**
- `server/src/services/bot-message.service.ts` → `shouldTriggerBot()`

**Verify:**
```typescript
// When no message for next step
if (!botMessage) {
  // ✅ MUST loop back to step 1
  botMessage = await this.getBotMessageByStep(input.chatType, 1);
  
  if (botMessage) {
    await this.updateConversationState(state.id, {
      currentStep: 1,
      isActive: true  // ✅ KEEP bot active!
    });
  }
}
```

---

### **Problem 3: Threshold not working**

**Symptom:**
```
Admin: "Hello"
Bot: Deactivated ✅
User: "Hi" (count should be 1)
User: "Hello" (count should be 2)
User: "Help" (count should be 3, bot should reactivate)
Bot: (nothing) ❌ (reactivate হওয়া উচিত ছিল)
```

**Root Cause:**
- `userMessageCount` increment হচ্ছে না
- Threshold check logic ভুল
- Bot active থাকলেও counter বাড়ছে

**Fix Location:**
- `server/src/services/bot-message.service.ts` → `handleUserMessage()`
- `server/src/services/bot-message.service.ts` → `shouldTriggerBot()`

**Verify:**
```typescript
// handleUserMessage() - ONLY increment when bot is INACTIVE
if (!state.isActive) {
  await this.updateConversationState(state.id, {
    userMessageCount: state.userMessageCount + 1
  });
}

// shouldTriggerBot() - Check threshold
if (userMessagesSinceReply >= rules.reactivationThreshold) {
  // ✅ Reactivate bot
  await this.updateConversationState(state.id, {
    isActive: true,
    userMessageCount: 0  // ✅ Reset counter
  });
}
```

---

## 📊 Database Queries for Debugging

### **Check Bot Configuration:**
```sql
-- 1. Bot Trigger Rules
SELECT * FROM "BotTriggerRule";

-- Expected:
-- LIVE_CHAT: isEnabled=true, reactivationThreshold=3
-- COMPLAINT_CHAT: isEnabled=true, reactivationThreshold=3

-- 2. Bot Messages
SELECT "chatType", "stepNumber", "content", "isActive" 
FROM "BotMessageConfig" 
WHERE "isActive" = true 
ORDER BY "chatType", "stepNumber";

-- Expected: At least 3 steps per chat type
```

### **Check Bot State:**
```sql
-- Recent conversation states
SELECT 
  "conversationId",
  "chatType",
  "isActive",
  "currentStep",
  "userMessageCount",
  "lastBotMessageAt",
  "lastAdminReplyAt",
  "updatedAt"
FROM "BotConversationState" 
ORDER BY "updatedAt" DESC 
LIMIT 10;

-- Check specific conversation
SELECT * FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{userId}';
```

### **Check Recent Messages:**
```sql
-- Live Chat messages
SELECT 
  id,
  "senderId",
  "receiverId",
  "senderType",
  content,
  "createdAt"
FROM "ChatMessage" 
WHERE "senderId" = {userId} OR "receiverId" = {userId}
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Complaint Chat messages
SELECT 
  id,
  "complaintId",
  "senderId",
  "senderType",
  message,
  "createdAt"
FROM "ComplaintChatMessage" 
WHERE "complaintId" = {complaintId}
ORDER BY "createdAt" DESC 
LIMIT 20;
```

---

## 🚀 Quick Test Script

আমি একটি test script তৈরি করেছি:

```bash
# Run this command
test-bot-system-complete.cmd
```

এটি:
1. Database configuration check করবে
2. Manual testing instructions দেখাবে
3. Database queries দেখাবে

---

## 📝 Test Results Template

Testing এর পর এই template fill করুন:

```
TEST 1: Bot Looping
- User message 1 → Bot reply: [YES/NO]
- User message 2 → Bot reply: [YES/NO]
- User message 3 → Bot reply: [YES/NO]
- User message 4 → Bot loops to step 1: [YES/NO]
- Status: [PASS/FAIL]

TEST 2: Bot Deactivation
- Admin reply → Bot deactivates: [YES/NO]
- User message after admin → Bot silent: [YES/NO]
- Database isActive = false: [YES/NO]
- Status: [PASS/FAIL]

TEST 3: Bot Reactivation
- User message 1 → Bot silent: [YES/NO]
- User message 2 → Bot silent: [YES/NO]
- User message 3 → Bot reactivates: [YES/NO]
- Database isActive = true: [YES/NO]
- Status: [PASS/FAIL]

TEST 4: Dynamic Threshold
- Threshold changed to 5: [YES/NO]
- Database updated: [YES/NO]
- Bot reactivates after 5 messages: [YES/NO]
- Status: [PASS/FAIL]
```

---

## 🎯 আমাকে জানান

Testing complete হলে আমাকে জানান:

1. **কোন test fail হয়েছে?**
2. **Expected vs Actual behavior কি?**
3. **Database state কি?** (SQL queries চালান)
4. **Server logs কি বলছে?** (`pm2 logs clean-care-server | grep BOT`)

এই information দিলে আমি exact problem identify করতে পারব এবং fix করতে পারব।

---

**Status:** 🧪 Testing Required  
**Next Action:** Manual tests করুন এবং results share করুন  
**তারিখ:** ২৭ জানুয়ারি, ২০২৬
