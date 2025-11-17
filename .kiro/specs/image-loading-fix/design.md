# Design Document

## Overview

This design addresses the image loading issue in the complaint detail view by fixing the mismatch between URL generation and file serving routes. The solution involves updating the `getFileUrl` function in the backend to generate URLs that match the existing server routes (`/api/uploads/:type/:filename`), and ensuring the mobile app correctly constructs full URLs when needed.

## Architecture

### Current State

**Backend:**
- Files are stored in: `uploads/complaints/images/` and `uploads/complaints/voice/`
- URLs are generated as: `http://localhost:4000/uploads/complaints/images/filename.jpg`
- Files are served through route: `/api/uploads/:type/:filename`
- **Problem:** URL generation doesn't match the serving route

**Mobile App:**
- Receives image URLs from backend API responses
- Constructs full URLs by prepending `ApiConfig.baseUrl` if URL doesn't start with 'http'
- Uses `CachedNetworkImage` to display images

### Proposed Solution

Update the backend URL generation to match the existing file serving routes. This is the minimal change approach that:
1. Keeps the existing file serving route structure
2. Only requires changes to the URL generation function
3. Maintains backward compatibility with the mobile app

## Components and Interfaces

### Backend Changes

#### 1. Upload Configuration (`server/src/config/upload.config.ts`)

**Function: `getFileUrl`**

