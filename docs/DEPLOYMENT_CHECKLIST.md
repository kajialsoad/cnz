# Deployment Checklist - Clean Care App

## 📋 Pre-Deployment Checklist

### Server (Backend)
- [ ] Database connection tested
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API endpoints tested
- [ ] Rate limiting configured
- [ ] Error handling verified

### Admin Panel (Frontend)
- [ ] API base URL updated
- [ ] Build successful
- [ ] Login/logout working
- [ ] All features tested
- [ ] Responsive design verified

### Mobile App
- [ ] API configuration updated
- [ ] Production URL set
- [ ] Build successful (APK/AAB)
- [ ] Tested on real device
- [ ] Images loading correctly
- [ ] Chat working properly

---

## 🚀 Deployment Steps

### Step 1: Deploy Server to Vercel

```bash
cd server

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**After deployment, copy the URL:**
```
✅ Server URL: https://your-server-name.vercel.app
```

**Set Environment Variables in Vercel Dashboard:**
```
DATABASE_URL=mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production-2024
CORS_ORIGIN=*
NODE_ENV=production
PORT=4000
```

---

### Step 2: Update Admin Panel Configuration

Edit `clean-care-admin/.env.production`:
```env
VITE_API_BASE_URL=https://your-server-name.vercel.app
```

---

### Step 3: Deploy Admin Panel to Vercel

```bash
cd clean-care-admin

# Build
npm run build

# Deploy
vercel --prod
```

**After deployment, copy the URL:**
```
✅ Admin Panel URL: https://your-admin-panel.vercel.app
```

---

### Step 4: Update Mobile App Configuration

Edit `lib/config/api_config.dart`:
```dart
static const String productionUrl = 'https://your-server-name.vercel.app';
```

---

### Step 5: Build Mobile App

```bash
# Build APK
flutter build apk --release

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

**APK Location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

---

## ✅ Post-Deployment Verification

### 1. Test Server
```bash
# Open in browser:
https://your-server-name.vercel.app/api/health

# Expected response:
{"status": "ok", "message": "Server is running"}
```

### 2. Test Admin Panel
```bash
# Open in browser:
https://your-admin-panel.vercel.app

# Login with:
Email: admin@cleancare.com
Password: admin123
```

### 3. Test Mobile App
- [ ] Install APK on device
- [ ] Enable internet connection
- [ ] Login with test account
- [ ] Create a complaint
- [ ] Send a chat message
- [ ] Upload an image
- [ ] Verify all features work

---

## 🔧 Troubleshooting

### Issue: Server not connecting
**Solution:**
1. Check server URL in mobile app config
2. Verify CORS settings in server
3. Check Vercel deployment logs
4. Verify environment variables

### Issue: Images not loading
**Solution:**
1. Check URL helper in mobile app
2. Verify image URLs in database
3. Check CORS for image requests
4. Verify file upload configuration

### Issue: Admin panel API errors
**Solution:**
1. Check API base URL in admin config
2. Verify server is running
3. Check browser console for errors
4. Verify authentication tokens

---

## 📊 URLs Summary

After deployment, you will have:

```
✅ Server API: https://your-server-name.vercel.app
✅ Admin Panel: https://your-admin-panel.vercel.app
✅ Mobile App: APK file for distribution
```

---

## 🎯 Next Steps

### Immediate:
1. Test all features thoroughly
2. Monitor error logs
3. Check performance
4. Gather user feedback

### Short-term:
1. Setup custom domain
2. Configure SSL certificates
3. Setup monitoring (Sentry)
4. Add analytics

### Long-term:
1. Publish to Play Store
2. Setup CI/CD pipeline
3. Add automated testing
4. Scale infrastructure

---

## 📞 Support

For issues or questions:
- Check documentation in `/server/PRODUCTION_SETUP_GUIDE.md`
- Review API documentation
- Check Vercel deployment logs
- Test with provided test scripts

---

**Your Clean Care app is ready for production! 🚀**
