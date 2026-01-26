# Admin User Management API Documentation

## Overview

This document describes the Admin User Management API endpoints for the Clean Care application. These endpoints allow administrators to view, manage, and monitor all registered users (citizens) who sign up through the Flutter mobile app.

## Base URL

```
http://localhost:4000/api/admin
```

## Authentication

All admin user management endpoints require authentication using a JWT access token with admin privileges.

### Authentication Header

```
Authorization: Bearer <access_token>
```

### Required Role

- `ADMIN` or `SUPER_ADMIN` role required for all endpoints
- Some operations may require `SUPER_ADMIN` role specifically

### Authentication Errors

- `401 Unauthorized`: Missing or invalid access token
- `403 Forbidden`: User does not have admin privileges

---

## Endpoints

### 1. Get All Users

Retrieve a paginated list of all registered users with filtering and search capabilities.

**Endpoint**: `GET /api/admin/users`

**Authentication**: Required (Admin role)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Number of users per page |
| `search` | string | No | - | Search term for name, email, phone, ward, or zone |
| `status` | string | No | - | Filter by user status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |
| `role` | string | No | - | Filter by user role: `CUSTOMER`, `SERVICE_PROVIDER`, `ADMIN`, `SUPER_ADMIN` |
| `sortBy` | string | No | createdAt | Field to sort by |
| `sortOrder` | string | No | desc | Sort order: `asc` or `desc` |

#### Request Example

```http
GET /api/admin/users?page=1&limit=20&search=john&status=ACTIVE
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "john.doe@example.com",
        "phone": "+8801712345678",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "emailVerified": true,
        "phoneVerified": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:45:00.000Z",
        "lastLoginAt": "2024-01-20T09:15:00.000Z",
        "ward": "Ward 15",
        "zone": "Zone A",
        "statistics": {
          "totalComplaints": 12,
          "resolvedComplaints": 8,
          "unresolvedComplaints": 4,
          "pendingComplaints": 2,
          "inProgressComplaints": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

---

### 2. Get User by ID

Retrieve detailed information about a specific user including their recent complaints.

**Endpoint**: `GET /api/admin/users/:id`

**Authentication**: Required (Admin role)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Request Example

```http
GET /api/admin/users/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "phone": "+8801712345678",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatars/john.jpg",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "emailVerified": true,
      "phoneVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "lastLoginAt": "2024-01-20T09:15:00.000Z",
      "ward": "Ward 15",
      "zone": "Zone A",
      "statistics": {
        "totalComplaints": 12,
        "resolvedComplaints": 8,
        "unresolvedComplaints": 4,
        "pendingComplaints": 2,
        "inProgressComplaints": 2
      }
    },
    "recentComplaints": [
      {
        "id": 45,
        "title": "Street light not working",
        "status": "RESOLVED",
        "priority": 2,
        "createdAt": "2024-01-18T08:00:00.000Z",
        "updatedAt": "2024-01-19T16:30:00.000Z"
      },
      {
        "id": 44,
        "title": "Garbage collection issue",
        "status": "IN_PROGRESS",
        "priority": 3,
        "createdAt": "2024-01-17T14:20:00.000Z",
        "updatedAt": "2024-01-18T10:15:00.000Z"
      }
    ]
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 999 not found"
  }
}
```

---

### 3. Get User Statistics

Retrieve aggregate statistics about all users and their activity.

**Endpoint**: `GET /api/admin/users/statistics`

**Authentication**: Required (Admin role)

#### Request Example

```http
GET /api/admin/users/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalCitizens": 1250,
    "totalComplaints": 3450,
    "resolvedComplaints": 2890,
    "unresolvedComplaints": 560,
    "successRate": 83.77,
    "activeUsers": 890,
    "newUsersThisMonth": 45,
    "statusBreakdown": {
      "active": 1100,
      "inactive": 80,
      "suspended": 50,
      "pending": 20
    }
  }
}
```

---

### 4. Create User

Manually create a new user account.

**Endpoint**: `POST /api/admin/users`

**Authentication**: Required (Admin role)

#### Request Body

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+8801798765432",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "ward": "Ward 10",
  "zone": "Zone B",
  "role": "CUSTOMER"
}
```

#### Request Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | User's first name |
| `lastName` | string | Yes | User's last name |
| `phone` | string | Yes | User's phone number (must be unique) |
| `email` | string | No | User's email address (must be unique if provided) |
| `password` | string | Yes | User's password (min 8 characters) |
| `ward` | string | No | User's ward |
| `zone` | string | No | User's zone |
| `role` | string | No | User role (default: CUSTOMER) |

#### Request Example

```http
POST /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+8801798765432",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "ward": "Ward 10",
  "zone": "Zone B"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 151,
      "email": "jane.smith@example.com",
      "phone": "+8801798765432",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": null,
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2024-01-21T10:00:00.000Z",
      "updatedAt": "2024-01-21T10:00:00.000Z",
      "lastLoginAt": null,
      "ward": "Ward 10",
      "zone": "Zone B",
      "statistics": {
        "totalComplaints": 0,
        "resolvedComplaints": 0,
        "unresolvedComplaints": 0,
        "pendingComplaints": 0,
        "inProgressComplaints": 0
      }
    },
    "message": "User created successfully"
  }
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": {
      "firstName": "First name is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

**409 Conflict - Duplicate Phone**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_PHONE",
    "message": "Phone number already exists"
  }
}
```

