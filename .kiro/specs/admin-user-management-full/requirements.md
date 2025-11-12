# Requirements Document

## Introduction

This document outlines the requirements for implementing a fully functional Admin User Management system for the Clean Care application. The feature will enable administrators to view, manage, and monitor all registered users (citizens) who sign up through the Flutter mobile app. The system will maintain the existing UI/UX design while connecting it to a dynamic backend with full database integration.

## Glossary

- **Admin Panel**: The React-based web application used by administrators to manage the Clean Care system
- **User Management System**: The complete system for managing citizen accounts including frontend UI, backend APIs, and database operations
- **Citizen**: A user who registers through the Flutter mobile app to submit complaints and access services
- **User Record**: A complete set of user information stored in the database including profile, activity, and statistics
- **Backend API**: The Node.js/Express server that handles user management operations
- **Database**: The MySQL database managed through Prisma ORM that stores all user data
- **User Statistics**: Aggregated data about user activity including complaint counts and resolution rates
- **Search Filter**: A mechanism to find users based on name, email, phone, ward, or zone
- **Status Filter**: A mechanism to filter users by their account status (Active, Inactive, Suspended, Pending)
- **User Details Modal**: A popup interface displaying comprehensive information about a selected user
- **Edit User Form**: An interface for modifying user information and account settings

## Requirements

### Requirement 1: Display All Registered Users

**User Story:** As an administrator, I want to view a list of all citizens who have registered through the mobile app, so that I can monitor user accounts and their activity.

#### Acceptance Criteria

1. WHEN the Admin Panel loads the User Management page, THE User Management System SHALL fetch all user records from the Database
2. WHEN user records are retrieved, THE User Management System SHALL display each user with their name, ID, email, phone, ward, zone, join date, and complaint statistics
3. WHEN the user list is displayed, THE User Management System SHALL show the total count of citizens in the statistics cards
4. WHEN a user has no avatar, THE User Management System SHALL display initials based on their first and last name
5. WHEN the page loads, THE User Management System SHALL calculate and display aggregate statistics including total citizens, total complaints, resolved complaints, and success rate

### Requirement 2: Search and Filter Users

**User Story:** As an administrator, I want to search and filter users by various criteria, so that I can quickly find specific users or groups of users.

#### Acceptance Criteria

1. WHEN an administrator types in the search field, THE User Management System SHALL filter users whose name, email, phone, ward, or zone contains the search term
2. WHEN the search term is cleared, THE User Management System SHALL display all users again
3. WHEN an administrator selects a status filter, THE User Management System SHALL display only users matching that status
4. WHEN multiple filters are applied, THE User Management System SHALL apply all filters simultaneously
5. WHEN no users match the search criteria, THE User Management System SHALL display a message indicating no results found

### Requirement 3: View User Details

**User Story:** As an administrator, I want to view detailed information about a specific user, so that I can understand their account status and activity history.

#### Acceptance Criteria

1. WHEN an administrator clicks the "View" button for a user, THE User Management System SHALL open a modal displaying complete user details
2. WHEN the user details modal opens, THE User Management System SHALL display personal information including full name, email, phone, avatar, and join date
3. WHEN the user details modal opens, THE User Management System SHALL display account information including status, role, email verification status, and phone verification status
4. WHEN the user details modal opens, THE User Management System SHALL display activity statistics including total complaints, resolved complaints, unresolved complaints, and last login date
5. WHEN the user details modal opens, THE User Management System SHALL fetch and display the user's recent complaints with their status

### Requirement 4: Edit User Information

**User Story:** As an administrator, I want to edit user information and account settings, so that I can update user details or modify account status when needed.

#### Acceptance Criteria

1. WHEN an administrator clicks the "Edit" button for a user, THE User Management System SHALL open an edit form with the current user information pre-filled
2. WHEN the edit form is displayed, THE User Management System SHALL allow modification of first name, last name, email, phone, ward, zone, status, and role
3. WHEN an administrator submits the edit form with valid data, THE Backend API SHALL update the user record in the Database
4. WHEN the user record is successfully updated, THE User Management System SHALL refresh the user list to reflect the changes
5. WHEN the edit form contains invalid data, THE User Management System SHALL display validation errors and prevent submission

