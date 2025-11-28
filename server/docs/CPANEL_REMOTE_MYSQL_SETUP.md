# cPanel Remote MySQL Setup for Vercel

## 🎯 Goal:
Allow Vercel serverless functions to connect to your cPanel MySQL database.

## 📋 Step-by-Step Guide:

### Step 1: Login to cPanel

1. Go to: https://ultra.webfastdns.com:2083
2. Login with your credentials
3. Find **"Remote MySQL"** in the Databases section

### Step 2: Add Remote Access Host

In Remote MySQL section:

**Option A: Allow All IPs (Easy but less secure)**
```
Host: %
Comment: Allow Vercel Access
```

**Option B: Allow Specific Vercel IPs (More secure)**
```
Host: 76.76.21.0/24
Comment: Vercel IP Range 1

Host: 76.76.19.0/24
Comment: Vercel IP Range 2
```

Click **"Add Host"** for each entry.

### Step 3: Verify MySQL User Permissions

Make sure your MySQL user has remote access:

1. Go to **"MySQL Databases"** in cPanel
2. Find user: `cleancar_munna`
3. Check if remote access is allowed
4. If not, recreate user with remote access enabled

### Step 4: Test Connection from External

You can test if remote connection works:

```bash
mysql -h ultra.webfastdns.com -P 3306 -u cleancar_munna -p cleancar_munna
```

If this works from your local machine, Vercel should also work.

### Step 5: Update Vercel Environment Variables

Go to: https://vercel.com/kajialsoads-projects/server/settings/environment-variables

Make sure `DATABASE_URL` is set:
```
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna
```

### Step 6: Redeploy Vercel

After enabling remote MySQL:
```bash
cd server
vercel --prod
```

## 🔍 Troubleshooting:

### Issue 1: "Access denied for user"
**Solution**: Check MySQL user permissions in cPanel

### Issue 2: "Can't connect to MySQL server"
**Solution**: 
- Check if port 3306 is open
- Contact hosting provider to enable external MySQL access
- Check firewall settings

### Issue 3: "Too many connections"
**Solution**: 
- Increase MySQL connection limit in cPanel
- Use connection pooling (see below)

### Issue 4: Vercel timeout
**Solution**: 
- Check database server location (latency)
- Consider using connection pooling
- Migrate to serverless-friendly database

## ⚡ Connection Pooling (Recommended)

For better performance in serverless, add connection pooling:

**Update `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

**Or use connection pooler URL:**
```
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?connection_limit=5&pool_timeout=10
```

## 🚀 Alternative Solutions:

If cPanel MySQL doesn't work well with Vercel:

### Option 1: PlanetScale (Recommended)
- Free tier available
- MySQL-compatible
- Built for serverless
- No connection limits
- Global edge network

**Setup:**
1. Create account: https://planetscale.com
2. Create database
3. Get connection string
4. Update DATABASE_URL in Vercel
5. Run migrations

### Option 2: Supabase
- PostgreSQL-based
- Free tier available
- Connection pooling built-in
- Real-time features

### Option 3: Railway
- MySQL/PostgreSQL support
- Easy migration
- Good for serverless

## 📊 Current Status:

**Database**: cPanel MySQL (ultra.webfastdns.com)  
**Issue**: Remote access not enabled  
**Solution**: Enable Remote MySQL in cPanel  

## ⚠️ Important Notes:

1. **Security**: Don't use `%` (all IPs) in production
2. **Connection Limits**: cPanel MySQL may have connection limits
3. **Latency**: Check if database location causes timeout
4. **Backup**: Always backup before making changes

## 🎯 Recommended Action:

**For Quick Fix**: Enable Remote MySQL with `%` wildcard  
**For Production**: Use PlanetScale or add specific Vercel IPs  
**For Best Performance**: Migrate to serverless-friendly database  

---

**Need Help?**
- Contact your hosting provider support
- Check cPanel documentation
- Consider database migration
