# Input Validation and Security Implementation

## Overview

This document describes the comprehensive input validation and sanitization implementation for the Clean Care Admin Management System. The implementation addresses security requirements 12.5 through 12.12.

## Requirements Addressed

### Requirement 12.5: Input Validation
✅ **IMPLEMENTED**: All input fields are validated using Zod schemas with strict type checking and custom validation rules.

### Requirement 12.6: Email Format Validation
✅ **IMPLEMENTED**: Email validation using the `validator` library with comprehensive format checking.

### Requirement 12.7: Phone Number Format Validation
✅ **IMPLEMENTED**: Bangladesh phone number format validation (01XXXXXXXXX) with regex pattern matching.

### Requirement 12.8: Password Strength Validation
✅ **IMPLEMENTED**: Password validation requiring:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)
- Check against common weak passwords

### Requirement 12.9: SQL Injection Prevention
✅ **IMPLEMENTED**: Multiple layers of SQL injection prevention:
- Prisma ORM with parameterized queries
- Input sanitization removing SQL keywords
- String escaping for raw queries

### Requirement 12.10: XSS Prevention
✅ **IMPLEMENTED**: XSS prevention using:
- DOMPurify for HTML sanitization
- Script tag removal
- Event handler removal
- JavaScript protocol removal

### Requirement 12.11: CSRF Protection
✅ **IMPLEMENTED**: CSRF protection with:
- Token generation and validation
- Session-based token storage
- Automatic token expiration
- Token validation middleware

### Requirement 12.12: NoSQL Injection Prevention
✅ **IMPLEMENTED**: NoSQL injection prevention using:
- express-mongo-sanitize middleware
- Input sanitization
- Logging of injection attempts

## Security Middleware

### 1. Helmet Configuration
```typescript
helmetConfig
```
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled

### 2. XSS Prevention
```typescript
xssPrevention
```
- Sanitizes all string inputs in body, query, and params
- Removes HTML tags and dangerous JavaScript
- Uses DOMPurify for comprehensive sanitization

### 3. NoSQL Injection Prevention
```typescript
noSqlInjectionPrevention
```
- Sanitizes MongoDB/NoSQL operators
- Replaces dangerous characters
- Logs injection attempts

### 4. HTTP Parameter Pollution Prevention
```typescript
parameterPollutionPrevention
```
- Prevents duplicate parameters
- Whitelist of allowed duplicate parameters

### 5. CSRF Protection
```typescript
csrfProtection
```
- Token-based CSRF protection
- Session validation
- Automatic token expiration

### 6. Security Headers
```typescript
securityHeaders
```
- Additional security headers
- Referrer policy
- Permissions policy

## Validation Schemas

### Admin User Validation

#### Create User
```typescript
createAdminUserSchema
```
- Validates all required fields
- Sanitizes string inputs
- Validates email and phone formats
- Validates password strength
- Strict mode (rejects unknown fields)

#### Update User
```typescript
updateAdminUserSchema
```
- Optional field validation
- Same validation rules as create
- Allows partial updates

#### Update Status
```typescript
updateUserStatusSchema
```
- Validates status enum
- Sanitizes reason field

#### Update Permissions
```typescript
updateUserPermissionsSchema
```
- Validates permission structure
- Validates zone and ward IDs
- Validates feature permissions

### Query Validation

#### Get Users Query
```typescript
getUsersQuerySchema
```
- Validates pagination parameters
- Validates sort parameters
- Validates filter parameters
- Sanitizes search input

#### Get Activity Logs Query
```typescript
getActivityLogsQuerySchema
```
- Validates date ranges
- Validates user IDs
- Sanitizes action and entity type

## Security Functions

### String Sanitization
```typescript
sanitizeString(input: string): string
```
- Removes HTML tags
- Removes JavaScript
- Removes event handlers
- Removes dangerous protocols

### SQL Injection Prevention
```typescript
preventSqlInjection(input: string): string
```
- Removes SQL keywords
- Escapes single quotes
- Removes SQL comments

### Email Validation
```typescript
validateEmail(email: string): boolean
```
- Uses validator library
- Comprehensive format checking

### Phone Validation
```typescript
validatePhone(phone: string): boolean
```
- Bangladesh format (01XXXXXXXXX)
- Regex pattern matching

