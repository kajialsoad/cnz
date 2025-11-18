# Email Verification Signup - Design Document

## Overview

This design document outlines the implementation of email verification during the user signup process. The system will add an intermediate verification step between signup form submission and account activation, where users must verify their email address by entering a code sent to their email.

## Architecture

### High-Level Flow

```
User fills signup form → Submit → Backend creates pending user → 
Send verification email → Navigate to verification page → 
User enters code → Backend validates → Account activated → Login with tokens
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Flutter Mobile App                       │
├─────────────────────────────────────────────────────────────┤
│  SignUpPage → EmailVerificationPage → HomePage              │
│       ↓              ↓                                       │
│  AuthRepository  (API calls)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────────────┐
│                   Node.js Backend                            │
├─────────────────────────────────────────────────────────────┤
│  Auth Routes → Auth Controller → Auth Service               │
│                                      ↓                       │
│                              Email Service                   │
│                                      ↓                       │
│                              Database (Prisma)               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Backend Components

#### 1.1 Database Schema Updates

Add new fields to the User model in Prisma schema:

```prisma
model User {
  id                    Int       @id @default(autoincrement())
  name                  String
  phone                 String    @unique
  email                 String?   @unique
  password              String
  ward                  String?
  zone                  String?
  address               String?
  role                  String    @default("user")
  
  // New fields for email verification
  emailVerified         Boolean   @default(false)
  verificationCode      String?
  verificationCodeExpiry DateTime?
  accountStatus         String    @default("pending_verification") // pending_verification, active, suspended
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  complaints            Complaint[]
  chatMessages          ChatMessage[]
}
```

#### 1.2 Email Service Interface

Create a new email service module:

```typescript
// server/src/services/email.service.ts

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailData {
  userName: string;
  verificationCode: string;
  expiryMinutes: number;
}

class EmailService {
  // Send generic email
  async sendEmail(options: EmailOptions): Promise<void>
  
  // Send verification code email
  async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<void>
  
  // Test email configuration
  async testConnection(): Promise<boolean>
}
```

#### 1.3 Auth Service Updates

Update the existing auth service to handle verification:

```typescript
// server/src/services/auth.service.ts

class AuthService {
  // Modified register - creates pending user and sends verification
  async register(userData: RegisterDTO): Promise<{ 
    message: string; 
    email: string;
    requiresVerification: boolean;
  }>
  
  // New method - verify email with code
  async verifyEmail(email: string, code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserDTO;
  }>
  
  // New method - resend verification code
  async resendVerificationCode(email: string): Promise<{ 
    message: string;
    expiryTime: Date;
  }>
  
  // Helper - generate 6-digit code
  private generateVerificationCode(): string
  
  // Helper - hash verification code
  private hashVerificationCode(code: string): string
  
  // Helper - check if code is expired
  private isCodeExpired(expiryTime: Date): boolean
  
  // Helper - clean up expired pending accounts
  async cleanupExpiredAccounts(): Promise<void>
}
```

#### 1.4 Auth Controller Updates

Add new endpoints to the auth controller:

```typescript
// server/src/controllers/auth.controller.ts

class AuthController {
  // Modified - returns verification required message
  async register(req: Request, res: Response): Promise<void>
  
  // New endpoint - POST /auth/verify-email
  async verifyEmail(req: Request, res: Response): Promise<void>
  
  // New endpoint - POST /auth/resend-verification
  async resendVerification(req: Request, res: Response): Promise<void>
}
```

#### 1.5 Auth Routes Updates

```typescript
// server/src/routes/auth.routes.ts

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/login', authController.login); // Modified to check email verification
```

#### 1.6 Rate Limiting Middleware

```typescript
// server/src/middleware/rate-limit.middleware.ts

// Limit verification code requests
const verificationCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many verification requests, please try again later'
});

// Limit verification attempts
const verificationAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many verification attempts, please request a new code'
});
```

### 2. Flutter Components

#### 2.1 Email Verification Page

Create a new page for email verification:

**File**: `lib/pages/email_verification_page.dart`

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  ← Back        Email Verification       │
├─────────────────────────────────────────┤
│                                         │
│         📧 [Email Icon]                 │
│                                         │
│    Verify Your Email Address           │
│                                         │
│  We've sent a verification code to:    │
│      user@example.com                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Enter 6-digit code             │   │
│  │  [_] [_] [_] [_] [_] [_]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Code expires in: 14:32                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Verify Email               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Didn't receive the code?               │
│  [Resend Code]                          │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features**:
- 6 individual input boxes for verification code (OTP-style)
- Auto-focus moves to next box on input
- Countdown timer showing remaining time
- Resend button (disabled until 60 seconds pass)
- Loading state during verification
- Error messages displayed below code input

**State Management**:
```dart
class _EmailVerificationPageState extends State<EmailVerificationPage> {
  final List<TextEditingController> _codeControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  
  bool _isVerifying = false;
  bool _isResending = false;
  int _remainingSeconds = 900; // 15 minutes
  Timer? _timer;
  DateTime? _lastResendTime;
  
