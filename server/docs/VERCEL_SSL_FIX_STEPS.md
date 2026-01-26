# Vercel SSL Error - Quick Fix Steps

## Current Status
✅ DATABASE_URL is correctly set in Vercel with `?sslmode=disable`
❌ But the deployment is still using the OLD value without SSL disabled

## The Problem
Vercel caches environment variables at build time. Even though you updated the DATABASE_URL in settings, the **running deployment** still has the old value.

## Solution: Force Redeploy

### Option 1: Redeploy via CLI (Fastest)
```bash
cd server
vercel --prod --force
```

The `--force` flag ensures a fresh build with the new environment variables.

### Option 2: Redeploy via Vercel Dashboard
1. Go to your Vercel project dashboard
2. Click on the "Deployments" tab
3. Find the latest deployment
4. Click the three dots menu (⋮)
5. Select "Redeploy"
6. Make sure "Use existing Build Cache" is **UNCHECKED**
7. Click "Redeploy"

### Option 3: Push a Small Change (Triggers Auto-Deploy)
```bash
# Make a small change to trigger redeployment
cd server
echo "# SSL fix deployed" >> README.md
git add .
git commit -m "Force redeploy with SSL disabled"
git push
```

## Verify the Fix

After redeploying, test the API:
```bash
node test-vercel-api.js
```

You should see:
- ✅ Health check passes
- ✅ City Corporations API works (no SSL error)
- ✅ Categories API works
- ✅ Register API works (with updated payload)

## Why This Happened

1. You updated DATABASE_URL in Vercel settings ✅
2. But the **running serverless functions** were already built with the old value
3. Vercel doesn't automatically restart functions when env vars change
4. You need to trigger a new deployment to pick up the changes

## Expected Timeline
- Redeploy: ~2-3 minutes
- DNS propagation: Instant (same URL)
- Total time: ~3 minutes

## If It Still Fails

Check the Vercel logs after redeployment:
1. Go to Vercel Dashboard → Your Project → Logs
2. Look for any Prisma connection errors
3. Verify the DATABASE_URL being used includes `?sslmode=disable`

If you still see SSL errors, the environment variable might not be set for the correct environment (Production vs Preview vs Development).

Make sure DATABASE_URL is set for **Production** environment specifically.
