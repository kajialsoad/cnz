# Environment Variables Configuration Guide

## 📋 Overview

This guide explains all environment variables needed for deploying Clean Care app to production.

---

## 🖥️ Server Environment Variables

### File: `server/.env` (Local Development)

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5500

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL="mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna"

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mnanjeeba@gmail.com
SMTP_PASS=smxipmkzhiigjese
SMTP_FROM_NAME=Clean Care Bangladesh
SMTP_FROM_EMAIL=noreply@cleancare.bd
EMAIL_FROM=mnanjeeba@gmail.com

# Verification Settings
EMAIL_VERIFICATION_ENABLED=true
VERIFICATION_CODE_EXPIRY_MINUTES=15
VERIFICATION_CODE_LENGTH=6
PENDING_ACCOUNT_CLEANUP_HOURS=24

# Rate Limiting
VERIFICATION_REQUEST_LIMIT=3
VERIFICATION_REQUEST_WINDOW_MINUTES=15
VERIFICATION_ATTEMPT_LIMIT=5

# App URLs
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5500
CLIENT_URL=http://localhost:5500

# Demo Mode
DEMO_MODE=false
```

---

### Vercel Environment Variables (Production)

**Set these in Vercel Dashboard → Settings → Environment Variables:**

#### Required Variables:

```env
# Database (REQUIRED)
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna

# JWT Secrets (REQUIRED)
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production-2024

# Environment (REQUIRED)
NODE_ENV=production

# CORS (REQUIRED)
CORS_ORIGIN=*
```

#### Optional Variables:

```env
# JWT Expiry
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mnanjeeba@gmail.com
SMTP_PASS=smxipmkzhiigjese
SMTP_FROM_NAME=Clean Care Bangladesh
SMTP_FROM_EMAIL=noreply@cleancare.bd
EMAIL_FROM=mnanjeeba@gmail.com

# Email Verification
EMAIL_VERIFICATION_ENABLED=true
VERIFICATION_CODE_EXPIRY_MINUTES=15
VERIFICATION_CODE_LENGTH=6
PENDING_ACCOUNT_CLEANUP_HOURS=24

# Rate Limiting
VERIFICATION_REQUEST_LIMIT=3
VERIFICATION_REQUEST_WINDOW_MINUTES=15
VERIFICATION_ATTEMPT_LIMIT=5

# Demo Mode
DEMO_MODE=false
```

---

## 🌐 Admin Panel Environment Variables

### File: `clean-care-admin/.env.local` (Local Development)

```env
# Backend API URL (Local)
VITE_API_BASE_URL=http://localhost:4000

# App Configuration
VITE_APP_NAME=Clean Care Admin
VITE_APP_VERSION=1.0.0
```

---

### File: `clean-care-admin/.env.production` (Production)

```env
# Backend API URL (Production - Update after deploying server)
VITE_API_BASE_URL=https://your-server-name.vercel.app

# App Configuration
VITE_APP_NAME=Clean Care Admin
VITE_APP_VERSION=1.0.0
```

**⚠️ Important:** Replace `your-server-name.vercel.app` with your actual Vercel server URL after deployment.

---

## 📱 Mobile App Configuration

### File: `lib/config/api_config.dart`

```dart
import 'package:flutter/foundation.dart';

class ApiConfig {
  // Production URL (Update after deploying server to Vercel)
  static const String productionUrl = 'https://your-server-name.vercel.app';
  
  // Local development URLs
  static const String localWebUrl = 'http://localhost:4000';
  static const String localAndroidUrl = 'http://192.168.0.100:4000';
  static const String localIosUrl = 'http://localhost:4000';
  
  // Automatically select URL based on mode
  static String get baseUrl {
    if (kReleaseMode) {
      return productionUrl;
    } else {
      if (kIsWeb) {
        return localWebUrl;
      } else if (defaultTargetPlatform == TargetPlatform.android) {
        return localAndroidUrl;
      } else {
        return localIosUrl;
      }
    }
  }
  
  // API endpoints
  static const String authRegister = '/api/auth/register';
  static const String authLogin = '/api/auth/login';
  static const String authLogout = '/api/auth/logout';
  static const String authRefresh = '/api/auth/refresh';
  static const String authMe = '/api/auth/me';
  
  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
}
```

**⚠️ Important:** Replace `your-server-name.vercel.app` with your actual Vercel server URL.

---

## 🔐 Security Best Practices

### 1. JWT Secrets
```env
# ❌ BAD - Weak secret
JWT_ACCESS_SECRET=secret123

# ✅ GOOD - Strong secret
JWT_ACCESS_SECRET=a8f5f167f44f4964e6c998dee827110c03f0d5e8e8e8e8e8e8e8e8e8e8e8e8e8
```

**Generate strong secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. Database URL
```env
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE

