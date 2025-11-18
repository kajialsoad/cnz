# Implementation Plan

- [ ] 1. Set up email service infrastructure


  - Install and configure email service dependencies (nodemailer)
  - Create email service module with SMTP configuration
  - Create email template for verification code
  - Add environment variables for email configuration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2. Update database schema for email verification
  - [ ] 2.1 Add email verification fields to User model in Prisma schema
    - Add `emailVerified`, `verificationCode`, `verificationCodeExpiry`, `accountStatus` fields
    - Update User model with new fields and defaults
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2_

  - [ ] 2.2 Create and run database migration
    - Generate Prisma migration for schema changes
    - Run migration on development database
    - Verify schema changes in database
    - _Requirements: 1.1, 7.1_

- [ ] 3. Implement backend email service
  - [ ] 3.1 Create email service class with SMTP configuration
    - Implement EmailService class with nodemailer
    - Add methods for sending generic emails and verification emails
    - Configure SMTP transport with environment variables
    - Add email template rendering functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.5_

  - [ ] 3.2 Create verification email HTML template
    - Design professional email template with Clean Care branding
    - Include verification code display with styling
    - Add expiry time information
    - Make template dynamic with user name and code
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 3.3 Add email service connection test endpoint
    - Create test endpoint to verify SMTP configuration
    - Test email sending functionality
    - _Requirements: 9.3, 9.4_

- [ ] 4. Implement verification code generation and validation
  - [ ] 4.1 Add verification code generation logic to auth service
    - Create method to generate 6-digit random codes
    - Implement code hashing using bcrypt
    - Add code expiry timestamp calculation (15 minutes)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1_

  - [ ] 4.2 Implement code validation logic
    - Create method to validate verification code against stored hash
    - Add expiry check functionality
    - Implement code invalidation after successful verification
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2_

- [ ] 5. Update auth service for email verification flow
  - [ ] 5.1 Modify register method to create pending user
    - Update register to create user with "pending_verification" status
    - Generate and store verification code
    - Send verification email after user creation
    - Return response indicating verification required
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2_

  - [ ] 5.2 Implement verifyEmail method
    - Create method to verify email with code
    - Validate code and check expiry
    - Update user status to "active" and set emailVerified to true
    - Generate and return access and refresh tokens
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.2_

  - [ ] 5.3 Implement resendVerificationCode method
    - Create method to resend verification code
    - Invalidate old codes and generate new one
    - Send new verification email
    - Return new expiry time
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.4 Add cleanup method for expired pending accounts
    - Create method to delete accounts pending for more than 24 hours
    - Query users with "pending_verification" status older than 24 hours
    - Delete expired pending accounts
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 6. Implement rate limiting middleware
  - [ ] 6.1 Create rate limiting for verification code requests
    - Implement rate limiter for resend verification endpoint
    - Set limit to 3 requests per 15 minutes per email
    - Add appropriate error messages
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ] 6.2 Create rate limiting for verification attempts
    - Implement rate limiter for verify email endpoint
    - Set limit to 5 attempts per 15 minutes
    - Add appropriate error messages
    - _Requirements: 10.2, 10.3, 10.4_

- [ ] 7. Create auth controller endpoints for verification
  - [ ] 7.1 Update register endpoint to handle verification flow
    - Modify register controller to call updated auth service
    - Return verification required response
    - Handle email sending errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

  - [ ] 7.2 Create verify-email endpoint
    - Implement POST /auth/verify-email endpoint
    - Validate request body (email and code)
    - Call auth service verifyEmail method
    - Return tokens on success
    - Handle validation errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3, 8.4_

  - [ ] 7.3 Create resend-verification endpoint
    - Implement POST /auth/resend-verification endpoint
    - Validate request body (email)
    - Call auth service resendVerificationCode method
    - Return success response
    - Handle errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.3_

- [ ] 8. Update auth routes with new endpoints
  - Add verify-email route with rate limiting middleware
  - Add resend-verification route with rate limiting middleware
  - Update existing routes documentation
  - _Requirements: 4.1, 5.1, 10.2, 10.3_

- [ ] 9. Update login endpoint to check email verification
  - Modify login controller to check emailVerified status
  - Return error if email not verified
  - Provide appropriate error message for unverified accounts
  - _Requirements: 7.3, 8.1, 8.2, 8.3_

