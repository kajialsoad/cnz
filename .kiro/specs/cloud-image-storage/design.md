# Design Document - Cloudinary Image Storage System

## Overview

This design document outlines the technical architecture for integrating Cloudinary cloud storage into the Clean Care Bangladesh application. The system will replace local file storage with Cloudinary for all images (complaint images, chat images) and audio files (voice recordings). The implementation includes backend service modifications, database schema updates, migration utilities, and frontend integration for both the mobile app and admin panel.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Mobile App    │────────▶│  Backend Server  │────────▶│   Cloudinary    │
│   (Flutter)     │◀────────│   (Node.js)      │◀────────│   Cloud Storage │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   MySQL Database │
                            │  (Stores URLs)   │
                            └──────────────────┘
                                     ▲
                                     │
┌─────────────────┐                 │
│   Admin Panel   │─────────────────┘
│    (React)      │
└─────────────────┘
```

### Upload Flow

```
User uploads file
      │
      ▼
Mobile App/Admin Panel
      │
      ▼
Backend receives multipart/form-data
      │
      ▼
Multer middleware processes file
      │
      ▼
Cloudinary Upload Service
      │
      ├──▶ Upload to Cloudinary
      │         │
      │         ▼
      │    Success: Get Cloudinary URL
      │         │
      │         ▼
      │    Store URL in Database
      │         │
      │         ▼
      │    Return URL to client
      │
      └──▶ Failure: Retry (up to 3 times)
                │
                ▼
           Return error to client
```

## Components and Interfaces

### 1. Cloudinary Configuration Service

**File:** `server/src/config/cloudinary.config.ts`

**Purpose:** Initialize and configure Cloudinary SDK

**Interface:**
```typescript
interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: boolean;
}

interface CloudinaryInstance {
  uploader: {
    upload: (file: string | Buffer, options?: UploadOptions) => Promise<UploadResult>;
    destroy: (publicId: string) => Promise<DestroyResult>;
  };
}

function initializeCloudinary(): CloudinaryInstance;
function getCloudinaryConfig(): CloudinaryConfig;
```

**Implementation Details:**
- Read credentials from environment variables
- Validate all required credentials are present
- Configure Cloudinary SDK with credentials
- Export configured Cloudinary instance
- Provide helper functions for common operations

### 2. Cloud Upload Service

**File:** `server/src/services/cloud-upload.service.ts`

**Purpose:** Handle file uploads to Cloudinary with retry logic

**Interface:**
```typescript
interface UploadOptions {
  folder: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  transformation?: TransformationOptions[];
  public_id?: string;
}

interface UploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

