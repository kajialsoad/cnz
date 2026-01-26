# Review API Documentation

## Overview

The Review API provides endpoints for users to submit reviews and ratings for resolved complaints, and for admins to view review analytics.

**Base URL**: `/api`

---

## User Endpoints

### 1. Submit Review

Submit a review for a resolved complaint.

**Endpoint**: `POST /api/complaints/:complaintId/review`

**Authentication**: Required (User must own the complaint)

**Path Parameters**:
- `complaintId` (number, required) - ID of the complaint to review

**Request Body**:
```json
{
  "rating": 5,
  "comment": "Great service! The issue was resolved quickly."
}
```

**Body Parameters**:
- `rating` (number, required) - Rating from 1 to 5 stars
- `comment` (string, optional) - Review comment (max 300 characters)

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "complaintId": 456,
    "userId": 789,
    "rating": 5,
    "comment": "Great service! The issue was resolved quickly.",
    "createdAt": "2024-12-20T10:30:00.000Z"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Invalid input
```json
{
  "success": false,
  "message": "Invalid input",
  "errors": [
    {
      "path": ["rating"],
      "message": "Number must be less than or equal to 5"
    }
  ]
}
```

- **400 Bad Request** - Complaint not resolved
```json
{
  "success": false,
  "message": "Only resolved complaints can be reviewed"
}
```

- **403 Forbidden** - Not complaint owner
```json
{
  "success": false,
  "message": "You can only review your own complaints"
}
```

- **404 Not Found** - Complaint not found
```json
{
  "success": false,
  "message": "Complaint not found"
}
```

- **409 Conflict** - Duplicate review
```json
{
  "success": false,
  "message": "You have already submitted a review for this complaint"
}
```

**Validation Rules**:
- Rating must be an integer between 1 and 5
- Comment is optional but must not exceed 300 characters
- Complaint must exist and be in RESOLVED status
- User must be the owner of the complaint
- User can only submit one review per complaint

**Example cURL**:
```bash
curl -X POST http://localhost:4000/api/complaints/456/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Great service! The issue was resolved quickly."
  }'
```

---

### 2. Get Complaint Reviews

Get all reviews for a specific complaint.

**Endpoint**: `GET /api/complaints/:complaintId/reviews`

**Authentication**: Not required (Public)

**Path Parameters**:
- `complaintId` (number, required) - ID of the complaint

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "rating": 5,
      "comment": "Great service! The issue was resolved quickly.",
      "createdAt": "2024-12-20T10:30:00.000Z",
      "user": {
        "id": 789,
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://cloudinary.com/avatar.jpg"
      }
    },
    {
      "id": 124,
      "rating": 4,
      "comment": "Good resolution, took a bit longer than expected.",
      "createdAt": "2024-12-19T15:20:00.000Z",
      "user": {
        "id": 790,
        "firstName": "Jane",
        "lastName": "Smith",
        "avatar": null
      }
    }
  ]
}
```

**Error Responses**:

- **400 Bad Request** - Invalid complaint ID
```json
{
  "success": false,
  "message": "Invalid complaint ID"
}
```

**Example cURL**:
```bash
curl -X GET http://localhost:4000/api/complaints/456/reviews
```

---

## Admin Endpoints

### 3. Get Review Analytics

Get comprehensive review analytics with optional filters.

**Endpoint**: `GET /api/admin/complaints/analytics/reviews`

**Authentication**: Required (Admin only)

**Query Parameters** (all optional):
- `cityCorporationCode` (string) - Filter by city corporation code (e.g., "DSCC", "DNCC")
- `zoneId` (number) - Filter by zone ID
- `wardId` (number) - Filter by ward ID
- `startDate` (string) - Filter by start date (ISO 8601 format)
- `endDate` (string) - Filter by end date (ISO 8601 format)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "averageRating": 4.2,
    "totalReviews": 156,
    "reviewPercentage": 78,
    "ratingDistribution": {
      "1": 6,
      "2": 10,
      "3": 20,
      "4": 40,
      "5": 80
    },
    "recentReviews": [
      {
        "id": 123,
        "rating": 5,
        "comment": "Great service! The issue was resolved quickly.",
        "createdAt": "2024-12-20T10:30:00.000Z",
        "complaint": {
          "id": 456,
          "title": "Garbage not collected"
        },
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

**Response Fields**:
- `averageRating` (number) - Average rating across all reviews (0-5, rounded to 1 decimal)
- `totalReviews` (number) - Total number of reviews
- `reviewPercentage` (number) - Percentage of resolved complaints that have reviews
- `ratingDistribution` (object) - Count of reviews for each rating (1-5)
- `recentReviews` (array) - Most recent 10 reviews with complaint and user details

**Error Responses**:

- **400 Bad Request** - Invalid date format
```json
{
  "success": false,
  "message": "Invalid start date format"
}
```

- **401 Unauthorized** - Not authenticated
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Example cURL**:
```bash
# Get all review analytics
curl -X GET http://localhost:4000/api/admin/complaints/analytics/reviews \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get analytics for specific city corporation
curl -X GET "http://localhost:4000/api/admin/complaints/analytics/reviews?cityCorporationCode=DSCC" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get analytics for date range
curl -X GET "http://localhost:4000/api/admin/complaints/analytics/reviews?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get analytics with multiple filters
curl -X GET "http://localhost:4000/api/admin/complaints/analytics/reviews?cityCorporationCode=DSCC&zoneId=5&startDate=2024-12-01" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Data Models

### Review Model

