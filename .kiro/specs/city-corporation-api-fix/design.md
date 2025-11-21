# Design Document

## Overview

This design addresses the API response format inconsistencies in the City Corporation endpoints that are causing failures in both the mobile app and admin panel. The solution involves standardizing the response formats to match what the frontend applications expect, ensuring backward compatibility where possible.

## Architecture

The fix involves modifying the controller layer to return consistent response formats:

1. **Public City Corporation Routes** (`/api/city-corporations/*`): Return responses with descriptive field names matching the data type
2. **Admin City Corporation Routes** (`/api/admin/city-corporations/*`): Return responses with data wrapped in a `data` field
3. **Error Handling**: Standardize error responses across all endpoints

## Components and Interfaces

### Public City Corporation Controller

**Endpoint**: `GET /api/city-corporations/active`

**Current Response**:
```json
{
  "success": true,
  "data": [...]
}
```

**Expected Response**:
```json
{
  "success": true,
  "cityCorporations": [...]
}
```

**Endpoint**: `GET /api/city-corporations/:code/thanas`

**Current Response**:
```json
{
  "success": true,
  "data": [...]
}
```

**Expected Response**:
```json
{
  "success": true,
  "thanas": [...]
}
```

### Admin City Corporation Controller

**Endpoint**: `GET /api/admin/city-corporations`

**Current Response**:
```json
{
  "success": true,
  "data": [...]
}
```

**Expected Response** (no change needed):
```json
{
  "success": true,
  "data": [...]
}
```

**Endpoint**: `GET /api/admin/city-corporations/:code`

**Current Response**:
```json
{
  "success": true,
  "data": {...}
}
```

**Expected Response** (no change needed):
```json
{
  "success": true,
  "data": {...}
}
```

## Data Models

No changes to data models are required. The issue is purely in the response formatting at the controller level.

### CityCorporation Model
```typescript
{
  id: number;
  code: string;
  name: string;
  minWard: number;
  maxWard: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### Thana Model
```typescript
{
  id: number;
  name: string;
  cityCorporationCode: string;
  status: 'ACTIVE' | 'INACTIVE';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Public endpoint response field naming
*For any* successful request to public city corporation endpoints, the response should contain a field name that describes the data type (e.g., `cityCorporations` for arrays of city corporations, `thanas` for arrays of thanas)
**Validates: Requirements 1.1, 1.2, 3.3**

### Property 2: Admin endpoint response wrapping
*For any* successful request to admin city corporation endpoints, the response should contain a `data` field that wraps the actual response data
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.4**

### Property 3: Success field presence
*For any* API response (success or error), the response should contain a `success` field set to `true` for successful requests and `false` for errors
**Validates: Requirements 1.3, 1.4, 3.1, 3.2**

### Property 4: Error response format
*For any* error response, the response should contain both `success: false` and a `message` field describing the error
**Validates: Requirements 1.4, 3.2, 4.2, 4.3, 4.4**

### Property 5: Array field naming consistency
*For any* API response containing an array, the field name should be plural (e.g., `cityCorporations` not `cityCorporation`)
**Validates: Requirements 3.5**

## Error Handling

### Error Response Format
All endpoints will return errors in this format:
```json
{
  "success": false,
  "message": "User-friendly error message"
}
```

### HTTP Status Codes
- `200`: Successful request
- `201`: Resource created successfully
- `400`: Validation error or bad request
- `404`: Resource not found
- `500`: Internal server error

### Error Logging
All errors will be logged to the console with:
- Error message
- Stack trace (for debugging)
- Request context (endpoint, method)

## Testing Strategy

### Unit Tests
- Test each controller method to verify correct response format
- Test error scenarios return proper error format
- Test that service layer data is correctly transformed into response format

### Integration Tests
- Test mobile app can successfully fetch city corporations from public endpoint
- Test admin panel can successfully fetch city corporations from admin endpoint
- Test error responses are handled correctly by frontend applications

### Manual Testing
1. Start the backend server
2. Test mobile app signup page loads city corporations
3. Test admin panel city corporation management page loads data
4. Test error scenarios display appropriate messages

## Implementation Notes

### Changes Required

1. **Public City Corporation Routes** (`server/src/routes/public-city-corporation.routes.ts`):
   - Change `data` to `cityCorporations` for `/active` endpoint
   - Change `data` to `thanas` for `/:code/thanas` endpoint

2. **No Changes Required** for Admin Routes:
   - Admin routes already return data in the expected format

3. **Error Handling**:
   - Ensure all error responses include `success: false` and `message` fields
   - Maintain consistent HTTP status codes

### Backward Compatibility

Since the public endpoints are changing field names, this is a breaking change for any clients using the old format. However, since the mobile app is the primary consumer and it expects the new format, this change fixes the current broken state.

### Testing Approach

1. Fix the public endpoint response formats
2. Test with mobile app signup page
3. Verify admin panel still works (no changes needed)
4. Add unit tests to prevent regression