### Password Strength Validation
```typescript
validatePasswordStrength(password: string): { isValid: boolean; errors: string[] }
```
- Length check (minimum 8)
- Character type checks
- Common password check

### URL Validation
```typescript
validateUrl(url: string): boolean
```
- Protocol validation (http/https)
- Format validation

### Filename Sanitization
```typescript
sanitizeFilename(filename: string): string
```
- Removes special characters
- Prevents directory traversal
- Limits length

### File Type Validation
```typescript
validateFileType(mimetype: string, allowedTypes: string[]): boolean
```
- Validates against whitelist
- Prevents dangerous file types

### File Size Validation
```typescript
validateFileSize(size: number, maxSize: number): boolean
```
- Validates file size limits
- Prevents large file uploads

## CSRF Protection

### Token Generation
```typescript
generateCsrfToken(sessionId: string): string
```
- Generates unique token
- Associates with session
- Sets expiration time

### Token Validation
```typescript
validateCsrfToken(sessionId: string, token: string): boolean
```
- Validates token against session
- Checks expiration
- Automatic cleanup

### CSRF Middleware
```typescript
csrfProtection
```
- Skips GET, HEAD, OPTIONS
- Validates session ID
- Validates CSRF token
- Returns 403 on failure

## Rate Limiting

### General Rate Limit
```typescript
rateLimitConfig
```
- 100 requests per 15 minutes
- Per-IP limiting
- Standard headers

### Authentication Rate Limit
```typescript
authRateLimitConfig
```
- 5 requests per 15 minutes
- Prevents brute force attacks
- Stricter limits for auth endpoints

## Usage Examples

### Applying Validation Middleware
```typescript
import { validate } from './middlewares/validation.middleware';
import { createAdminUserSchema } from './validators/admin-user.validators';

router.post('/users',
    validate(createAdminUserSchema, 'body'),
    createUser
);
```

### Using Security Functions
```typescript
import { sanitizeString, validateEmail } from './middlewares/security.middleware';

const sanitizedInput = sanitizeString(userInput);
const isValidEmail = validateEmail(email);
```

### Applying CSRF Protection
```typescript
import { csrfProtection } from './middlewares/security.middleware';

router.post('/users',
    csrfProtection,
    createUser
);
```

## Testing

### Unit Tests
- Test each validation function
- Test sanitization functions
- Test CSRF token generation/validation
- Test rate limiting

### Integration Tests
- Test validation middleware
- Test security middleware
- Test CSRF protection
- Test XSS prevention

### Security Tests
- Test SQL injection attempts
- Test XSS attempts
- Test CSRF attacks
- Test NoSQL injection attempts

## Best Practices

1. **Always Validate Input**: Never trust user input
2. **Sanitize Early**: Sanitize input as soon as it enters the system
3. **Use Strict Schemas**: Reject unknown fields
4. **Log Security Events**: Log all security-related events
5. **Keep Dependencies Updated**: Regularly update security packages
6. **Use Parameterized Queries**: Always use Prisma ORM for database queries
7. **Implement Rate Limiting**: Prevent brute force attacks
8. **Use HTTPS**: Always use HTTPS in production
9. **Set Security Headers**: Use Helmet and custom security headers
10. **Regular Security Audits**: Conduct regular security reviews

## Security Checklist

- [x] Input validation for all endpoints
- [x] Email format validation
- [x] Phone number format validation
- [x] Password strength validation
- [x] SQL injection prevention
- [x] XSS prevention
- [x] CSRF protection
- [x] NoSQL injection prevention
- [x] HTTP parameter pollution prevention
- [x] Security headers
- [x] Rate limiting
- [x] File upload validation
- [x] URL validation
- [x] Filename sanitization

## Monitoring and Logging

### Security Events Logged
- SQL injection attempts
- XSS attempts
- CSRF validation failures
- NoSQL injection attempts
- Rate limit violations
- Invalid input attempts

### Log Format
```typescript
{
    timestamp: Date,
    level: 'warn' | 'error',
    type: 'security',
    event: string,
    details: any,
    ip: string,
    path: string
}
```

## Maintenance

### Regular Tasks
1. Update security packages monthly
2. Review security logs weekly
3. Conduct security audits quarterly
4. Update validation rules as needed
5. Monitor for new vulnerabilities

### Incident Response
1. Log all security incidents
2. Investigate immediately
3. Block malicious IPs
4. Update security measures
5. Document lessons learned

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
