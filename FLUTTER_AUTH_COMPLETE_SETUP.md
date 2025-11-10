# 🚀 Flutter Authentication Complete Setup Guide

## ✅ What's Been Configured

### Backend (Node.js + Prisma + MySQL)
- ✅ Database connected to cPanel MySQL
- ✅ Prisma schema with User model
- ✅ Authentication endpoints ready
- ✅ Demo users seed file created

### Frontend (Flutter)
- ✅ API client configured
- ✅ Auth repository with login/register/logout
- ✅ Login page with validation
- ✅ Signup page with validation
- ✅ API config for easy URL management

---

## 🎯 Step 1: Setup Database & Create Demo Users

### 1.1 Navigate to server folder
```bash
cd server
```

### 1.2 Install dependencies (if not done)
```bash
npm install
```

### 1.3 Generate Prisma Client
```bash
npm run prisma:generate
```

### 1.4 Push schema to database
```bash
npx prisma db push
```

### 1.5 Create demo users
```bash
npm run prisma:seed
```

This will create 5 demo users:

| Role | Phone | Email | Password | Name |
|------|-------|-------|----------|------|
| Customer | 01712345678 | customer1@demo.com | Demo123!@# | Rahim Ahmed |
| Customer | 01812345678 | customer2@demo.com | Demo123!@# | Karim Hossain |
| Service Provider | 01912345678 | provider@demo.com | Demo123!@# | Jamal Khan |
| Admin | 01612345678 | admin@demo.com | Demo123!@# | Admin User |
| Super Admin | 01512345678 | superadmin@demo.com | Demo123!@# | Super Admin |

---

## 🎯 Step 2: Start Backend Server

```bash
npm run dev
```

Server will start on: `http://localhost:4000`

### Test if server is running:
Open browser: `http://localhost:4000/api/health`

You should see: `{"status":"ok"}`

---

## 🎯 Step 3: Run Flutter App

### 3.1 Navigate to project root
```bash
cd ..
```

### 3.2 Get Flutter dependencies
```bash
flutter pub get
```

### 3.3 Run the app

**For Web:**
```bash
flutter run -d chrome
```

**For Android Emulator:**
```bash
flutter run -d emulator
```

**For iOS Simulator:**
```bash
flutter run -d simulator
```

---

## 🧪 Step 4: Test Authentication

### Test Login
1. Open Flutter app
2. Go to Login page
3. Enter credentials:
   - **Phone**: `01712345678` or **Email**: `customer1@demo.com`
   - **Password**: `Demo123!@#`
4. Click Login
5. Should redirect to Home page

### Test Signup
1. Go to Signup page
2. Fill in the form:
   - **Name**: Your Name
   - **Phone**: 01999999999 (any unique number)
   - **Email**: test@example.com
   - **Password**: Test123!@#
3. Click Create Account
4. Should show success message
5. Go to Login and login with new credentials

---

## 📱 API Endpoints

All endpoints are prefixed with `/api`

### Authentication Endpoints:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Test with cURL:

**Register:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phone": "01999999999",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "password": "Demo123!@#"
  }'
```

---

## 🔧 Configuration Files

### Backend Configuration
📁 `server/.env`
```env
DATABASE_URL="mysql://cleancar_cleancare:YOUR_PASSWORD@localhost:3306/cleancar_clean care"
PORT=4000
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Flutter Configuration
📁 `lib/config/api_config.dart`
```dart
static const String localWebUrl = 'http://localhost:4000';
static const String localAndroidUrl = 'http://10.0.2.2:4000';
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Can't reach database server"**
- Check if MySQL is running in cPanel
- Verify DATABASE_URL in `server/.env`
- Check database password

**Error: "Port 4000 already in use"**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Or change port in server/.env
PORT=5000
```

**Error: "Prisma Client not generated"**
```bash
npm run prisma:generate
```

### Flutter Issues

**Error: "Network error"**
- Make sure backend server is running
- Check API URL in `lib/config/api_config.dart`
- For Android emulator, use `10.0.2.2` instead of `localhost`

**Error: "Failed to parse server response"**
- Check if backend is returning correct JSON format
- Check server logs for errors

**Error: "Invalid credentials"**
- Make sure you're using correct demo user credentials
- Password: `Demo123!@#`

---

## 📊 Database Management

### View database in browser:
```bash
cd server
npx prisma studio
```

Opens at: `http://localhost:5555`

### Reset database (CAUTION: Deletes all data):
```bash
npx prisma migrate reset
npm run prisma:seed
```

### Check database connection:
```bash
npx prisma db pull
```

---

## 🚀 Deployment

### Backend Deployment (cPanel)

1. Upload `server` folder to cPanel
2. SSH into server
3. Run:
```bash
cd server
npm install
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm start
```

4. Use PM2 for production:
```bash
npm install -g pm2
pm2 start dist/index.js --name "cleancare-api"
pm2 save
pm2 startup
```

### Flutter Deployment

**Update API URL in production:**
📁 `lib/config/api_config.dart`
```dart
static const String productionUrl = 'https://your-domain.com';
```

**Build for production:**
```bash
# Web
flutter build web

# Android
flutter build apk --release

# iOS
flutter build ios --release
```

---

## 📝 Next Steps

1. ✅ Database setup complete
2. ✅ Demo users created
3. ✅ Backend server running
4. ✅ Flutter app configured
5. 🔄 Test login/signup
6. 🔄 Add more features (complaints, payments, etc.)
7. 🔄 Deploy to production
8. 🔄 Setup SSL certificate

---

## 🆘 Need Help?

### Check Logs

**Backend logs:**
```bash
cd server
npm run dev
# Watch console for errors
```

**Flutter logs:**
```bash
flutter run --verbose
```

### Useful Commands

```bash
# Backend
npm run dev              # Start development server
npm run prisma:studio    # Open database GUI
npm run prisma:seed      # Create demo users
npx prisma validate      # Check schema

# Flutter
flutter doctor           # Check Flutter setup
flutter clean            # Clean build cache
flutter pub get          # Get dependencies
flutter run -v           # Run with verbose logging
```

---

## 🎉 Demo User Credentials

Use these to test the app:

**Customer 1:**
- Phone: `01712345678`
- Email: `customer1@demo.com`
- Password: `Demo123!@#`

**Customer 2:**
- Phone: `01812345678`
- Email: `customer2@demo.com`
- Password: `Demo123!@#`

**Service Provider:**
- Phone: `01912345678`
- Email: `provider@demo.com`
- Password: `Demo123!@#`

**Admin:**
- Phone: `01612345678`
- Email: `admin@demo.com`
- Password: `Demo123!@#`

**Super Admin:**
- Phone: `01512345678`
- Email: `superadmin@demo.com`
- Password: `Demo123!@#`

---

## ✨ Features Implemented

- ✅ User registration with validation
- ✅ User login (phone or email)
- ✅ JWT token authentication
- ✅ Token refresh mechanism
- ✅ Logout functionality
- ✅ User profile retrieval
- ✅ Error handling
- ✅ Loading states
- ✅ Bengali language support
- ✅ Responsive UI

---

## 🔐 Security Notes

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Change JWT secrets** in production
3. **Use HTTPS** in production
4. **Validate all inputs** on backend
5. **Hash passwords** with bcrypt (already implemented)
6. **Use secure tokens** for password reset
7. **Enable CORS** only for trusted domains in production

---

Happy Coding! 🎉