class CloudUploadService {
  uploadImage(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  uploadAudio(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<void>;
  getOptimizedUrl(publicId: string, transformation: string): string;
}
```

**Implementation Details:**
- Accept Express.Multer.File objects
- Upload files to Cloudinary using streams or buffers
- Implement retry logic (3 attempts) for network failures
- Generate folder structure: `clean-care/{type}/{date}/`
- Return Cloudinary secure URLs
- Handle errors and provide meaningful error messages

### 3. Updated Upload Configuration

**File:** `server/src/config/upload.config.ts`

**Purpose:** Configure Multer for temporary file handling before Cloudinary upload

**Changes:**
- Keep Multer for initial file validation
- Use memory storage instead of disk storage
- Files will be uploaded to Cloudinary from memory
- Remove local file cleanup (no longer needed)

**Interface:**
```typescript
interface MulterConfig {
  storage: multer.StorageEngine;
  fileFilter: (req: any, file: any, cb: FileFilterCallback) => void;
  limits: {
    fileSize: number;
    files: number;
  };
}

export const uploadConfig: MulterConfig;
export const complaintFileUpload: multer.Multer;
```

### 4. Updated Complaint Service

**File:** `server/src/services/complaint.service.ts`

**Purpose:** Integrate Cloudinary uploads into complaint creation

**Modified Methods:**
```typescript
class ComplaintService {
  async createComplaint(
    userId: number,
    data: ComplaintData,
    files: Express.Multer.File[]
  ): Promise<Complaint> {
    // 1. Upload images to Cloudinary
    const imageUrls = await this.uploadImagesToCloudinary(files.images);
    
    // 2. Upload voice file to Cloudinary (if present)
    const voiceUrl = files.voice 
      ? await this.uploadAudioToCloudinary(files.voice)
      : null;
    
    // 3. Create complaint with Cloudinary URLs
    const complaint = await prisma.complaint.create({
      data: {
        ...data,
        images: imageUrls,
        voiceNote: voiceUrl,
      }
    });
    
    return complaint;
  }
  
  private async uploadImagesToCloudinary(
    images: Express.Multer.File[]
  ): Promise<string[]> {
    const uploadPromises = images.map(image =>
      cloudUploadService.uploadImage(image, 'complaints/images')
    );
    
    const results = await Promise.all(uploadPromises);
    return results.map(r => r.secure_url);
  }
  
  private async uploadAudioToCloudinary(
    audio: Express.Multer.File
  ): Promise<string> {
    const result = await cloudUploadService.uploadAudio(
      audio,
      'complaints/voice'
    );
    return result.secure_url;
  }
}
```

### 5. Updated Chat Service

**File:** `server/src/services/chat.service.ts`

**Purpose:** Integrate Cloudinary uploads into chat messages

**Modified Methods:**
```typescript
class ChatService {
  async sendMessage(
    complaintId: number,
    senderId: number,
    senderType: 'USER' | 'ADMIN',
    message: string,
    image?: Express.Multer.File
  ): Promise<ChatMessage> {
    let imageUrl: string | null = null;
    
    // Upload image to Cloudinary if present
    if (image) {
      const result = await cloudUploadService.uploadImage(
        image,
        'chat/images'
      );
      imageUrl = result.secure_url;
    }
    
    // Create chat message with Cloudinary URL
    const chatMessage = await prisma.chatMessage.create({
      data: {
        complaintId,
        senderId,
        senderType,
        message,
        imageUrl,
      }
    });
    
    return chatMessage;
  }
}
```

### 6. Migration Service

**File:** `server/src/services/migration.service.ts`

**Purpose:** Migrate existing local files to Cloudinary

**Interface:**
```typescript
interface MigrationResult {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  failures: MigrationFailure[];
}

interface MigrationFailure {
  localPath: string;
  error: string;
  recordId: number;
  recordType: 'complaint' | 'chat';
}

class MigrationService {
  async migrateComplaintImages(): Promise<MigrationResult>;
  async migrateChatImages(): Promise<MigrationResult>;
  async migrateVoiceFiles(): Promise<MigrationResult>;
  async migrateAll(): Promise<MigrationResult>;
}
```

**Implementation Details:**
- Scan database for records with local file paths
- Read files from local uploads directory
- Upload each file to Cloudinary
- Update database record with new Cloudinary URL
- Log successes and failures
- Generate migration report
- Handle missing files gracefully

### 7. Admin Panel Service Updates

**File:** `clean-care-admin/src/services/complaintService.ts`

**Purpose:** Remove URL fixing logic, use Cloudinary URLs directly

**Changes:**
- Remove `fixMediaUrl()` method (no longer needed)
- Use Cloudinary URLs directly from API responses
- Implement image loading error handling
- Add loading states for images

**Updated Interface:**
```typescript
interface ComplaintImage {
  url: string; // Cloudinary URL
  thumbnail?: string; // Cloudinary thumbnail transformation
}

class ComplaintService {
  async getComplaintDetails(id: number): Promise<ComplaintDetails> {
    const response = await api.get(`/complaints/${id}`);
    
    // Cloudinary URLs are ready to use
    return {
      ...response.data,
      images: response.data.images.map((url: string) => ({
        url,
        thumbnail: this.getCloudinaryThumbnail(url)
      }))
    };
  }
  
  private getCloudinaryThumbnail(url: string): string {
    // Insert transformation parameters into Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/sample.jpg
    return url.replace('/upload/', '/upload/w_200,h_200,c_fill/');
  }
}
```

### 8. Mobile App Repository Updates

**File:** `lib/repositories/complaint_repository.dart`

**Purpose:** Use Cloudinary URLs directly from API

**Changes:**
- Remove any local URL manipulation
- Use Cloudinary URLs as-is from API responses
- Implement image caching for better performance
- Handle image loading errors

**Updated Interface:**
```dart
class ComplaintRepository {
  Future<Complaint> createComplaint({
    required ComplaintData data,
    required List<File> images,
    File? voiceFile,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/complaints'),
    );
    
    // Add images
    for (var image in images) {
      request.files.add(
        await http.MultipartFile.fromPath('images', image.path),
      );
    }
    
    // Add voice file
    if (voiceFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath('voice', voiceFile.path),
      );
    }
    
    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    
    // Response contains Cloudinary URLs
    return Complaint.fromJson(jsonDecode(responseData));
  }
  
  Future<List<Complaint>> getComplaints() async {
    final response = await http.get(
      Uri.parse('$baseUrl/complaints'),
    );
    
    // Cloudinary URLs are ready to use
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => Complaint.fromJson(json)).toList();
  }
}
```

## Data Models

### Database Schema Changes

**No schema changes required!** The existing schema already stores image URLs as strings. We'll simply store Cloudinary URLs instead of local paths.

**Existing Schema:**
```prisma
model Complaint {
  id          Int      @id @default(autoincrement())
  images      Json?    // Array of image URLs (will be Cloudinary URLs)
  voiceNote   String?  // Voice file URL (will be Cloudinary URL)
  // ... other fields
}

