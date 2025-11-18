# Signup Flow Diagram

## Current Flow (Email Verification DISABLED)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Submit Registration  │
                │  - Email              │
                │  - Phone              │
                │  - Password           │
                │  - Name               │
                └───────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Check EMAIL_VERIFICATION_ENABLED     │
        │  (Currently: false)                   │
        └───────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              false │                │ true
                    │                │
        ┌───────────▼──┐    ┌────────▼──────────┐
        │ ACTIVE       │    │ PENDING           │
        │ Status       │    │ Status            │
        │              │    │                   │
        │ No code      │    │ Generate code     │
        │ No email     │    │ Send email        │
        └───────────┬──┘    └────────┬──────────┘
                    │                │
                    └────────┬───────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │  Return Response         │
                │  requiresVerification:   │
                │  - false (current)       │
                │  - true (if enabled)     │
                └──────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │  USER CAN LOGIN IMMEDIATELY ✅     │
        │  (No verification needed)          │
        └────────────────────────────────────┘
```

---

## Future Flow (Email Verification ENABLED)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Submit Registration  │
                │  - Email              │
                │  - Phone              │
                │  - Password           │
                │  - Name               │
                └───────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Check EMAIL_VERIFICATION_ENABLED     │
        │  (Set to: true)                       │
        └───────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Generate Code         │
                │ Hash Code             │
                │ Set Expiry (15 min)   │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Send Email with Code  │
                │ to User's Email       │
                └───────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Create User with PENDING Status   │
        │  Store verification code           │
        │  Store code expiry time            │
        └────────────────────────────────────┘
                            │
                            ▼
                ┌──────────────────────────┐
                │  Return Response         │
                │  requiresVerification:   │
                │  true                    │
                │  expiryTime: timestamp   │
                └──────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  USER MUST VERIFY EMAIL            │
        │  (Cannot login yet)                │
        └────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  User Enters Code     │
                │  from Email           │
                └───────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  POST /auth/verify-email           │
        │  - Email                           │
        │  - Code                            │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Validate Code                     │
        │  - Check if expired                │
        │  - Check if matches                │
        └────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              Valid │                │ Invalid
                    │                │
        ┌───────────▼──┐    ┌────────▼──────────┐
        │ Update User  │    │ Return Error      │
        │ - ACTIVE     │    │ - Invalid code    │
        │ - Verified   │    │ - Expired code    │
        │ Generate     │    │ - Other errors    │
        │ tokens       │    └───────────────────┘
        └───────────┬──┘
                    │
                    ▼
        ┌────────────────────────────────────┐
        │  Return Tokens                     │
        │  - Access Token                    │
        │  - Refresh Token                   │
        └────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────────────────┐
        │  USER CAN NOW LOGIN ✅             │
        │  (Email verified)                  │
        └────────────────────────────────────┘
```

---

## Login Flow Comparison

### Current (Verification Disabled)

```
┌──────────────────────────┐
│  User Login Request      │
│  - Email/Phone           │
│  - Password              │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Find User               │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Check Password          │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Check if Suspended      │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  EMAIL_VERIFICATION_     │
│  ENABLED = false         │
│  (Skip verification)     │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Generate Tokens         │
│  - Access Token          │
│  - Refresh Token         │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  LOGIN SUCCESS ✅        │
└──────────────────────────┘
```

### Future (Verification Enabled)

```
┌──────────────────────────┐
│  User Login Request      │
│  - Email/Phone           │
│  - Password              │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Find User               │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Check Password          │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  Check if Suspended      │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  EMAIL_VERIFICATION_     │
│  ENABLED = true          │
│  (Check verification)    │
└──────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
 PENDING │            │ ACTIVE
    │                │
┌───▼──────┐    ┌────▼──────┐
│ Check    │    │ Generate  │
│ Email    │    │ Tokens    │
│ Verified │    │           │
└───┬──────┘    └────┬──────┘
    │                │
    ├─ Not Verified  │
    │  ERROR ❌      │
    │                │
    └─ Verified      │
       │             │
       └─────┬───────┘
             │
             ▼
    ┌──────────────────────┐
    │  LOGIN SUCCESS ✅    │
    └──────────────────────┘
```