**409 Conflict - Duplicate Email**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email address already exists"
  }
}
```

---

### 5. Update User

Update user information and account settings.

**Endpoint**: `PUT /api/admin/users/:id`

**Authentication**: Required (Admin role)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+8801712345678",
  "ward": "Ward 16",
  "zone": "Zone C",
  "role": "CUSTOMER",
  "status": "ACTIVE"
}
```

#### Request Body Parameters

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |
| `email` | string | User's email address |
| `phone` | string | User's phone number |
| `ward` | string | User's ward |
| `zone` | string | User's zone |
| `role` | string | User role |
| `status` | string | User status |

#### Request Example

```http
PUT /api/admin/users/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "lastName": "Doe Updated",
  "ward": "Ward 16"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "phone": "+8801712345678",
      "firstName": "John",
      "lastName": "Doe Updated",
      "avatar": "https://example.com/avatars/john.jpg",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "emailVerified": true,
      "phoneVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-21T11:00:00.000Z",
      "lastLoginAt": "2024-01-20T09:15:00.000Z",
      "ward": "Ward 16",
      "zone": "Zone A",
      "statistics": {
        "totalComplaints": 12,
        "resolvedComplaints": 8,
        "unresolvedComplaints": 4,
        "pendingComplaints": 2,
        "inProgressComplaints": 2
      }
    },
    "message": "User updated successfully"
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 999 not found"
  }
}
```

**409 Conflict**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email address already exists"
  }
}
```

---

### 6. Update User Status

Update only the status of a user account (quick status change).

**Endpoint**: `PATCH /api/admin/users/:id/status`

**Authentication**: Required (Admin role)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Request Body

```json
{
  "status": "SUSPENDED",
  "reason": "Violation of terms of service"
}
```

#### Request Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |
| `reason` | string | No | Reason for status change (for audit log) |

#### Request Example

```http
PATCH /api/admin/users/1/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "SUSPENDED",
  "reason": "Multiple spam complaints"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "phone": "+8801712345678",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatars/john.jpg",
      "role": "CUSTOMER",
      "status": "SUSPENDED",
      "emailVerified": true,
      "phoneVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-21T11:30:00.000Z",
      "lastLoginAt": "2024-01-20T09:15:00.000Z",
      "ward": "Ward 15",
      "zone": "Zone A",
      "statistics": {
        "totalComplaints": 12,
        "resolvedComplaints": 8,
        "unresolvedComplaints": 4,
        "pendingComplaints": 2,
        "inProgressComplaints": 2
      }
    },
    "message": "User status updated successfully"
  }
}
```

#### Status Effects

- **ACTIVE**: User can log in and use the mobile app normally
- **INACTIVE**: User account is marked inactive but can still log in
- **SUSPENDED**: User cannot log in to the mobile app
- **PENDING**: User account is pending approval (new registrations)

---

## Data Models

### User Object

```typescript
{
  id: number;
  email: string | null;
  phone: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;  // ISO 8601 format
  lastLoginAt: string | null;  // ISO 8601 format
  ward: string | null;
  zone: string | null;
  statistics: {
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
  };
}
```

### Complaint Summary Object

```typescript
{
  id: number;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  priority: number;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;  // ISO 8601 format
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User does not have required permissions |
| `USER_NOT_FOUND` | 404 | User with specified ID does not exist |
| `INVALID_INPUT` | 400 | Request validation failed |
| `DUPLICATE_PHONE` | 409 | Phone number already exists |
| `DUPLICATE_EMAIL` | 409 | Email address already exists |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

All admin endpoints are subject to rate limiting:

- **Rate**: 100 requests per 15 minutes per IP address
- **Response Header**: `X-RateLimit-Remaining`
- **Error Response (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## Best Practices

### Pagination

- Always use pagination for list endpoints
- Default page size is 20, maximum is 100
- Use `page` and `limit` parameters to control pagination

### Search and Filtering

- Combine `search` with `status` or `role` filters for precise results
- Search is case-insensitive and matches partial strings
- Use debouncing on the frontend to avoid excessive API calls

### Error Handling

- Always check the `success` field in responses
- Handle all documented error codes appropriately
- Display user-friendly error messages to administrators

### Security

- Never expose sensitive user data (passwords, tokens) in responses
- Always validate and sanitize user input
- Use HTTPS in production
- Rotate JWT secrets regularly

---

## Testing

### Using cURL

```bash
# Get all users
curl -X GET "http://localhost:4000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get user by ID
curl -X GET "http://localhost:4000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create user
curl -X POST "http://localhost:4000/api/admin/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phone": "+8801700000000",
    "password": "TestPass123!"
  }'

# Update user
curl -X PUT "http://localhost:4000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "Updated"
  }'

# Update user status
curl -X PATCH "http://localhost:4000/api/admin/users/1/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED"
  }'
```

### Using Postman

Import the following collection to test all endpoints:

1. Create a new collection named "Admin User Management"
2. Add environment variables:
   - `base_url`: `http://localhost:4000`
   - `access_token`: Your admin JWT token
3. Add requests for each endpoint as documented above

---

## Changelog

### Version 1.0.0 (2024-01-21)

- Initial release of Admin User Management API
- Added endpoints for user listing, viewing, creating, updating
- Added user statistics endpoint
- Added status management endpoint
- Implemented search and filtering capabilities
- Added comprehensive error handling

---

## Support

For issues or questions about the Admin User Management API:

1. Check this documentation first
2. Review the error codes and responses
3. Test with the provided cURL examples
4. Contact the development team

---

## Related Documentation

- [Main API Documentation](./README.md)
- [Database Setup Guide](./setup-database.md)
- [Authentication Guide](./AUTH_SECURITY_SETUP.md)
