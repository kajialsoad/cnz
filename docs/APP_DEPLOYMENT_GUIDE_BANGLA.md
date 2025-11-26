# অ্যাপ ডিপ্লয়মেন্ট গাইড - যেকোনো জায়গা থেকে অ্যাক্সেস করুন

## 🎯 লক্ষ্য
আপনার Clean Care অ্যাপটি যেকোনো জায়গা থেকে (মোবাইল, অ্যাডমিন প্যানেল) ওপেন করার জন্য সার্ভার হোস্ট করা এবং কনফিগার করা।

---

## 📋 বর্তমান সেটআপ

### বর্তমানে কি আছে:
- ✅ **Server**: Node.js backend (localhost:4000)
- ✅ **Admin Panel**: React frontend (localhost:5500)
- ✅ **Mobile App**: Flutter app (localhost connection)
- ✅ **Database**: MySQL database (remote hosted)

### সমস্যা:
- ❌ শুধুমাত্র localhost এ কাজ করে
- ❌ বাইরে থেকে অ্যাক্সেস করা যায় না
- ❌ মোবাইল অ্যাপ শুধু local network এ চলে

---

## 🚀 সমাধান: তিনটি স্টেপ

### **স্টেপ ১: সার্ভার হোস্ট করুন (Backend)**
### **স্টেপ ২: অ্যাডমিন প্যানেল ডিপ্লয় করুন (Vercel)**
### **স্টেপ ৩: মোবাইল অ্যাপ কনফিগার করুন**

---

## 📦 স্টেপ ১: সার্ভার হোস্ট করুন

### অপশন A: Vercel এ সার্ভার ডিপ্লয় (সহজ)

#### ১.১ Vercel অ্যাকাউন্ট তৈরি করুন
```
1. https://vercel.com এ যান
2. GitHub দিয়ে সাইন আপ করুন
3. Free plan নিন
```

#### ১.২ সার্ভার প্রস্তুত করুন
```bash
cd server

# vercel.json ফাইল তৈরি করুন
```

#### ১.৩ Vercel Configuration
`server/vercel.json` ফাইল তৈরি করুন:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### ১.৪ Environment Variables সেট করুন
Vercel Dashboard এ গিয়ে:
```
Settings → Environment Variables → Add

DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production-2024
CORS_ORIGIN=*
NODE_ENV=production
```

#### ১.৫ Deploy করুন
```bash
# Vercel CLI install করুন
npm install -g vercel

# Login করুন
vercel login

# Deploy করুন
vercel --prod
```

#### ১.৬ URL পাবেন
```
✅ Deployed to: https://your-server-name.vercel.app
```

এই URL টি কপি করে রাখুন! 📝

---

### অপশন B: Railway/Render এ ডিপ্লয় (বিকল্প)

#### Railway (প্রস্তাবিত)
```
1. https://railway.app এ যান
2. GitHub দিয়ে সাইন আপ করুন
3. "New Project" → "Deploy from GitHub"
4. server folder সিলেক্ট করুন
5. Environment Variables যোগ করুন
6. Deploy করুন
```

#### Render
```
1. https://render.com এ যান
2. "New Web Service" ক্লিক করুন
3. GitHub repo connect করুন
4. Root Directory: server
5. Build Command: npm install
6. Start Command: npm start
7. Environment Variables যোগ করুন
8. Deploy করুন
```

---

## 🌐 স্টেপ ২: অ্যাডমিন প্যানেল ডিপ্লয় (Vercel)

### ২.১ Admin Panel প্রস্তুত করুন

#### Environment File তৈরি করুন
`clean-care-admin/.env.production` ফাইল তৈরি করুন:

```env
# আপনার সার্ভার URL (স্টেপ ১ থেকে)
VITE_API_BASE_URL=https://your-server-name.vercel.app
```

#### ২.২ Build করুন
```bash
cd clean-care-admin

# Dependencies install করুন
npm install

# Production build করুন
npm run build
```