  String get verificationCode => _codeControllers.map((c) => c.text).join();
  bool get canResend => _lastResendTime == null || 
                        DateTime.now().difference(_lastResendTime!) > Duration(seconds: 60);
}
```

#### 2.2 Modified Signup Page

Update the existing signup page to navigate to verification page after successful registration:

**Changes to `lib/pages/signup_page.dart`**:

```dart
// In _submit() method, after successful registration:
if (!mounted) return;

// Navigate to email verification page instead of login
Navigator.pushReplacement(
  context,
  MaterialPageRoute(
    builder: (context) => EmailVerificationPage(
      email: email,
      userName: name,
    ),
  ),
);
```

#### 2.3 Auth Repository Updates

Update the auth repository to include new verification methods:

**File**: `lib/repositories/auth_repository.dart`

```dart
class AuthRepository {
  // Modified - no longer returns tokens immediately
  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    String? email,
    required String password,
    String? ward,
    String? zone,
    String? address,
  });
  
  // New method - verify email with code
  Future<Map<String, dynamic>> verifyEmail({
    required String email,
    required String code,
  });
  
  // New method - resend verification code
  Future<Map<String, dynamic>> resendVerificationCode({
    required String email,
  });
}
```

#### 2.4 Modified Login Page

Update login to handle unverified accounts:

**Changes to `lib/pages/login_page.dart`**:

```dart
// In login error handling:
if (errorStr.contains('email not verified')) {
  // Show dialog asking if user wants to verify now
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Email Not Verified'),
      content: Text('Please verify your email to continue'),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EmailVerificationPage(
                  email: extractedEmail,
                ),
              ),
            );
          },
          child: Text('Verify Now'),
        ),
      ],
    ),
  );
}
```

### 3. Email Templates

#### 3.1 Verification Email Template

**File**: `server/src/templates/verification-email.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - Clean Care</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2E8B57 0%, #7CC289 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Clean Care Bangladesh</h1>
    <p style="color: white; margin: 10px 0 0 0;">Email Verification</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2E8B57; margin-top: 0;">Hello {{userName}}!</h2>
    
    <p>Thank you for registering with Clean Care Bangladesh. To complete your registration, please verify your email address.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
      <h1 style="color: #2E8B57; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">{{verificationCode}}</h1>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">This code will expire in {{expiryMinutes}} minutes</p>
    </div>
    
    <p>Enter this code in the app to activate your account.</p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      If you didn't request this verification, please ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      © 2025 Clean Care Bangladesh. All rights reserved.
    </p>
  </div>
</body>
</html>
```

## Data Models

### Request/Response DTOs

#### Register Request (Modified)
```typescript
{
  name: string;
  phone: string;
  email: string;
  password: string;
  ward?: string;
  zone?: string;
  address?: string;
}
```

#### Register Response (Modified)
```typescript
{
  success: true;
  message: "Registration successful. Please verify your email.";
  data: {
    email: string;
    requiresVerification: true;
    expiryTime: string; // ISO date string
  }
}
```

#### Verify Email Request
```typescript
{
  email: string;
  code: string;
}
```

#### Verify Email Response
```typescript
{
  success: true;
  message: "Email verified successfully";
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      emailVerified: true;
      accountStatus: "active";
    }
  }
}
```

#### Resend Verification Request
```typescript
{
  email: string;
}
```

#### Resend Verification Response
```typescript
{
  success: true;
  message: "Verification code has been resent";
  data: {
    expiryTime: string; // ISO date string
  }
}
```

## Error Handling

### Backend Error Responses

```typescript
// Invalid verification code
{
  success: false;
  message: "Invalid verification code";
  statusCode: 400;
}

// Expired verification code
{
  success: false;
  message: "Verification code has expired. Please request a new one.";
  statusCode: 400;
}

// Rate limit exceeded
{
  success: false;
  message: "Too many verification attempts. Please try again later.";
  statusCode: 429;
}

// Email already verified
{
  success: false;
  message: "Email is already verified";
  statusCode: 400;
}

// User not found
{
  success: false;
  message: "No pending registration found for this email";
  statusCode: 404;
}

