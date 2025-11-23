# Render/Railway Deployment Guide (বাংলা)

এই গাইড আপনাকে দেখাবে কিভাবে আপনার Clean Care অ্যাপ্লিকেশন Render অথবা Railway তে deploy করবেন। উভয় প্ল্যাটফর্মই MySQL এবং Prisma সাপোর্ট করে।

## কেন Render/Railway?

- ✅ **MySQL Database Support**: সম্পূর্ণ MySQL database সাপোর্ট
- ✅ **Prisma ORM Support**: Prisma migrations এবং seeding সাপোর্ট করে
- ✅ **Free Tier Available**: দুটোতেই ফ্রি টায়ার আছে
- ✅ **Easy Deployment**: GitHub থেকে সরাসরি deploy করা যায়
- ✅ **Automatic Deployments**: Code push করলে automatically deploy হয়

---

## Option 1: Render Deployment

### Prerequisites
1. [Render](https://render.com) তে একাউন্ট তৈরি করুন
2. আপনার GitHub repository public করুন অথবা Render কে access দিন

### Step 1: MySQL Database তৈরি করুন

1. Render Dashboard এ যান
2. **"New +"** → **"MySQL"** সিলেক্ট করুন
3. Database এর নাম দিন: `cleancare-db`
4. Region সিলেক্ট করুন (আপনার কাছের)
5. **"Create Database"** ক্লিক করুন
6. Database তৈরি হওয়ার পর **Internal Database URL** কপি করুন

### Step 2: Web Service তৈরি করুন

1. **"New +"** → **"Web Service"** সিলেক্ট করুন
2. আপনার GitHub repository সিলেক্ট করুন
3. নিচের সেটিংস দিন:
   - **Name**: `cleancare-server`
   - **Region**: Database এর মতো same region
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Environment Variables সেট করুন

Web Service এর **Environment** ট্যাবে যান এবং নিচের variables যোগ করুন:

```bash
DATABASE_URL=<আপনার Render MySQL Internal URL>
SHADOW_DATABASE_URL=<আপনার Render MySQL Internal URL>
NODE_ENV=production
PORT=4000
JWT_SECRET=<একটা strong random string>
JWT_REFRESH_SECRET=<আরেকটা strong random string>
```

### Step 4: Deploy করুন

1. **"Create Web Service"** ক্লিক করুন
2. Render automatically build এবং deploy করবে
3. Deploy শেষ হলে আপনার server URL পাবেন (যেমন: `https://cleancare-server.onrender.com`)

### Step 5: Database Migration চালান

Render Shell ব্যবহার করে:

```bash
npm run prisma:migrate
npm run prisma:seed
```

---

## Option 2: Railway Deployment

### Prerequisites
1. [Railway](https://railway.app) তে একাউন্ট তৈরি করুন
2. আপনার GitHub repository connect করুন

### Step 1: New Project তৈরি করুন

1. Railway Dashboard এ **"New Project"** ক্লিক করুন
2. **"Deploy from GitHub repo"** সিলেক্ট করুন
3. আপনার repository সিলেক্ট করুন

### Step 2: MySQL Database যোগ করুন

1. Project এ **"New"** → **"Database"** → **"Add MySQL"** ক্লিক করুন
2. Railway automatically MySQL database তৈরি করবে
3. Database এর **Variables** ট্যাবে গিয়ে `DATABASE_URL` কপি করুন

### Step 3: Server Service Configure করুন

1. আপনার GitHub service সিলেক্ট করুন
2. **Settings** → **Root Directory** → `server` সেট করুন
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`

### Step 4: Environment Variables সেট করুন

Service এর **Variables** ট্যাবে:

```bash
DATABASE_URL=${{MySQL.DATABASE_URL}}
SHADOW_DATABASE_URL=${{MySQL.DATABASE_URL}}
NODE_ENV=production
PORT=${{PORT}}
JWT_SECRET=<একটা strong random string>
JWT_REFRESH_SECRET=<আরেকটা strong random string>
```

> **Note**: Railway automatically `PORT` variable provide করে, তাই `${{PORT}}` ব্যবহার করুন।

### Step 5: Deploy করুন

1. Railway automatically deploy শুরু করবে
2. Deploy শেষ হলে **Settings** → **Networking** → **Generate Domain** ক্লিক করুন
3. আপনার public URL পাবেন (যেমন: `https://cleancare-server.up.railway.app`)

### Step 6: Database Migration চালান

Railway CLI ব্যবহার করে:

```bash
railway run npm run prisma:migrate
railway run npm run prisma:seed
```

---

## Flutter App Update করুন

Deploy করার পর, আপনার Flutter app এর `.env` file আপডেট করুন:

```bash
# Production Server URL (Render অথবা Railway)
PRODUCTION_URL=https://your-server-url.com

# Production mode enable করুন
USE_PRODUCTION=true

# Local development URLs (unchanged)
LOCAL_WEB_URL=http://localhost:4000
LOCAL_ANDROID_URL=http://192.168.0.100:4000
LOCAL_IOS_URL=http://localhost:4000
```

**Render এর জন্য**:
```bash
PRODUCTION_URL=https://cleancare-server.onrender.com
```

**Railway এর জন্য**:
```bash
PRODUCTION_URL=https://cleancare-server.up.railway.app
```

---

## Admin Panel Update করুন

Admin panel এর `.env` file আপডেট করুন:

```bash
VITE_API_BASE_URL=https://your-server-url.com
```

---

## Testing

### 1. Server Health Check
```bash
curl https://your-server-url.com/api/health
```

### 2. Flutter App Test
- `.env` file আপডেট করুন
- `USE_PRODUCTION=true` সেট করুন
- App run করুন এবং login/register test করুন

### 3. Admin Panel Test
- `.env` file আপডেট করুন
- Admin panel run করুন
- Login করে dashboard check করুন

---

## Cost Comparison

### Render Free Tier
- ✅ 750 hours/month free compute
- ✅ 1GB RAM
- ✅ MySQL database (256MB storage)
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Cold start time: ~30 seconds

### Railway Free Tier
- ✅ $5 free credit/month
- ✅ 512MB RAM
- ✅ MySQL database included
- ⚠️ Credit runs out based on usage
- ✅ No sleep/cold start issues

---

## Troubleshooting

### Database Connection Error
```bash
# Check DATABASE_URL format
mysql://username:password@host:port/database
```

### Prisma Migration Error
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push
```

### Build Timeout
- Render/Railway এর build timeout বাড়ান settings থেকে
- অথবা `package.json` এ build script optimize করুন

---

## Next Steps

1. ✅ Custom domain যোগ করুন (optional)
2. ✅ SSL certificate setup করুন (automatic)
3. ✅ Monitoring এবং logs check করুন
4. ✅ Database backups enable করুন
5. ✅ Environment variables secure রাখুন

---

## Support

কোনো সমস্যা হলে:
- Render: [docs.render.com](https://docs.render.com)
- Railway: [docs.railway.app](https://docs.railway.app)
- Prisma: [prisma.io/docs](https://www.prisma.io/docs)

---

**সফল deployment এর জন্য শুভকামনা! 🚀**
