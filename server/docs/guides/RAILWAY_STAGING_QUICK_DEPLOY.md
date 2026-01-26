# ⚡ Railway Staging Quick Deploy
## Admin Complaint Status Enhancement

**Feature**: Enhanced Complaint Status Management  
**Date**: December 21, 2024

---

## 🚀 Quick Start

### Linux/Mac (Automated)

```bash
cd server
chmod +x deploy-staging-railway.sh
./deploy-staging-railway.sh
```

### Windows (Automated)

```cmd
cd server
deploy-staging-railway.cmd
```

### Manual (All Platforms)

```bash
cd server
npm install
npm run build
railway up
railway run npx prisma migrate deploy
```

---

## ✅ Pre-Flight Checklist

- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Logged in to Railway (`railway login`)
- [ ] Environment variables set in Railway dashboard
- [ ] Database backup created
- [ ] Local build tested (`npm run build`)
- [ ] Tests passing (`npm test`)

---

## 🔧 Required Environment Variables

Set these in Railway dashboard (Settings > Variables):

```env
DATABASE_URL=mysql://...          # From Railway MySQL service
JWT_SECRET=your-secret-key        # Min 32 characters
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=djeguy5v5
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
NODE_ENV=production
PORT=3000
```

---

## 🔍 Quick Verification

```bash
# Check deployment status
railway status

# Test health endpoint
curl https://your-app.railway.app/health

# Test API endpoint
curl https://your-app.railway.app/api/public/city-corporations

# View logs
railway logs --follow
```

---

## 🗄️ Database Migration

The deployment script automatically runs:

```bash
railway run npx prisma migrate deploy
```

**Migration**: `20241220_add_others_and_reviews`

**Changes**:
- New `reviews` table
- `Complaint.othersCategory` & `othersSubcategory`
- `Notification.complaintId`, `statusChange`, `metadata`
- Performance indexes
- Foreign key constraints

---

## 🔄 Quick Rollback

If something goes wrong:

```bash
# Option 1: Railway Dashboard
# Go to Deployments > Select previous deployment > Redeploy

# Option 2: Command Line
railway run mysql ... < backup.sql  # Restore database
git revert HEAD                      # Revert code
railway up                           # Redeploy
```

---

## 🧪 Quick Test

```bash
# Get your Railway URL
RAILWAY_URL=$(railway status | grep "URL" | awk '{print $2}')

# Test Others marking (replace TOKEN)
curl -X PATCH ${RAILWAY_URL}/api/admin/complaints/1/mark-others \
  -H "Authorization: Bearer TOKEN" \
  -d '{"othersCategory":"CORPORATION_INTERNAL","othersSubcategory":"Engineering"}'

# Test review submission (replace TOKEN)
curl -X POST ${RAILWAY_URL}/api/complaints/1/review \
  -H "Authorization: Bearer TOKEN" \
  -d '{"rating":5,"comment":"Great!"}'
```

---

## ⏱️ Estimated Time

- **Pre-checks**: 2 minutes
- **Build**: 2-3 minutes
- **Deploy**: 3-5 minutes
- **Migration**: 1-2 minutes
- **Verification**: 1-2 minutes
- **Total**: 10-15 minutes

---

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| "Railway CLI not found" | `npm install -g @railway/cli` |
| "Not logged in" | `railway login` |
| "Build failed" | Check `npm run build` locally |
| "Migration failed" | Verify DATABASE_URL is set |
| "Connection refused" | Wait 30s, service may be starting |

---

## 📱 Update Frontend Apps

### Admin Panel

```typescript
// clean-care-admin/src/config/apiConfig.ts
export const API_BASE_URL = 'https://your-app.railway.app'