# Frontend Service Layer

This directory contains all the service modules for the Clean Care Admin Panel. These services handle API communication with the backend and provide a clean interface for the frontend components.

## Services Overview

### 1. Complaint Service (`complaintService.ts`)

Handles all complaint-related operations for the admin panel.

**Methods:**
- `getComplaints(page, limit, filters)` - Get paginated list of complaints with filters
- `getComplaintById(id)` - Get detailed information about a specific complaint
- `updateComplaintStatus(id, data)` - Update the status of a complaint
- `searchComplaints(searchTerm, page, limit)` - Search complaints by term
- `getComplaintsByUser(userId, page, limit)` - Get all complaints for a specific user

**Features:**
- Automatic authentication token injection
- Media URL parsing (images and audio)
- Error handling with custom ApiError
- Automatic redirect on 401 errors

**Usage Example:**
```typescript
import { complaintService } from '../services';

// Get complaints with filters
const response = await complaintService.getComplaints(1, 20, {
  status: 'PENDING',
  search: 'road',
  ward: 'Ward 5'
});

// Update complaint status
await complaintService.updateComplaintStatus(123, {
  status: 'IN_PROGRESS',
  note: 'Team assigned to investigate'
});
```

### 2. Analytics Service (`analyticsService.ts`)

Provides analytics and statistics for the admin dashboard.

**Methods:**
- `getAnalytics(query)` - Get comprehensive analytics data
- `getComplaintTrends(query)` - Get complaint trends over time
- `getAnalyticsByDateRange(startDate, endDate)` - Get analytics for specific date range
- `getAnalyticsByPeriod(period)` - Get analytics for a specific period
- `getTrendsByDateRange(startDate, endDate)` - Get trends for date range
- `getTrendsByPeriod(period)` - Get trends for a period
- `clearCache()` - Clear all cached analytics data
- `clearCacheEntry(endpoint, query)` - Clear specific cache entry

**Features:**
- Built-in caching (5-minute cache duration)
- Automatic cache invalidation
- Support for date ranges and periods (day, week, month, year)
- Error handling

**Usage Example:**
```typescript
import { analyticsService } from '../services';

// Get analytics for the last month
const analytics = await analyticsService.getAnalyticsByPeriod('month');

// Get trends for a specific date range
const trends = await analyticsService.getTrendsByDateRange(
  '2024-01-01',
  '2024-01-31'
);

// Clear cache when data is updated
analyticsService.clearCache();
```

### 3. Chat Service (`chatService.ts`)

Manages admin-citizen communication through the chat system.

**Methods:**
- `getChatMessages(complaintId, page, limit)` - Get chat messages for a complaint
- `sendMessage(complaintId, data)` - Send a chat message
- `markAsRead(complaintId)` - Mark all messages as read
- `getUnreadCount(complaintId)` - Get count of unread messages
- `startPolling(complaintId, callback)` - Start polling for new messages
- `stopPolling(complaintId)` - Stop polling for a specific complaint
- `stopAllPolling()` - Stop all active polling
- `sendMessageWithImage(complaintId, message, imageUrl)` - Send message with image
- `getLatestMessages(complaintId, limit)` - Get latest messages

**Features:**
- Real-time message polling (5-second interval)
- Automatic polling management
- Support for text and image messages
- Unread message tracking
- Error handling

**Usage Example:**
```typescript
import { chatService } from '../services';

// Get chat messages
const { messages, pagination } = await chatService.getChatMessages(123);

// Send a message
await chatService.sendMessage(123, {
  message: 'We are investigating your complaint'
});

// Start polling for new messages
chatService.startPolling(123, (messages) => {
  console.log('New messages:', messages);
  // Update UI with new messages
});

// Stop polling when component unmounts
chatService.stopPolling(123);

// Mark messages as read
await chatService.markAsRead(123);
```

### 4. Auth Service (`authService.ts`)

Handles authentication and user session management.

**Methods:**
- `login(credentials)` - Login with email and password
- `logout()` - Logout and clear session
- `refreshToken()` - Refresh access token
- `getProfile()` - Get current user profile

**Features:**
- Automatic token refresh on 401 errors
- Token storage in localStorage
- Automatic redirect to login on auth failure

### 5. User Management Service (`userManagementService.ts`)

Manages user-related operations for admins.

**Methods:**
- `getUsers(query)` - Get paginated list of users
- `getUserById(userId)` - Get user details
- `getUserStatistics()` - Get user statistics
- `createUser(data)` - Create new user
- `updateUser(userId, data)` - Update user information
- `updateUserStatus(userId, data)` - Update user status

## Type Definitions

### Complaint Service Types (`types/complaint-service.types.ts`)

- `ComplaintStatus` - Status enum (PENDING, IN_PROGRESS, RESOLVED, REJECTED)
- `Complaint` - Complaint data structure
- `ComplaintDetails` - Extended complaint with status history
- `ComplaintFilters` - Filter options for complaints
- `ComplaintStats` - Statistics breakdown
- `ApiError` - Custom error interface

### Analytics Service Types (`types/analytics-service.types.ts`)

- `AnalyticsData` - Complete analytics data structure
- `TrendData` - Trend data point
- `AnalyticsQuery` - Query parameters for analytics

### Chat Service Types (`types/chat-service.types.ts`)

- `SenderType` - Message sender type (ADMIN, CITIZEN)
- `ChatMessage` - Chat message structure
- `SendMessageRequest` - Request body for sending messages

## Error Handling

All services use a consistent error handling approach:

1. Axios errors are caught and converted to user-friendly messages
2. 401 errors trigger automatic redirect to login
3. Custom `ApiError` interface provides structured error information
4. Error handler utility (`utils/errorHandler.ts`) provides helper functions

**Error Handler Utilities:**
```typescript
import { handleApiError, isAuthError, isNotFoundError } from '../utils/errorHandler';

try {
  await complaintService.getComplaintById(123);
} catch (error) {
  const message = handleApiError(error);
  console.error(message);
  
  if (isAuthError(error)) {
    // Handle auth error
  }
  
  if (isNotFoundError(error)) {
    // Handle not found error
  }
}
```

## Authentication

All services automatically include the authentication token in requests:

1. Token is retrieved from `localStorage.getItem('accessToken')`
2. Token is added to `Authorization` header as `Bearer ${token}`
3. If token is missing or invalid, user is redirected to login

## Best Practices

1. **Always handle errors**: Wrap service calls in try-catch blocks
2. **Use loading states**: Show loading indicators while fetching data
3. **Cache when appropriate**: Analytics service has built-in caching
4. **Clean up polling**: Always stop polling when components unmount
5. **Use TypeScript types**: Import and use the provided type definitions
6. **Handle edge cases**: Check for empty data, null values, etc.

## API Configuration

Base URL and timeout are configured in `config/apiConfig.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  TIMEOUT: 10000,
  // ... endpoints
};
```

## Testing

When testing components that use these services, mock the service methods:

```typescript
import { complaintService } from '../services';

jest.mock('../services', () => ({
  complaintService: {
    getComplaints: jest.fn(),
    getComplaintById: jest.fn(),
    // ... other methods
  }
}));
```

## Future Enhancements

Potential improvements for the service layer:

1. WebSocket support for real-time updates (instead of polling)
2. Request cancellation for pending requests
3. Retry logic for failed requests
4. Request queuing for offline support
5. More granular caching strategies
6. Request deduplication
7. Optimistic updates
