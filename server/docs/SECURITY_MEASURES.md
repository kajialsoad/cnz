# Security Measures - Cloud Image Storage System

This document outlines all security measures implemented for the Cloudinary image storage system.

## Table of Contents

1. [API Credentials Security](#api-credentials-security)
2. [Authorization Checks](#authorization-checks)
3. [HTTPS Enforcement](#https-enforcement)
4. [File Validation](#file-validation)
5. [File Size Limits](#file-size-limits)
6. [Filename Sanitization](#filename-sanitization)
7. [Security Best Practices](#security-best-practices)

---

## 1. API Credentials Security

### Environment Variables Only

**Requirement:** Ensure API credentials are in environment variables only (Requirement 10.1)

**Implementation:**

- All Cloudinary credentials are stored in environment variables:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

- Credentials are NEVER hardcoded in source code
- `.env` file is in `.gitignore` to prevent accidental commits
- `.env.example` provides template without actual credentials

**Configuration File:** `server/src/config/cloudinary.config.ts`

```typescript
export function getCloudinaryConfig(): CloudinaryConfig {
    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
        api_key: process.env.CLOUDINARY_API_KEY!,
        api_secret: process.env.CLOUDINARY_API_SECRET!,
        secure: true, // Always use HTTPS
    };
}
```

**Validation:**

- System validates all required credentials are present on startup
- Throws error if any credential is missing
- Logs cloud name (non-sensitive) for verification

---

## 2. Authorization Checks

**Requirement:** Add backend authorization checks before returning URLs (Requirement 10.2)

**Implementation:**

### File Access Middleware

**File:** `server/src/middlewares/file-access.middleware.ts`

#### Complaint File Access

```typescript
export async function checkComplaintFileAccess(
  req: FileAccessRequest,
  res: Response,
  next: NextFunction
)
```

**Rules:**
- Users must be authenticated to access complaint files
- Admins and super admins can access all files
- Regular users can only access their own complaint files
- Returns 403 Forbidden if user doesn't own the complaint

#### Chat File Access

```typescript
export async function checkChatFileAccess(
  req: FileAccessRequest,
  res: Response,
  next: NextFunction
)
```

**Rules:**
- Users must be authenticated to access chat files
- Admins and super admins can access all files
- Regular users can only access files from their own complaints
- Returns 403 Forbidden if user doesn't have access

### Usage Example

```typescript
// In routes
router.get(
  '/complaints/:id',
  authGuard,
  checkComplaintFileAccess,
  complaintController.getComplaintById
);
```

---

## 3. HTTPS Enforcement

**Requirement:** Use HTTPS URLs from Cloudinary (Requirement 10.3)

**Implementation:**

### Cloudinary Configuration

All Cloudinary uploads are configured to use HTTPS:

```typescript
cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true, // Always use HTTPS
});
```

### URL Validation

**File:** `server/src/middlewares/file-access.middleware.ts`

```typescript
export function validateCloudinaryUrls(
  req: Request,
  res: Response,
  next: NextFunction
)
```

**Checks:**
- All URLs must use HTTPS protocol
- All URLs must be from cloudinary.com domain
- Rejects any HTTP URLs
- Validates both single URLs and URL arrays

### HTTPS Transformation Middleware

```typescript
export function ensureHttpsUrls(
  req: Request,
  res: Response,
  next: NextFunction
)
```

**Function:**
- Automatically transforms any HTTP URLs to HTTPS in responses
- Recursively processes nested objects and arrays
- Ensures all returned URLs are secure

---

## 4. File Validation

**Requirement:** Implement file validation on backend (Requirement 10.4)

**Implementation:**

### File Security Utilities

**File:** `server/src/utils/file-security.ts`

#### Image File Validation

```typescript
export function validateImageFile(
  file: Express.Multer.File
): { valid: boolean; error?: string }
```

**Checks:**
- File exists and has buffer
- No dangerous file extensions (.exe, .bat, .php, etc.)
- MIME type is in allowed list (JPEG, PNG, WebP)
- File size is within limits (5MB)

**Allowed Image Types:**
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

#### Audio File Validation

```typescript
export function validateAudioFile(
  file: Express.Multer.File
): { valid: boolean; error?: string }
```

**Checks:**
- File exists and has buffer
- No dangerous file extensions
- MIME type is in allowed list
- File size is within limits (10MB)

**Allowed Audio Types:**
- `audio/mpeg`
- `audio/mp3`
- `audio/wav`
- `audio/ogg`
- `audio/m4a`
- `audio/aac`
- `audio/mp4`

#### Dangerous Extension Detection

```typescript
export function hasDangerousExtension(filename: string): boolean
```

**Blocked Extensions:**
- Executables: `.exe`, `.bat`, `.cmd`, `.com`, `.pif`, `.scr`
- Scripts: `.vbs`, `.js`, `.jar`, `.sh`, `.bash`, `.ps1`
- Server-side: `.php`, `.asp`, `.aspx`, `.jsp`, `.cgi`
- Installers: `.msi`, `.app`, `.deb`, `.rpm`, `.dmg`, `.pkg`

### Multer File Filter

**File:** `server/src/config/upload.config.ts`

```typescript
const fileFilter = (req: any, file: any, cb: (error: any, acceptFile: boolean) => void) => {
  // Security check: Reject files with dangerous extensions
  if (hasDangerousExtension(file.originalname)) {
    return cb(new Error('File type not allowed for security reasons'), false);
  }

  // Sanitize filename
  const sanitized = sanitizeFilename(file.originalname);
  if (!sanitized || sanitized === 'unnamed') {
    return cb(new Error('Invalid filename'), false);
  }

  // Validate MIME type
  // ...
}
```

---

## 5. File Size Limits

**Requirement:** Add file size limits (Requirement 10.5)

**Implementation:**

### Maximum File Sizes

**File:** `server/src/utils/file-security.ts`

```typescript
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024,  // 5MB
  AUDIO: 10 * 1024 * 1024, // 10MB
};
```

### Multer Configuration

**File:** `server/src/config/upload.config.ts`

```typescript
export const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files at once
  }
});
```

### Size Validation Function

```typescript
export function validateFileSize(
  size: number,
  maxSize: number
): { valid: boolean; error?: string }
```

**Features:**
- Validates file size is positive
- Checks against maximum allowed size
- Returns user-friendly error messages with MB values
- Used in both image and audio validation

---

## 6. Filename Sanitization

**Requirement:** Sanitize filenames (Requirement 10.5)

**Implementation:**

### Sanitization Function

**File:** `server/src/utils/file-security.ts`

```typescript
export function sanitizeFilename(filename: string): string
```

**Security Measures:**

1. **Path Traversal Prevention**
   - Uses `path.basename()` to remove directory components
   - Prevents `../` attacks

2. **Null Byte Removal**
   - Removes `\0` characters
   - Prevents null byte injection attacks

3. **Dangerous Character Removal**
   - Removes: `< > : " | ? *`
   - Replaces with underscore

4. **Dot Handling**
   - Removes leading/trailing dots and spaces
   - Prevents hidden files (`.filename`)
   - Replaces multiple consecutive dots

5. **Length Limiting**
   - Maximum 255 characters
   - Preserves file extension

6. **Default Fallback**
   - Returns 'unnamed' if filename becomes empty

### Secure Filename Generation

```typescript
export function generateSecureFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  
  return `${timestamp}_${randomString}${ext}`;
}
```

**Features:**
- Timestamp for uniqueness
- 16-byte random hex string (32 characters)
- Preserves original file extension
- Prevents filename collisions

---

## 7. Security Best Practices

### Input Validation

- All file inputs are validated before processing
- MIME type validation on backend (not just client-side)
- File size validation on backend
- Filename sanitization on all uploads

### Error Handling

- Security errors don't expose sensitive information
- Generic error messages for users
- Detailed logging for administrators
- No stack traces in production

### Logging

- All upload attempts are logged
- Failed uploads include error details
- Successful uploads log filename, size, and duration
- Sanitized filenames used in logs

### Access Control

- Authentication required for all file operations
- Authorization checks before returning URLs
- Role-based access control (RBAC)
- Principle of least privilege

### Data Protection

- All URLs use HTTPS
- Credentials stored in environment variables
- No sensitive data in logs
- Secure random filename generation

### Defense in Depth

Multiple layers of security:
1. Multer file filter (first line of defense)
2. File security utilities (validation)
3. Cloud upload service (sanitization)
4. Access middleware (authorization)
5. HTTPS enforcement (transport security)

---

## Testing Security Measures

### Manual Testing Checklist

- [ ] Try uploading file with dangerous extension (.exe, .php)
- [ ] Try uploading file with path traversal in name (../../etc/passwd)
- [ ] Try uploading file exceeding size limit
- [ ] Try uploading file with invalid MIME type
- [ ] Try accessing another user's complaint files
- [ ] Verify all returned URLs use HTTPS
- [ ] Verify credentials are not in source code
- [ ] Verify .env file is in .gitignore

### Automated Testing

Create tests for:
- Filename sanitization function
- File validation functions
- Authorization middleware
- URL validation middleware

---

## Security Incident Response

If a security issue is discovered:

1. **Immediate Actions**
   - Disable affected functionality if necessary
   - Review logs for exploitation attempts
   - Assess scope of potential breach

2. **Investigation**
   - Identify root cause
   - Determine affected users/data
   - Document timeline of events

3. **Remediation**
   - Apply security patch
   - Update validation rules
   - Enhance monitoring

4. **Communication**
   - Notify affected users if necessary
   - Update security documentation
   - Share lessons learned with team

---

## Security Maintenance

### Regular Tasks

- **Weekly:** Review upload logs for suspicious activity
- **Monthly:** Update dependencies for security patches
- **Quarterly:** Review and update security measures
- **Annually:** Conduct security audit

### Monitoring

- Track failed upload attempts
- Monitor for unusual file patterns
- Alert on repeated authorization failures
- Log all security-related events

---

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Cloudinary Security Best Practices](https://cloudinary.com/documentation/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Contact

For security concerns or to report vulnerabilities, contact the development team.

**Last Updated:** 2024-01-27