### Requirement 5: Manage User Account Status

**User Story:** As an administrator, I want to change user account status, so that I can activate, suspend, or deactivate user accounts as needed.

#### Acceptance Criteria

1. WHEN an administrator changes a user's status to "Suspended", THE Backend API SHALL update the user status in the Database and prevent the user from logging in
2. WHEN an administrator changes a user's status to "Active", THE Backend API SHALL update the user status in the Database and allow the user to access the mobile app
3. WHEN an administrator changes a user's status to "Inactive", THE Backend API SHALL update the user status in the Database and mark the account as inactive
4. WHEN a user's status is changed, THE User Management System SHALL update the displayed status immediately
5. WHEN a status change fails, THE User Management System SHALL display an error message and revert to the previous status

### Requirement 6: Display Real-Time User Statistics

**User Story:** As an administrator, I want to see real-time statistics about users and their complaints, so that I can monitor overall system usage and user engagement.

#### Acceptance Criteria

1. WHEN the User Management page loads, THE User Management System SHALL calculate the total number of registered citizens from the Database
2. WHEN the User Management page loads, THE User Management System SHALL calculate the total number of complaints submitted by all users
3. WHEN the User Management page loads, THE User Management System SHALL calculate the total number of resolved complaints
4. WHEN the User Management page loads, THE User Management System SHALL calculate the success rate as a percentage of resolved complaints to total complaints
5. WHEN user data changes, THE User Management System SHALL update the statistics cards to reflect current values

### Requirement 7: Backend API for User Management

**User Story:** As a system, I need robust backend APIs for user management operations, so that the Admin Panel can perform all necessary user management functions securely.

#### Acceptance Criteria

1. THE Backend API SHALL provide an endpoint to retrieve all users with pagination support
2. THE Backend API SHALL provide an endpoint to retrieve a single user by ID with complete details and related data
3. THE Backend API SHALL provide an endpoint to update user information with validation
4. THE Backend API SHALL provide an endpoint to update user status
5. THE Backend API SHALL require admin authentication for all user management endpoints
6. THE Backend API SHALL validate all input data before processing requests
7. THE Backend API SHALL return appropriate error messages for invalid requests

### Requirement 8: Database Integration

**User Story:** As a system, I need proper database queries and relationships, so that user data is stored, retrieved, and updated efficiently and accurately.

#### Acceptance Criteria

1. THE Database SHALL store all user information in the users table with proper data types and constraints
2. WHEN retrieving users, THE Database SHALL include related complaint counts through aggregation queries
3. WHEN updating user information, THE Database SHALL maintain data integrity and enforce constraints
4. WHEN querying users, THE Database SHALL support filtering by status, role, and search terms
5. THE Database SHALL maintain indexes on frequently queried fields for optimal performance

### Requirement 9: Add New User Functionality

**User Story:** As an administrator, I want to manually add new users to the system, so that I can create accounts for citizens who cannot register through the mobile app.

#### Acceptance Criteria

1. WHEN an administrator clicks the "Add New User" button, THE User Management System SHALL open a form to create a new user account
2. WHEN the add user form is displayed, THE User Management System SHALL require first name, last name, phone, and password fields
3. WHEN an administrator submits the add user form with valid data, THE Backend API SHALL create a new user record in the Database
4. WHEN a new user is successfully created, THE User Management System SHALL add the user to the list and display a success message
5. WHEN the add user form contains duplicate phone or email, THE User Management System SHALL display an error message and prevent creation

### Requirement 10: User Activity Tracking

**User Story:** As an administrator, I want to see user activity information, so that I can identify active and inactive users.

#### Acceptance Criteria

1. WHEN displaying user information, THE User Management System SHALL show the last login date for each user
2. WHEN a user has never logged in, THE User Management System SHALL display "Never logged in" instead of a date
3. WHEN viewing user details, THE User Management System SHALL display a timeline of recent user activities
4. WHEN calculating statistics, THE User Management System SHALL include activity metrics such as average complaints per user
5. WHEN filtering users, THE User Management System SHALL support filtering by activity status (active in last 30 days, inactive, etc.)
