# Implementation Plan

## Overview
This implementation plan focuses on creating the Complaint List Page in the Flutter mobile app where users can view all their submitted complaints with real-time data from the backend database.

## Tasks

- [x] 1. Create Complaint List Page UI


  - Create a new page `complaint_list_page.dart` that displays all user complaints
  - Implement AppBar with title "My Complaints" and back button
  - Add pull-to-refresh functionality using RefreshIndicator
  - Display loading indicator while fetching complaints
  - Show empty state message when no complaints exist
  - Add error handling with retry button
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 1.1 Design complaint card widget

  - Create complaint card showing ID, title, location, status badge, and timestamp
  - Implement color-coded status badges (Pending: yellow, In Progress: blue, Resolved: green)
  - Add thumbnail image preview if complaint has images
  - Display "time ago" format for timestamps (e.g., "2 hours ago")
  - Make cards tappable to navigate to details page
  - _Requirements: 2.2, 3.1, 3.2, 3.3_


- [x] 1.2 Implement complaint list rendering

  - Use ListView.builder for efficient rendering of complaint list
  - Sort complaints by creation date (most recent first)
  - Handle empty list state with friendly message



  - Add spacing and padding for better visual hierarchy
  - _Requirements: 2.2, 3.4_

- [x] 2. Integrate with ComplaintProvider





  - Call `loadMyComplaints()` method when page loads
  - Listen to provider state changes for loading, error, and data updates
  - Implement pull-to-refresh to reload complaints

  - Handle loading states with CircularProgressIndicator
  - Display error messages from provider
  - _Requirements: 2.1, 2.5, 6.1, 6.2_



- [x] 2.1 Add navigation to complaint list




  - Add route for complaint list page in main.dart
  - Create navigation from home page or profile page to complaint list
  - Ensure proper navigation stack management
  - _Requirements: 2.1_


- [x] 3. Create Complaint Detail View Page





  - Create `complaint_detail_view_page.dart` for viewing single complaint
  - Display all complaint information (ID, title, description, location details)
  - Show full address with district, thana, ward, city corporation
  - Display status badge and timestamps (created, updated)
  - Add back button to return to list

  - _Requirements: 4.1, 4.2, 4.5_

- [x] 3.1 Implement image gallery in detail view

  - Display all complaint images in a swipeable carousel
  - Add tap-to-view-fullscreen functionality for images


  - Show image loading indicators
  - Handle image load errors with placeholder
  - _Requirements: 4.3, 7.1, 7.2, 7.4_

- [x] 3.2 Add audio player in detail view

  - Display audio player UI with play/pause button

  - Show audio progress bar and duration
  - Implement audio playback controls
  - Handle audio loading and playback errors
  - _Requirements: 4.4, 7.7_


- [x] 4. Update backend API integration





  - Verify `/api/complaints/my` endpoint returns correct data format
  - Ensure authentication token is sent with requests
  - Test pagination support (if needed for large complaint lists)
  - Verify complaint status enum matches between frontend and backend
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.1 Update Complaint model if needed

  - Ensure Complaint model matches backend response structure
  - Add helper methods for status color and display text
  - Implement "time ago" formatting method
  - Parse image and audio URLs correctly from backend
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implement error handling and user feedback






  - Show user-friendly error messages for network failures
  - Add retry button for failed API calls
  - Display success message after complaint submission
  - Show loading states during API calls
  - Handle authentication errors (redirect to login if token expired)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.1 Add offline support





  - Cache complaint list locally using shared_preferences or hive
  - Show cached data while loading fresh data
  - Display offline indicator when no internet connection
  - _Requirements: 9.3, 9.5_

- [ ] 6. Test complaint list functionality




  - Test loading complaints from backend
  - Test pull-to-refresh functionality
  - Test navigation to complaint details
  - Test with different complaint statuses
  - Test with complaints that have images and audio
  - Test with empty complaint list
  - Test error scenarios (network error, auth error)
  - Test on different screen sizes (phone, tablet)
  - _Requirements: All_

- [x] 6.1 Update navigation flow


  - Add "My Complaints" button/link in home page or profile page
  - Update complaint success page to navigate to complaint list
  - Ensure proper back navigation from complaint details
  - _Requirements: 2.1_

- [x] 7. Polish UI and UX





  - Add smooth animations for list items
  - Implement skeleton loading for better perceived performance
  - Add haptic feedback for button taps
  - Ensure consistent spacing and typography
  - Test with Bengali translations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Implementation Notes

### Complaint List Page Structure
```dart
class ComplaintListPage extends StatefulWidget {
  // Page that displays all user complaints
  // Uses ComplaintProvider to fetch and display data
  // Implements pull-to-refresh
  // Handles loading, error, and empty states
}
```

### Complaint Card Widget
```dart
Widget _buildComplaintCard(Complaint complaint) {
  // Card showing:
  // - Complaint ID (e.g., "C001234")
  // - Title/Type
  // - Location
  // - Status badge (color-coded)
  // - Timestamp ("2 hours ago")
  // - Thumbnail image (if available)
  // Tappable to navigate to details
}
```

### Status Badge Colors
- PENDING: Yellow (#FFC107)
- IN_PROGRESS: Blue (#2196F3)
- RESOLVED: Green (#4CAF50)
- REJECTED: Red (#F44336)

### Time Ago Formatting
```dart
String getTimeAgo(DateTime dateTime) {
  final now = DateTime.now();
  final difference = now.difference(dateTime);
  
  if (difference.inDays > 0) {
    return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
  } else if (difference.inHours > 0) {
    return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
  } else if (difference.inMinutes > 0) {
    return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
  } else {
    return 'Just now';
  }
}
```

### API Integration
- Endpoint: `GET /api/complaints/my`
- Headers: `Authorization: Bearer <token>`
- Response format:
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": 123,
        "title": "Household Waste",
        "description": "...",
        "location": "Dhaka, Uttara, Ward 300",
        "district": "Dhaka",
        "thana": "Uttara",
        "ward": "300",
        "imageUrl": "...",
        "audioUrl": "...",
        "status": "PENDING",
        "createdAt": "2025-11-14T10:30:00Z"
      }
    ]
  }
}
```

## Testing Checklist
- [ ] Complaint list loads successfully
- [ ] Pull-to-refresh works
- [ ] Status badges show correct colors
- [ ] Time ago displays correctly
- [ ] Images show thumbnails
- [ ] Tapping card navigates to details
- [ ] Detail page shows all information
- [ ] Images can be viewed full-screen
- [ ] Audio player works
- [ ] Empty state shows when no complaints
- [ ] Error state shows with retry button
- [ ] Loading indicator shows during fetch
- [ ] Works with Bengali translations
- [ ] Responsive on different screen sizes

## Dependencies
- Provider package (already installed)
- image_picker (already installed)
- flutter_sound (already installed)
- cached_network_image (for image loading)
- timeago package (for time formatting) - optional, can implement manually

## Files to Create/Modify
- `lib/pages/complaint_list_page.dart` (NEW)
- `lib/pages/complaint_detail_view_page.dart` (NEW)
- `lib/main.dart` (UPDATE - add routes)
- `lib/models/complaint.dart` (UPDATE - add helper methods)
- `lib/pages/home_page.dart` or `lib/pages/profile_settings_page.dart` (UPDATE - add navigation)
- `lib/pages/complaint_success_page.dart` (UPDATE - navigate to list)
