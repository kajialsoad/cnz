# Others Status API Documentation

This document provides comprehensive documentation for the Others status management API endpoints.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Mark Complaint as Others](#mark-complaint-as-others)
  - [Get Others Analytics](#get-others-analytics)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The Others Status API provides endpoints for:
- Marking complaints as "Others" with categorization
- Retrieving analytics about Others complaints
- Tracking resolution times and trends

**Base URL**: `/api/admin/complaints`

**Version**: 1.0.0

---

## Authentication

All endpoints require:
- **Authentication**: Valid JWT token in Authorization header
- **Authorization**: Admin role (ADMIN, SUPER_ADMIN, or MASTER_ADMIN)

```http
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Mark Complaint as Others

Mark a complaint as "Others" with appropriate category and subcategory.

**Endpoint**: `PATCH /api/admin/complaints/:id/mark-others`

**Authentication**: Required (Admin roles only)

**URL Parameters**:
- `id` (number, required) - Complaint ID

**Request Body**:
```json
{
  "othersCategory": "CORPORATION_INTERNAL",
  "othersSubcategory": "Engineering",
  "adminId": 123
}
```

**Request Body Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| othersCategory | string | Yes | Must be "CORPORATION_INTERNAL" or "CORPORATION_EXTERNAL" |
| othersSubcategory | string | Yes | Valid subcategory based on category (see below) |
| adminId | number | No | Admin user ID (defaults to authenticated user) |

**Valid Subcategories**:

For `CORPORATION_INTERNAL`:
- Engineering
- Electricity
- Health
- Property (Eviction)

For `CORPORATION_EXTERNAL`:
- WASA
- Titas
- DPDC
- DESCO
- BTCL
- Fire Service
- Others

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Complaint marked as Others successfully",
  "data": {
    "complaint": {
      "id": 123,
      "status": "OTHERS",
      "othersCategory": "CORPORATION_INTERNAL",
      "othersSubcategory": "Engineering",
      "description": "Street light not working",
      "address": "123 Main St",
      "createdAt": "2024-12-20T10:00:00.000Z",
      "updatedAt": "2024-12-20T11:00:00.000Z",
      "user": {
        "id": 456,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+8801712345678"
      }
    }
  }
}
```

**Error Responses**:

400 Bad Request - Invalid complaint ID:
```json
{
  "success": false,
  "message": "Invalid complaint ID"
}
```

400 Bad Request - Missing required fields:
```json
{
  "success": false,
  "message": "Others category and subcategory are required"
}
```

400 Bad Request - Invalid category:
```json
{
  "success": false,
  "message": "Invalid Others category. Must be CORPORATION_INTERNAL or CORPORATION_EXTERNAL"
}
```

400 Bad Request - Invalid subcategory:
```json
{
  "success": false,
  "message": "Invalid subcategory for CORPORATION_INTERNAL. Valid options: Engineering, Electricity, Health, Property (Eviction)"
}
```

401 Unauthorized:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

404 Not Found:
```json
{
  "success": false,
  "message": "Complaint not found"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "message": "Failed to mark complaint as Others"
}
```

---

### Get Others Analytics

Retrieve comprehensive analytics about complaints marked as Others.

**Endpoint**: `GET /api/admin/complaints/analytics/others`

**Authentication**: Required (Admin roles only)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cityCorporationCode | string | No | Filter by city corporation (e.g., "DSCC", "DNCC") |
| zoneId | number | No | Filter by zone ID |
| startDate | string | No | Filter from date (ISO 8601 format) |
| endDate | string | No | Filter to date (ISO 8601 format) |

**Example Request**:
```http
GET /api/admin/complaints/analytics/others?cityCorporationCode=DSCC&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <your-jwt-token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalOthers": 150,
    "byCategory": {
      "CORPORATION_INTERNAL": {
        "count": 90,
        "percentage": 60
      },
      "CORPORATION_EXTERNAL": {
        "count": 60,
        "percentage": 40
      }
    },
    "bySubcategory": [
      {
        "subcategory": "Engineering",
        "count": 45,
        "percentage": 30
      },
      {
        "subcategory": "WASA",
        "count": 30,
        "percentage": 20
      },
      {
        "subcategory": "Electricity",
        "count": 25,
        "percentage": 16.67
      }
    ],
    "topSubcategories": [
      {
        "subcategory": "Engineering",
        "count": 45
      },
      {
        "subcategory": "WASA",
        "count": 30
      },
      {
        "subcategory": "Electricity",
        "count": 25
      },
      {
        "subcategory": "Health",
        "count": 20
      },
      {
        "subcategory": "DPDC",
        "count": 15
      }
    ],
    "averageResolutionTime": {
      "overall": 5.5,
      "bySubcategory": [
        {
          "subcategory": "Engineering",
          "avgDays": 6.2
        },
        {
          "subcategory": "WASA",
          "avgDays": 4.8
        }
      ]
    },
    "trend": [
      {
        "date": "2024-11-20",
        "count": 5
      },
      {
        "date": "2024-11-21",
        "count": 8
      },
      {
        "date": "2024-11-22",
        "count": 3
      }
    ]
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| totalOthers | number | Total number of Others complaints |
| byCategory | object | Breakdown by category (INTERNAL/EXTERNAL) |
| byCategory.*.count | number | Number of complaints in category |
| byCategory.*.percentage | number | Percentage of total |
| bySubcategory | array | All subcategories with counts |
| bySubcategory[].subcategory | string | Subcategory name |
| bySubcategory[].count | number | Number of complaints |
| bySubcategory[].percentage | number | Percentage of total |
| topSubcategories | array | Top 5 subcategories by count |
| averageResolutionTime.overall | number | Average days to resolve (all) |
| averageResolutionTime.bySubcategory | array | Average resolution time per subcategory |
| trend | array | Daily complaint counts for last 30 days |
| trend[].date | string | Date (YYYY-MM-DD) |
| trend[].count | number | Number of complaints on that date |

**Error Responses**:

400 Bad Request - Invalid zone ID:
```json
{
  "success": false,
  "message": "Invalid zone ID"
}
```

400 Bad Request - Invalid date:
```json
{
  "success": false,
  "message": "Invalid start date"
}
```

401 Unauthorized:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "message": "Failed to fetch Others analytics"
}
```

---

## Data Models

### Others Category

```typescript
type OthersCategory = 'CORPORATION_INTERNAL' | 'CORPORATION_EXTERNAL';
```

### Others Subcategory

```typescript
// For CORPORATION_INTERNAL
type InternalSubcategory = 
  | 'Engineering'
  | 'Electricity'
  | 'Health'
  | 'Property (Eviction)';

// For CORPORATION_EXTERNAL
type ExternalSubcategory = 
  | 'WASA'
  | 'Titas'
  | 'DPDC'
  | 'DESCO'
  | 'BTCL'
  | 'Fire Service'
  | 'Others';
```

### Mark Others Input

```typescript
interface MarkOthersInput {
  othersCategory: OthersCategory;
  othersSubcategory: string;
  adminId?: number;
}
```

### Others Analytics Response

```typescript
interface OthersAnalytics {
  totalOthers: number;
  byCategory: {
    CORPORATION_INTERNAL: {
      count: number;
      percentage: number;
    };
    CORPORATION_EXTERNAL: {
      count: number;
      percentage: number;
    };
  };
  bySubcategory: Array<{
    subcategory: string;
    count: number;
    percentage: number;
  }>;
  topSubcategories: Array<{
    subcategory: string;
    count: number;
  }>;
  averageResolutionTime: {
    overall: number;
    bySubcategory: Array<{
      subcategory: string;
      avgDays: number;
    }>;
  };
  trend: Array<{
    date: string;
    count: number;
  }>;
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Examples

### Example 1: Mark Complaint as Corporation Internal

**Request**:
```bash
curl -X PATCH http://localhost:4000/api/admin/complaints/123/mark-others \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "othersCategory": "CORPORATION_INTERNAL",
    "othersSubcategory": "Engineering"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Complaint marked as Others successfully",
  "data": {
    "complaint": {
      "id": 123,
      "status": "OTHERS",
      "othersCategory": "CORPORATION_INTERNAL",
      "othersSubcategory": "Engineering"
    }
  }
}
```

### Example 2: Mark Complaint as Corporation External

**Request**:
```bash
curl -X PATCH http://localhost:4000/api/admin/complaints/456/mark-others \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "othersCategory": "CORPORATION_EXTERNAL",
    "othersSubcategory": "WASA"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Complaint marked as Others successfully",
  "data": {
    "complaint": {
      "id": 456,
      "status": "OTHERS",
      "othersCategory": "CORPORATION_EXTERNAL",
      "othersSubcategory": "WASA"
    }
  }
}
```

### Example 3: Get Others Analytics (No Filters)

**Request**:
```bash
curl -X GET http://localhost:4000/api/admin/complaints/analytics/others \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOthers": 150,
    "byCategory": {
      "CORPORATION_INTERNAL": {
        "count": 90,
        "percentage": 60
      },
      "CORPORATION_EXTERNAL": {
        "count": 60,
        "percentage": 40
      }
    },
    "topSubcategories": [
      {
        "subcategory": "Engineering",
        "count": 45
      }
    ]
  }
}
```

### Example 4: Get Others Analytics with Filters

**Request**:
```bash
curl -X GET "http://localhost:4000/api/admin/complaints/analytics/others?cityCorporationCode=DSCC&zoneId=5&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOthers": 45,
    "byCategory": {
      "CORPORATION_INTERNAL": {
        "count": 30,
        "percentage": 66.67
      },
      "CORPORATION_EXTERNAL": {
        "count": 15,
        "percentage": 33.33
      }
    },
    "averageResolutionTime": {
      "overall": 4.5,
      "bySubcategory": [
        {
          "subcategory": "Engineering",
          "avgDays": 5.2
        }
      ]
    },
    "trend": [
      {
        "date": "2024-12-01",
        "count": 2
      },
      {
        "date": "2024-12-02",
        "count": 3
      }
    ]
  }
}
```

### Example 5: Invalid Category Error

**Request**:
```bash
curl -X PATCH http://localhost:4000/api/admin/complaints/123/mark-others \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "othersCategory": "INVALID_CATEGORY",
    "othersSubcategory": "Engineering"
  }'
