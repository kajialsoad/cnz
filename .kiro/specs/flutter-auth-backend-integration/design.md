# Design Document

## Overview

This design document outlines the integration approach for connecting the existing Flutter authentication UI (login and signup pages) with the Node.js backend server. The frontend design remains unchanged - we will only modify the backend communication layer to properly connect with the server API endpoints.

## Architecture

### Current State
- Flutter app has complete UI for login and signup pages
- Node.js backend has authentication endpoints at `/auth/register` and `/auth/login`
- Basic API client and auth repository exist but need alignment with backend API

### Integration Points

```
┌─────────────────┐         HTTP/JSON          ┌──────────────────┐
│   Flutter App   │ ◄────────────────────────► │  Node Backend    │
│                 │                             │                 │
│  - LoginPage    │    POST /auth/register     │  - Auth Routes   │
│  - SignUpPage   │    POST /auth/login        │  - Auth Service  │
│  - AuthRepo     │    POST /auth/refresh      │  - Prisma DB     │
│  - ApiClient    │    POST /auth/logout       │                 │
└─────────────────┘                             └──────────────────┘
         │
         ▼
  SharedPreferences
  (Token Storage)
```

## Components and Interfaces

### 1. API Client Service (`lib/services/api_client.dart`)

**Current Implementation:**
- Basic HTTP client with token management
- Methods: `post()`, `get()`
- Token retrieval from SharedPreferences

**Required Changes:**
- Update response parsing to match backend format
- Add proper error handling for different status codes
- Implement timeout handling

**Interface:**
```dart
class ApiClient {
  final String baseUrl;
  
  Future<http.Response> post(String path, Map<String, dynamic> body);
  Future<http.Response> get(String path);
  Future<String?> _getAccessToken();
}
```

### 2. Auth Repository (`lib/repositories/auth_repository.dart`)

**Current Implementation:**
- Methods for register, login, logout, refresh, me
- Token storage in SharedPreferences
- Basic error handling

**Required Changes:**
- Align request body format with backend expectations
- Update response parsing to match backend response structure
- Handle backend-specific error messages
- Support both phone and email login (backend uses email)

**Interface:**
```dart
class AuthRepository {
  final ApiClient api;
  
  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    String? email,
    required String password,
  });
  
  Future<Map<String, dynamic>> login(String identifier, String password);
  Future<Map<String, dynamic>> me();
  Future<String> refresh();
  Future<void> logout();
}
```

### 3. Login Page (`lib/pages/login_page.dart`)

**Current Implementation:**
- Complete UI with phone and password fields
- Demo mode for testing (phone: 01700000000, password: 123456)
- Form validation
- Error display with SnackBar

**Required Changes:**
- Update to use real backend instead of demo mode
- Improve error message display based on backend responses
- Add loading state management

**No UI Changes Required**

### 4. Signup Page (`lib/pages/signup_page.dart`)

**Current Implementation:**
- Complete UI with name, phone, email, password fields
- NID upload functionality (demo mode)
- Terms & conditions checkbox
- Form validation

**Required Changes:**
- Connect to real backend registration endpoint
- Handle backend validation errors
- Map form fields to backend expected format

**No UI Changes Required**

## Data Models

### Backend Request Formats

**Registration Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "password": "string"
}
```

**Login Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Note:** Backend expects email for login, but Flutter UI collects phone. We need to handle this mismatch.

### Backend Response Formats

**Success Response:**
```json
{
  "success": true,
  "message": "string",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "string",
  "errors": []
}
```

### Flutter Data Mapping

Since the backend expects `firstName` and `lastName` but Flutter collects a single `name` field, we need to:
1. Split the name into firstName and lastName
2. Or modify backend to accept a single name field
3. Or add separate fields in Flutter UI

**Recommended Approach:** Split name in Flutter before sending to backend.

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Display field-specific errors from backend
   - Show in SnackBar with details

2. **Authentication Errors (401)**
   - Invalid credentials
   - Expired tokens
   - Display user-friendly message

3. **Server Errors (500)**
   - Display generic error message
   - Log details for debugging

4. **Network Errors**
   - Connection timeout
   - No internet connection
   - Display connectivity message

### Error Flow

```
API Request
    │
    ├─► Success (200/201)
    │   └─► Parse response
    │       └─► Store tokens
    │           └─► Navigate to home
    │
    ├─► Client Error (400/401)
    │   └─► Parse error message
    │       └─► Display to user
    │
    ├─► Server Error (500)
    │   └─► Display generic message
    │       └─► Log error
    │
    └─► Network Error
        └─► Display connectivity message
            └─► Retry option
```

## Testing Strategy

### Unit Tests
- Test API client request formatting
- Test auth repository token management
- Test response parsing logic
- Test error handling for different status codes

### Integration Tests
- Test full registration flow
- Test full login flow
- Test token refresh flow
- Test logout flow

### Manual Testing Checklist
1. Register new user with valid data
2. Register with duplicate email/phone (should fail)
3. Login with valid credentials
4. Login with invalid credentials (should fail)
5. Test with backend server offline (network error)
6. Test token persistence across app restarts
7. Test on Android emulator (10.0.2.2:4000)
8. Test on web (localhost:4000)

## Configuration

### Environment Setup

**Development:**
- Web: `http://localhost:4000`
- Android Emulator: `http://10.0.2.2:4000`
- iOS Simulator: `http://localhost:4000`

**Production:**
- Use environment variable or config file
- Example: `https://api.cleancare.com`

### Backend Server Requirements

1. Server must be running on port 4000
2. CORS must allow Flutter app origin
3. Endpoints must be available:
   - POST `/auth/register`
   - POST `/auth/login`
   - POST `/auth/refresh`
   - POST `/auth/logout`

## Implementation Notes

### Phone vs Email Login Issue

The Flutter UI collects phone numbers for login, but the backend expects email. Solutions:

**Option 1: Backend Modification (Recommended)**
- Modify backend login to accept phone OR email
- Update validation schema to support both

**Option 2: Flutter Modification**
- Change UI to collect email instead of phone
- Update placeholder text and labels

**Option 3: Dual Support**
- Allow users to login with either phone or email
- Detect input type and send appropriate field

**Selected Approach:** We'll implement Option 3 - detect if input is email or phone and send accordingly.

### Name Field Splitting

Flutter collects single "Full Name" field, backend expects firstName and lastName:

```dart
String fullName = _nameController.text.trim();
List<String> nameParts = fullName.split(' ');
String firstName = nameParts.first;
String lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
```

### Token Storage

Tokens will be stored in SharedPreferences:
- Key: `accessToken` - Value: JWT access token
- Key: `refreshToken` - Value: JWT refresh token

### Loading States

Add loading indicators during:
- Registration submission
- Login submission
- Token refresh
- Logout

Use Flutter's built-in loading indicators and disable form during processing.
