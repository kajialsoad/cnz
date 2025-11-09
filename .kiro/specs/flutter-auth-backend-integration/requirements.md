# Requirements Document

## Introduction

This document outlines the requirements for integrating the Flutter mobile application's authentication system (signup and login pages) with the existing Node.js backend server. The system will enable users to register new accounts and authenticate using their credentials, with proper error handling and token management.

## Glossary

- **Flutter App**: The mobile application frontend built with Flutter/Dart
- **Node Backend**: The Express.js/TypeScript backend server running on port 4000
- **Auth Repository**: The Dart class responsible for authentication API calls
- **API Client**: The HTTP client service in Flutter for making API requests
- **Access Token**: JWT token used for authenticating API requests
- **Refresh Token**: Long-lived JWT token used to obtain new access tokens
- **Registration**: The process of creating a new user account
- **Login**: The process of authenticating an existing user

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register an account with my name, phone, email, and password, so that I can access the Clean Care application.

#### Acceptance Criteria

1. WHEN the user submits the registration form with valid data, THE Flutter App SHALL send a POST request to the Node Backend at `/auth/register` endpoint
2. WHEN the Node Backend successfully creates the account, THE Flutter App SHALL receive access and refresh tokens in the response
3. WHEN the Node Backend returns tokens, THE Flutter App SHALL store the tokens in local storage using SharedPreferences
4. IF the registration fails due to duplicate phone or email, THEN THE Flutter App SHALL display an error message to the user
5. WHILE the registration request is processing, THE Flutter App SHALL display a loading indicator to the user

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my phone number and password, so that I can access my account and use the application.

#### Acceptance Criteria

1. WHEN the user submits the login form with valid credentials, THE Flutter App SHALL send a POST request to the Node Backend at `/auth/login` endpoint
2. WHEN the Node Backend validates the credentials successfully, THE Flutter App SHALL receive access and refresh tokens in the response
3. WHEN login is successful, THE Flutter App SHALL store the tokens and navigate to the home page
4. IF the credentials are invalid, THEN THE Flutter App SHALL display an error message indicating authentication failure
5. WHILE the login request is processing, THE Flutter App SHALL display a loading indicator to the user

### Requirement 3: API Response Handling

**User Story:** As a user, I want to see clear error messages when something goes wrong, so that I understand what action to take.

#### Acceptance Criteria

1. WHEN the Node Backend returns a 400 status code, THE Flutter App SHALL parse the error message from the response body
2. WHEN the Node Backend returns a 401 status code, THE Flutter App SHALL display "Invalid credentials" message
3. WHEN the Node Backend returns a 500 status code, THE Flutter App SHALL display "Server error, please try again later" message
4. IF the network request fails due to connectivity issues, THEN THE Flutter App SHALL display "Network error, check your connection" message
5. WHEN any error occurs, THE Flutter App SHALL log the error details for debugging purposes

### Requirement 4: Token Management

**User Story:** As a user, I want my session to persist across app restarts, so that I don't have to log in every time I open the app.

#### Acceptance Criteria

1. WHEN tokens are received from the Node Backend, THE Flutter App SHALL store both access and refresh tokens in SharedPreferences
2. WHEN making authenticated API requests, THE Flutter App SHALL include the access token in the Authorization header
3. IF the access token expires, THEN THE Flutter App SHALL use the refresh token to obtain a new access token
4. WHEN the user logs out, THE Flutter App SHALL remove all stored tokens from SharedPreferences
5. WHEN the app starts, THE Flutter App SHALL check for existing tokens and validate them before auto-login

### Requirement 5: Backend API Compatibility

**User Story:** As a developer, I want the Flutter app to correctly format requests according to the backend API specification, so that authentication works reliably.

#### Acceptance Criteria

1. WHEN sending registration requests, THE Flutter App SHALL include name, phone, email, and password fields in the request body
2. WHEN sending login requests, THE Flutter App SHALL include phone and password fields in the request body
3. THE Flutter App SHALL set Content-Type header to "application/json" for all authentication requests
4. WHEN the Node Backend expects email-based login, THE Flutter App SHALL support both phone and email login methods
5. THE Flutter App SHALL handle the response format from Node Backend with success, message, and data fields

### Requirement 6: Environment Configuration

**User Story:** As a developer, I want to easily configure the backend URL for different environments, so that I can test locally and deploy to production.

#### Acceptance Criteria

1. THE Flutter App SHALL use "http://localhost:4000" as the base URL when running on web platform
2. THE Flutter App SHALL use "http://10.0.2.2:4000" as the base URL when running on Android emulator
3. WHERE production environment is configured, THE Flutter App SHALL use the production backend URL
4. THE Flutter App SHALL allow configuration of the base URL through environment variables or config file
5. WHEN the backend URL is invalid or unreachable, THE Flutter App SHALL display a clear error message