```

**Response**:
```json
{
  "success": false,
  "message": "Invalid Others category. Must be CORPORATION_INTERNAL or CORPORATION_EXTERNAL"
}
```

### Example 6: Invalid Subcategory Error

**Request**:
```bash
curl -X PATCH http://localhost:4000/api/admin/complaints/123/mark-others \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "othersCategory": "CORPORATION_INTERNAL",
    "othersSubcategory": "WASA"
  }'
```

**Response**:
```json
{
  "success": false,
  "message": "Invalid subcategory for CORPORATION_INTERNAL. Valid options: Engineering, Electricity, Health, Property (Eviction)"
}
```

---

## Integration Notes

### Workflow

1. **Mark as Others**:
   - Admin reviews complaint
   - Determines it belongs to another department
   - Calls `PATCH /api/admin/complaints/:id/mark-others`
   - System updates status to OTHERS
   - System creates notification for user
   - System logs activity

2. **View Analytics**:
   - Admin navigates to Others analytics dashboard
   - Frontend calls `GET /api/admin/complaints/analytics/others`
   - System returns comprehensive statistics
   - Frontend displays charts and trends

### Notifications

When a complaint is marked as Others:
- User receives notification about status change
- Notification includes category and subcategory
- User can view which department is responsible

### Activity Logging

All Others operations are logged:
- Admin who marked complaint
- Timestamp
- Category and subcategory
- Previous status

---

## Testing

### Test Script

A test script is available at `server/test-others-api.js`:

```bash
# Run all tests
node server/test-others-api.js

