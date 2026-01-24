@echo off
echo ========================================
echo Voice Message CSP Fix - Railway Deploy
echo ========================================
echo.

cd server

echo [1/3] Committing changes...
git add .
git commit -m "fix: Add Cloudinary to CSP mediaSrc for voice message playback"

echo.
echo [2/3] Deploying to Railway...
railway up

echo.
echo [3/3] Deployment complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Wait 2-3 minutes for Railway to rebuild
echo 2. Open admin panel: https://munna-production.up.railway.app/admin
echo 3. Test voice message playback in complaint chat
echo 4. Verify no CSP errors in browser console
echo.
echo Voice messages should now play successfully!
echo ========================================

pause
