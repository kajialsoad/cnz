# Chat Image Upload 404 Error - FIXED ✅

## Problem
When trying to upload an image in the chat page, got error:
```
ছবি পাঠাতে ব্যর্থ: Exception: Image upload failed: 404
```

## Root Cause
The chat service was calling:
```
POST /api/complaints/:id/upload
```

But the server only had:
```
POST /api/complaints/upload  (without :id)
```

## Solution
Added the missing route to the server:

**File:** `server/src/routes/complaint.routes.ts`

```typescript
/**
 * @route   POST /api/complaints/:id/upload
 * @desc    Upload files for a specific complaint (for chat)
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/:id/upload', uploadController.uploadComplaintFiles, uploadController.uploadFiles.bind(uploadController));
```

## Testing

1. ✅ Server restarted successfully
2. ✅ Route is now available: `POST /api/complaints/:id/upload`
3. Now test in the app:
   - Open chat page
   - Click image icon (📷)
   - Select an image
   - Should upload successfully!

## What Changed
- Added new route that accepts complaint ID in the URL
- Uses same upload controller as the general upload route
- Supports Cloudinary upload

## Result
Chat image upload should now work! 🎉