# ✅ Use strong password
# ✅ Use SSL if available
# ✅ Restrict database user permissions
```

### 3. CORS Configuration
```env
# Development - Allow all
CORS_ORIGIN=*

# Production - Specific domains (recommended)
CORS_ORIGIN=https://your-admin-panel.vercel.app,https://your-domain.com
```

### 4. Email Credentials
```env
# ✅ Use app-specific passwords
# ✅ Don't use your main email password
# ✅ Enable 2FA on email account
```

---

## 📝 How to Set Environment Variables

### Local Development

1. Create `.env` file in project root
2. Copy variables from template
3. Update with your values
4. Never commit `.env` to git

### Vercel Deployment

#### Method 1: Vercel Dashboard (Recommended)

1. Go to your project on Vercel
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable:
   - Name: `DATABASE_URL`
   - Value: `mysql://...`
   - Environment: Production
5. Click **Save**

#### Method 2: Vercel CLI

```bash
# Set single variable
vercel env add DATABASE_URL production

# Import from file
vercel env pull .env.production
```

---

## ✅ Verification Checklist

### Server Variables
- [ ] `DATABASE_URL` - Database connection string
- [ ] `JWT_ACCESS_SECRET` - Strong random string
- [ ] `JWT_REFRESH_SECRET` - Different from access secret
- [ ] `NODE_ENV` - Set to "production"
- [ ] `CORS_ORIGIN` - Set to "*" or specific domains

### Admin Panel Variables
- [ ] `VITE_API_BASE_URL` - Points to deployed server

### Mobile App Configuration
- [ ] `productionUrl` - Points to deployed server
- [ ] Build mode set to release

---

## 🧪 Testing Environment Variables

### Test Server Connection
```bash
# Test database connection
node -e "require('./src/utils/prisma').default.\$connect().then(() => console.log('✅ DB Connected')).catch(e => console.error('❌ Error:', e))"

# Test server health
curl https://your-server.vercel.app/api/health
```

### Test Admin Panel
```bash
# Check API URL
cat clean-care-admin/.env.production

# Test build
cd clean-care-admin
npm run build
```

### Test Mobile App
```bash
# Check configuration
cat lib/config/api_config.dart

# Build APK
flutter build apk --release
```

---

## 🔄 Updating Environment Variables

### When to Update

1. **After Server Deployment**
   - Update `VITE_API_BASE_URL` in admin panel
   - Update `productionUrl` in mobile app

2. **Security Rotation**
   - Rotate JWT secrets every 3-6 months
   - Update database passwords regularly

3. **Feature Changes**
   - Add new variables as needed
   - Remove unused variables

### How to Update

#### Vercel
1. Go to Settings → Environment Variables
2. Edit the variable
3. Redeploy the project

#### Mobile App
1. Edit `lib/config/api_config.dart`
2. Rebuild APK
3. Distribute new version

---

## 🚨 Common Issues

### Issue 1: Database Connection Failed
```
Error: Can't reach database server
```

**Solution:**
- Check `DATABASE_URL` format
- Verify database host is accessible
- Check firewall rules
- Verify credentials

### Issue 2: CORS Error
```
Error: CORS policy blocked
```

**Solution:**
- Set `CORS_ORIGIN=*` for testing
- Add specific domains for production
- Verify admin panel URL is allowed

### Issue 3: JWT Invalid
```
Error: Invalid token
```

**Solution:**
- Verify `JWT_ACCESS_SECRET` matches
- Check token expiry settings
- Clear browser/app cache

---

## 📊 Environment Variables Summary

### Required for Basic Functionality
```
✅ DATABASE_URL
✅ JWT_ACCESS_SECRET
✅ JWT_REFRESH_SECRET
✅ NODE_ENV
✅ CORS_ORIGIN
```

### Optional but Recommended
```
⚠️ SMTP_* (for email features)
⚠️ EMAIL_VERIFICATION_ENABLED
⚠️ Rate limiting settings
```

### Platform-Specific
```
📱 Mobile: productionUrl in api_config.dart
🌐 Admin: VITE_API_BASE_URL in .env.production
```

---

## 💡 Pro Tips

1. **Use different secrets** for development and production
2. **Never commit** `.env` files to git
3. **Document** all custom variables
4. **Test** after changing variables
5. **Backup** variable values securely
6. **Rotate** secrets regularly
7. **Use** environment-specific values
8. **Monitor** for exposed secrets

---

## 📞 Need Help?

### Resources
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [Flutter Configuration](https://docs.flutter.dev/deployment/flavors)

### Common Commands
```bash
# List Vercel environment variables
vercel env ls

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add VARIABLE_NAME production
```

---

**Keep your environment variables secure and up-to-date! 🔐**