```typescript
interface Review {
  id: number;
  complaintId: number;
  userId: number;
  rating: number;        // 1-5
  comment: string | null; // Max 300 characters
  createdAt: Date;
  updatedAt: Date;
}
```

### Review Submission Input

```typescript
interface ReviewSubmissionInput {
  rating: number;        // Required, 1-5
  comment?: string;      // Optional, max 300 chars
}
```

### Review Analytics

```typescript
interface ReviewAnalytics {
  averageRating: number;
  totalReviews: number;
  reviewPercentage: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Array<{
    id: number;
    rating: number;
    comment: string | null;
    createdAt: Date;
    complaint: {
      id: number;
      title: string;
    };
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}
```

---

## Business Rules

### Review Submission Rules

1. **Authentication**: User must be authenticated
2. **Ownership**: User must own the complaint being reviewed
3. **Status**: Complaint must be in RESOLVED status
4. **Uniqueness**: One review per user per complaint (enforced by database unique constraint)
5. **Rating**: Must be an integer between 1 and 5
6. **Comment**: Optional, but if provided must not exceed 300 characters

### Review Analytics Rules

1. **Authentication**: Admin authentication required
2. **Filters**: All filters are optional and can be combined
3. **Date Range**: Both startDate and endDate are inclusive
4. **Percentage Calculation**: reviewPercentage = (totalReviews / totalResolvedComplaints) * 100
5. **Average Rating**: Rounded to 1 decimal place
6. **Recent Reviews**: Limited to 10 most recent reviews

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

For validation errors, additional details are provided:

```json
{
  "success": false,
  "message": "Invalid input",
  "errors": [
    {
      "path": ["field_name"],
      "message": "Validation error message"
    }
  ]
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting:
- **IP-based**: 1000 requests per minute per IP
- **User-based**: Standard API rate limits apply

---

## Testing

### Test Review Submission

```javascript
// test-review-submission.js
const axios = require('axios');

async function testReviewSubmission() {
  const BASE_URL = 'http://localhost:4000/api';
  const token = 'YOUR_USER_TOKEN';
  const complaintId = 456;

  try {
    // Submit review
    const response = await axios.post(
      `${BASE_URL}/complaints/${complaintId}/review`,
      {
        rating: 5,
        comment: 'Excellent service!'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Review submitted:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReviewSubmission();
```

### Test Get Reviews

```javascript
// test-get-reviews.js
const axios = require('axios');

async function testGetReviews() {
  const BASE_URL = 'http://localhost:4000/api';
  const complaintId = 456;

  try {
    const response = await axios.get(
      `${BASE_URL}/complaints/${complaintId}/reviews`
    );

    console.log('✅ Reviews fetched:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testGetReviews();
```

### Test Review Analytics

```javascript
// test-review-analytics.js
const axios = require('axios');

async function testReviewAnalytics() {
  const BASE_URL = 'http://localhost:4000/api';
  const adminToken = 'YOUR_ADMIN_TOKEN';

  try {
    // Get all analytics
    const response = await axios.get(
      `${BASE_URL}/admin/complaints/analytics/reviews`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    console.log('✅ Analytics fetched:', response.data);

    // Get filtered analytics
    const filteredResponse = await axios.get(
      `${BASE_URL}/admin/complaints/analytics/reviews?cityCorporationCode=DSCC&startDate=2024-01-01`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    console.log('✅ Filtered analytics:', filteredResponse.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReviewAnalytics();
```

---

## Integration with Frontend

### React Example - Submit Review

```typescript
import axios from 'axios';

interface ReviewSubmission {
  rating: number;
  comment?: string;
}

async function submitReview(
  complaintId: number,
  review: ReviewSubmission,
  token: string
) {
  try {
    const response = await axios.post(
      `/api/complaints/${complaintId}/review`,
      review,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}
```

### React Example - Get Reviews

```typescript
async function getComplaintReviews(complaintId: number) {
  try {
    const response = await axios.get(
      `/api/complaints/${complaintId}/reviews`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
}
```

### React Example - Get Analytics (Admin)

```typescript
interface AnalyticsFilters {
  cityCorporationCode?: string;
  zoneId?: number;
  wardId?: number;
  startDate?: string;
  endDate?: string;
}

async function getReviewAnalytics(
  filters: AnalyticsFilters,
  adminToken: string
) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get(
      `/api/admin/complaints/analytics/reviews?${params}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
}
```

---

## Security Considerations

1. **Authentication**: All write operations require authentication
2. **Authorization**: Users can only review their own complaints
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Rate Limiting**: Prevents abuse through IP and user-based limits
5. **SQL Injection**: Protected through Prisma ORM parameterized queries
6. **XSS Prevention**: Comment text is sanitized before storage

---

## Performance Considerations

1. **Database Indexes**: Reviews table has indexes on:
   - `complaintId` - Fast lookup of reviews by complaint
   - `userId` - Fast lookup of reviews by user
   - `rating` - Fast filtering by rating
   - `createdAt` - Fast sorting by date
   - Unique composite index on `(complaintId, userId)` - Prevents duplicates

2. **Pagination**: Review lists should be paginated for large datasets

3. **Caching**: Consider caching analytics results for 5 minutes

4. **Query Optimization**: Analytics queries use efficient aggregations

---

## Changelog

### Version 1.0 (December 20, 2024)
- Initial release
- Submit review endpoint
- Get complaint reviews endpoint
- Get review analytics endpoint (admin)
- Comprehensive validation and error handling
- Full documentation

---

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