Current implementation:
```typescript
export const getFileUrl = (filename: string, type: 'image' | 'voice'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/complaints/${type === 'image' ? 'images' : 'voice'}/${filename}`;
};
```

Updated implementation:
```typescript
export const getFileUrl = (filename: string, type: 'image' | 'voice'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/api/uploads/${type}/${filename}`;
};
```

**Changes:**
- Remove `/complaints/images` or `/complaints/voice` path segments
- Use `/api/uploads/{type}/{filename}` pattern to match the server route
- Type parameter is already 'image' or 'voice', which matches the route parameter

#### 2. Complaint Service (`server/src/services/complaint.service.ts`)

**Current Issue:**
The service generates URLs like `/uploads/${file.filename}` when processing uploaded files:

```typescript
finalImageUrls = imageFiles.map((file: any) => `/uploads/${file.filename}`);
```

**Solution:**
Update to use the proper file path structure that the upload controller expects:

```typescript
finalImageUrls = imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
```

**Changes needed in:**
- `createComplaint` method: Update image URL generation
- `createComplaint` method: Update audio URL generation
- Import `getFileUrl` from upload.config

#### 3. Upload Controller (`server/src/controllers/upload.controller.ts`)

**Current Implementation:**
The `serveFile` method already:
- Validates file type (image or voice)
- Checks file existence
- Sets appropriate content-type headers
- Sets cache headers
- Serves the file using `res.sendFile()`

**Required Changes:**
None - the controller is already correctly implemented and will work once URLs are generated correctly.

#### 4. Upload Service (`server/src/services/upload.service.ts`)

**Current Implementation:**
The `getFilePath` method needs to construct the correct file system path:

```typescript
getFilePath(filename: string, type: 'image' | 'voice'): string {
  const subDir = type === 'image' ? 'images' : 'voice';
  return path.join('uploads', 'complaints', subDir, filename);
}
```

**Required Changes:**
Verify this method exists and returns the correct path. If it doesn't exist, add it.

### Mobile App Changes

#### Flutter App (`lib/pages/complaint_detail_view_page.dart`)

**Current Implementation:**
```dart
String _getFullImageUrl(String imageUrl) {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return '${ApiConfig.baseUrl}$imageUrl';
}
```

**Required Changes:**
None - this implementation is correct. It will work once the backend returns properly formatted URLs.

## Data Models

### File URL Format

**Database Storage:**
- Store only the filename: `1699123456789_abc123def456.jpg`
- Do NOT store full URLs or paths

**API Response Format:**
```json
{
  "imageUrls": [
    "http://192.168.0.100:4000/api/uploads/image/1699123456789_abc123def456.jpg"
  ],
  "audioUrls": [
    "http://192.168.0.100:4000/api/uploads/voice/1699123456789_xyz789abc123.m4a"
  ]
}
```

### File System Structure

```
server/
  uploads/
    complaints/
      images/
        1699123456789_abc123def456.jpg
      voice/
        1699123456789_xyz789abc123.m4a
```

## Error Handling

### Backend Error Scenarios

1. **File Not Found (404)**
   - Occurs when: Requested file doesn't exist on disk
   - Response: `{ success: false, message: 'File not found' }`
   - HTTP Status: 404

2. **Invalid File Type (400)**
   - Occurs when: Type parameter is not 'image' or 'voice'
   - Response: `{ success: false, message: 'Type must be either "image" or "voice"' }`
   - HTTP Status: 400

3. **Missing Parameters (400)**
   - Occurs when: Filename or type parameter is missing
   - Response: `{ success: false, message: 'Filename and type are required' }`
   - HTTP Status: 400

### Mobile App Error Handling

1. **Network Error**
   - Display: Broken image icon (already implemented)
   - User action: Can tap to retry viewing full image

2. **Invalid URL**
   - Display: Broken image icon
   - Logged to console for debugging

3. **Loading State**
   - Display: Circular progress indicator (already implemented)

## Testing Strategy

### Backend Testing

1. **Unit Tests**
   - Test `getFileUrl` function returns correct URL format
   - Test URL includes base URL, `/api/uploads/`, type, and filename
   - Test both 'image' and 'voice' types

2. **Integration Tests**
   - Create a complaint with images
   - Verify returned URLs match pattern `/api/uploads/image/{filename}`
   - Request the image URL and verify file is served correctly
   - Verify response headers include correct content-type and cache-control

3. **Manual Testing**
   - Upload a complaint with images through the mobile app
   - View the complaint detail page
   - Verify images display correctly without broken icons
   - Check browser network tab to confirm correct URLs are being requested

### Mobile App Testing

1. **Integration Tests**
   - Mock API response with corrected URL format
   - Verify images load successfully
   - Verify full-screen image viewer works

2. **Manual Testing**
   - Test with real backend server
   - Create new complaint with images
   - View complaint detail page
   - Verify images display correctly
   - Test offline mode (images should load from cache)

## Implementation Notes

### Minimal Changes Approach

This design prioritizes minimal code changes:
1. Only update URL generation in `getFileUrl` function
2. Update complaint service to use `getFileUrl` instead of manual path construction
3. No changes needed to file serving routes
4. No changes needed to mobile app
5. No database migrations required

### Environment Configuration

The `BASE_URL` environment variable should be set appropriately:
- Development: `http://192.168.0.100:4000` (local network IP)
- Production: `https://yourdomain.com` (production domain)

### Backward Compatibility

**Existing Complaints:**
If there are existing complaints in the database with old URL formats:
- Option 1: Run a migration script to update URLs (recommended for production)
- Option 2: Add fallback logic in the mobile app to handle both formats (quick fix)

For this implementation, we'll assume Option 1 and create a migration script if needed.

## Security Considerations

1. **Public File Access**
   - Files are served without authentication (by design)
   - This is acceptable for complaint images as they are public records
   - Consider adding authentication if requirements change

2. **Path Traversal Prevention**
   - The upload controller validates file type parameter
   - Filenames are generated by the server (not user-provided)
   - No risk of path traversal attacks

3. **File Type Validation**
   - Only 'image' and 'voice' types are allowed
   - MIME type validation occurs during upload
   - File extension validation occurs during upload

## Performance Considerations

1. **Caching**
   - Cache-Control header set to 1 year
   - Reduces server load for frequently accessed images
   - Mobile app uses `CachedNetworkImage` for client-side caching

2. **File Serving**
   - Using `res.sendFile()` is efficient for static files
   - Consider using nginx for static file serving in production
   - Current implementation is acceptable for development and small-scale production

## Deployment Notes

1. **Environment Variables**
   - Ensure `BASE_URL` is set correctly in production
   - Update `.env` file with production domain

2. **File Storage**
   - Ensure `uploads/complaints/images/` and `uploads/complaints/voice/` directories exist
   - Set appropriate file permissions (readable by Node.js process)

3. **Testing After Deployment**
   - Upload a test complaint with images
   - Verify images display correctly in mobile app
   - Check server logs for any errors
