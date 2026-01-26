# Email Verification - Disabled by Default

## Overview
The signup system has been modified to allow registration without email verification by default. Email verification can be easily enabled later by changing a configuration flag.

## Changes Made

### 1. Modified Auth Service (`server/src/services/auth.service.ts`)

#### Register Method
- Added check for `EMAIL_VERIFICATION_ENABLED` environment variable
- When disabled (default):
  - User account is created with `ACTIVE` status immediately
  - `emailVerified` is set to `true` automatically
  - No verification code is generated
  - No verification email is sent
  - User can login immediately after registration
- When enabled:
  - User account is created with `PENDING` status
  - Verification code is generated and sent via email
  - User must verify email before login

#### Login Method
- Added check for `EMAIL_VERIFICATION_ENABLED` environment variable
- When disabled: No email verification check is performed
- When enabled: Email verification is required for pending accounts

### 2. Environment Configuration (`server/.env`)

Added new configuration variable:
```
EMAIL_VERIFICATION_ENABLED=false
```

**Default**: `false` (verification disabled)
**To enable**: Change to `true`

## How It Works

### Current Flow (Verification Disabled)
```
1. User submits registration form
2. Account created with ACTIVE status
3. Response: "Registration successful. You can now login."
4. User can login immediately
```

### Future Flow (When Verification Enabled)
```
1. User submits registration form
2. Account created with PENDING status
3. Verification code sent to email
4. Response: "Registration successful. Please verify your email."
5. User enters verification code
6. Account activated, user can login
```

## Enabling Email Verification

To enable email verification in the future:

1. Open `server/.env`
2. Change:
   ```
   EMAIL_VERIFICATION_ENABLED=false
   ```
   to:
   ```
   EMAIL_VERIFICATION_ENABLED=true
   ```
3. Restart the server

That's it! The system will automatically:
- Require email verification for new signups
- Generate and send verification codes
- Prevent login until email is verified
- All existing verification endpoints remain functional

## Verification Endpoints (Always Available)

Even with verification disabled, these endpoints are available for future use:

- `POST /auth/verify-email` - Verify email with code
- `POST /auth/resend-verification` - Resend verification code

## Database Schema

The User model already has all necessary fields:
- `emailVerified` - Boolean flag
- `verificationCode` - Hashed verification code
- `verificationCodeExpiry` - Code expiry timestamp
- `status` - User account status (ACTIVE, PENDING, SUSPENDED)

No database changes needed when toggling verification on/off.

## Benefits

✅ **Immediate**: Users can start using the app right away
✅ **Flexible**: Can enable verification anytime without code changes
✅ **Safe**: All verification infrastructure is in place and tested
✅ **Backward Compatible**: Existing verification code works unchanged
✅ **Easy Toggle**: Single environment variable controls the feature

## Testing

### Test Without Verification (Current)
```bash
# 1. Register a new user
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "01700000000",
  "password": "password123"
}

# Response should indicate immediate login is possible
{
  "success": true,
  "message": "Registration successful. You can now login.",
  "data": {
    "email": "john@example.com",
    "requiresVerification": false
  }
}

# 2. Login immediately
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Should succeed without verification
```

### Test With Verification (After Enabling)
```bash
# Set EMAIL_VERIFICATION_ENABLED=true in .env

# 1. Register a new user
POST /auth/register
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "01700000001",
  "password": "password123"
}

# Response should indicate verification is required
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "email": "jane@example.com",
    "requiresVerification": true,
    "expiryTime": "2024-01-15T10:30:00Z"
  }
}

# 2. Try to login (should fail)
POST /auth/login
{
  "email": "jane@example.com",
  "password": "password123"
}

# Should fail with: "Please verify your email first"

# 3. Verify email
POST /auth/verify-email
{
  "email": "jane@example.com",
  "code": "123456"
}

# 4. Now login should work
```

## Configuration Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `EMAIL_VERIFICATION_ENABLED` | `false` | Enable/disable email verification requirement |
| `VERIFICATION_CODE_EXPIRY_MINUTES` | `15` | How long verification code is valid |
| `VERIFICATION_CODE_LENGTH` | `6` | Length of verification code |
| `PENDING_ACCOUNT_CLEANUP_HOURS` | `24` | Delete unverified accounts after this time |

## Migration Path

If you want to enable verification for existing users:

1. Set `EMAIL_VERIFICATION_ENABLED=true`
2. Existing active users can still login (they have `emailVerified=true`)
3. New registrations will require verification
4. Optionally, send verification emails to existing users to update their status

## Notes

- The Flutter app signup flow will automatically adapt based on the `requiresVerification` flag in the response
- No frontend changes needed - the app already handles both scenarios
- All rate limiting and security measures remain in place
- Email service configuration is still required for when verification is enabled

## Support

To switch between modes:
1. **Disable verification**: Set `EMAIL_VERIFICATION_ENABLED=false` and restart
2. **Enable verification**: Set `EMAIL_VERIFICATION_ENABLED=true` and restart

No database migrations or code changes required!
