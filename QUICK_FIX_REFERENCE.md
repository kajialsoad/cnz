# ⚡ Quick Fix Reference Card

## 🔴 Problem
Complaint list shows "No complaints yet" + "You are offline"

## ✅ Solution
**Fixed:** `lib/config/api_config.dart` - Changed port from 4000 to 3000

## 🚀 Apply Fix (30 seconds)

```bash
# 1. Start server
cd server && npm run dev

# 2. Rebuild app (in Flutter terminal)
Press 'R' for hot restart

# 3. Test
Login → Complaint List → Pull to refresh
```

## 📱 URLs by Platform

| Platform | URL |
|----------|-----|
| Android Emulator | `http://10.0.2.2:3000` |
| Android Device | `http://YOUR_IP:3000` |
| iOS Simulator | `http://localhost:3000` |
| Web | `http://localhost:3000` |

## 🧪 Quick Tests

### Test 1: Server Running?
```bash
curl http://localhost:3000/api/health
```

### Test 2: Check Data
```bash
cd server
node quick-check-complaints.js
```

### Test 3: Test Login & Fetch
```bash
cd server
node test-mobile-complaint-fetch.js
```

## 🐛 Still Not Working?

| Issue | Fix |
|-------|-----|
| "Offline" banner | Check URL in `api_config.dart` |
| Empty list | Create test complaint |
| 401 error | Logout → Login again |
| Network error | Verify server is running |

## 📋 Success Checklist

- [ ] Server on port 3000 ✅
- [ ] App rebuilt ✅
- [ ] User logged in ✅
- [ ] Complaints load ✅
- [ ] No offline banner ✅

## 📚 Detailed Guides

- **English:** `COMPLAINT_LIST_FIX_COMPLETE.md`
- **বাংলা:** `COMPLAINT_LIST_BANGLA_GUIDE.md`
- **Summary:** `COMPLAINT_LIST_ISSUE_SUMMARY.md`
- **Troubleshooting:** `COMPLAINT_LIST_OFFLINE_FIX.md`

---

**Time to Fix:** 2-3 minutes
**Difficulty:** Easy
**Impact:** High - Core feature restored
