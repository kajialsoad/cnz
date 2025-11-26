# Quick Deployment Guide | দ্রুত ডিপ্লয়মেন্ট গাইড

## 🚀 English Version

### 3 Simple Steps to Deploy Your App

#### Step 1: Deploy Server (5 minutes)
```bash
cd server
npm install -g vercel
vercel login
vercel --prod
```
**Copy the URL:** `https://your-server.vercel.app`

#### Step 2: Update Configuration
Edit these files with your server URL:

**File 1:** `clean-care-admin/.env.production`
```env
VITE_API_BASE_URL=https://your-server.vercel.app
```

**File 2:** `lib/config/api_config.dart`
```dart
static const String productionUrl = 'https://your-server.vercel.app';
```

#### Step 3: Deploy Admin Panel (5 minutes)
```bash
cd clean-care-admin
npm run build
vercel --prod
```
**Copy the URL:** `https://your-admin.vercel.app`

#### Step 4: Build Mobile App (2 minutes)
```bash
flutter build apk --release
```
**APK Location:** `build/app/outputs/flutter-apk/app-release.apk`

### ✅ Done! Your app is now live!

---

## 🇧🇩 বাংলা সংস্করণ

### ৩টি সহজ ধাপে আপনার অ্যাপ ডিপ্লয় করুন

#### ধাপ ১: সার্ভার ডিপ্লয় করুন (৫ মিনিট)
```bash
cd server
npm install -g vercel
vercel login
vercel --prod
```
**URL কপি করুন:** `https://your-server.vercel.app`

#### ধাপ ২: কনফিগারেশন আপডেট করুন
আপনার সার্ভার URL দিয়ে এই ফাইলগুলো এডিট করুন:

**ফাইল ১:** `clean-care-admin/.env.production`
```env
VITE_API_BASE_URL=https://your-server.vercel.app
```

**ফাইল ২:** `lib/config/api_config.dart`
```dart
static const String productionUrl = 'https://your-server.vercel.app';
```

#### ধাপ ৩: অ্যাডমিন প্যানেল ডিপ্লয় করুন (৫ মিনিট)
```bash
cd clean-care-admin
npm run build
vercel --prod
```
**URL কপি করুন:** `https://your-admin.vercel.app`

#### ধাপ ৪: মোবাইল অ্যাপ বিল্ড করুন (২ মিনিট)
```bash
flutter build apk --release
```
**APK লোকেশন:** `build/app/outputs/flutter-apk/app-release.apk`

### ✅ সম্পন্ন! আপনার অ্যাপ এখন লাইভ!

---

## 🔗 Important URLs | গুরুত্বপূর্ণ লিংক

After deployment, you'll have | ডিপ্লয়মেন্টের পর আপনি পাবেন:

```
✅ Server API: https://your-server.vercel.app
✅ Admin Panel: https://your-admin.vercel.app
✅ Mobile App: app-release.apk
```

---

## 🧪 Testing | পরীক্ষা করুন

### Test Server | সার্ভার টেস্ট করুন
Open in browser | ব্রাউজারে খুলুন:
```
https://your-server.vercel.app/api/health
```

### Test Admin Panel | অ্যাডমিন প্যানেল টেস্ট করুন
```
URL: https://your-admin.vercel.app
Email: admin@cleancare.com
Password: admin123
```

### Test Mobile App | মোবাইল অ্যাপ টেস্ট করুন
1. Install APK | APK ইনস্টল করুন
2. Login | লগইন করুন
3. Create complaint | কমপ্লেইন তৈরি করুন
4. Send message | মেসেজ পাঠান

---

## 💰 Cost | খরচ

### Free Tier (Recommended for start)
```
✅ Vercel Server: FREE
✅ Vercel Admin: FREE
✅ Database: Already hosted
✅ Total: $0/month
✅ Supports: 1,000-5,000 users
```

---

## 🆘 Need Help? | সাহায্য প্রয়োজন?

### Detailed Guides | বিস্তারিত গাইড:
- 📖 **Bangla Guide:** `APP_DEPLOYMENT_GUIDE_BANGLA.md`
- 📋 **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- 🔧 **Production Setup:** `server/PRODUCTION_SETUP_GUIDE.md`

### Quick Deploy Scripts | দ্রুত ডিপ্লয় স্ক্রিপ্ট:
- **Windows:** Run `deploy-to-vercel.cmd`
- **Mac/Linux:** Run `deploy-to-vercel.sh`

---

## 📞 Support | সাপোর্ট

### Common Issues | সাধারণ সমস্যা:

**Problem:** Server not connecting | সার্ভার কানেক্ট হচ্ছে না
**Solution:** Check URL in config files | কনফিগ ফাইলে URL চেক করুন

**Problem:** Images not loading | ছবি লোড হচ্ছে না
**Solution:** Check CORS settings | CORS সেটিংস চেক করুন

**Problem:** Admin login failed | অ্যাডমিন লগইন ব্যর্থ
**Solution:** Check server is running | সার্ভার চালু আছে কিনা চেক করুন

---

## 🎉 Success! | সফল!

Your Clean Care app is now accessible from anywhere in the world!

আপনার Clean Care অ্যাপ এখন বিশ্বের যেকোনো জায়গা থেকে অ্যাক্সেস করা যাবে!

---

**Total Time:** 15-20 minutes | **মোট সময়:** ১৫-২০ মিনিট

**Difficulty:** Easy | **কঠিনতা:** সহজ

**Cost:** Free | **খরচ:** বিনামূল্যে