model ChatMessage {
  id          Int      @id @default(autoincrement())
  imageUrl    String?  // Image URL (will be Cloudinary URL)
  // ... other fields
}
```

### URL Format Examples

**Local URLs (current):**
```
http://localhost:4000/api/uploads/image/1764079718678_730f54198f04dab7.jpg
http://localhost:4000/api/uploads/voice/1764079718678_730f54198f04dab7.mp3
```

**Cloudinary URLs (new):**
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/clean-care/complaints/images/abc123.jpg
https://res.cloudinary.com/your-cloud-name/video/upload/v1234567890/clean-care/complaints/voice/def456.mp3
```

**Cloudinary Thumbnail URLs:**
```
https://res.cloudinary.com/your-cloud-name/image/upload/w_200,h_200,c_fill/v1234567890/clean-care/complaints/images/abc123.jpg
```

## Error Handling

### Upload Errors

**Error Types:**
1. **Network Errors**: Retry up to 3 times with exponential backoff
2. **Invalid File Type**: Return 400 Bad Request immediately
3. **File Too Large**: Return 413 Payload Too Large immediately
4. **Cloudinary API Errors**: Log error, return 500 Internal Server Error
5. **Missing Credentials**: Log error, return 503 Service Unavailable

**Error Response Format:**
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Example Error Responses:**
```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_FAILED",
    "message": "Failed to upload image to cloud storage"
  }
}

{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG, PNG, and WebP images are allowed"
  }
}
```

### Retry Logic Implementation

```typescript
async function uploadWithRetry(
  file: Express.Multer.File,
  options: UploadOptions,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(file.buffer, options);
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.http_code && error.http_code >= 400 && error.http_code < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}
```

## Testing Strategy

### Unit Tests

**Test Files:**
- `server/tests/cloud-upload.service.test.ts`
- `server/tests/cloudinary.config.test.ts`
- `server/tests/migration.service.test.ts`

**Test Cases:**
1. **Cloudinary Configuration**
   - Test successful initialization with valid credentials
   - Test error handling with missing credentials
   - Test error handling with invalid credentials

2. **Cloud Upload Service**
   - Test successful image upload
   - Test successful audio upload
   - Test retry logic on network failure
   - Test error handling for invalid file types
   - Test error handling for oversized files
   - Test file deletion

3. **Migration Service**
   - Test migration of complaint images
   - Test migration of chat images
   - Test migration of voice files
   - Test handling of missing local files
   - Test database update after successful migration
   - Test rollback on migration failure

### Integration Tests

**Test Files:**
- `server/tests/complaint-cloudinary-integration.test.ts`
- `server/tests/chat-cloudinary-integration.test.ts`

**Test Cases:**
1. **Complaint Creation with Images**
   - Create complaint with multiple images
   - Verify images are uploaded to Cloudinary
   - Verify Cloudinary URLs are stored in database
   - Verify images are accessible via URLs

2. **Chat Message with Image**
   - Send chat message with image
   - Verify image is uploaded to Cloudinary
   - Verify Cloudinary URL is stored in database
   - Verify image is accessible via URL

3. **End-to-End Upload Flow**
   - Upload from mobile app
   - Verify backend processes correctly
   - Verify admin panel displays correctly

### Manual Testing Checklist

**Backend:**
- [ ] Cloudinary credentials are configured correctly
- [ ] Image upload endpoint works
- [ ] Audio upload endpoint works
- [ ] Retry logic works on network failure
- [ ] Error messages are clear and helpful

**Admin Panel:**
- [ ] Complaint images load from Cloudinary
- [ ] Chat images load from Cloudinary
- [ ] Thumbnails display correctly
- [ ] Full-size images open correctly
- [ ] Loading states display properly
- [ ] Error states display properly

