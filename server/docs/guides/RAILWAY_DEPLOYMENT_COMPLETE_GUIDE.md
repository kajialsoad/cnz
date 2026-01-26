# 🚀 Railway Server Deployment - Complete Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup
আপনার Railway project-এ এই environment variables set করতে হবে:

```bash
# Database (Railway MySQL থেকে automatically পাবেন)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary Configuration
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=djeguy5v5
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cleancare.com

# Server Configuration
NODE_ENV=production
PORT=3000
```

### 2. Files Ready ✅
- ✅ `railway.json` - Railway configuration
- ✅ `.railwayignore` - Files to ignore during deployment
- ✅ `package.json` - Build and start scripts configured
- ✅ Prisma schema ready
- ✅ Cloudinary integration complete

---

## 🚀 Deployment Steps

### Step 1: Railway তে Environment Variables Set করুন

```bash
# Railway dashboard এ যান
# Settings > Variables section এ যান
# উপরের সব environment variables add করুন
```

**Important Variables:**
1. `DATABASE_URL` - Railway MySQL service থেকে copy করুন
2. `JWT_SECRET` - একটা strong random string generate করুন
3. `CLOUDINARY_*` - আপনার Cloudinary credentials
4. `NODE_ENV=production` - Production mode enable করতে

### Step 2: Deploy Command Run করুন

```bash
# Server directory তে যান
cd server

# Railway তে deploy করুন
railway up
```

### Step 3: Database Migration Run করুন

Deploy হওয়ার পর, Railway dashboard থেকে:

```bash
# Railway CLI দিয়ে
railway run npx prisma migrate deploy

# অথবা Railway dashboard > Deployments > Shell থেকে
npx prisma migrate deploy
```

### Step 4: Verify Deployment

```bash
# Health check
curl https://your-railway-url.railway.app/health

# API test
curl https://your-railway-url.railway.app/api/public/city-corporations
```

---

## 📋 Post-Deployment Tasks

### 1. Database Setup

```bash
# Railway shell থেকে run করুন
railway run node seed-city-corporations.js
```

### 2. Create Admin User

```bash
# Railway shell থেকে
railway run node create-test-user.js
```

### 3. Test Cloudinary Integration

```bash
# Test upload endpoint
curl -X POST https://your-railway-url.railway.app/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

---

## 🔧 Railway Configuration Details

### Build Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  }
}
```

**Build Process:**
1. `npm install` - Install dependencies
2. `prisma generate` - Generate Prisma client
3. `tsc` - Compile TypeScript to JavaScript

### Deploy Configuration
```json
{
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Start Command:** `node dist/index.js`

---

## 🌐 Environment-Specific Settings

### Production Settings
```env
NODE_ENV=production
USE_CLOUDINARY=true
LOG_LEVEL=info
```

### Database Connection
Railway automatically provides:
- MySQL database
- Connection pooling
- Automatic backups
- SSL connections

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
railway logs

# Follow logs
railway logs --follow
```

### Check Service Status
```bash
# Service info
railway status

# Environment info
railway environment
```

---

## 🔄 Update Deployment

### Deploy New Changes
```bash
# Commit your changes
git add .
git commit -m "Update: description"

# Deploy to Railway
railway up
```

### Rollback (if needed)
```bash
# Railway dashboard > Deployments
# Click on previous successful deployment
# Click "Redeploy"
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails
**Problem:** TypeScript compilation errors
**Solution:**
```bash
# Local এ test করুন
npm run build

# Errors fix করুন
# Then redeploy
railway up
```

#### 2. Database Connection Error
**Problem:** `DATABASE_URL` not set or incorrect
**Solution:**
```bash
# Railway dashboard > Variables
# DATABASE_URL verify করুন
# MySQL service link করুন
```

#### 3. Prisma Migration Issues
**Problem:** Migration fails during deployment
**Solution:**
```bash
# Manual migration run করুন
railway run npx prisma migrate deploy

# অথবা reset করুন (⚠️ Data loss!)
railway run npx prisma migrate reset --force
```

#### 4. Cloudinary Upload Fails
**Problem:** Images not uploading
**Solution:**
```bash
# Environment variables check করুন
railway variables

# Cloudinary credentials verify করুন
# USE_CLOUDINARY=true set আছে কিনা check করুন
```

---

## 🔐 Security Checklist

- ✅ `JWT_SECRET` strong এবং unique
- ✅ Database credentials secure
- ✅ Cloudinary API keys protected
- ✅ Email credentials secure
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation active

---

## 📈 Performance Optimization

### 1. Database Indexes
```bash
# Chat indexes apply করুন
railway run node apply-chat-indexes.js
```

### 2. Connection Pooling
Prisma automatically handles connection pooling in production.

### 3. Caching
Consider adding Redis for caching (Railway add-on available).

---

## 🎯 Quick Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs --follow

# Run migrations
railway run npx prisma migrate deploy

# Open dashboard
railway open

# Check status
railway status

# Environment variables
railway variables

# Shell access
railway shell
```

---

## 📞 Support & Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app/)
- [Nixpacks](https://nixpacks.com/)
- [Prisma on Railway](https://docs.railway.app/guides/prisma)

### Project Resources
- Cloudinary Setup: `.kiro/specs/cloud-image-storage/CLOUDINARY_SETUP_COMPLETE.md`
- API Documentation: `server/docs/`
- Testing Guide: `server/tests/README_INTEGRATION_TESTS.md`

---

## ✅ Deployment Success Checklist

- [ ] Environment variables set করা হয়েছে
- [ ] `railway up` successfully complete হয়েছে
- [ ] Database migrations run হয়েছে
- [ ] Health check endpoint working
- [ ] Cloudinary uploads working
- [ ] Admin user created
- [ ] City corporations seeded
- [ ] Mobile app connected to production URL
- [ ] Admin panel connected to production URL

---

## 🎊 Congratulations!

আপনার Clean Care server এখন Railway তে successfully deployed! 🚀

**Next Steps:**
1. Mobile app এর API URL update করুন
2. Admin panel এর API URL update করুন
3. Production testing করুন
4. Monitor logs for any issues

**Your Production URL:**
```
https://your-project-name.railway.app
```

---

## 📝 Notes

- Railway automatically handles SSL certificates
- Database backups are automatic
- Logs are retained for 7 days
- Free tier: 500 hours/month, $5 credit
- Upgrade for more resources if needed

**Deployment Date:** $(date)
**Status:** ✅ READY TO DEPLOY
