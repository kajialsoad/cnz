# Vercel Database Connection Fix

## Problem:
City Corporations API returning 500 error on Vercel but working locally.

## Root Cause:
Prisma client not properly generated or DATABASE_URL not set in Vercel environment.

## Solution:

### Step 1: Verify Environment Variables in Vercel

Go to: https://vercel.com/kajialsoads-projects/server/settings/environment-variables

Make sure `DATABASE_URL` is set:
```
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna
```

### Step 2: Add Prisma Generate to Build

The `vercel-build` script in `package.json` should include:
```json
"vercel-build": "prisma generate"
```

This is already added ✅

### Step 3: Redeploy

After verifying environment variables:
```bash
cd server
vercel --prod
```

### Step 4: Check Vercel Logs

If still failing, check logs at:
https://vercel.com/kajialsoads-projects/server/logs

Look for:
- Prisma connection errors
- DATABASE_URL issues
- Missing environment variables

## Current Status:

✅ Local database connection working
✅ Health endpoint working on Vercel
✅ Categories endpoint working on Vercel
❌ City Corporations endpoint failing on Vercel

## Next Steps:

1. Verify DATABASE_URL in Vercel dashboard
2. Check if Prisma client is generated during build
3. Review Vercel function logs for specific error
4. Consider using connection pooling for serverless

## Alternative: Use Vercel Postgres or PlanetScale

For better serverless compatibility, consider:
- Vercel Postgres (built-in)
- PlanetScale (MySQL-compatible, serverless-optimized)
- Supabase (PostgreSQL with connection pooling)

Current MySQL setup may have connection limits in serverless environment.
