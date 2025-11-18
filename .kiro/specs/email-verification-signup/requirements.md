# Requirements Document

## Introduction

This document outlines the requirements for implementing email verification during the user signup process. The system will send a verification code to the user's email address during registration, and users must verify their email by entering the correct code before their account is activated and they can sign up successfully.

## Glossary

- **Flutter App**: The mobile application frontend built with Flutter/Dart
- **Node Backend**: The Express.js/TypeScript backend server
- **Verification Code**: A randomly generated numeric or alphanumeric code sent to the user's email
- **Email Service**: The service responsible for sending verification emails (e.g., Nodemailer, SendGrid)
- **Verification Token**: A temporary token stored in the database associated with the verification code
- **Email Verification Page**: The Flutter page where users enter the verification code
- **Code Expiry**: The time limit after which a verification code becomes invalid
- **Resend Functionality**: The ability to request a new verification code if the previous one expired or was not received

## Requirements

### Requirement 1: Email Verification Code Generation

**User Story:** As a new user, I want to receive a verification code via email when I sign up, so that I can verify my email address is valid.

#### Acceptance Criteria

1. WHEN the user submits the registration form with valid data, THE Node Backend SHALL generate a 6-digit numeric verification code
2. WHEN the verification code is generated, THE Node Backend SHALL store the code in the database with an expiry timestamp of 15 minutes
3. WHEN the code is stored, THE Node Backend SHALL associate it with the user's email address and registration data
4. THE Node Backend SHALL hash or encrypt the verification code before storing it in the database
5. WHEN the code generation is complete, THE Node Backend SHALL return a success response indicating that verification email has been sent

### Requirement 2: Verification Email Sending

**User Story:** As a new user, I want to receive a professional email with my verification code, so that I can easily complete the signup process.

#### Acceptance Criteria

1. WHEN the verification code is generated, THE Node Backend SHALL send an email to the user's provided email address
2. THE Email Service SHALL include the 6-digit verification code in the email body
3. THE Email Service SHALL include the user's name in the email greeting
4. THE Email Service SHALL include instructions on how to use the verification code
5. IF the email fails to send, THEN THE Node Backend SHALL return an error response and not create the user account

### Requirement 3: Email Verification Page in Flutter

**User Story:** As a new user, I want to enter the verification code I received via email, so that I can activate my account.

#### Acceptance Criteria

1. WHEN the user successfully submits the registration form, THE Flutter App SHALL navigate to the email verification page
2. THE Email Verification Page SHALL display an input field for the 6-digit verification code
3. THE Email Verification Page SHALL display the email address where the code was sent
4. THE Email Verification Page SHALL include a "Verify" button to submit the code
5. THE Email Verification Page SHALL include a "Resend Code" button to request a new verification code

### Requirement 4: Verification Code Validation

**User Story:** As a new user, I want my verification code to be validated quickly, so that I can start using the app without delays.

#### Acceptance Criteria

1. WHEN the user submits the verification code, THE Flutter App SHALL send a POST request to the Node Backend at `/auth/verify-email` endpoint
2. WHEN the Node Backend receives the verification request, THE Node Backend SHALL validate that the code matches the stored code for that email
3. WHEN the code is valid and not expired, THE Node Backend SHALL activate the user account and return access and refresh tokens
4. IF the code is invalid, THEN THE Node Backend SHALL return an error response with message "Invalid verification code"
5. IF the code has expired, THEN THE Node Backend SHALL return an error response with message "Verification code has expired"

### Requirement 5: Resend Verification Code

**User Story:** As a new user, I want to request a new verification code if I didn't receive the first one or if it expired, so that I can complete my registration.

#### Acceptance Criteria

1. WHEN the user clicks the "Resend Code" button, THE Flutter App SHALL send a POST request to the Node Backend at `/auth/resend-verification` endpoint
2. WHEN the Node Backend receives the resend request, THE Node Backend SHALL generate a new 6-digit verification code
3. WHEN the new code is generated, THE Node Backend SHALL invalidate any previous verification codes for that email
4. WHEN the new code is ready, THE Node Backend SHALL send a new verification email to the user
5. THE Flutter App SHALL display a success message "Verification code has been resent to your email"

### Requirement 6: Verification Code Expiry Handling

**User Story:** As a user, I want to be notified if my verification code has expired, so that I know to request a new one.

#### Acceptance Criteria

1. WHEN the user submits an expired verification code, THE Node Backend SHALL check the expiry timestamp
2. IF the code has expired (more than 15 minutes old), THEN THE Node Backend SHALL return a 400 status code with error message
3. WHEN the Flutter App receives an expiry error, THE Flutter App SHALL display the error message to the user
4. THE Flutter App SHALL automatically enable the "Resend Code" button when a code expires
5. THE Email Verification Page SHALL display a countdown timer showing time remaining before code expires

### Requirement 7: Pending User Account Management

**User Story:** As a system, I want to manage unverified user accounts properly, so that the database remains clean and secure.

#### Acceptance Criteria

1. WHEN a user submits registration data, THE Node Backend SHALL create a user record with status "pending_verification"
2. WHEN the email is verified successfully, THE Node Backend SHALL update the user status to "active"
3. THE Node Backend SHALL prevent login attempts for users with "pending_verification" status
4. WHERE a user account remains unverified for 24 hours, THE Node Backend SHALL automatically delete the pending account
5. IF a user tries to register with an email that has a pending verification, THEN THE Node Backend SHALL resend the verification code instead of creating a duplicate account

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback on the verification process, so that I understand what's happening and what to do next.

#### Acceptance Criteria

1. WHEN the verification email is sent successfully, THE Flutter App SHALL display "Verification code sent to [email]" message
2. IF the email service fails, THEN THE Flutter App SHALL display "Failed to send verification email. Please try again" message
3. WHILE the verification request is processing, THE Flutter App SHALL display a loading indicator
4. WHEN verification is successful, THE Flutter App SHALL display a success message and navigate to the home page
5. IF network errors occur, THEN THE Flutter App SHALL display appropriate error messages with retry options

### Requirement 9: Email Service Configuration

**User Story:** As a developer, I want to configure the email service easily, so that I can use different email providers for different environments.

#### Acceptance Criteria

1. THE Node Backend SHALL support configuration of SMTP settings through environment variables
2. THE Node Backend SHALL support multiple email providers (Gmail, SendGrid, AWS SES, etc.)
3. WHERE email service credentials are invalid, THE Node Backend SHALL log detailed error messages
4. THE Node Backend SHALL include a test endpoint to verify email service configuration
5. THE Node Backend SHALL use a professional "from" email address and sender name in verification emails

### Requirement 10: Security Considerations

**User Story:** As a system administrator, I want the verification process to be secure, so that user accounts cannot be compromised.

#### Acceptance Criteria

1. THE Node Backend SHALL generate cryptographically secure random verification codes
2. THE Node Backend SHALL implement rate limiting on verification code requests (maximum 3 requests per 15 minutes per email)
3. THE Node Backend SHALL implement rate limiting on verification attempts (maximum 5 attempts per code)
4. IF rate limits are exceeded, THEN THE Node Backend SHALL return a 429 status code with appropriate error message
5. THE Node Backend SHALL log all verification attempts for security auditing purposes
