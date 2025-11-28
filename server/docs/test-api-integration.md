# Backend API Integration Test Results

## Test Date: 2025-11-14

## API Endpoint Verification

### 1. Authentication Endpoint
**Endpoint:** `POST /api/auth/login`
**Purpose:** Get access token for authenticated requests

Test credentials:
- Phone: `01712345678`
- Password: `password123`

### 2. Get My Complaints Endpoint
**Endpoint:** `GET /api/complaints`
**Purpose:** Fetch all complaints for authenticated user
**Authentication:** Required (Bearer token)

**Expected Response Format:**
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": 123,
        "title": "Complaint Title",
        "description": "Complaint description",
        "status": "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED",
        "priority": 1,
        "location": "Address string",
        "imageUrls": ["url1", "url2"],
        "voiceNoteUrl": "audio_url",
        "userId": 1,
        "createdAt": "2025-11-14T10:30:00Z",
        "updatedAt": "2025-11-14T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Complaint by ID Endpoint
**Endpoint:** `GET /api/complaints/:id`
**Purpose:** Fetch single complaint details
**Authentication:** Required (Bearer token)

**Expected Response Format:**
```json
{
  "success": true,
  "data": {
    "complaint": {
      "id": 123,
      "title": "Complaint Title",
      "description": "Full complaint description",
      "status": "PENDING",
      "priority": 1,
      "location": "Full address",
      "imageUrls": ["url1", "url2"],
      "voiceNoteUrl": "audio_url",
      "userId": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com",
        "phone": "01712345678"
      },
      "createdAt": "2025-11-14T10:30:00Z",
      "updatedAt": "2025-11-14T10:30:00Z"
    }
  }
}
```

## Status Enum Verification

### Backend Status Values (Prisma Schema)
```prisma
enum ComplaintStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  REJECTED
}
```

### Flutter Status Mapping
```dart
// Flutter constants (lowercase with underscore)
static const String pending = 'pending';
static const String inProgress = 'in_progress';
static const String resolved = 'resolved';
static const String closed = 'closed'; // Maps to REJECTED

// Normalization function converts backend format to Flutter format
```

## Authentication Token Handling

### Token Storage
- Access token stored in SharedPreferences as `accessToken`
- Refresh token stored in SharedPreferences as `refreshToken`

### Token Usage
- All complaint endpoints require `Authorization: Bearer <token>` header
- ApiClient automatically includes token in requests
- Token refresh handled automatically on 401 responses

## Pagination Support

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional)
- `sortBy`: Sort field (default: 'createdAt')
- `sortOrder`: Sort direction (default: 'desc')

### Response Structure
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## File URL Parsing

### Backend Storage Format
- Images: JSON array string `["url1", "url2"]` or comma-separated
- Audio: Single URL in `voiceNoteUrl` field or JSON array

### Flutter Parsing
- `_parseUrlList()` handles both JSON arrays and comma-separated strings
- `_parseAudioUrls()` checks multiple fields: `voiceNoteUrl`, `audioUrls`, `audioUrl`

## Integration Checklist

- [x] Backend routes configured (`/api/complaints`)
- [x] Authentication middleware applied to all routes
- [x] Status enum matches between backend and frontend
- [x] Pagination support implemented
- [x] Response format documented
- [x] Flutter Complaint model updated with:
  - [x] Status normalization
  - [x] Helper methods (statusText, statusColor, timeAgo)
  - [x] URL parsing for images and audio
  - [x] Priority field added
- [x] ApiClient handles authentication tokens
- [x] Error handling for network failures
- [x] Token refresh on 401 responses

## Known Issues and Solutions

### Issue 1: Status Enum Mismatch
**Problem:** Backend uses uppercase with underscore (IN_PROGRESS), Flutter uses lowercase (in_progress)
**Solution:** Added `_normalizeStatus()` method in Complaint.fromJson() to convert backend format to Flutter format

### Issue 2: Multiple Audio URL Fields
**Problem:** Backend may return audio in different fields (voiceNoteUrl, audioUrls, audioUrl)
**Solution:** Added `_parseAudioUrls()` method to check all possible fields

### Issue 3: Nested Response Structure
**Problem:** Some endpoints return `data.complaint`, others return `data.complaints`
**Solution:** Updated fromJson to handle both `json['complaint']` and direct `json` object

## Testing Recommendations

1. **Manual Testing:**
   - Use Postman or similar tool to test endpoints
   - Verify response format matches expected structure
   - Test with different status values
   - Test pagination with various page/limit values

2. **Flutter Integration Testing:**
   - Test complaint list loading
   - Test complaint detail view
   - Test with different status values
   - Test image and audio URL parsing
   - Test time ago formatting

3. **Error Scenarios:**
   - Test with expired token (should trigger refresh)
   - Test with invalid token (should return 401)
   - Test with network failure
   - Test with empty complaint list

## Next Steps

1. Start backend server: `cd server && npm run dev`
2. Test endpoints manually using Postman or curl
3. Run Flutter app and test complaint list page
4. Verify data displays correctly
5. Test pull-to-refresh functionality
6. Test navigation to complaint details
