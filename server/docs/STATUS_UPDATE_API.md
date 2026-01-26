# Status Update API Documentation

## Overview

This document describes the enhanced status update endpoint that supports resolution documentation with images and notes.

**Last Updated**: December 20, 2024  
**Version**: 1.0

---

## Endpoint

### Update Complaint Status

**Endpoint**: `PATCH /api/admin/complaints/:id/status`

**Authentication**: Required (JWT Token)

**Authorization**: ADMIN, SUPER_ADMIN, MASTER_ADMIN

**Content-Type**: `multipart/form-data`

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Complaint ID |

### Form Data Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `status` | string | Yes | New complaint status | Must be valid Complaint_status enum |
| `note` | string | No | Admin note for status change | - |
| `resolutionNote` | string | Conditional | Resolution description | Required for RESOLVED status. 20-500 characters |
| `resolutionImages` | File[] | Conditional | Resolution images | Required for RESOLVED (min 1), Optional for IN_PROGRESS. Max 5 images, 5MB each |
| `category` | string | No | Complaint category | - |
| `subcategory` | string | No | Complaint subcategory | - |

### Status-Specific Requirements

#### RESOLVED Status
- **resolutionNote**: REQUIRED (20-500 characters)
- **resolutionImages**: REQUIRED (at least 1 image, max 5)
- Images will be uploaded to Cloudinary
- User will receive notification with images and notes

#### IN_PROGRESS Status
- **resolutionNote**: OPTIONAL (if provided, 20-500 characters)
- **resolutionImages**: OPTIONAL (max 5)
- User will receive notification

#### Other Statuses (PENDING, REJECTED, OTHERS)
- **resolutionNote**: Not applicable
- **resolutionImages**: Not applicable

### Image Validation

- **Allowed formats**: JPEG, JPG, PNG, WebP
- **Max file size**: 5MB per image
- **Max count**: 5 images
- **Upload destination**: Cloudinary (with automatic optimization)

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Complaint status updated successfully",
  "data": {
    "complaint": {
      "id": 123,
      "title": "Garbage not collected",
      "description": "...",
      "status": "RESOLVED",
      "category": "WASTE_MANAGEMENT",
      "subcategory": "GARBAGE_COLLECTION",
      "resolutionImages": "https://res.cloudinary.com/.../image1.jpg,https://res.cloudinary.com/.../image2.jpg",
      "resolutionNote": "The garbage has been collected and the area has been cleaned thoroughly.",
      "createdAt": "2024-12-15T10:30:00.000Z",
      "updatedAt": "2024-12-20T14:45:00.000Z",
      "user": {
        "id": 456,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+8801712345678"
      }
    },
    "resolutionImages": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ],
    "resolutionNote": "The garbage has been collected and the area has been cleaned thoroughly."
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Complaint ID
```json
{
  "success": false,
  "message": "Invalid complaint ID"
}
```

#### 400 Bad Request - Missing Status
```json
{
  "success": false,
  "message": "Status is required"
}
```

#### 400 Bad Request - Missing Resolution Note (RESOLVED)
```json
{
  "success": false,
  "message": "Resolution note is required when marking complaint as RESOLVED"
}
```

#### 400 Bad Request - Resolution Note Too Short
```json
{
  "success": false,
  "message": "Resolution note must be at least 20 characters"
}
```

#### 400 Bad Request - Resolution Note Too Long
```json
{
  "success": false,
  "message": "Resolution note must not exceed 500 characters"
}
```

#### 400 Bad Request - Missing Resolution Images (RESOLVED)
```json
{
  "success": false,
  "message": "At least one resolution image is required when marking complaint as RESOLVED"
}
```

#### 400 Bad Request - Too Many Images
```json
{
  "success": false,
  "message": "Maximum 5 resolution images allowed"
}
```

#### 400 Bad Request - Image Too Large
```json
{
  "success": false,
  "message": "Image example.jpg exceeds 5MB size limit"
}
```

#### 400 Bad Request - Invalid Image Type
```json
{
  "success": false,
  "message": "Image example.bmp has invalid type. Only JPEG, PNG, and WebP are allowed"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Complaint not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to update complaint status"
}
```

