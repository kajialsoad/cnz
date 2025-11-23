# 🚀 Dual Mode Setup - Localhost + Vercel

## আপনার প্রজেক্ট এখন দুইভাবে চলবে:

### ✅ Mode 1: Local WiFi (বাসায়/অফিসে)
- Server: `http://localhost:4000` বা `http://192.168.0.100:4000`
- দ্রুত গতি
- ইন্টারনেট লাগবে না (শুধু local WiFi)
- Development এর জন্য perfect

### ✅ Mode 2: Vercel Cloud (যেকোনো জায়গা থেকে)
- Server: `https://server-p6kosaux0-kajialsoads-projects.vercel.app`
- সারা দুনিয়া থেকে access করা যাবে
- সবসময় online থাকবে
- Production এর জন্য perfect

---

## 🎯 কিভাবে কাজ করে?

### Automatic Fallback System:
1. **প্রথমে Local Server চেষ্টা করবে** (দ্রুত)
2. যদি Local না পায়, **Vercel এ switch করবে** (automatic)
3. প্রতি 30 সেকেন্ডে check করবে Local আবার available কিনা

```
Mobile App/Admin Panel
        ↓
   Try Localhost (5 sec timeout)
        ↓
   Failed? → Switch to Vercel
        ↓
   Success! ✅
```

---

## 📱 Mobile App Setup

### Current Configuration:
- **Primary**: `http://192.168.0.100:4000` (Local WiFi)
- **Fallback**: `https://server-p6kosaux0-kajialsoads-projects.vercel.app` (Vercel)

### Files Updated:
1. `lib/config/api_config.dart` - Dual URL configuration
2. `lib/services/smart_api_client.dart` - Auto fallback logic
3. `lib/repositories/smart_auth_repository.dart` - Smart repository wrapper

### কিভাবে ব্যবহার করবেন:
```dart
// Old way (শুধু একটা server)
final repo = AuthRepository(ApiClient(ApiConfig.baseUrl));

// New way (automatic fallback)
final repo = SmartAuthRepository();
await repo.login(phone: phone, password: password);
// ↑ এটা automatically local try করবে, না পেলে Vercel use করবে
```

---

## 💻 Admin Panel Setup

### Current Configuration:
- **Primary**: `http://localhost:4000` (Local)
- **Fallback**: `https://server-p6kosaux0-kajialsoads-projects.vercel.app` (Vercel)

### Files Created:
1. `clean-care-admin/src/services/smartApiService.ts` - Smart API service
2. `clean-care-admin/.env.local` - Local development config
3. `clean-care-admin/.env.production` - Production config

### কিভাবে ব্যবহার করবেন:
```typescript
import { smartApiService } from './services/smartApiService';

// Automatic fallback
const data = await smartApiService.get('/api/admin/users');
// ↑ এটা automatically local try করবে, না পেলে Vercel use করবে

// Check current server
console.log(smartApiService.getCurrentServer()); 
// Output: "Local WiFi" or "Vercel (Cloud)"
```

---

## 🔧 Server Setup

### Local Server চালানো:
```cmd
cd server
npm run dev
```
Server চলবে: `http://localhost:4000`

### Vercel Server (Already Deployed):
URL: `https://server-p6kosaux0-kajialsoads-projects.vercel.app`

**⚠️ Important**: Vercel এ environment variables add করতে হবে:
1. Go to: https://vercel.com/kajialsoads-projects/server/settings/environment-variables
2. Add করুন:
   - `DATABASE_URL` - আপনার PostgreSQL URL
   - `JWT_SECRET` - Secret key
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 🎮 Testing করুন

### Test 1: Local Server Running
```cmd
# Terminal 1: Start local server
cd server
npm run dev

# Terminal 2: Test mobile app
flutter run

# Result: Mobile app will use localhost ✅
```

### Test 2: Local Server Stopped
```cmd
# Stop local server (Ctrl+C)

# Mobile app automatically switches to Vercel ✅
```

### Test 3: Local Server Back Online
```cmd
# Start local server again
cd server
npm run dev

# After 30 seconds, mobile app switches back to localhost ✅
```

---

## 📊 Status Check

### Mobile App এ দেখুন:
```dart
final repo = SmartAuthRepository();
print(repo.getCurrentServer()); // "Local WiFi" or "Vercel (Cloud)"
print(repo.isUsingVercel()); // true or false
```

### Admin Panel এ দেখুন:
```typescript
console.log(smartApiService.getCurrentServer());
console.log(smartApiService.isUsingVercel());
```

---

## 🚨 Troubleshooting

### Problem 1: Local server connect হচ্ছে না
**Solution**: 
- Check করুন server চলছে কিনা: `cd server && npm run dev`
- Check করুন IP address সঠিক আছে কিনা
- Firewall check করুন

### Problem 2: Vercel server error দিচ্ছে
**Solution**:
- Environment variables add করেছেন কিনা check করুন
- Database URL সঠিক আছে কিনা check করুন
- Vercel logs দেখুন: https://vercel.com/kajialsoads-projects/server

### Problem 3: দুইটাই কাজ করছে না
**Solution**:
- Internet connection check করুন
- Server logs check করুন
- Database connection check করুন

---

## 🎯 Best Practices

### Development এর সময়:
1. Local server use করুন (দ্রুত)
2. Same WiFi তে থাকুন
3. Hot reload কাজ করবে

### Testing এর সময়:
1. Local + Vercel দুইটাই test করুন
2. Fallback কাজ করছে কিনা check করুন
3. Different networks থেকে test করুন

### Production এ:
1. Vercel server use হবে
2. সবসময় available থাকবে
3. Global access পাবেন

---

## 📝 Summary

✅ **Local Server**: দ্রুত, WiFi লাগবে, development এর জন্য  
✅ **Vercel Server**: সবসময় online, যেকোনো জায়গা থেকে, production এর জন্য  
✅ **Automatic Fallback**: একটা না পেলে অন্যটা use করবে  
✅ **Smart Switching**: Local available হলে সেটা use করবে  

---

## 🔗 Important URLs

- **Local Server**: http://localhost:4000
- **Local WiFi**: http://192.168.0.100:4000
- **Vercel Server**: https://server-p6kosaux0-kajialsoads-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/kajialsoads-projects/server

---

## 🎉 এখন আপনার App:
- ✅ বাসায় local server দিয়ে চলবে (দ্রুত)
- ✅ বাইরে Vercel দিয়ে চলবে (সবসময়)
- ✅ Automatic switch করবে
- ✅ কোনো manual configuration লাগবে না!

**Happy Coding! 🚀**
