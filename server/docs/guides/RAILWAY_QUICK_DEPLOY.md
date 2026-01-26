# ⚡ Railway Quick Deploy - Bangla Guide

## 🚀 এক নজরে Deployment

### Step 1: Environment Variables Set করুন

Railway Dashboard > Settings > Variables এ যান এবং এগুলো add করুন:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=djeguy5v5
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
PORT=3000
```

### Step 2: Deploy করুন

```bash
cd server
railway up
```

### Step 3: Database Setup

```bash
# Migration run করুন
railway run npx prisma migrate deploy

# City corporations seed করুন
railway run node seed-city-corporations.js

# Admin user create করুন (optional)
railway run node create-test-user.js
```

### Step 4: Test করুন

```bash
# Health check
curl https://your-app.railway.app/health

# API test
curl https://your-app.railway.app/api/public/city-corporations
```

## ✅ Done!

আপনার server এখন live! 🎉

**Production URL:** `https://your-project-name.railway.app`

---

## 🔧 Common Commands

```bash
# Deploy
railway up

# Logs দেখুন
railway logs --follow

# Shell access
railway shell

# Status check
railway status
```

---

## ⚠️ Important Notes

1. **DATABASE_URL:** Railway MySQL service থেকে automatically পাবেন
2. **JWT_SECRET:** Strong random string use করুন (minimum 32 characters)
3. **Cloudinary:** আপনার actual credentials use করুন
4. **First Deploy:** 5-10 minutes লাগতে পারে

---

## 🐛 Problem হলে

### Build Fail হলে:
```bash
# Local এ test করুন
npm run build

# Error fix করে আবার deploy করুন
railway up
```

### Database Error হলে:
```bash
# Migration manually run করুন
railway run npx prisma migrate deploy
```

### Logs দেখুন:
```bash
railway logs --follow
```

---

## 📱 Mobile App Update

Deploy হওয়ার পর mobile app এর `lib/config/api_config.dart` file এ:

```dart
static const String baseUrl = 'https://your-app.railway.app';
```

## 💻 Admin Panel Update

Admin panel এর `clean-care-admin/src/config/apiConfig.ts` file এ:

```typescript
export const API_BASE_URL = 'https://your-app.railway.app';
```

---

## ✅ Success!

সব কিছু ঠিকমতো কাজ করলে আপনার Clean Care application এখন fully deployed! 🎊