---

## Examples

### Example 1: Mark as RESOLVED with Images and Note

**Request**:
```bash
curl -X PATCH \
  'http://localhost:4000/api/admin/complaints/123/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'status=RESOLVED' \
  -F 'resolutionNote=The garbage has been collected and the area has been cleaned thoroughly. Our team completed the work on December 20, 2024.' \
  -F 'resolutionImages=@/path/to/image1.jpg' \
  -F 'resolutionImages=@/path/to/image2.jpg' \
  -F 'note=Resolved by cleaning team'
```

**Response**: See Success Response above

### Example 2: Mark as IN_PROGRESS with Optional Images

**Request**:
```bash
curl -X PATCH \
  'http://localhost:4000/api/admin/complaints/123/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'status=IN_PROGRESS' \
  -F 'resolutionNote=Our team is currently working on this issue. Expected completion by tomorrow.' \
  -F 'resolutionImages=@/path/to/progress.jpg' \
  -F 'note=Assigned to cleaning team'
```

**Response**:
```json
{
  "success": true,
  "message": "Complaint status updated successfully",
  "data": {
    "complaint": {
      "id": 123,
      "status": "IN_PROGRESS",
      "resolutionImages": "https://res.cloudinary.com/.../progress.jpg",
      "resolutionNote": "Our team is currently working on this issue. Expected completion by tomorrow.",
      ...
    },
    "resolutionImages": [
      "https://res.cloudinary.com/.../progress.jpg"
    ],
    "resolutionNote": "Our team is currently working on this issue. Expected completion by tomorrow."
  }
}
```

### Example 3: Mark as IN_PROGRESS without Images

**Request**:
```bash
curl -X PATCH \
  'http://localhost:4000/api/admin/complaints/123/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'status=IN_PROGRESS' \
  -F 'note=Assigned to team'
```

**Response**:
```json
{
  "success": true,
  "message": "Complaint status updated successfully",
  "data": {
    "complaint": {
      "id": 123,
      "status": "IN_PROGRESS",
      "resolutionImages": null,
      "resolutionNote": null,
      ...
    },
    "resolutionImages": [],
    "resolutionNote": null
  }
}
```

---

## Side Effects

### 1. Status History
A new entry is created in the `StatusHistory` table:
```typescript
{
  complaintId: 123,
  oldStatus: "PENDING",
  newStatus: "RESOLVED",
  changedBy: 789, // Admin ID
  note: "Resolved by cleaning team",
  createdAt: "2024-12-20T14:45:00.000Z"
}
```

### 2. Notification
A notification is sent to the complaint owner:

**For RESOLVED status**:
```typescript
{
  userId: 456,
  title: "Complaint Resolved",
  message: "Your complaint has been resolved",
  type: "STATUS_CHANGE",
  complaintId: 123,
  statusChange: "RESOLVED",
  metadata: {
    resolutionImages: [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ],
    resolutionNote: "The garbage has been collected...",
    adminName: "Admin #789"
  },
  isRead: false
}
```

**For IN_PROGRESS status**:
```typescript
{
  userId: 456,
  title: "Complaint In Progress",
  message: "Your complaint is being processed",
  type: "STATUS_CHANGE",
  complaintId: 123,
  statusChange: "IN_PROGRESS",
  metadata: {
    resolutionImages: ["https://res.cloudinary.com/.../progress.jpg"], // if provided
    resolutionNote: "Our team is currently working...", // if provided
    adminName: "Admin #789"
  },
  isRead: false
}
```

### 3. Activity Log
An activity log entry is created:
```typescript
{
  userId: 789, // Admin ID
  action: "UPDATE_STATUS",
  entityType: "Complaint",
  entityId: 123,
  oldValue: {
    status: "PENDING",
    resolutionImages: null,
    resolutionNote: null
  },
  newValue: {
    status: "RESOLVED",
    resolutionImages: "https://res.cloudinary.com/.../image1.jpg,...",
    resolutionNote: "The garbage has been collected..."
  },
  createdAt: "2024-12-20T14:45:00.000Z"
}
```