# Test specific endpoint
node server/test-others-api.js mark-others
node server/test-others-api.js analytics
```

### Manual Testing

1. **Setup**:
   - Ensure server is running
   - Obtain admin JWT token
   - Have test complaint IDs ready

2. **Test Mark as Others**:
   - Use curl or Postman
   - Test valid categories
   - Test invalid categories
   - Test invalid subcategories
   - Verify notifications created

3. **Test Analytics**:
   - Test without filters
   - Test with city corporation filter
   - Test with zone filter
   - Test with date range
   - Verify calculations

---

## Performance Considerations

### Caching

Analytics endpoint is suitable for caching:
- Cache key: `others-analytics:{cityCorporationCode}:{zoneId}:{startDate}:{endDate}`
- TTL: 5 minutes
- Invalidate on new Others complaint

### Optimization

- Analytics uses single query with aggregation
- Indexes on `status`, `othersCategory`, `othersSubcategory`
- Date range filtering optimized with index

---

## Security

### Authorization

- Only admin roles can access endpoints
- RBAC middleware enforces permissions
- JWT token required for all requests

### Validation

- All inputs validated before processing
- Category and subcategory whitelist
- SQL injection prevention via Prisma
- XSS prevention via input sanitization

---

## Changelog

### Version 1.0.0 (2024-12-20)
- Initial release
- Mark complaint as Others endpoint
- Others analytics endpoint
- Comprehensive documentation

---

## Support

For issues or questions:
- Check error messages for details
- Review this documentation
- Contact backend team

---

**Last Updated**: December 20, 2024  
**API Version**: 1.0.0
