# cPanel Database Setup Guide - Node.js Server

## Step 1: Create MySQL Database in cPanel

### 1.1 Login to cPanel
- Go to your hosting provider's cPanel
- Login with your credentials

### 1.2 Create Database
1. Find **MySQL® Databases** in cPanel
2. Under "Create New Database":
   - Database Name: `cleancare_db` (or your preferred name)
   - Click **Create Database**
3. Note the full database name (usually: `username_cleancare_db`)

### 1.3 Create Database User
1. Scroll to "MySQL Users" section
2. Create new user:
   - Username: `cleancare_user`
   - Password: Generate a strong password
   - Click **Create User**
3. Note the full username (usually: `username_cleancare_user`)

### 1.4 Add User to Database
1. Scroll to "Add User To Database"
2. Select:
   - User: `username_cleancare_user`
   - Database: `username_cleancare_db`
3. Click **Add**
4. Grant **ALL PRIVILEGES**
5. Click **Make Changes**

---

## Step 2: Get Database Connection Details

You'll need these details:
```
Host: localhost (or your cPanel MySQL host)
Database: username_cleancare_db
Username: username_cleancare_user
Password: [your generated password]
Port: 3306 (default MySQL port)
```

---

## Step 3: Configure Node.js Server

### 3.1 Update `.env` File
Create or update `server/.env`:

```env
# Database Configuration
DATABASE_URL="mysql://username_cleancare_user:your_password@localhost:3306/username_cleancare_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=production

# Email Configuration (optional)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"

# App Configuration
APP_URL="https://yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
```

### 3.2 DATABASE_URL Format
```
mysql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]
```

**Example:**
```
DATABASE_URL="mysql://myuser_cleancare:MyP@ssw0rd123@localhost:3306/myuser_cleancare_db"
```

**Important Notes:**
- Replace `username_` prefix with your actual cPanel username
- If password contains special characters (@, #, etc.), URL encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

---

## Step 4: Deploy and Run Migrations

### 4.1 Upload Files to cPanel
1. Upload your `server` folder to cPanel (via FTP or File Manager)
2. Recommended location: `/home/username/server/`

### 4.2 Install Dependencies
SSH into your server and run:
```bash
cd /home/username/server
npm install
```

### 4.3 Generate Prisma Client
```bash
npm run prisma:generate
```

### 4.4 Run Database Migrations
```bash
npx prisma migrate deploy
```

Or if you want to create a new migration:
```bash
npx prisma migrate dev --name init
```

### 4.5 Start the Server
```bash
npm start
```

Or for production with PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name "cleancare-api"
pm2 save
pm2 startup
```

---

## Step 5: Verify Database Connection

### 5.1 Check Prisma Connection
```bash
npx prisma db pull
```

### 5.2 View Database in Prisma Studio (Development Only)
```bash
npx prisma studio
```

### 5.3 Test API Endpoints
```bash
# Test health check
curl https://yourdomain.com/api/health

# Test registration
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "01712345678",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## Step 6: Remote Database Access (Optional)

If your Node.js server is hosted elsewhere (not on cPanel):

### 6.1 Enable Remote MySQL in cPanel
1. Go to **Remote MySQL®** in cPanel
2. Add your server's IP address to "Access Hosts"
3. Click **Add Host**

### 6.2 Update DATABASE_URL
```env
DATABASE_URL="mysql://username_cleancare_user:password@your-cpanel-domain.com:3306/username_cleancare_db"
```

---

## Troubleshooting

### Error: "Can't reach database server"
- Check if MySQL is running in cPanel
- Verify host, port, username, and password
- Check firewall rules for port 3306

### Error: "Access denied for user"
- Verify username and password
- Check if user has privileges on the database
- Ensure user is added to the database in cPanel

### Error: "Unknown database"
- Verify database name (include cPanel username prefix)
- Check if database exists in cPanel

### Error: "Too many connections"
- Increase connection pool limit in Prisma schema:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### Connection Pool Configuration
Add to your DATABASE_URL:
```
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=5&pool_timeout=10"
```

---

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong passwords** for database users
3. **Limit database privileges** - Only grant necessary permissions
4. **Use SSL/TLS** for database connections in production
5. **Regular backups** - Use cPanel backup tools
6. **Monitor logs** - Check for suspicious activity
7. **Update dependencies** regularly

---

## Database Backup

### Manual Backup in cPanel
1. Go to **phpMyAdmin** in cPanel
2. Select your database
3. Click **Export**
4. Choose format (SQL recommended)
5. Click **Go**

### Automated Backup
Set up cPanel backup schedule:
1. Go to **Backup** in cPanel
2. Configure automatic backups
3. Set backup frequency and retention

---

## Next Steps

1. ✅ Database created in cPanel
2. ✅ User created and privileges granted
3. ✅ `.env` file configured
4. ✅ Prisma migrations run
5. ✅ Server deployed and running
6. 🔄 Test all API endpoints
7. 🔄 Configure SSL certificate
8. 🔄 Set up monitoring and logging
9. 🔄 Configure backup schedule

---

## Useful Commands

```bash
# Check Prisma schema
npx prisma validate

# View database structure
npx prisma db pull

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Format Prisma schema
npx prisma format

# Check migration status
npx prisma migrate status
```

---

## Support

If you encounter issues:
1. Check cPanel error logs
2. Check Node.js application logs
3. Verify database connection string
4. Contact your hosting provider support
5. Check Prisma documentation: https://www.prisma.io/docs
