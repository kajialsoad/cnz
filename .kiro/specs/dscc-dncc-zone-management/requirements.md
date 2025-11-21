# Requirements Document: DSCC/DNCC Zone-Based User Management & Chat Filtering

## Introduction

This feature enhances the Clean Care Bangladesh system to properly partition users and complaints by City Corporation (DSCC/DNCC), implement zone-based filtering in admin panels, and add thana/area-based filtering for the chat system. This ensures admins can efficiently manage users and complaints specific to their jurisdiction.

## Glossary

- **DSCC**: Dhaka South City Corporation - manages wards 1-75 in southern Dhaka
- **DNCC**: Dhaka North City Corporation - manages wards 1-54 in northern Dhaka
- **Ward**: Administrative division within a city corporation (numbered 1-75 for DSCC, 1-54 for DNCC)
- **Zone**: City corporation identifier (DSCC or DNCC)
- **Thana**: Police station area/administrative subdivision within Dhaka
- **Admin Panel**: Web-based interface for administrators to manage users and complaints
- **Chat System**: Real-time messaging system between citizens and administrators
- **User Management System**: Admin interface for viewing and managing citizen accounts
- **Complaint Management System**: Admin interface for viewing and managing citizen complaints

## Requirements

### Requirement 1: Enhanced User Signup with Dynamic City Corporation

**User Story:** As a citizen, I want to register with my correct city corporation and ward number, so that my complaints are routed to the appropriate authority.

#### Acceptance Criteria

1. WHEN a user accesses the signup page, THE System SHALL dynamically load all active city corporations from the database
2. WHEN a user selects a city corporation, THE System SHALL display ward options based on that city corporation's configured ward range
3. WHEN a user selects a city corporation, THE System SHALL display thana options belonging to that city corporation
4. WHEN a user submits the signup form, THE System SHALL validate that the ward number is within the valid range for the selected city corporation
5. WHEN a user submits the signup form with invalid ward-city corporation combination, THE System SHALL display an error message and prevent registration
6. THE System SHALL store the city corporation code, ward number, and thana in the user profile

### Requirement 2: Admin User Management with Dynamic City Corporation Filtering

**User Story:** As an admin, I want to filter users by city corporation and ward, so that I can manage citizens within my jurisdiction.

#### Acceptance Criteria

1. WHEN an admin views the user management page, THE System SHALL display a city corporation filter dropdown with all active city corporations plus "All" option
2. WHEN an admin selects a city corporation filter, THE System SHALL display only users belonging to that city corporation
3. WHEN an admin selects a city corporation filter, THE System SHALL display a ward filter dropdown with valid wards for that city corporation's range
4. WHEN an admin selects a ward filter, THE System SHALL display only users from that specific ward
5. WHEN an admin clears the filters, THE System SHALL display all users regardless of city corporation or ward
6. THE System SHALL display the city corporation name and ward information prominently in the user list table
7. THE System SHALL update the user statistics cards to reflect only the filtered users

### Requirement 3: Complaint Submission with User Zone Tracking

**User Story:** As a system, I want to automatically associate complaints with the user's registered zone and ward, so that complaints are properly routed to the correct city corporation.

#### Acceptance Criteria

1. WHEN a user submits a complaint, THE System SHALL automatically retrieve the user's zone (DSCC/DNCC) from their profile
2. WHEN a user submits a complaint, THE System SHALL automatically retrieve the user's ward number from their profile
3. WHEN a user submits a complaint, THE System SHALL store the user's zone and ward with the complaint record
4. THE System SHALL include the user's zone and ward in the complaint response data
5. THE System SHALL validate that the user has a valid zone and ward before allowing complaint submission

### Requirement 4: Admin Complaint Management with Dynamic City Corporation Filtering

**User Story:** As an admin, I want to filter complaints by city corporation and ward, so that I can focus on issues within my area of responsibility.

#### Acceptance Criteria

