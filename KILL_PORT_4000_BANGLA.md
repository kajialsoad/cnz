# Port 4000 সমস্যা সমাধান

## সমস্যা
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
```

এর মানে port 4000 ইতিমধ্যে ব্যবহার হচ্ছে।

## সমাধান

### পদ্ধতি ১: Process Kill করুন (সবচেয়ে ভালো)

**PowerShell-এ:**
```powershell
# Step 1: কোন process port 4000 ব্যবহার করছে দেখুন
netstat -ano | findstr :4000

# Step 2: Process kill করুন (PID নম্বর দিয়ে)
taskkill /PID <PID_NUMBER> /F
```

**উদাহরণ:**
```powershell
# ধরুন output এসেছে:
# TCP    0.0.0.0:4000    0.0.0.0:0    LISTENING    12345

# তাহলে চালান:
taskkill /PID 12345 /F
```

### পদ্ধতি ২: Automatic Script (সবচেয়ে সহজ)

**CMD-তে:**
```cmd
cd server
kill-port-4000.cmd
```

এটি স্বয়ংক্রিয়ভাবে port 4000 এর process kill করবে।

### পদ্ধতি ৩: অন্য Port ব্যবহার করুন

**server/.env ফাইলে:**
```env
PORT=4001
```

**clean-care-admin/.env ফাইলে:**
```env
VITE_LOCAL_API_URL=http://localhost:4001
```

## সম্পূর্ণ পদক্ষেপ

### ১. Port Kill করুন:
```powershell
cd server
.\kill-port-4000.cmd
```

### ২. Server চালু করুন:
```powershell
npm run dev
```

### ৩. Admin Panel চালু করুন (নতুন terminal):
```powershell
cd clean-care-admin
npm run dev
```

## কেন এই সমস্যা হয়?

1. **Server আগে থেকে চলছে** - আগের server বন্ধ হয়নি
2. **Crash হয়েছে** - Server crash করেছে কিন্তু process বন্ধ হয়নি
3. **অন্য app** - অন্য কোনো application port 4000 ব্যবহার করছে

## প্রতিরোধ

Server বন্ধ করার সময় সঠিকভাবে বন্ধ করুন:
- `Ctrl + C` চাপুন terminal-এ
- অপেক্ষা করুন "Server stopped" দেখা পর্যন্ত
- Terminal বন্ধ করবেন না হঠাৎ

## সমস্যা থাকলে

যদি এখনও সমস্যা হয়:

1. **Task Manager খুলুন** (Ctrl + Shift + Esc)
2. **Details ট্যাবে যান**
3. **node.exe খুঁজুন**
4. **Right-click → End Task**

অথবা:

```powershell
# সব node process kill করুন
taskkill /F /IM node.exe
```

⚠️ **সতর্কতা**: এটি সব Node.js application বন্ধ করে দেবে!

## সফল হলে

Server চালু হলে দেখবেন:
```
✅ Server is running on port 4000
✅ Admin panel served at /admin
```

এখন আপনি chat image test করতে পারবেন!
