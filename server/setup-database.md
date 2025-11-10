# Database Setup Instructions

## ✅ Your cPanel Database Info (from screenshots):
- **Database Name**: `cleancar_clean care`
- **Username**: `cleancar_cleancare` or `cleancar_cleancare1`
- **Host**: `localhost` (if same server) or your domain
- **Port**: `3306`

---

## 🔧 Step 1: Update .env File

Open `server/.env` and update this line:

```env
DATABASE_URL="mysql://cleancar_cleancare:YOUR_PASSWORD_HERE@localhost:3306/cleancar_clean care"
```

**Replace:**
- `YOUR_PASSWORD_HERE` → Your actual database password (jo tumne cPanel me create kiya tha)

**Example:**
```env
DATABASE_URL="mysql://cleancar_cleancare:MyPass123@localhost:3306/cleancar_clean care"
```

---

## 🚀 Step 2: Install Dependencies

```bash
cd server
npm install
```

---

## 📦 Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

Or:
```bash
npx prisma generate
```

---

## 🗄️ Step 4: Create Database Tables

### Option A: Using Migrations (Recommended)
```bash
npx prisma migrate deploy
```

### Option B: Push Schema (for development)
```bash
npx prisma db push
```

### Option C: Create New Migration
```bash
npx prisma migrate dev --name init
```

---

## ✅ Step 5: Verify Connection

Test if database connection works:

```bash
npx prisma db pull
```

If successful, you'll see: "Introspected X models and wrote them into prisma/schema.prisma"

---

## 🎯 Step 6: Start Server

```bash
npm run dev
```

Or for production:
```bash
npm run build
npm start
```

---

## 🧪 Step 7: Test API

Open browser or use curl:

```bash
# Health check
curl http://localhost:4000/api/health

# Register test user
curl -X POST http://localhost:4000/api/auth/register \
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

## ⚠️ Common Issues

### Error: "Can't reach database server"
**Solution:** Check if:
- Database password is correct in `.env`
- MySQL is running in cPanel
- Host is correct (`localhost` or your domain)

### Error: "Unknown database"
**Solution:** 
- Database name might have space: `cleancar_clean care`
- Try URL encoding: `cleancar_clean%20care`
- Or rename database in cPanel to remove space: `cleancar_cleancare`

### Error: "Access denied"
**Solution:**
- Verify username and password
- Check if user has ALL PRIVILEGES on database
- Go to cPanel → MySQL Databases → Add User To Database

---

## 🔐 Security Tips

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** for production
3. **Change JWT secrets** in production
4. **Enable SSL** for database connection in production
5. **Backup database** regularly

---

## 📝 Next Steps

After database setup:
1. ✅ Test all API endpoints
2. ✅ Connect Flutter app to API
3. ✅ Deploy to production server
4. ✅ Setup SSL certificate
5. ✅ Configure backup schedule

---

## 🆘 Need Help?

If you face any issues:
1. Check `server/logs` folder
2. Run `npx prisma validate` to check schema
3. Check cPanel error logs
4. Contact hosting provider support