1. WHEN an admin views the complaints page, THE System SHALL display a city corporation filter dropdown with all active city corporations plus "All" option
2. WHEN an admin selects a city corporation filter, THE System SHALL display only complaints from users in that city corporation
3. WHEN an admin selects a city corporation filter, THE System SHALL display a ward filter dropdown with valid wards for that city corporation's range
4. WHEN an admin selects a ward filter, THE System SHALL display only complaints from users in that specific ward
5. THE System SHALL display the complainant's city corporation name and ward information in the complaint details
6. THE System SHALL update the complaint statistics to reflect only the filtered complaints

### Requirement 5: Chat System with Dynamic Thana/Area Filtering

**User Story:** As an admin, I want to filter chat conversations by thana/area and city corporation, so that I can prioritize messages from specific locations.

#### Acceptance Criteria

1. WHEN an admin views the chat page, THE System SHALL display a city corporation filter dropdown with all active city corporations plus "All" option
2. WHEN an admin selects a city corporation, THE System SHALL dynamically load and display thanas belonging to that city corporation
3. WHEN an admin selects a thana filter, THE System SHALL display only chat conversations from users in that thana
4. THE System SHALL display the user's city corporation and thana information in the chat list
5. WHEN an admin clears the filters, THE System SHALL display all chat conversations
6. THE System SHALL update chat statistics to reflect only the filtered conversations

### Requirement 6: Database Schema Enhancement

**User Story:** As a system architect, I want the database to properly store city corporation and location information, so that filtering and reporting can be performed efficiently.

#### Acceptance Criteria

1. THE System SHALL create a CityCorpora tion table with fields: id, name, code, minWard, maxWard, status, createdAt, updatedAt
2. THE System SHALL create a Thana table with fields: id, name, cityCorpora tionId, status, createdAt, updatedAt
3. THE System SHALL add a cityCorpora tionCode field to the User table as a foreign key reference
4. THE System SHALL add a thanaId field to the User table as a foreign key reference
5. THE System SHALL create database indexes on cityCorpora tionCode, ward, and thanaId fields in User table for query performance
6. THE System SHALL create a unique constraint on CityCorpora tion.code
7. THE System SHALL create a unique constraint on Thana (name, cityCorpora tionId) combination
8. THE System SHALL add cascading rules to preserve data integrity when city corporations or thanas are deactivated

### Requirement 7: Backend API Enhancement

**User Story:** As a frontend developer, I want backend APIs that support zone and ward filtering, so that I can build efficient admin interfaces.

#### Acceptance Criteria

1. WHEN the frontend requests users with zone filter, THE System SHALL return only users from that zone
2. WHEN the frontend requests users with ward filter, THE System SHALL return only users from that ward
3. WHEN the frontend requests complaints with zone filter, THE System SHALL return only complaints from users in that zone
4. WHEN the frontend requests chat conversations with zone and thana filters, THE System SHALL return only conversations from users matching those filters
5. THE System SHALL include zone, ward, and thana information in all user-related API responses
6. THE System SHALL validate filter parameters and return appropriate error messages for invalid combinations

### Requirement 8: Admin Dashboard Statistics by City Corporation

**User Story:** As an admin, I want to see statistics filtered by city corporation, so that I can understand the workload and performance in my jurisdiction.

#### Acceptance Criteria

1. WHEN an admin selects a city corporation filter, THE System SHALL update the total users statistic to show only users from that city corporation
2. WHEN an admin selects a city corporation filter, THE System SHALL update the total complaints statistic to show only complaints from that city corporation
3. WHEN an admin selects a city corporation filter, THE System SHALL update the resolved complaints statistic to show only resolved complaints from that city corporation
4. WHEN an admin selects a city corporation filter, THE System SHALL recalculate the success rate based on filtered data
5. THE System SHALL display the city corporation filter selection prominently on the dashboard
6. THE System SHALL provide a comparison view showing statistics across all city corporations

### Requirement 9: Mobile App Dynamic Address Selection

**User Story:** As a citizen, I want to provide my thana/area during signup based on my selected city corporation, so that my location is accurately recorded for complaint routing.

#### Acceptance Criteria

1. WHEN a user selects a city corporation, THE System SHALL dynamically fetch and display thanas for that city corporation
2. WHEN a user selects a thana, THE System SHALL store the thana ID in the user profile
3. THE System SHALL display the thana selection before the road address field
4. THE System SHALL make thana selection optional but recommended
5. WHEN the thana list is empty for a city corporation, THE System SHALL display a message "No areas available for this city corporation"

