# Access Token Usage Guide

## Test Results

✅ **Login Test Completed Successfully**

### Test User Credentials

**Option 1: Login with Phone**
```json
{
  "phone": "01712345678",
  "password": "Demo123!@#"
}
```

**Option 2: Login with Email**
```json
{
  "email": "customer1@demo.com",
  "password": "Demo123!@#"
}
```

### User Information

- **User ID**: 1
- **Name**: Rahim Ahmed
- **Email**: customer1@demo.com
- **Phone**: 01712345678
- **Role**: CUSTOMER
- **Status**: ACTIVE

## Access Token

The access token has been saved to `server/test-token.json` and is valid for **7 days** (604800 seconds).

### Current Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJDVVNUT01FUiIsImVtYWlsIjoiY3VzdG9tZXIxQGRlbW8uY29tIiwicGhvbmUiOiIwMTcxMjM0NTY3OCIsImlhdCI6MTc2MzE4NDg2NiwiZXhwIjoxNzYzNzg5NjY2LCJhdWQiOiJjbGVhbi1jYXJlLXVzZXJzIiwiaXNzIjoiY2xlYW4tY2FyZS1hcHAifQ.pWNFvpzrSH3osg8UVsbS-aQTljwaOKYN2b-TWhUd298
```

## How to Use the Token

### 1. In HTTP Requests (Node.js)

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/complaints',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};

const req = http.request(options, (res) => {
  // Handle response
});
```

### 2. In cURL

```bash
curl -X GET http://localhost:4000/api/complaints \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. In Postman

1. Open Postman
2. Create a new request
3. Go to the "Authorization" tab
4. Select "Bearer Token" from the Type dropdown
5. Paste the access token in the Token field

### 4. In Flutter App

The token is automatically managed by the `ApiClient` class:

```dart
// Login stores the token
await authRepository.login(phone: '01712345678', password: 'Demo123!@#');

// All subsequent API calls automatically include the token
final complaints = await complaintRepository.getMyComplaints();
```

## Testing Authenticated Endpoints

### Get User Profile

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get My Complaints

```bash
curl -X GET http://localhost:4000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Complaint

```bash
curl -X POST http://localhost:4000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test complaint",
    "complaintType": "Household Waste",
    "district": "Dhaka",
    "thana": "Uttara",
    "ward": "300",
    "cityCorporation": "DNCC",
    "fullAddress": "House 123, Road 45, Uttara"
  }'
```

## Token Refresh

If the access token expires, use the refresh token to get a new one:

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

## Running the Test Script

To test login and get a fresh token:

```bash
cd server
node test-login-token.js
```

This will:
- Test login with both phone and email
- Retrieve access and refresh tokens
- Test an authenticated endpoint
- Save the token to `test-token.json`

## Token Expiration

- **Access Token**: Expires in 7 days (604800 seconds)
- **Refresh Token**: Expires in 30 days (2592000 seconds)

When the access token expires, use the refresh token to get a new access token without requiring the user to log in again.

## Security Notes

⚠️ **Important**: These are test credentials for development only. Never commit real tokens or credentials to version control.

- Tokens are stored in `test-token.json` (should be in .gitignore)
- Use environment variables for production credentials
- Rotate tokens regularly in production
- Use HTTPS in production to protect tokens in transit