**Mobile App:**
- [ ] Can upload complaint images
- [ ] Can upload voice recordings
- [ ] Can send chat images
- [ ] Images display correctly in complaint list
- [ ] Images display correctly in complaint details
- [ ] Images display correctly in chat
- [ ] Loading indicators work
- [ ] Error messages display properly

**Migration:**
- [ ] Migration script runs without errors
- [ ] All local files are uploaded to Cloudinary
- [ ] Database records are updated with Cloudinary URLs
- [ ] Migration report is generated
- [ ] Old local files can be safely deleted after verification

## Environment Configuration

### Required Environment Variables

**File:** `server/.env`

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Cloudinary folder prefix
CLOUDINARY_FOLDER=clean-care

# Optional: Enable/disable Cloudinary (for testing)
CLOUDINARY_ENABLED=true
```

### Cloudinary Account Setup

1. Sign up at https://cloudinary.com (Free tier: 25GB storage, 25GB bandwidth/month)
2. Get credentials from Dashboard
3. Configure upload presets (optional)
4. Set up folder structure
5. Configure transformation presets for thumbnails

## Performance Considerations

### Image Optimization

**Cloudinary Automatic Optimizations:**
- Automatic format selection (WebP for supported browsers)
- Automatic quality adjustment
- Automatic compression
- Lazy loading support

**Transformation URLs:**
```
Original: https://res.cloudinary.com/.../image.jpg
Thumbnail: https://res.cloudinary.com/.../w_200,h_200,c_fill/image.jpg
Medium: https://res.cloudinary.com/.../w_800,h_600,c_limit/image.jpg
Optimized: https://res.cloudinary.com/.../q_auto,f_auto/image.jpg
```

### Caching Strategy

**Backend:**
- No caching needed (Cloudinary handles CDN)
- Cache Cloudinary URLs in database

**Admin Panel:**
- Browser caching via Cloudinary CDN
- React Query for API response caching

**Mobile App:**
- Use `cached_network_image` package
- Cache images locally on device
- Implement cache expiration (7 days)

### Upload Performance

**Optimizations:**
- Upload multiple images in parallel
- Use streams instead of buffers for large files
- Implement upload progress tracking
- Show upload progress to users

## Security Considerations

### API Key Protection

- Store Cloudinary credentials in environment variables
- Never expose API secret in client-side code
- Use signed uploads for sensitive content (future enhancement)
- Rotate API keys periodically

### Access Control

- Cloudinary URLs are public by default (suitable for this use case)
- Implement backend authorization checks before returning URLs
- Consider signed URLs for private content (future enhancement)

### File Validation

- Validate file types on backend
- Validate file sizes on backend
- Sanitize filenames
- Scan for malware (future enhancement)

## Migration Strategy

### Phase 1: Setup and Testing (Week 1)

1. Set up Cloudinary account
2. Install Cloudinary SDK
3. Implement CloudUploadService
4. Test uploads in development
5. Update environment configuration

### Phase 2: Backend Integration (Week 1-2)

1. Update complaint creation endpoint
2. Update chat message endpoint
3. Implement error handling
4. Add retry logic
5. Test all endpoints

### Phase 3: Frontend Integration (Week 2)

1. Update admin panel complaint service
2. Update admin panel chat service
3. Update mobile app repositories
4. Test image display in all views
5. Implement loading and error states

### Phase 4: Migration (Week 3)

1. Create migration script
2. Test migration on sample data
3. Run migration on production database
4. Verify all images are accessible
5. Keep local files as backup for 1 week
6. Delete local files after verification

### Phase 5: Cleanup (Week 3)

1. Remove local file storage code
2. Remove URL fixing logic
3. Update documentation
4. Monitor Cloudinary usage
5. Optimize costs if needed

## Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback:**
   - Revert backend code to previous version
   - Local files are still available as backup
   - Database still has old local URLs

2. **Partial Rollback:**
   - Keep Cloudinary for new uploads
   - Serve old files from local storage
   - Implement dual-mode URL handling

3. **Data Recovery:**
   - Local files backed up before deletion
   - Database backup before migration
   - Cloudinary files remain accessible

## Monitoring and Maintenance

### Metrics to Track

- Upload success rate
- Upload duration (average, p95, p99)
- Cloudinary storage usage
- Cloudinary bandwidth usage
- Error rates by type
- Retry rates

### Alerts

- Upload failure rate > 5%
- Cloudinary API errors
- Storage quota approaching limit (80%)
- Bandwidth quota approaching limit (80%)

### Maintenance Tasks

- Monthly review of Cloudinary usage
- Quarterly cleanup of unused files
- Annual review of storage costs
- Regular testing of upload functionality
