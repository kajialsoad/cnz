# 🚀 Quick Start: SMTP Setup in 5 Minutes

## Step 1: Enable 2FA on Gmail (3 minutes)

1. Open: https://myaccount.google.com/security
2. Find "2-Step Verification" → Click "Turn On"
3. Enter your phone number → Receive verification code → Done!

---

## Step 2: Get App Password (1 minute)

1. Open: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other** → Type: "Clean Care"
4. Click **Generate**
5. **Copy the 16-character password** (remove spaces!)
   - Example: `abcd efgh ijkl mnop` → becomes `abcdefghijklmnop`

---

## Step 3: Update `.env` File (1 minute)

Open: `server/.env`

**Find these lines:**
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Replace with YOUR credentials:**
```env
SMTP_USER=maisha@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=maisha@gmail.com
```

**⚠️ Important:** 
- Replace `maisha@gmail.com` with YOUR actual Gmail
- Replace `abcdefghijklmnop` with YOUR 16-character App Password
- NO spaces in the password!

---

## Step 4: Test It! (30 seconds)

```powershell
cd server
node test-email.js your-email@gmail.com
```

**You should see:** ✅ SUCCESS! Email sent successfully!

**Check your inbox** for the test email!

---

## 🐛 Troubleshooting

**Error: "Invalid login"**
→ Wrong App Password. Generate new one and update `.env`

**Error: "Connection timeout"**
→ Firewall blocking port 587. Check firewall settings.

**Email not arriving?**
→ Check spam folder!

---

## ✅ Done!

Your SMTP is now configured! 🎉

**What works now:**
- ✅ Registration sends verification email
- ✅ Password reset sends email
- ✅ Welcome email after verification

**What's still needed:**
- ❌ Email verification page in Flutter app (not built yet)
- ❌ Deep linking to handle email links

---

## 📞 Quick Links

- **Enable 2FA:** https://myaccount.google.com/security
- **Get App Password:** https://myaccount.google.com/apppasswords
- **Full Guide:** See `SMTP_SETUP_GUIDE.md`

---

**Need help?** Read the full guide in `SMTP_SETUP_GUIDE.md`
