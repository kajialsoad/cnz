# Notification API Documentation

## Overview

The Notification API provides endpoints for managing user notifications related to complaint status changes. Users receive notifications when their complaints are updated, resolved, or categorized.

**Base URL**: `/api/notifications`

**Authentication**: All endpoints require a valid JWT token in the Authorization header.

---

## Endpoints

### 1. Get User Notifications

Retrieve paginated list of notifications for the authenticated user.

**Endpoint**: `GET /api/notifications`

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (must be >= 1) |
| limit | number | No | 20 | Items per page (1-100) |
| unreadOnly | boolean | No | false | Filter unread notifications only |

**Request Example**:
```http
GET /api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 123,
        "userId": 45,
        "complaintId": 789,
        "title": "Complaint Resolved",
        "message": "Your complaint has been resolved. Please review the resolution details.",
        "type": "STATUS_CHANGE",
        "statusChange": "TO_RESOLVED",
        "metadata": {
          "resolutionImages": ["https://cloudinary.com/image1.jpg"],
          "resolutionNote": "Issue fixed by maintenance team",
          "adminName": "John Doe"
        },
        "isRead": false,
        "createdAt": "2024-12-20T10:30:00.000Z",
        "complaint": {
          "id": 789,
          "title": "Broken Street Light",
          "status": "RESOLVED"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "unreadCount": 5
  }
}
```

**Error Responses**:

- **401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- **400 Bad Request** (Invalid pagination):
```json
{
  "success": false,
  "message": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100."
}
```

- **500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to fetch notifications"
}
```

---

### 2. Get Unread Notification Count

Get the count of unread notifications for the authenticated user.

**Endpoint**: `GET /api/notifications/unread-count`

**Authentication**: Required

**Request Example**:
```http
GET /api/notifications/unread-count
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Error Responses**:

- **401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- **500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to get unread count"
}
```

---

### 3. Mark Notification as Read

Mark a single notification as read.

**Endpoint**: `PATCH /api/notifications/:id/read`

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Notification ID |

**Request Example**:
```http
PATCH /api/notifications/123/read
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "isRead": true
  }
}
```

**Error Responses**:

- **401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- **400 Bad Request** (Invalid ID):
```json
{
  "success": false,
  "message": "Invalid notification ID"
}
```

- **404 Not Found** (Notification doesn't belong to user):
```json
{
  "success": false,
  "message": "Notification not found or does not belong to user"
}
```

- **500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to mark notification as read"
}
```

---

### 4. Mark All Notifications as Read

Mark all unread notifications as read for the authenticated user.

**Endpoint**: `PATCH /api/notifications/read-all`

**Authentication**: Required

**Request Example**:
```http
PATCH /api/notifications/read-all
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

**Error Responses**:

- **401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- **500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to mark all notifications as read"
}
```

---

## Notification Types

### Status Change Notifications

Notifications are automatically created when complaint status changes:

1. **IN_PROGRESS**:
   - Title: "Complaint In Progress"
   - Message: "Your complaint has been accepted and is currently being processed by our team."

2. **RESOLVED**:
   - Title: "Complaint Resolved"
   - Message: Includes resolution note if provided
   - Metadata: Contains resolution images and notes

3. **OTHERS**:
   - Title: "Complaint Categorized"
   - Message: Includes category and subcategory information
   - Metadata: Contains othersCategory and othersSubcategory

4. **REJECTED**:
   - Title: "Complaint Rejected"
   - Message: "Your complaint has been reviewed and rejected."

---

## Notification Metadata Structure

The `metadata` field contains additional information based on the notification type:

```typescript
interface NotificationMetadata {
  resolutionImages?: string[];      // Array of Cloudinary URLs
  resolutionNote?: string;          // Admin's resolution note
  othersCategory?: string;          // "CORPORATION_INTERNAL" or "CORPORATION_EXTERNAL"
  othersSubcategory?: string;       // Specific department/agency
  adminName?: string;               // Name of admin who made the change
}
```

---

## Usage Examples

### Mobile App Integration

```dart
// Fetch notifications
Future<void> fetchNotifications() async {
  final response = await apiClient.get(
    '/notifications',
    queryParameters: {
      'page': 1,
      'limit': 20,
      'unreadOnly': false,
    },
  );
  
  if (response.data['success']) {
    final notifications = response.data['data']['notifications'];
    final unreadCount = response.data['data']['unreadCount'];
    // Update UI
  }
}

// Mark as read
Future<void> markAsRead(int notificationId) async {
  await apiClient.patch('/notifications/$notificationId/read');
}

// Get unread count
Future<int> getUnreadCount() async {
  final response = await apiClient.get('/notifications/unread-count');
  return response.data['data']['count'];
}
```

### Admin Panel Integration

```typescript
// Fetch notifications
const fetchNotifications = async (page = 1, limit = 20) => {
  const response = await axios.get('/api/notifications', {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

// Mark all as read
const markAllAsRead = async () => {
  await axios.patch('/api/notifications/read-all', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own notifications
3. **Validation**: Pagination parameters are validated to prevent abuse
4. **Ownership Verification**: Marking notifications as read verifies ownership

---

## Rate Limiting

- Global IP-based rate limit: 1000 requests per minute
- Additional endpoint-specific rate limits may apply

---

## Related Documentation

- [Admin Complaint Status Enhancement Design](../.kiro/specs/admin-complaint-status-enhancement/design.md)
- [Notification Service](../src/services/notification.service.ts)
- [Authentication Middleware](../src/middlewares/auth.middleware.ts)

---

**Last Updated**: December 20, 2024  
**Version**: 1.0
