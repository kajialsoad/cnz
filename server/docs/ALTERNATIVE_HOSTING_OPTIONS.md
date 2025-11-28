# Alternative Hosting Options (Vercel এর বদলে)

## সমস্যা
Vercel এ Prisma + MySQL নিয়ে SSL সমস্যা হচ্ছে যা fix করা যাচ্ছে না।

## ✅ সমাধান: Railway বা Render ব্যবহার করুন

---

## Option 1: Railway (সবচেয়ে সহজ - Recommended)

### কেন Railway?
- ✅ Prisma + MySQL perfectly কাজ করে
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Environment variables সহজে manage করা যায়
- ✅ SSL নিয়ে কোনো সমস্যা নেই

### Railway Setup Steps:

#### 1. Railway Account তৈরি করুন
- যান: https://railway.app
- GitHub দিয়ে sign up করুন

#### 2. New Project তৈরি করুন
- Dashboard এ "New Project" click করুন
- "Deploy from GitHub repo" select করুন
- আপনার server repository select করুন

#### 3. Environment Variables Add করুন
Railway dashboard এ:
```
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
NODE_ENV=production
PORT=4000
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mnanjeeba@gmail.com
SMTP_PASS=smxipmkzhiigjese
CLOUDINARY_CLOUD_NAME=djeguy5v5
CLOUDINARY_API_KEY=371175211797569
CLOUDINARY_API_SECRET=i4_JgAR420sz8pZzHczBWf32kX0
```

#### 4. Deploy করুন
- Railway automatically deploy করবে
- 2-3 মিনিট wait করুন
- আপনার API URL পাবেন (যেমন: `https://your-app.railway.app`)

---

## Option 2: Render

### কেন Render?
- ✅ Free tier available
- ✅ Prisma support ভালো
- ✅ Easy deployment
- ✅ Custom domains support

### Render Setup Steps:

#### 1. Render Account তৈরি করুন
- যান: https://render.com
- GitHub দিয়ে sign up করুন

#### 2. New Web Service তৈরি করুন
- Dashboard এ "New +" → "Web Service"
- আপনার GitHub repo connect করুন
- Server folder select করুন

#### 3. Build & Start Commands
```
Build Command: npm install && npm run build
Start Command: npm start
```

#### 4. Environment Variables Add করুন
Same as Railway (উপরে দেওয়া আছে)

#### 5. Deploy করুন
- "Create Web Service" click করুন
- Automatic deploy হবে

---

## Option 3: Localhost থেকে চালান (Temporary)

যদি এখনই production এ deploy করার দরকার না থাকে:

### 1. Local Server চালান
```bash
cd server
npm run dev
```

### 2. ngrok দিয়ে Public URL তৈরি করুন
```bash
# ngrok install করুন: https://ngrok.com/download
ngrok http 4000
```

এটা একটা public URL দেবে যেমন: `https://abc123.ngrok.io`

### 3. Mobile App এ এই URL use করুন
`lib/config/api_config.dart` এ:
```dart
static const String baseUrl = 'https://abc123.ngrok.io';
```

---

## 🎯 Recommendation: Railway ব্যবহার করুন

কারণ:
1. Setup সবচেয়ে সহজ
2. Prisma + MySQL perfectly কাজ করে
3. Free tier যথেষ্ট
4. SSL নিয়ে কোনো ঝামেলা নেই
5. Automatic deployments

---

## Railway Deployment Commands

### Local থেকে deploy করতে চাইলে:

```bash
# Railway CLI install করুন
npm install -g @railway/cli

# Login করুন
railway login

# Project link করুন
railway link

# Deploy করুন
railway up
```

---

## Vercel থেকে Migration

### 1. Vercel Project Delete করুন (Optional)
```bash
vercel remove server --yes
```

### 2. Railway/Render এ deploy করুন (উপরের steps follow করুন)

### 3. Mobile App এ নতুন URL update করুন
`lib/config/api_config.dart`:
```dart
static const String baseUrl = 'https://your-app.railway.app';
// অথবা
static const String baseUrl = 'https://your-app.onrender.com';
```

### 4. Admin Panel এও URL update করুন
`clean-care-admin/src/config/apiConfig.ts`:
```typescript
export const API_BASE_URL = 'https://your-app.railway.app';
```

---

## Cost Comparison

| Platform | Free Tier | Prisma Support | SSL Issues |
|----------|-----------|----------------|------------|
| Vercel | ✅ Yes | ⚠️ Limited | ❌ Yes |
| Railway | ✅ Yes ($5 credit/month) | ✅ Excellent | ✅ No |
| Render | ✅ Yes | ✅ Good | ✅ No |
| ngrok | ✅ Yes (temporary) | ✅ Perfect | ✅ No |

---

## আমার Suggestion

1. **এখনই**: Railway ব্যবহার করুন
2. **Testing এর জন্য**: ngrok ব্যবহার করুন
3. **Vercel**: এড়িয়ে চলুন (Prisma + MySQL এর জন্য)

---

## Next Steps

1. Railway account তৈরি করুন
2. GitHub repo connect করুন
3. Environment variables add করুন
4. Deploy করুন
5. Mobile app এ নতুন URL update করুন
6. Test করুন

সব কিছু 10-15 মিনিটে হয়ে যাবে!