### 4. Cloudinary Upload
Images are uploaded to Cloudinary with:
- **Folder structure**: `clean-care/resolution/{YYYY-MM-DD}/`
- **Transformations**: Auto quality and format optimization
- **Security**: Secure URLs with HTTPS

---

## Testing

### Test Script

A test script is available at `server/test-status-update-api.js`:

```bash
# Run the test script
node server/test-status-update-api.js
```

The script tests:
1. ✅ Mark as RESOLVED with images and note
2. ✅ Mark as IN_PROGRESS with optional images
3. ✅ Mark as IN_PROGRESS without images
4. ❌ Validation errors (missing note, missing images, etc.)

---

## Integration

### Frontend Integration (Admin Panel)

```typescript
// Using FormData for multipart upload
const updateComplaintStatus = async (
  complaintId: number,
  status: string,
  resolutionNote: string,
  images: File[]
) => {
  const formData = new FormData();
  formData.append('status', status);
  formData.append('resolutionNote', resolutionNote);
  
  images.forEach(image => {
    formData.append('resolutionImages', image);
  });

  const response = await fetch(
    `/api/admin/complaints/${complaintId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return response.json();
};
```

### Mobile App Integration (Flutter)

```dart
// Using dio for multipart upload
Future<void> updateComplaintStatus(
  int complaintId,
  String status,
  String resolutionNote,
  List<File> images
) async {
  final formData = FormData.fromMap({
    'status': status,
    'resolutionNote': resolutionNote,
    'resolutionImages': images.map((file) => 
      MultipartFile.fromFileSync(file.path)
    ).toList(),
  });

  final response = await dio.patch(
    '/api/admin/complaints/$complaintId/status',
    data: formData,
  );

  return response.data;
}
```

---

## Performance Considerations

### Image Upload
- **Average upload time**: 2-5 seconds for 5 images
- **Cloudinary optimization**: Automatic format conversion (WebP) and quality adjustment
- **Retry logic**: Built-in retry for network failures (max 3 attempts)

### Database Transaction
- **Transaction scope**: Status update + status history creation
- **Average duration**: < 100ms
- **Rollback**: Automatic on any failure

### Notification
- **Async operation**: Does not block status update
- **Failure handling**: Logged but does not fail the main operation

---

## Security

### Authentication
- JWT token required in Authorization header
- Token must be valid and not expired

### Authorization
- Only users with ADMIN, SUPER_ADMIN, or MASTER_ADMIN roles can update status
- Role check performed by `rbacGuard` middleware

### File Upload Security
- File type validation (only images)
- File size validation (max 5MB)
- Filename sanitization
- Cloudinary secure URLs (HTTPS)
- No executable files allowed

### Input Validation
- Status must be valid enum value
- Resolution note length validated
- Image count validated
- SQL injection prevention (Prisma parameterized queries)

---

## Troubleshooting

### Issue: "Resolution note is required"
**Solution**: Ensure `resolutionNote` field is included and has at least 20 characters when marking as RESOLVED.

### Issue: "At least one resolution image is required"
**Solution**: Include at least one image file in `resolutionImages` field when marking as RESOLVED.

### Issue: "Image exceeds 5MB size limit"
**Solution**: Compress images before upload or use smaller images.

### Issue: "Maximum 5 resolution images allowed"
**Solution**: Upload maximum 5 images at a time.

### Issue: Cloudinary upload fails
**Solution**: 
1. Check Cloudinary credentials in `.env`
2. Verify `USE_CLOUDINARY=true` in environment
3. Check network connectivity
4. Review server logs for detailed error

---

## Related Documentation

- [Notification API](./NOTIFICATION_API.md)
- [Review API](./REVIEW_API.md)
- [Others API](./OTHERS_API.md)
- [Design Document](../.kiro/specs/admin-complaint-status-enhancement/design.md)
- [Requirements](../.kiro/specs/admin-complaint-status-enhancement/requirements.md)

---

**Document Version**: 1.0  
**Last Updated**: December 20, 2024  
**Maintained By**: Backend Team
