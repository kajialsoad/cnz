# Cloud Upload Service - Quick Reference Guide

## Overview

The Cloud Upload Service provides a simple interface for uploading images and audio files to Cloudinary with automatic retry logic, error handling, and URL optimization.

## Installation

The service is already configured and ready to use. Just ensure your `.env` file has the required Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_ENABLED=true
CLOUDINARY_FOLDER=clean-care
```

## Basic Usage

### Import the Service

```typescript
import { cloudUploadService } from './services/cloud-upload.service';
```

### Upload an Image

```typescript
// In your controller/service
async function handleImageUpload(file: Express.Multer.File) {
  try {
    const result = await cloudUploadService.uploadImage(
      file,
      'complaints/images'  // folder type
    );
    
    console.log('Image URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    return result.secure_url;
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
}
```

### Upload Audio/Voice File

```typescript
async function handleVoiceUpload(file: Express.Multer.File) {
  try {
    const result = await cloudUploadService.uploadAudio(
      file,
      'complaints/voice'  // folder type
    );
    
    return result.secure_url;
  } catch (error) {
    console.error('Voice upload failed:', error.message);
    throw error;
  }
}
```

### Upload Multiple Images

```typescript
async function handleMultipleImages(files: Express.Multer.File[]) {
  try {
    const uploadPromises = files.map(file =>
      cloudUploadService.uploadImage(file, 'complaints/images')
    );
    
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.secure_url);
    
    return urls;
  } catch (error) {
    console.error('Multiple upload failed:', error.message);
    throw error;
  }
}
```

## URL Optimization

### Get Thumbnail URL

```typescript
// Generate a 200x200 thumbnail
const thumbnailUrl = cloudUploadService.getThumbnailUrl(publicId);

// Custom size thumbnail
const customThumbnail = cloudUploadService.getThumbnailUrl(publicId, 300, 300);
```

### Get Medium-Sized URL

```typescript
// Generate an 800x600 medium-sized image
const mediumUrl = cloudUploadService.getMediumUrl(publicId);
```

### Custom Transformations

```typescript
// Apply custom Cloudinary transformations
const customUrl = cloudUploadService.getOptimizedUrl(
  publicId,
  'w_500,h_500,c_fill,q_80,f_auto'
);
```

## File Deletion

```typescript
async function deleteUploadedFile(publicId: string) {
  try {
    await cloudUploadService.deleteFile(publicId);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Deletion failed:', error.message);
  }
}
```

## Error Handling

The service throws `CloudUploadError` with specific error codes:

```typescript
import { CloudUploadError } from './services/cloud-upload.service';

try {
  const result = await cloudUploadService.uploadImage(file, 'complaints/images');
} catch (error) {
  if (error instanceof CloudUploadError) {
    switch (error.code) {
      case 'CLOUDINARY_DISABLED':
        // Cloudinary is disabled in config
        break;
      case 'CLOUDINARY_NOT_INITIALIZED':
        // Configuration error
        break;
      case 'INVALID_FILE':
        // File or buffer is missing
        break;
      case 'UPLOAD_FAILED':
        // Upload failed after retries
        break;
      case 'DELETE_FAILED':
        // Deletion failed
        break;
      case 'INVALID_PUBLIC_ID':
        // Invalid public_id provided
        break;
    }
  }
}
```

## Folder Structure

Files are automatically organized by type and date:

```
clean-care/
├── complaints/
│   ├── images/
│   │   └── 2025-11-27/
│   │       └── abc123.jpg
│   └── voice/
│       └── 2025-11-27/
│           └── def456.mp3
└── chat/
    └── images/
        └── 2025-11-27/
            └── ghi789.jpg
```

## Retry Logic

The service automatically retries failed uploads:
- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retry Conditions**: Network errors, 5xx server errors
- **No Retry**: 4xx client errors (invalid file, auth errors)

## Complete Example: Complaint Creation

```typescript
import { cloudUploadService } from './services/cloud-upload.service';

async function createComplaint(
  userId: number,
  data: ComplaintData,
  images: Express.Multer.File[],
  voiceFile?: Express.Multer.File
) {
  try {
    // Upload all images in parallel
    const imageUploadPromises = images.map(image =>
      cloudUploadService.uploadImage(image, 'complaints/images')
    );
    const imageResults = await Promise.all(imageUploadPromises);
    const imageUrls = imageResults.map(r => r.secure_url);

    // Upload voice file if present
    let voiceUrl = null;
    if (voiceFile) {
      const voiceResult = await cloudUploadService.uploadAudio(
        voiceFile,
        'complaints/voice'
      );
      voiceUrl = voiceResult.secure_url;
    }

    // Create complaint in database with Cloudinary URLs
    const complaint = await prisma.complaint.create({
      data: {
        userId,
        ...data,
        images: imageUrls,
        voiceNote: voiceUrl,
      }
    });

    return complaint;
  } catch (error) {
    console.error('Failed to create complaint:', error);
    throw error;
  }
}
```

## Testing

Run the test suite to verify the service:

```bash
# Compile TypeScript
npm run build

# Run tests
node test-cloud-upload-service.js
```

## Troubleshooting

### Upload Fails Immediately

Check your Cloudinary credentials in `.env`:
```bash
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
```

### Network Errors

The service will automatically retry network errors up to 3 times. If all retries fail, check:
- Internet connection
- Cloudinary service status
- Firewall settings

### Invalid File Errors

Ensure the file object has a `buffer` property:
```typescript
console.log('File buffer:', file.buffer ? 'Present' : 'Missing');
```

### URL Generation Fails

Ensure you're using the correct `public_id` from the upload result:
```typescript
const result = await cloudUploadService.uploadImage(file, 'complaints/images');
const publicId = result.public_id; // Use this for URL generation
```

## Performance Tips

1. **Parallel Uploads**: Upload multiple files in parallel using `Promise.all()`
2. **Use Thumbnails**: Generate thumbnail URLs for list views to reduce bandwidth
3. **Cache URLs**: Store Cloudinary URLs in your database, don't regenerate them
4. **Lazy Loading**: Use lazy loading for images in the frontend

## Security Notes

- API credentials are stored securely in environment variables
- All URLs use HTTPS
- Files are publicly accessible (suitable for this use case)
- Consider signed URLs for private content (future enhancement)

## Support

For issues or questions:
1. Check the error logs for detailed error messages
2. Verify Cloudinary credentials
3. Test with the provided test script
4. Review Cloudinary dashboard for upload status
