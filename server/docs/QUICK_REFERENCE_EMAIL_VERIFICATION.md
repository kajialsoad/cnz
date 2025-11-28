# Quick Reference: Email Verification Toggle

## Current Status
✅ **Email Verification is DISABLED** (default)

Users can register and login immediately without email verification.

## To Enable Email Verification Later

### Step 1: Edit `.env` file
```bash
# Change this line:
EMAIL_VERIFICATION_ENABLED=false

# To this:
EMAIL_VERIFICATION_ENABLED=true
```

### Step 2: Restart the server
```bash
npm run dev
# or
npm start
```

That's it! ✅

## What Changes When You Enable It

| Aspect | Disabled (Current) | Enabled |
|--------|-------------------|---------|
| Registration | Immediate account creation | Account created, needs verification |
| Email | No email sent | Verification code sent |
| Login | Can login right away | Must verify email first |
| User Status | `ACTIVE` | `PENDING` until verified |
| Response Message | "You can now login" | "Please verify your email" |

## Testing the Current Setup

### Register a user:
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "01700000000",
    "password": "password123"
  }'
```

### Login immediately:
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

✅ Should work without any verification!

## Files Modified

1. `server/src/services/auth.service.ts`
   - Updated `register()` method
   - Updated `login()` method

2. `server/.env`
   - Added `EMAIL_VERIFICATION_ENABLED=false`

## Verification Endpoints (Always Available)

These endpoints work regardless of the setting:

- `POST /auth/verify-email` - Verify with code
- `POST /auth/resend-verification` - Resend code

## Important Notes

- ✅ No database changes needed
- ✅ No frontend changes needed
- ✅ All existing verification code remains functional
- ✅ Can toggle on/off anytime
- ✅ Existing users unaffected

## Troubleshooting

**Q: I enabled verification but users can still login without verifying?**
A: Make sure you restarted the server after changing `.env`

**Q: Do I need to update the Flutter app?**
A: No! The app automatically handles both scenarios based on the API response

**Q: Can I enable verification for new users only?**
A: Yes! Existing users with `emailVerified=true` can still login. Only new registrations will require verification.

---

**Need to enable verification?** Just change one line in `.env` and restart! 🚀