### Requirement 10: Admin City Corporation Management System

**User Story:** As a super admin, I want to manage city corporations dynamically, so that the system can support new city corporations and administrative changes without code modifications.

#### Acceptance Criteria

1. WHEN a super admin accesses the City Corporation Management page, THE System SHALL display a list of all city corporations with their status (Active/Inactive)
2. WHEN a super admin creates a new city corporation, THE System SHALL require: name, code (e.g., DSCC, DNCC), minimum ward number, maximum ward number
3. WHEN a super admin creates a new city corporation, THE System SHALL validate that the code is unique
4. WHEN a super admin activates a city corporation, THE System SHALL immediately make it available in signup dropdowns
5. WHEN a super admin deactivates a city corporation, THE System SHALL hide it from new signups but preserve existing user data
6. THE System SHALL store city corporation data in a database table (CityCorpora tion)
7. THE System SHALL provide an API endpoint to fetch active city corporations
8. THE System SHALL display total users and complaints for each city corporation

### Requirement 11: Admin Thana/Area Management per City Corporation

**User Story:** As a super admin, I want to manage thanas/areas for each city corporation separately, so that each city corporation has its own area list.

#### Acceptance Criteria

1. WHEN a super admin selects a city corporation, THE System SHALL display all thanas/areas for that city corporation
2. WHEN a super admin adds a new thana, THE System SHALL require: thana name, city corporation, status (Active/Inactive)
3. WHEN a super admin adds a new thana, THE System SHALL validate the thana name is unique within that city corporation
4. WHEN a super admin activates a thana, THE System SHALL immediately make it available in signup and filter dropdowns for that city corporation
5. WHEN a super admin deactivates a thana, THE System SHALL hide it from new selections but preserve historical data
6. THE System SHALL store thana data in a database table (Thana) with foreign key to CityCorpora tion
7. THE System SHALL provide an API endpoint to fetch active thanas by city corporation code
8. THE System SHALL display total users for each thana

### Requirement 12: Dynamic Signup with City Corporation Selection

**User Story:** As a citizen, I want to select my city corporation during signup and see only relevant wards and thanas, so that my registration is accurate.

#### Acceptance Criteria

1. WHEN a user accesses the signup page, THE System SHALL fetch and display all active city corporations
2. WHEN a user selects a city corporation, THE System SHALL display ward options from that city corporation's minimum to maximum ward range
3. WHEN a user selects a city corporation, THE System SHALL display only thanas belonging to that city corporation
4. WHEN a user submits signup, THE System SHALL validate that the selected ward is within the city corporation's valid range
5. WHEN a user submits signup, THE System SHALL validate that the selected thana belongs to the selected city corporation
6. THE System SHALL store the city corporation code, ward, and thana in the user profile

### Requirement 13: City Corporation-Based User Division

**User Story:** As an admin, I want to see users divided by city corporation, so that I can manage citizens within specific jurisdictions.

#### Acceptance Criteria

1. WHEN an admin views the User Management page, THE System SHALL display a city corporation filter with all active city corporations
2. WHEN an admin selects a city corporation filter, THE System SHALL display only users from that city corporation
3. WHEN an admin selects a city corporation filter, THE System SHALL update statistics to show only data for that city corporation
4. THE System SHALL display the user's city corporation name prominently in the user list
5. THE System SHALL allow admins to filter by both city corporation and ward simultaneously

### Requirement 14: City Corporation-Based Complaint Routing

**User Story:** As a system, I want to route complaints to the correct city corporation based on the user's registration, so that complaints are handled by the appropriate authority.

#### Acceptance Criteria

1. WHEN a user submits a complaint, THE System SHALL automatically associate the complaint with the user's city corporation
2. WHEN an admin views complaints, THE System SHALL display the complainant's city corporation
3. WHEN an admin filters complaints by city corporation, THE System SHALL show only complaints from users in that city corporation
4. THE System SHALL include city corporation information in complaint analytics and reports
5. THE System SHALL validate that complaint handlers have access to complaints from their assigned city corporation
