# Requirements Document

## Introduction

This document outlines the requirements for implementing a fully functional complaint management system in the Clean Care Flutter mobile app. Users need to be able to create complaints, view their own complaint history, and see real-time status updates from the database.

## Glossary

- **Mobile App**: The Flutter-based mobile application used by citizens to report complaints
- **Complaint**: A report submitted by a citizen about waste management or city service issues
- **Complaint List Page**: The page that displays all complaints submitted by the logged-in user
- **Backend API**: The Node.js/Express server with Prisma ORM that stores and manages complaint data
- **Real-time Data**: Current data fetched from the MySQL database through the backend API
- **Complaint Status**: The current state of a complaint (Pending, In Progress, Solved)
- **Complaint Form**: The interface where users enter complaint details and submit them

## Requirements

### Requirement 1: User Complaint Submission

**User Story:** As a citizen, I want to submit complaints about waste management issues, so that the city administration can address them

#### Acceptance Criteria

1. WHEN a user fills out the complaint form with description, address, district, thana, ward, and city corporation, THE Mobile App SHALL validate all required fields before submission
2. WHEN a user submits a valid complaint, THE Mobile App SHALL send the complaint data to the backend API with the user's authentication token
3. WHEN the backend successfully creates the complaint, THE Mobile App SHALL display a success message and navigate to the complaint list page
4. WHEN the complaint submission fails, THE Mobile App SHALL display an error message with details about what went wrong
5. THE Mobile App SHALL allow users to attach both images and audio recordings to their complaints during submission

### Requirement 2: User Complaint List Display

**User Story:** As a citizen, I want to view all my submitted complaints, so that I can track their status and history

#### Acceptance Criteria

1. WHEN a user navigates to the complaint list page, THE Mobile App SHALL fetch all complaints created by that user from the backend API
2. THE Mobile App SHALL display each complaint with complaint ID, type, location, status, and submission date
3. WHEN the complaint list is loading, THE Mobile App SHALL display a loading indicator
4. WHEN no complaints exist for the user, THE Mobile App SHALL display a message indicating no complaints have been submitted
5. WHEN the API request fails, THE Mobile App SHALL display an error message with a retry button

### Requirement 3: Complaint Status Visualization

**User Story:** As a citizen, I want to see the current status of my complaints, so that I know if they are being addressed

#### Acceptance Criteria

1. THE Mobile App SHALL display complaint status using color-coded badges (yellow for Pending, blue for In Progress, green for Solved)
2. WHEN a complaint status changes in the database, THE Mobile App SHALL show the updated status when the user refreshes the complaint list
3. THE Mobile App SHALL display the time elapsed since complaint submission (e.g., "2 hours ago", "1 day ago")
4. THE Mobile App SHALL sort complaints with most recent submissions appearing first
5. THE Mobile App SHALL provide a pull-to-refresh gesture to manually update the complaint list

### Requirement 4: Complaint Details View

**User Story:** As a citizen, I want to view detailed information about my complaints, so that I can review what I submitted

#### Acceptance Criteria

1. WHEN a user taps on a complaint in the list, THE Mobile App SHALL navigate to a complaint details page
2. THE complaint details page SHALL display all information including description, full address, district, thana, ward, city corporation, status, and submission timestamp
3. IF the complaint has attached images, THEN THE details page SHALL display the images
4. IF the complaint has attached audio, THEN THE details page SHALL display an audio player with play/pause controls
5. THE details page SHALL display any admin responses or updates to the complaint
6. THE Mobile App SHALL provide a back button to return to the complaint list

### Requirement 5: Backend Complaint API

**User Story:** As a developer, I want complete backend API endpoints for complaint operations, so that the mobile app can create and retrieve complaints

#### Acceptance Criteria

1. THE Backend API SHALL provide an endpoint to create a new complaint with user authentication validation
2. THE Backend API SHALL provide an endpoint to fetch all complaints for the authenticated user
3. THE Backend API SHALL provide an endpoint to fetch a single complaint by ID with ownership validation
4. THE Backend API SHALL store complaint data in the MySQL database using Prisma ORM
5. THE Backend API SHALL return complaint data with proper JSON formatting and HTTP status codes

### Requirement 6: Complaint Data Model

**User Story:** As a developer, I want a proper database schema for complaints, so that all complaint information is stored correctly

#### Acceptance Criteria

1. THE database SHALL have a Complaint table with fields for id, userId, description, complaintType, district, thana, ward, cityCorporation, fullAddress, status, imageUrl, audioUrl, createdAt, and updatedAt
2. THE Complaint table SHALL have a foreign key relationship to the User table
3. THE status field SHALL be an enum with values PENDING, IN_PROGRESS, and SOLVED
4. THE Backend API SHALL automatically set createdAt and updatedAt timestamps
5. THE Backend API SHALL validate that complaint data matches the schema before saving

### Requirement 7: Image and Audio Upload for Complaints

**User Story:** As a citizen, I want to attach photos and audio recordings to my complaints, so that I can provide visual and audio evidence of the issue

#### Acceptance Criteria

1. WHEN a user selects an image from their device, THE Mobile App SHALL display a preview of the selected image
2. WHEN a user records or selects an audio file, THE Mobile App SHALL display the audio file name and duration
3. WHEN a user submits a complaint with media files, THE Mobile App SHALL upload both images and audio to the backend server
4. THE Backend API SHALL store uploaded images and audio files in designated uploads folders
5. THE Backend API SHALL save both image URL and audio URL in the complaint record
6. THE Mobile App SHALL display complaint images in both the list view (thumbnail) and details view (full size)
7. THE Mobile App SHALL provide an audio player in the details view to play attached audio recordings

### Requirement 8: Complaint Form Validation

**User Story:** As a citizen, I want clear feedback when filling out the complaint form, so that I can submit valid complaints

#### Acceptance Criteria

1. WHEN a user leaves a required field empty, THE Mobile App SHALL display an error message below that field
2. THE Mobile App SHALL validate that the description has at least 10 characters
3. THE Mobile App SHALL validate that the ward number is a valid integer
4. THE Mobile App SHALL ensure district, thana, and city corporation are selected from dropdowns
5. THE Mobile App SHALL disable the submit button until all validations pass

### Requirement 9: Real-time Complaint Updates

**User Story:** As a citizen, I want to see updates to my complaints immediately, so that I stay informed about progress

#### Acceptance Criteria

1. WHEN the complaint list page is opened, THE Mobile App SHALL fetch the latest complaint data from the backend
2. WHEN a user pulls down to refresh, THE Mobile App SHALL reload all complaints from the backend
3. THE Mobile App SHALL display a loading indicator during data refresh
4. WHEN new data is loaded, THE Mobile App SHALL update the UI smoothly without flickering
5. THE Mobile App SHALL cache complaint data locally to display while loading fresh data

### Requirement 10: Error Handling and User Feedback

**User Story:** As a citizen, I want clear error messages when something goes wrong, so that I know what to do next

#### Acceptance Criteria

1. WHEN a network error occurs, THE Mobile App SHALL display a user-friendly error message
2. WHEN the backend returns an error, THE Mobile App SHALL display the error message from the backend
3. THE Mobile App SHALL provide a retry button for failed operations
4. WHEN a complaint is successfully submitted, THE Mobile App SHALL display a success message with the complaint ID
5. THE Mobile App SHALL log errors to help with debugging while showing user-friendly messages to users