#### ২.৩ Vercel এ Deploy করুন
```bash
# Vercel CLI দিয়ে
vercel --prod

# অথবা Vercel Dashboard থেকে:
# 1. "Add New Project"
# 2. Import clean-care-admin folder
# 3. Framework Preset: Vite
# 4. Environment Variables যোগ করুন
# 5. Deploy করুন
```

#### ২.৪ Admin Panel URL পাবেন
```
✅ Admin Panel: https://your-admin-panel.vercel.app
```

---

## 📱 স্টেপ ৩: মোবাইল অ্যাপ কনফিগার করুন

### ৩.১ API Configuration আপডেট করুন

`lib/config/api_config.dart` ফাইল এডিট করুন:

```dart
import 'package:flutter/foundation.dart';

class ApiConfig {
  // আপনার Production Server URL (স্টেপ ১ থেকে)
  static const String productionUrl = 'https://your-server-name.vercel.app';
  
  // Local development URLs (testing এর জন্য)
  static const String localWebUrl = 'http://localhost:4000';
  static const String localAndroidUrl = 'http://192.168.0.100:4000';
  static const String localIosUrl = 'http://localhost:4000';
  
  // Automatically select URL based on mode
  static String get baseUrl {
    if (kReleaseMode) {
      // Production mode - live server use করবে
      return productionUrl;
    } else {
      // Development mode - local server use করবে
      if (kIsWeb) {
        return localWebUrl;
      } else if (defaultTargetPlatform == TargetPlatform.android) {
        return localAndroidUrl;
      } else {
        return localIosUrl;
      }
    }
  }
  
  // API endpoints
  static const String authRegister = '/api/auth/register';
  static const String authLogin = '/api/auth/login';
  static const String authLogout = '/api/auth/logout';
  static const String authRefresh = '/api/auth/refresh';
  static const String authMe = '/api/auth/me';
  
  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
}
```

### ৩.২ URL Helper আপডেট করুন

`lib/config/url_helper.dart` ফাইল এডিট করুন:

```dart
import 'api_config.dart';

class UrlHelper {
  /// Fix URL - production server use করবে
  static String fixUrl(String url) {
    if (url.isEmpty) return url;
    
    // যদি URL এ localhost থাকে, production URL দিয়ে replace করুন
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      // Production server URL extract করুন
      final productionHost = ApiConfig.productionUrl
          .replaceAll('https://', '')
          .replaceAll('http://', '');
      
      return url
          .replaceAll('localhost:4000', productionHost)
          .replaceAll('127.0.0.1:4000', productionHost)
          .replaceAll('http://', 'https://');
    }
    
    return url;
  }
  
  /// Get full URL for an image
  static String getImageUrl(String imageUrl) {
    if (imageUrl.isEmpty) return '';
    
    if (imageUrl.startsWith('http')) {
      return fixUrl(imageUrl);
    }
    
    return '${ApiConfig.baseUrl}$imageUrl';
  }
  
  /// Get full URL for an audio file
  static String getAudioUrl(String audioUrl) {
    if (audioUrl.isEmpty) return '';
    
    if (audioUrl.startsWith('http')) {
      return fixUrl(audioUrl);
    }
    
    return '${ApiConfig.baseUrl}$audioUrl';
  }
}
```

### ৩.৩ অ্যাপ Build করুন

#### Android APK Build
```bash
# Production APK build করুন
flutter build apk --release

# APK পাবেন এখানে:
# build/app/outputs/flutter-apk/app-release.apk
```

#### Android App Bundle (Play Store এর জন্য)
```bash
flutter build appbundle --release

# Bundle পাবেন এখানে:
# build/app/outputs/bundle/release/app-release.aab
```

---

## ✅ সম্পূর্ণ Setup যাচাই করুন

### চেকলিস্ট:

#### ১. সার্ভার চেক করুন
```bash
# Browser এ খুলুন:
https://your-server-name.vercel.app/api/health

# Response দেখতে হবে:
{"status": "ok", "message": "Server is running"}
```