// Email service failure
{
  success: false;
  message: "Failed to send verification email. Please try again.";
  statusCode: 500;
}
```

### Flutter Error Handling

```dart
// Error messages in Bangla
final errorMessages = {
  'invalid_code': 'ভেরিফিকেশন কোড ভুল হয়েছে',
  'expired_code': 'কোডের মেয়াদ শেষ হয়ে গেছে। নতুন কোড পাঠান',
  'rate_limit': 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন',
  'already_verified': 'ইমেইল ইতিমধ্যে ভেরিফাই করা হয়েছে',
  'network_error': 'ইন্টারনেট সংযোগ চেক করুন',
  'email_send_failed': 'ইমেইল পাঠাতে ব্যর্থ। আবার চেষ্টা করুন',
};
```

## Testing Strategy

### Backend Unit Tests

1. **Email Service Tests**
   - Test email sending with valid SMTP configuration
   - Test email sending failure handling
   - Test verification email template rendering

2. **Auth Service Tests**
   - Test verification code generation (6 digits, unique)
   - Test code hashing and validation
   - Test code expiry logic
   - Test resend functionality
   - Test rate limiting
   - Test cleanup of expired accounts

3. **Auth Controller Tests**
   - Test register endpoint with email verification flow
   - Test verify-email endpoint with valid/invalid codes
   - Test resend-verification endpoint
   - Test error responses

### Flutter Widget Tests

1. **Email Verification Page Tests**
   - Test code input functionality
   - Test auto-focus between input boxes
   - Test timer countdown
   - Test resend button enable/disable
   - Test verification success flow
   - Test error display

2. **Integration Tests**
   - Test complete signup → verification → login flow
   - Test resend code flow
   - Test expired code handling
   - Test network error handling

### Manual Testing Checklist

1. **Happy Path**
   - [ ] User fills signup form
   - [ ] Verification email received
   - [ ] Code entered correctly
   - [ ] Account activated
   - [ ] User can login

2. **Error Scenarios**
   - [ ] Invalid code entered
   - [ ] Expired code entered
   - [ ] Resend code works
   - [ ] Rate limiting works
   - [ ] Network errors handled

3. **Edge Cases**
   - [ ] Email already registered
   - [ ] Email service down
   - [ ] Multiple resend requests
   - [ ] Account cleanup after 24 hours

## Security Considerations

### Code Generation
- Use cryptographically secure random number generator
- Generate 6-digit numeric codes (100000-999999)
- Hash codes before storing in database using bcrypt

### Rate Limiting
- Maximum 3 verification code requests per 15 minutes per email
- Maximum 5 verification attempts per code
- Implement exponential backoff for repeated failures

### Code Expiry
- Verification codes expire after 15 minutes
- Expired codes cannot be used
- Old codes invalidated when new code is requested

### Database Security
- Store hashed verification codes only
- Use indexed queries for performance
- Clean up expired pending accounts daily

### Email Security
- Use TLS/SSL for SMTP connections
- Validate email addresses before sending
- Implement SPF, DKIM, DMARC for email authentication
- Use environment variables for email credentials

## Configuration

### Environment Variables

```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Clean Care Bangladesh
SMTP_FROM_EMAIL=noreply@cleancare.bd

# Verification Settings
VERIFICATION_CODE_EXPIRY_MINUTES=15
VERIFICATION_CODE_LENGTH=6
PENDING_ACCOUNT_CLEANUP_HOURS=24

# Rate Limiting
VERIFICATION_REQUEST_LIMIT=3
VERIFICATION_REQUEST_WINDOW_MINUTES=15
VERIFICATION_ATTEMPT_LIMIT=5
```

### Email Provider Setup

**Gmail Setup**:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password in SMTP_PASSWORD

**SendGrid Setup**:
1. Create SendGrid account
2. Generate API key
3. Use API key for authentication

**AWS SES Setup**:
1. Verify domain in AWS SES
2. Create SMTP credentials
3. Use SMTP credentials in configuration

## Performance Considerations

### Database Optimization
- Add index on `email` and `verificationCodeExpiry` fields
- Use database cleanup job for expired accounts
- Implement connection pooling

### Email Sending
- Use async email sending (don't block API response)
- Implement email queue for high volume
- Add retry logic for failed emails

### Caching
- Cache email templates in memory
- Use Redis for rate limiting counters
- Cache user verification status

## Deployment Checklist

### Backend
- [ ] Update Prisma schema
- [ ] Run database migrations
- [ ] Configure email service credentials
- [ ] Set up environment variables
- [ ] Test email sending in production
- [ ] Set up cron job for account cleanup
- [ ] Configure rate limiting
- [ ] Update API documentation

### Flutter
- [ ] Add email verification page
- [ ] Update signup flow
- [ ] Update login flow
- [ ] Add Bangla translations
- [ ] Test on Android/iOS
- [ ] Update app version
- [ ] Submit to app stores

### Monitoring
- [ ] Set up email delivery monitoring
- [ ] Monitor verification success rate
- [ ] Track failed verification attempts
- [ ] Monitor rate limit hits
- [ ] Set up alerts for email service failures
