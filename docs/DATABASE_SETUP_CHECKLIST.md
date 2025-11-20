# ✅ Database Setup Checklist

## 📋 What You Have Already Done (from screenshots):

- ✅ Created database: `cleancar_clean care`
- ✅ Created users: `cleancar_cleancare` and `cleancar_cleancare1`
- ✅ Added remote access hosts: `157.180.49.182` and `dfff`
- ✅ User added to database with privileges

---

## 🎯 What You Need To Do Now:

### 1. Update `.env` File
📁 File: `server/.env`

```env
DATABASE_URL="mysql://cleancar_cleancare:YOUR_PASSWORD@localhost:3306/cleancar_clean care"
```

**Action:** Replace `YOUR_PASSWORD` with your actual database password

---

### 2. Install Dependencies
```bash
cd server
npm install
```

---

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

---

### 4. Run Database Migration
```bash
npx prisma migrate deploy
```

Or:
```bash
npx prisma db push
```

---

### 5. Start Server
```bash
npm run dev
```

---

### 6. Test API
Open browser: `http://localhost:4000/api/health`

---

## ⚠️ Important Notes:

### Database Name Issue
Your database name has a **space**: `cleancar_clean care`

This might cause issues. You have 2 options:

**Option 1: URL Encode the space**
```env
DATABASE_URL="mysql://cleancar_cleancare:password@localhost:3306/cleancar_clean%20care"
```

**Option 2: Rename database in cPanel (Recommended)**
1. Go to cPanel → MySQL Databases
2. Delete current database
3. Create new database: `cleancar_cleancare` (no space)
4. Add user to new database

---

## 🔍 Quick Test Commands:

```bash
# Check if Prisma can connect
npx prisma db pull

# Validate schema
npx prisma validate

# View database in browser
npx prisma studio
```

---

## 📞 Your Database Credentials:

```
Host: localhost
Database: cleancar_clean care
Username: cleancar_cleancare
Password: [You know this - you created it in cPanel]
Port: 3306
```

---

## 🚀 Ready to Deploy?

Once everything works locally:
1. Upload `server` folder to cPanel
2. SSH into server
3. Run: `npm install`
4. Run: `npm run prisma:generate`
5. Run: `npx prisma migrate deploy`
6. Run: `npm start` or use PM2

---

## 💡 Pro Tips:

1. **Backup** your database before running migrations
2. **Test** on local first, then deploy
3. **Use PM2** for production server management
4. **Enable SSL** for secure connections
5. **Monitor logs** regularly

---

## ❓ Still Confused?

Check these files:
- `server/setup-database.md` - Detailed setup guide
- `CPANEL_DATABASE_SETUP.md` - Complete cPanel guide
- `server/.env.example` - Environment variables example