#### ২. অ্যাডমিন প্যানেল চেক করুন
```bash
# Browser এ খুলুন:
https://your-admin-panel.vercel.app

# Login করতে পারবেন:
Email: admin@cleancare.com
Password: admin123
```

#### ৩. মোবাইল অ্যাপ চেক করুন
```
1. APK install করুন
2. Internet connection চালু করুন
3. Login করুন
4. Complaint তৈরি করুন
5. Chat করুন
```

---

## 🔧 সমস্যা সমাধান (Troubleshooting)

### সমস্যা ১: সার্ভার কানেক্ট হচ্ছে না

#### সমাধান:
```bash
# ১. Server URL চেক করুন
# lib/config/api_config.dart এ productionUrl সঠিক আছে কিনা

# ২. CORS চেক করুন
# server/.env এ CORS_ORIGIN=* আছে কিনা

# ৩. Database connection চেক করুন
# Vercel Dashboard → Environment Variables → DATABASE_URL
```

### সমস্যা ২: Images লোড হচ্ছে না

#### সমাধান:
```dart
// lib/config/url_helper.dart এ fixUrl() function চেক করুন
// সব localhost URL production URL এ convert হচ্ছে কিনা
```

### সমস্যা ৩: Admin Panel API call করতে পারছে না

#### সমাধান:
```typescript
// clean-care-admin/src/config/apiConfig.ts চেক করুন
export const API_CONFIG = {
  BASE_URL: 'https://your-server-name.vercel.app',
  // ...
}
```

---

## 📊 খরচ হিসাব (Cost Estimation)

### Free Tier (শুরুর জন্য)
```
✅ Vercel Server: Free (100GB bandwidth/month)
✅ Vercel Admin Panel: Free (100GB bandwidth/month)
✅ Database: Already hosted
✅ Total: $0/month
✅ Users: 1,000-5,000
```

### Paid Tier (বেশি ইউজারের জন্য)
```
💰 Vercel Pro: $20/month (1TB bandwidth)
💰 Railway/Render: $5-20/month
💰 Database Upgrade: $10-50/month
💰 Total: $35-90/month
💰 Users: 50,000-100,000
```

---

## 🎯 পরবর্তী পদক্ষেপ

### এখনই করুন:
1. ✅ সার্ভার Vercel এ deploy করুন
2. ✅ Admin Panel Vercel এ deploy করুন
3. ✅ Mobile app configuration আপডেট করুন
4. ✅ APK build করুন এবং test করুন

### পরে করবেন:
1. 📱 Google Play Store এ publish করুন
2. 🔒 Custom domain যোগ করুন (cleancare.com)
3. 📧 Email service setup করুন
4. 📊 Analytics যোগ করুন
5. 🔔 Push notifications setup করুন

---

## 📞 সাহায্য প্রয়োজন?

### ডকুমেন্টেশন:
- [Production Setup Guide](./server/PRODUCTION_SETUP_GUIDE.md)
- [Deployment Guide](./server/DEPLOYMENT_GUIDE.md)
- [API Documentation](./server/API_DOCUMENTATION.md)

### ভিডিও টিউটোরিয়াল:
- Vercel Deployment: https://vercel.com/docs
- Railway Deployment: https://docs.railway.app
- Flutter Build: https://docs.flutter.dev/deployment

---

## 🎉 সফলতার মাপকাঠি

### আপনার অ্যাপ সফলভাবে deploy হয়েছে যদি:
- ✅ যেকোনো জায়গা থেকে admin panel খোলা যায়
- ✅ মোবাইল অ্যাপ internet এ কাজ করে
- ✅ User registration এবং login কাজ করে
- ✅ Complaint তৈরি এবং chat কাজ করে
- ✅ Images এবং audio সঠিকভাবে লোড হয়

---

**আপনার Clean Care অ্যাপ এখন সারা বিশ্ব থেকে অ্যাক্সেস করা যাবে! 🚀🇧🇩**

কোনো প্রশ্ন থাকলে জানান!
