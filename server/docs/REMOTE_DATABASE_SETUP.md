# Remote Database Connection Setup

## Your Current IP Address
**IP:** 160.191.83.125

## Steps to Enable Remote MySQL Access

### 1. Login to cPanel
- Go to your hosting cPanel
- URL: Usually `yourdomain.com/cpanel` or `yourdomain.com:2083`

### 2. Find Remote MySQL Section
- Search for "Remote MySQL" in cPanel
- Or find it under "Databases" section

### 3. Add Your IP Address
- Click "Add Access Host"
- Enter: `160.191.83.125`
- Click "Add Host"

### 4. Verify Database Credentials
Make sure your `.env` file has correct credentials:

```env
DATABASE_URL="mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna"
```

### 5. Test Connection

```bash
# Test with Prisma
cd server
npx prisma db pull

# Or test with Node.js
npm run dev
```

## Troubleshooting

### If Still Can't Connect:

1. **Check Firewall:**
   - Your ISP might be blocking port 3306
   - Try using SSH tunnel instead

2. **Check Database Server:**
   - Make sure MySQL is running on remote server
   - Verify port 3306 is open

3. **Check Credentials:**
   - Username: cleancar_munna
   - Password: mylovema2
   - Database: cleancar_munna
   - Host: ultra.webfastdns.com

### Alternative: Use SSH Tunnel

If direct connection doesn't work:

```bash
# Create SSH tunnel (if you have SSH access)
ssh -L 3306:localhost:3306 user@ultra.webfastdns.com

# Then use localhost in DATABASE_URL
DATABASE_URL="mysql://cleancar_munna:mylovema2@localhost:3306/cleancar_munna"
```

## For Development: Use Local Database

If remote connection is problematic, use local MySQL:

```bash
# Install MySQL locally
# Then update .env:
DATABASE_URL="mysql://root:@localhost:3306/cleancare_local"

# Create database
npx prisma db push
```

## Security Notes

⚠️ **Important:**
- Never use `%` (wildcard) in production
- Only add specific IP addresses
- Change database password regularly
- Use SSL connection if available

---
**Your IP:** 160.191.83.125  
**Date:** November 19, 2025