- [ ] 10. Create email verification page in Flutter
  - [ ] 10.1 Create EmailVerificationPage widget
    - Create new page file with StatefulWidget
    - Accept email and userName as constructor parameters
    - Set up page scaffold with app bar
    - _Requirements: 3.1, 3.2_

  - [ ] 10.2 Implement 6-digit code input UI
    - Create 6 individual TextFormField widgets for code digits
    - Style input boxes with borders and spacing
    - Implement auto-focus to next box on input
    - Add backspace handling to move to previous box
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 10.3 Add countdown timer for code expiry
    - Implement Timer to count down from 15 minutes
    - Display remaining time in MM:SS format
    - Update UI every second
    - Show expiry message when timer reaches zero
    - _Requirements: 3.2, 6.5_

  - [ ] 10.4 Implement verify button and loading state
    - Add verify button that submits code
    - Show loading indicator during verification
    - Disable button while loading
    - _Requirements: 3.4, 8.3_

  - [ ] 10.5 Implement resend code functionality
    - Add resend code button
    - Disable button for 60 seconds after resend
    - Show countdown on button while disabled
    - Call resend API and reset timer
    - _Requirements: 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Update auth repository with verification methods
  - [ ] 11.1 Add verifyEmail method to AuthRepository
    - Create method that calls POST /auth/verify-email
    - Accept email and code parameters
    - Return tokens and user data on success
    - Handle API errors
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 11.2 Add resendVerificationCode method to AuthRepository
    - Create method that calls POST /auth/resend-verification
    - Accept email parameter
    - Return success response
    - Handle API errors
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.3 Update register method response handling
    - Modify register method to handle verification required response
    - Don't store tokens immediately
    - Return email and verification status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 12. Update signup page to navigate to verification
  - Modify _submit method in SignUpPage
  - Navigate to EmailVerificationPage after successful registration
  - Pass email and userName to verification page
  - Remove immediate token storage
  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ] 13. Implement verification page logic and error handling
  - [ ] 13.1 Add verification submission logic
    - Implement method to collect code from all 6 inputs
    - Call auth repository verifyEmail method
    - Store tokens on successful verification
    - Navigate to home page after verification
    - _Requirements: 4.1, 4.2, 4.3, 8.3_

  - [ ] 13.2 Add error handling and user feedback
    - Display error messages in Bangla for invalid codes
    - Show error for expired codes
    - Handle network errors
    - Display rate limit errors
    - Show success message on verification
    - _Requirements: 4.4, 4.5, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 13.3 Implement resend code logic
    - Call auth repository resendVerificationCode method
    - Reset countdown timer on successful resend
    - Show success message
    - Handle resend errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2_

- [ ] 14. Update login page to handle unverified accounts
  - Add error handling for "email not verified" error
  - Show dialog prompting user to verify email
  - Add button to navigate to verification page
  - Extract email from error response
  - _Requirements: 7.3, 8.1, 8.2, 8.3_

- [ ] 15. Add Bangla translations for verification UI
  - Add translations for verification page title and messages
  - Add error message translations
  - Add button text translations
  - Update existing translations file
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Set up cron job for account cleanup
  - Create scheduled task to run cleanup method daily
  - Use node-cron or similar library
  - Schedule cleanup to run at midnight
  - Log cleanup results
  - _Requirements: 7.4_

- [ ] 17. Add environment configuration and documentation
  - Add email service environment variables to .env.example
  - Document email provider setup (Gmail, SendGrid, AWS SES)
  - Add configuration instructions to README
  - Document rate limiting settings
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18. Create backend tests for verification flow
  - Write unit tests for email service
  - Write unit tests for verification code generation and validation
  - Write unit tests for auth service verification methods
  - Write integration tests for verification endpoints
  - Test rate limiting functionality
  - _Requirements: All_

- [ ] 19. Create Flutter tests for verification page
  - Write widget tests for EmailVerificationPage
  - Test code input functionality
  - Test timer countdown
  - Test resend button behavior
  - Write integration tests for complete signup-verification flow
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 20. Manual testing and deployment preparation
  - Test complete signup → verification → login flow
  - Test with real email providers (Gmail, SendGrid)
  - Test error scenarios (invalid code, expired code, rate limits)
  - Test on Android and iOS devices
  - Verify email delivery and formatting
  - Update API documentation
  - _Requirements: All_
