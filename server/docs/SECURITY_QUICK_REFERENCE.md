# Security Quick Reference Guide

Quick reference for developers working with file uploads and Cloudinary integration.

## Environment Variables

Required in `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=clean-care
CLOUDINARY_ENABLED=true
USE_CLOUDINARY=true
```

## File Upload Limits

```typescript
// Maximum file sizes
Images: 5MB
Audio: 10MB
Max files per upload: 10

// Allowed image types
JPEG, JPG, PNG, WebP

// Allowed audio types
MP3, MPEG, WAV, OGG, M4A, AAC, MP4
```

## Using Security Utilities

### Validate Image File

```typescript
import { validateImageFile } from '../utils/file-security';

const validation = validateImageFile(file);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### Validate Audio File

```typescript
import { validateAudioFile } from '../utils/file-security';

const validation = validateAudioFile(file);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### Sanitize Filename

```typescript
import { sanitizeFilename } from '../utils/file-security';

const safe = sanitizeFilename(file.originalname);
```

### Generate Secure Filename

```typescript
import { generateSecureFilename } from '../utils/file-security';

const filename = generateSecureFilename(file.originalname);
// Returns: 1234567890_abc123def456...xyz.jpg
```

### Check Dangerous Extension

```typescript
import { hasDangerousExtension } from '../utils/file-security';

if (hasDangerousExtension(filename)) {
  throw new Error('Dangerous file type');
}
```

### Validate Cloudinary URL

```typescript
import { isValidCloudinaryUrl } from '../utils/file-security';

if (!isValidCloudinaryUrl(url)) {
  throw new Error('Invalid Cloudinary URL');
}
```

## Using Access Control Middleware

### Protect Complaint File Access

```typescript
import { checkComplaintFileAccess } from '../middlewares/file-access.middleware';

router.get(
  '/complaints/:id',
  authGuard,
  checkComplaintFileAccess,
  complaintController.getComplaintById
);
```

### Protect Chat File Access

```typescript
import { checkChatFileAccess } from '../middlewares/file-access.middleware';

router.get(
  '/chat/messages/:messageId',
  authGuard,
  checkChatFileAccess,
  chatController.getMessage
);
```

### Validate URLs in Request

```typescript
import { validateCloudinaryUrls } from '../middlewares/file-access.middleware';

router.post(
  '/complaints',
  authGuard,
  validateCloudinaryUrls,
  complaintController.createComplaint
);
```

### Ensure HTTPS in Response

```typescript
import { ensureHttpsUrls } from '../middlewares/file-access.middleware';

// Apply globally or to specific routes
app.use(ensureHttpsUrls);
```

## Cloud Upload Service

### Upload Image

```typescript
import { cloudUploadService } from '../services/cloud-upload.service';

const result = await cloudUploadService.uploadImage(
  file,
  'complaints/images'
);

console.log(result.secure_url); // HTTPS URL
console.log(result.public_id);  // Cloudinary public ID
```

### Upload Audio

```typescript
const result = await cloudUploadService.uploadAudio(
  file,
  'complaints/voice'
);

console.log(result.secure_url);
```

### Delete File

```typescript
await cloudUploadService.deleteFile(publicId);
```

### Get Thumbnail URL

```typescript
const thumbnailUrl = cloudUploadService.getThumbnailFromUrl(
  originalUrl,
  200,  // width
  200   // height
);
```

### Get Optimized URL

```typescript
const optimizedUrl = cloudUploadService.getOptimizedFromUrl(url);
// Adds automatic format and quality optimization
```

## Common Patterns

### Upload with Validation

```typescript
// Validate file
const validation = validateImageFile(file);
if (!validation.valid) {
  return res.status(400).json({
    success: false,
    message: validation.error
  });
}

// Upload to Cloudinary
const result = await cloudUploadService.uploadImage(
  file,
  'complaints/images'
);

// Store URL in database
await prisma.complaint.create({
  data: {
    imageUrl: result.secure_url,
    // ... other fields
  }
});
```

### Multiple File Upload

```typescript
const uploadPromises = files.map(file =>
  cloudUploadService.uploadImage(file, 'complaints/images')
);

const results = await Promise.all(uploadPromises);
const urls = results.map(r => r.secure_url);
```

### Error Handling

```typescript
try {
  const result = await cloudUploadService.uploadImage(file, folder);
  return result.secure_url;
} catch (error) {
  if (error instanceof CloudUploadError) {
    // Handle specific upload errors
    console.error('Upload failed:', error.code, error.message);
  }
  throw error;
}
```

## Security Checklist

Before deploying:

- [ ] All Cloudinary credentials in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] File validation on all upload endpoints
- [ ] Authorization checks on file access endpoints
- [ ] All URLs use HTTPS
- [ ] File size limits enforced
- [ ] Dangerous extensions blocked
- [ ] Filenames sanitized
- [ ] Error messages don't expose sensitive info
- [ ] Logging configured for security events

## Testing

Run security tests:

```bash
cd server
npm run build
node tests/test-security-measures.js
```

Expected output: 36/36 tests passing

## Troubleshooting

### "Cloudinary is not initialized"

Check that environment variables are set:
```bash
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### "File type not allowed"

Check that file MIME type is in allowed list:
- Images: image/jpeg, image/jpg, image/png, image/webp
- Audio: audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/m4a, audio/aac

### "File size exceeds limit"

Check file size:
- Images: Maximum 5MB
- Audio: Maximum 10MB

### "Dangerous file extension"

File has a blocked extension. Allowed extensions:
- Images: .jpg, .jpeg, .png, .webp
- Audio: .mp3, .wav, .ogg, .m4a, .aac

## Additional Resources

- Full documentation: `server/docs/SECURITY_MEASURES.md`
- Cloudinary docs: https://cloudinary.com/documentation
- OWASP File Upload: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

---

**Last Updated:** 2024-01-27
