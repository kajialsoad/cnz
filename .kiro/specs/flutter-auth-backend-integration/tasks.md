# Implementation Plan

- [x] 1. Update API Client for backend compatibility


  - Enhance error handling to parse backend response format (success, message, data fields)
  - Add timeout configuration for HTTP requests
  - Implement proper exception types for different error scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_



- [x] 2. Update Auth Repository to align with backend API

  - [x] 2.1 Modify register method to split name into firstName and lastName

    - Parse full name from form into firstName and lastName
    - Format request body to match backend schema (firstName, lastName, phone, email, password)
    - Update response parsing to extract tokens from data.accessToken and data.refreshToken
    - _Requirements: 1.1, 1.2, 1.3, 5.1_
  

  - [ ] 2.2 Update login method to support phone or email
    - Detect if input is email or phone number using regex
    - Send appropriate field (email or phone) to backend
    - Handle backend response format with success and data fields
    - _Requirements: 2.1, 2.2, 5.2, 5.4_

  
  - [ ] 2.3 Implement proper error handling for all auth methods
    - Parse error messages from backend response
    - Throw descriptive exceptions based on status codes
    - Handle validation errors from backend
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Update Login Page to connect with real backend


  - [x] 3.1 Remove demo mode and connect to actual backend


    - Remove hardcoded demo credentials check
    - Call auth repository login method with form data
    - Handle loading state during API call
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 3.2 Enhance error display based on backend responses

    - Show specific error messages from backend
    - Display network error messages for connectivity issues
    - Improve SnackBar messages for better UX
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update Signup Page to connect with real backend


  - [x] 4.1 Remove demo mode and connect to actual backend


    - Remove demo registration simulation
    - Call auth repository register method with form data
    - Handle loading state during API call
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  
  - [ ] 4.2 Implement backend error handling
    - Display validation errors from backend
    - Handle duplicate email/phone errors

    - Show user-friendly error messages
    - _Requirements: 1.4, 3.1, 3.2_

- [ ] 5. Add environment configuration for backend URL
  - Create config file or use environment variables for base URL

  - Support different URLs for development and production
  - Ensure proper URL for web, Android emulator, and iOS simulator
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Implement token persistence and validation

  - Verify tokens are properly stored in SharedPreferences
  - Add token validation on app startup
  - Implement auto-login if valid tokens exist
  - _Requirements: 4.1, 4.2, 4.4, 4.5_


- [ ] 7. Add refresh token functionality
  - Implement token refresh when access token expires
  - Handle refresh token errors and force re-login
  - Update API client to automatically refresh on 401 errors
  - _Requirements: 4.3_



- [ ] 8. Add comprehensive error logging
  - Log all API errors with details for debugging
  - Add error tracking for network failures
  - Implement debug mode for verbose logging
  - _Requirements: 3.5_

- [ ] 9. Create integration tests for auth flows
  - Write tests for registration flow
  - Write tests for login flow
  - Write tests for token refresh flow
  - Write tests for logout flow
  - _Requirements: All requirements_
