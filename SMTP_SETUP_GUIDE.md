# 📧 SMTP Email Verification Setup Guide

## 🎯 What is SMTP and Why Do We Need It?

**SMTP (Simple Mail Transfer Protocol)** is the technology that allows your server to send emails. In your Clean Care app, it's used to:
- ✅ Send email verification links when users register
- ✅ Send password reset emails
- ✅ Send welcome emails

**Current Status:** Your backend code is ready, but email credentials are missing!

---

## 📋 Option 1: Using Gmail (Recommended for Development)

### Step 1: Prepare Your Gmail Account

**What you need:**
- A Gmail account (your personal email or create a new one for the app)
- Access to Google Account settings

**Why 2-Factor Authentication?**
Google requires 2FA to generate App Passwords for security reasons. This ensures only you can create these passwords.

### Step 2: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification" section
3. Click "Get Started" or "Turn On" if not already enabled
4. Follow Google's prompts to:
   - Verify your phone number
   - Choose verification method (text message, phone call, or authenticator app)
   - Complete the setup

**Time needed:** 5-10 minutes

### Step 3: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
   - **Note:** You must have 2FA enabled first (Step 2)
   
2. You'll see "App passwords" page:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Type: **Clean Care Server**
   - Click **Generate**

3. Google will show a 16-character password in a yellow box:
   ```
   Example: abcd efgh ijkl mnop
   ```

4. **IMPORTANT:** Copy this password immediately!
   - You'll only see it once
   - Remove all spaces when copying
   - Save it somewhere safe

### Step 4: Update Your `.env` File

Open: `server/.env`

**Replace these lines:**
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**With your actual credentials:**
```env
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=yourname@gmail.com
```

**Example with real data:**
```env
SMTP_USER=maisha.cleancare@gmail.com
SMTP_PASS=xyzw1234abcd5678
EMAIL_FROM=maisha.cleancare@gmail.com
```

### Step 5: Update CLIENT_URL for Email Links

The CLIENT_URL tells the server where to send users when they click email verification links.

**For Flutter Mobile App (current setup):**
```env
CLIENT_URL=http://localhost:3000
```

**Change to your Flutter app URL:**
```env
CLIENT_URL=myapp://verify
```

**For now, you can use:**
```env
CLIENT_URL=http://localhost:4000
```

### Step 6: Restart Your Server

```powershell
# Stop the server (Ctrl+C in the terminal where it's running)

# Navigate to server folder
cd server

# Restart the server
npm run dev
```

You should see:
```
Server running on port 4000
```

---

## 📋 Option 2: Using SendGrid (Recommended for Production)

**Why SendGrid?**
- ✅ Free tier: 100 emails/day (enough for testing)
- ✅ Better delivery rates than Gmail
- ✅ Professional email tracking
- ✅ No need for 2FA setup

### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up with your email
3. Verify your email address
4. Complete the "Tell us about yourself" form

### Step 2: Generate API Key

1. In SendGrid dashboard, go to:
   - **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `Clean Care App`
4. Choose: **Full Access**
5. Click **Create & View**
6. Copy the API key (starts with `SG.`)

### Step 3: Update `.env` for SendGrid

```env
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_actual_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** SMTP_USER is literally the word `apikey` (SendGrid requirement)

---

## 🧪 Testing Your SMTP Setup

### Test 1: Start Server and Check Logs

```powershell
cd server
npm run dev
```

Look for any SMTP errors in the console.

### Test 2: Test Registration with Email

1. Use your Flutter app or Postman
2. Register a new user with a real email address
3. Check if email arrives

**Test Registration Request:**
```json
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "phone": "01999999999",
  "email": "your-real-email@gmail.com",
  "password": "Test123!@#"
}
```

### Test 3: Check Email Inbox

- Check inbox for verification email
- Check spam folder if not found
- Email should have subject: "ইমেইল ভেরিফিকেশন - ক্লিন কেয়ার"

---

## 🐛 Troubleshooting

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:** Your App Password is wrong
- Generate a new App Password
- Make sure you removed all spaces
- Update `.env` and restart server

### Issue: "Connection timeout" or "ETIMEDOUT"

**Solution:** Firewall or network issue
- Check if port 587 is blocked
- Try using port 465 with `SMTP_SECURE=true`
- Check your antivirus/firewall settings

### Issue: Emails not arriving

**Solution:** Check multiple things
- Verify SMTP credentials are correct
- Check spam/junk folder
- Check SendGrid/Gmail dashboard for errors
- Use a different email provider

### Issue: "Less secure app access" error

**Solution:** Use App Password instead
- Gmail no longer allows "less secure apps"
- You MUST use App Password (follow Step 2-3)

---

## 📊 Current Configuration Status

| Item | Status | Action Needed |
|------|--------|---------------|
| SMTP Code | ✅ Implemented | None |
| SMTP_HOST | ✅ Set (Gmail) | None |
| SMTP_PORT | ✅ Set (587) | None |
| SMTP_USER | ❌ Placeholder | **Update with real email** |
| SMTP_PASS | ❌ Placeholder | **Generate App Password** |
| EMAIL_FROM | ❌ Placeholder | **Update with real email** |
| CLIENT_URL | ⚠️ Needs Review | **Update for Flutter app** |

---

## ✅ Quick Setup Checklist

- [ ] Enable 2FA on Gmail account
- [ ] Generate Gmail App Password
- [ ] Update `SMTP_USER` in `.env`
- [ ] Update `SMTP_PASS` in `.env`
- [ ] Update `EMAIL_FROM` in `.env`
- [ ] Update `CLIENT_URL` in `.env`
- [ ] Restart server
- [ ] Test registration with real email
- [ ] Verify email arrives in inbox
- [ ] Click verification link (when Flutter page is ready)

---

## 🚀 Next Steps After SMTP Setup

Once emails are working, you'll need to:

1. **Create Email Verification Page in Flutter** (currently missing)
2. **Setup Deep Links** so email links open your app
3. **Add "Resend Email" button** in your app
4. **Test full registration flow**

---

## 💡 Pro Tips

1. **For Development:** Use Gmail (easier setup)
2. **For Production:** Use SendGrid (better reliability)
3. **Security:** Never commit `.env` file to Git (already in `.gitignore`)
4. **Testing:** Create a test Gmail account for testing
5. **Monitoring:** Check SendGrid dashboard for email delivery stats

---

## 📞 Need Help?

**Common questions:**

**Q: Do I need a domain name?**
A: No! For development, Gmail works fine. For production, consider getting a domain.

**Q: Will this work for many users?**
A: Gmail free: ~500 emails/day. SendGrid free: 100 emails/day. Upgrade for more.

**Q: Is my App Password safe?**
A: Yes! It only works for email, not your full Google account. You can revoke it anytime.

**Q: Can I use my personal Gmail?**
A: Yes, but better to create a separate account like "cleancare.notifications@gmail.com"

---

**Last Updated:** November 18, 2025
**Project:** Clean Care Mobile App
**Status:** Waiting for SMTP credentials