---

## Configuration Toggle

```
┌─────────────────────────────────────────────────────────┐
│              server/.env Configuration                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  EMAIL_VERIFICATION_ENABLED=false                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Current: Verification DISABLED ✅              │   │
│  │ - Users register and login immediately         │   │
│  │ - No verification emails sent                  │   │
│  │ - No verification code generated               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  To Enable Verification:                               │
│  1. Change to: EMAIL_VERIFICATION_ENABLED=true         │
│  2. Restart server                                     │
│  3. Done! ✅                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Response Message Flow

### Current (Verification Disabled)

```
Registration Request
        │
        ▼
┌──────────────────────────────────────┐
│  Response (Success)                  │
├──────────────────────────────────────┤
│ {                                    │
│   "success": true,                   │
│   "message": "Registration           │
│     successful. You can now login.", │
│   "data": {                          │
│     "email": "user@example.com",     │
│     "requiresVerification": false,   │
│     "expiryTime": null               │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  User can login immediately ✅       │
└──────────────────────────────────────┘
```

### Future (Verification Enabled)

```
Registration Request
        │
        ▼
┌──────────────────────────────────────┐
│  Response (Success)                  │
├──────────────────────────────────────┤
│ {                                    │
│   "success": true,                   │
│   "message": "Registration           │
│     successful. Please verify your   │
│     email.",                         │
│   "data": {                          │
│     "email": "user@example.com",     │
│     "requiresVerification": true,    │
│     "expiryTime": "2024-01-15T..."   │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  User must verify email first        │
│  (Cannot login yet)                  │
└──────────────────────────────────────┘
```

---

## Database State Comparison

### Current (Verification Disabled)

```
User Record Created:
┌─────────────────────────────────────┐
│ id: 1                               │
│ email: user@example.com             │
│ phone: 01700000000                  │
│ firstName: John                     │
│ lastName: Doe                       │
│ status: ACTIVE ✅                   │
│ emailVerified: true ✅              │
│ verificationCode: null              │
│ verificationCodeExpiry: null        │
│ createdAt: 2024-01-15T10:00:00Z     │
└─────────────────────────────────────┘

Result: User can login immediately ✅
```

### Future (Verification Enabled)

```
User Record Created:
┌─────────────────────────────────────┐
│ id: 1                               │
│ email: user@example.com             │
│ phone: 01700000001                  │
│ firstName: Jane                     │
│ lastName: Doe                       │
│ status: PENDING ⏳                  │
│ emailVerified: false ❌             │
│ verificationCode: $2b$12$hash...    │
│ verificationCodeExpiry: 2024-01-... │
│ createdAt: 2024-01-15T10:00:00Z     │
└─────────────────────────────────────┘

After Verification:
┌─────────────────────────────────────┐
│ id: 1                               │
│ email: user@example.com             │
│ phone: 01700000001                  │
│ firstName: Jane                     │
│ lastName: Doe                       │
│ status: ACTIVE ✅                   │
│ emailVerified: true ✅              │
│ verificationCode: null              │
│ verificationCodeExpiry: null        │
│ createdAt: 2024-01-15T10:00:00Z     │
└─────────────────────────────────────┘

Result: User can now login ✅
```

---

## Summary

### Current Setup (Verification Disabled)
```
Register → Account Created (ACTIVE) → Can Login Immediately ✅
```

### Future Setup (Verification Enabled)
```
Register → Account Created (PENDING) → Send Email → User Verifies → Can Login ✅
```

### Toggle
```
Change one line in .env + Restart = Switch between modes ✅
```

---

**Status**: ✅ READY
**Current**: Email verification DISABLED
**To Enable**: Change `EMAIL_VERIFICATION_ENABLED=false` to `true` in `.env`
