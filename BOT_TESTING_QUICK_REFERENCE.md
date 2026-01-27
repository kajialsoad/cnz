# Bot Testing - Quick Reference
## দ্রুত টেস্টিং গাইড

---

## 🚀 Quick Start (5 minutes)

### **Step 1: Database Check**
```bash
cd server
node tests/manual/check-bot-system-simple.js
```

### **Step 2: Manual Test**
1. Open Live Chat (as user)
2. Send: "Hello" → Bot should reply ✅
3. Admin reply: "Hi" → Bot should stop ✅
4. User sends 3 messages → Bot should reactivate ✅

### **Step 3: Report Results**
Tell me: Which test failed? What happened?

---

## 📊 Expected Behavior

### **Bot Active (Admin hasn't replied)**
```
User: "Hello"     → Bot: "Welcome!" ✅
User: "Help"      → Bot: "Describe issue" ✅
User: "Issue"     → Bot: "We'll help" ✅
User: "When?"     → Bot: "Welcome!" (LOOP) ✅
```

### **Bot Deactivated (Admin replied)**
```
Admin: "Hi"       → Bot: DEACTIVATED ✅
User: "Thanks"    → Bot: (silent) ✅
User: "Help?"     → Bot: (silent) ✅
```

### **Bot Reactivated (Threshold = 3)**
```
User: "Hello?"    → Bot: (silent) count=1 ✅
User: "Anyone?"   → Bot: (silent) count=2 ✅
User: "Help!"     → Bot: REACTIVATED! ✅
```

---

## 🔍 Quick Diagnosis

### **Problem: Bot not sending messages**
```sql
-- Check if bot is enabled
SELECT * FROM "BotTriggerRule" WHERE "chatType" = 'LIVE_CHAT';
-- Expected: isEnabled = true

-- Check if messages exist
SELECT COUNT(*) FROM "BotMessageConfig" 
WHERE "chatType" = 'LIVE_CHAT' AND "isActive" = true;
-- Expected: >= 1
```

### **Problem: Bot not deactivating**
```sql
-- Check conversation state after admin reply
SELECT * FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{userId}';
-- Expected: isActive = false, userMessageCount = 0
```

### **Problem: Bot not reactivating**
```sql
-- Check threshold setting
SELECT "reactivationThreshold" FROM "BotTriggerRule" 
WHERE "chatType" = 'LIVE_CHAT';
-- Expected: 3 (or your configured value)

-- Check user message count
SELECT "userMessageCount", "isActive" FROM "BotConversationState" 
WHERE "conversationId" = 'live-chat-user-{userId}';
-- After 3 messages: isActive should be true, count should be 0
```

---

## 📝 Test Results Template

```
TEST 1: Bot Looping
- Bot sends messages: [YES/NO]
- Bot loops after last step: [YES/NO]
- Status: [PASS/FAIL]

TEST 2: Bot Deactivation
- Bot stops after admin reply: [YES/NO]
- Database isActive = false: [YES/NO]
- Status: [PASS/FAIL]

TEST 3: Bot Reactivation
- Bot reactivates after 3 messages: [YES/NO]
- Database isActive = true: [YES/NO]
- Status: [PASS/FAIL]
```

---

## 🛠️ Quick Fixes

### **If bot not sending:**
1. Check System Control page → Enable bot
2. Check bot messages configured
3. Restart server: `pm2 restart clean-care-server`

### **If bot not deactivating:**
1. Check server logs: `pm2 logs clean-care-server | findstr BOT`
2. Look for: "Bot deactivated BEFORE admin message sent"
3. If not found → Code issue, need to fix

### **If bot not reactivating:**
1. Check threshold: System Control page
2. Check database: `SELECT * FROM "BotTriggerRule"`
3. Verify userMessageCount incrementing

---

## 📞 Report to Me

**Format:**
```
Problem: [describe in 1 sentence]
Expected: [what should happen]
Actual: [what is happening]
Database State: [paste SQL query result]
```

**Example:**
```
Problem: Bot sends message after admin reply
Expected: Bot should stop after admin reply
Actual: Bot still sends messages
Database State: isActive = true (should be false)
```

---

## 🎯 Files Created

1. `BOT_SYSTEM_TEST_GUIDE_BANGLA.md` - Detailed guide
2. `test-bot-system-complete.cmd` - Test script
3. `server/tests/manual/verify-bot-implementation.js` - Verification
4. `BOT_SYSTEM_CURRENT_STATUS_BANGLA.md` - Current status

---

**Quick Action:** Run `test-bot-system-complete.cmd` and follow instructions!
