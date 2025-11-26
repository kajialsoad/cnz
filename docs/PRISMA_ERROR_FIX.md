# Prisma "include and select" Error Fix

## Problem
Error: "Please either use `include` or `select`, but not both at the same time"

This happens when TypeScript code changes aren't compiled to JavaScript.

## Solution

**1. Stop the server** (Ctrl+C)

**2. Rebuild TypeScript:**
```bash
cd server
npm run build
```

**3. Start server again:**
```bash
npm start
```

## Alternative: Use Dev Mode (Auto-recompile)

Instead of `npm start`, use:
```bash
npm run dev
```

This will auto-recompile TypeScript on changes.

## If Error Persists

Clear Prisma cache and regenerate client:
```bash
cd server
npx prisma generate
npm run build
npm start
```

## Current Status
- Code is correct (only uses `include`, not both)
- Issue is likely stale compiled JavaScript
- Rebuilding will fix it
