# Implementation Plan

- [x] 1. Backend Database Schema and Migrations



  - Create Prisma schema for ChatMessage model with fields: id, complaintId, senderId, senderType, message, imageUrl, read, createdAt
  - Create Prisma schema for StatusHistory model with fields: id, complaintId, oldStatus, newStatus, changedBy, note, createdAt
  - Add SenderType enum (ADMIN, CITIZEN) to Prisma schema
  - Generate and run Prisma migration to create new tables
  - Add database indexes for complaintId and createdAt fields on new tables
  - _Requirements: 5.1, 5.2, 6.1, 6.2_


- [ ] 2. Backend Admin Complaint Service
  - [x] 2.1 Create admin complaint service methods


    - Write getAdminComplaints() method with pagination, filtering (status, category, ward, date range), and search functionality
    - Write getAdminComplaintById() method to fetch complete complaint details with user information
    - Write updateComplaintStatus() method to change complaint status and create status history entry
    - Write getComplaintsByUser() method to fetch all complaints for a specific user
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1_



  - [x] 2.2 Create analytics service methods





    - Write getComplaintAnalytics() method to calculate total complaints, status breakdown, category breakdown, ward breakdown
    - Write getComplaintTrends() method to fetch complaint trends over time (daily, weekly, monthly)
    - Write calculateAverageResolutionTime() method to compute average time from creation to resolution



    - Write calculateResolutionRate() method to compute percentage of resolved complaints
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.3 Create chat service methods





    - Write getChatMessages() method to fetch all messages for a complaint with pagination



    - Write sendChatMessage() method to create new chat message
    - Write markMessagesAsRead() method to mark all messages as read for a complaint
    - Write getUnreadMessageCount() method to count unread messages per complaint
    - _Requirements: 6.1, 6.2, 6.3, 6.4_



- [x] 3. Backend Admin API Routes





  - [x] 3.1 Create admin complaint routes


    - Implement GET /api/admin/complaints endpoint with query parameters for pagination, filtering, search, and sorting


    - Implement GET /api/admin/complaints/:id endpoint to fetch single complaint with full details

    - Implement PATCH /api/admin/complaints/:id/status endpoint to update complaint status
    - Implement GET /api/admin/users/:userId/complaints endpoint to fetch user's complaints
    - Add authentication middleware to verify admin role on all admin routes
    - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.2, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 10.2, 10.4_



  - [x] 3.2 Create admin analytics routes





    - Implement GET /api/admin/analytics endpoint with query parameters for period and date range
    - Add response formatting for status breakdown, category breakdown, ward breakdown, and trends


    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.3 Create admin chat routes





    - Implement GET /api/admin/chat/:complaintId endpoint to fetch chat messages
    - Implement POST /api/admin/chat/:complaintId endpoint to send new message
    - Implement PATCH /api/admin/chat/:complaintId/read endpoint to mark messages as read
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Frontend Service Layer





  - [x] 4.1 Create complaint service


    - Write complaintService.ts with methods: getComplaints(), getComplaintById(), updateComplaintStatus(), searchComplaints()
    - Implement API client with axios including base URL configuration and request/response interceptors
    - Add authentication token to all requests via interceptor
    - Implement error handling with custom ApiError class
    - Add TypeScript interfaces for Complaint, ComplaintFilters, ComplaintStats, ComplaintDetails
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 11.2, 11.3, 12.1, 12.2_

  - [x] 4.2 Create analytics service


    - Write analyticsService.ts with methods: getAnalytics(), getComplaintTrends()
    - Add TypeScript interfaces for AnalyticsData, TrendData
    - Implement caching strategy for analytics data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.3 Create chat service


    - Write chatService.ts with methods: getChatMessages(), sendMessage(), markAsRead(), getUnreadCount()
    - Add TypeScript interfaces for ChatMessage
    - Implement real-time message polling or WebSocket connection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Frontend AllComplaints Page Enhancement




  - [x] 5.1 Implement data fetching and state management


    - Replace static complaint data with API call to complaintService.getComplaints()
    - Add useState hooks for complaints, loading, error, searchTerm, statusFilter, pagination
    - Add useEffect hook to fetch complaints on component mount and when filters change
    - Implement debounced search to avoid excessive API calls
    - Add loading skeleton components while data is fetching
    - _Requirements: 1.1, 1.2, 11.1, 12.1_


  - [x] 5.2 Implement search and filtering functionality
    - Connect search input to searchTerm state and trigger API call on change
    - Connect status filter dropdown to statusFilter state (All Status, Pending, In Progress, Solved, Rejected) and trigger API call on change
    - Implement filter clear functionality to reset all filters
    - Display "No results found" message when filtered results are empty
    - _Requirements: 1.3, 1.4, 12.1, 12.2, 12.3, 12.4_


  - [x] 5.3 Implement status count badges
    - Fetch status counts from API response
    - Update Pending, In Progress, Solved, and Rejected badges with real counts
    - Add real-time updates when complaint status changes
    - _Requirements: 1.5_

  - [x] 5.4 Implement pagination





    - Add pagination controls (Previous, Next, Page numbers)
    - Update API call when page changes
    - Display current page and total pages

    - Maintain scroll position on page change
    - _Requirements: 1.1_

  - [x] 5.5 Implement error handling





    - Display error message when API call fails
    - Add retry button for failed requests
    - Show toast notification for errors
    - Handle network errors gracefully
    - _Requirements: 11.2, 11.3_

- [ ] 6. Frontend ComplaintDetailsModal Component





  - [x] 6.1 Create modal component structure


    - Create ComplaintDetailsModal.tsx component with Material-UI Dialog
    - Add props: complaintId, open, onClose, onStatusUpdate, onChatOpen
    - Implement modal open/close functionality with backdrop click and close button
    - Make modal responsive for mobile, tablet, and desktop views
    - _Requirements: 2.1, 2.3, 9.1, 9.4_

  - [x] 6.2 Implement complaint details display

    - Fetch complaint details using complaintService.getComplaintById() when modal opens
    - Display complaint ID, type, description, location (district, thana, ward, address)
    - Display citizen information (ID, name, phone, email)
    - Display current status with color-coded badge
    - Display submission timestamp and last updated timestamp
    - Add loading state while fetching complaint details
    - _Requirements: 2.2, 2.4_

  - [x] 6.3 Implement image gallery


    - Display image thumbnails in a grid layout
    - Implement click handler to open full-size image in lightbox
    - Add image navigation (previous/next) in lightbox
    - Add zoom controls and download option
    - Handle image loading errors with placeholder
    - _Requirements: 2.5, 7.1, 7.2, 7.4_

  - [x] 6.4 Implement audio player


    - Display audio player for voice recordings
    - Add play/pause controls, progress bar, volume control
    - Add playback speed control (0.5x, 1x, 1.5x, 2x)
    - Add download option for audio file
    - _Requirements: 2.5, 7.3_

  - [x] 6.5 Implement flexible status update controls with Rejected status





    - Add dynamic status change buttons based on current complaint status:
      - Pending → "Mark In Progress", "Mark Solved", "Mark Rejected"
      - In Progress → "Mark Pending", "Mark Solved", "Mark Rejected"
      - Solved → "Mark Pending", "Mark In Progress", "Mark Rejected"
      - Rejected → "Mark Pending", "Mark In Progress", "Mark Solved"
    - Implement status update API call when any status button is clicked
    - Show loading indicator during status update
    - Display success toast on successful update
    - Update complaint list after status change
    - Allow all status transitions to give admin full control
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 7. Frontend ChatModal Component








  - [x] 7.1 Create chat modal structure



    - Create ChatModal.tsx component with Material-UI Dialog
    - Add props: complaintId, open, onClose
    - Implement modal layout with message list and input area
    - Make modal responsive for all screen sizes
    - _Requirements: 6.1, 9.4_



  - [x] 7.2 Implement message display


    - Fetch chat messages using chatService.getChatMessages() when modal opens
    - Display messages in chronological order with sender name and timestamp
    - Style admin messages differently from citizen messages
    - Implement auto-scroll to latest message
    - Add loading state while fetching messages
    - _Requirements: 6.2_





  - [x] 7.3 Implement message sending
    - Add text input field with send button
    - Implement sendMessage() API call when send button is clicked
    - Clear input field after message is sent
    - Add message to chat list optimistically
    - Show loading indicator on send button while sending

    - _Requirements: 6.3_




  - [x] 7.4 Implement image attachment


    - Add image upload button in chat input area
    - Implement image preview before sending
    - Send image URL with message
    - Display images in chat messages

    - _Requirements: 6.5_




  - [x] 7.5 Implement real-time updates
    - Add polling mechanism to fetch new messages every 5 seconds
    - Mark messages as read when chat is opened
    - Display unread message badge on Chat button in complaint card
    - _Requirements: 6.4_

- [ ] 8. Frontend Dashboard Analytics
  - [ ] 8.1 Create analytics components
    - Create StatCard component to display individual statistics
    - Create TrendChart component using Chart.js or Recharts for line/bar charts
    - Create CategoryPieChart component for category distribution
    - Create WardDistributionChart component for ward-based complaints
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Implement dashboard data fetching
    - Fetch analytics data using analyticsService.getAnalytics() on dashboard mount
    - Display total complaints, pending, in progress, and solved counts
    - Display complaint trends over time in chart
    - Display category breakdown in pie chart
    - Display ward distribution in chart or list
    - Add loading state while fetching analytics
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 8.3 Implement analytics filters
    - Add date range picker to filter analytics by period
    - Add period selector (Day, Week, Month, Year)
    - Update charts when filters change
    - _Requirements: 8.5_

- [ ] 9. Frontend User Management Enhancement
  - [ ] 9.1 Add user complaint observation
    - Enhance UserDetailsModal to display all complaints submitted by user
    - Display complaint ID, type, status, submission date, resolution date for each complaint
    - Add click handler to open complaint details from user modal
    - _Requirements: 4.2, 4.3_

  - [ ] 9.2 Update user statistics display
    - Fetch user statistics from backend including total complaints, resolved, unresolved
    - Display statistics in user table and user details modal
    - Update statistics when complaint status changes
    - _Requirements: 4.1, 4.5_

- [-] 10. Frontend UI Polish and Responsive Design


  - [x] 10.1 Implement loading states


    - Add skeleton loaders for complaint cards while loading
    - Add spinner for button actions (Mark Solved, View Details)
    - Add progress bar for page-level loading
    - _Requirements: 11.1, 11.4_

  - [ ] 10.2 Implement toast notifications



    - Add toast notification system using react-hot-toast or Material-UI Snackbar
    - Show success toast for successful actions (status update, message sent)
    - Show error toast for failed actions
    - Show info toast for informational messages
    - _Requirements: 11.3_

  - [x] 10.3 Ensure responsive design





    - Test all pages on mobile (320px - 767px), tablet (768px - 1023px), desktop (1024px+)
    - Adjust complaint card layout for mobile (single column)
    - Adjust modal sizes for mobile devices
    - Ensure all buttons and inputs are touch-friendly on mobile
    - Test and fix any layout issues
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.4 Add animations and transitions





    - Add fade-in animation for complaint cards
    - Add slide-in animation for modals
    - Add smooth transitions for status badge color changes
    - Add loading spinner animations
    - _Requirements: 9.1_

- [ ] 11. Authentication and Authorization
  - [ ] 11.1 Implement admin role verification
    - Add role field to JWT token payload
    - Create admin middleware to verify admin role on backend
    - Apply admin middleware to all admin routes
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [ ] 11.2 Implement token management
    - Store JWT token in localStorage or httpOnly cookie
    - Add token to Authorization header in all API requests
    - Implement token refresh mechanism
    - Redirect to login page when token expires
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ] 11.3 Add protected route wrapper
    - Create ProtectedRoute component to wrap admin pages
    - Check authentication status before rendering page
    - Redirect to login if not authenticated
    - Display loading state while checking authentication
    - _Requirements: 10.1, 10.3_

- [ ] 12. Testing and Quality Assurance
  - [ ] 12.1 Write backend unit tests
    - Write tests for complaint service methods (getAdminComplaints, updateComplaintStatus)
    - Write tests for analytics service methods (getAnalytics, getComplaintTrends)
    - Write tests for chat service methods (getChatMessages, sendMessage)
    - Achieve 80%+ code coverage for service layer
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 12.2 Write backend integration tests
    - Write tests for admin complaint routes (GET /api/admin/complaints, PATCH /api/admin/complaints/:id/status)
    - Write tests for analytics routes (GET /api/admin/analytics)
    - Write tests for chat routes (GET /api/admin/chat/:complaintId, POST /api/admin/chat/:complaintId)
    - Test authentication and authorization on all routes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.4_

  - [ ] 12.3 Write frontend unit tests
    - Write tests for complaintService methods
    - Write tests for ComplaintCard component
    - Write tests for ComplaintDetailsModal component
    - Write tests for ChatModal component
    - _Requirements: 1.1, 2.1, 6.1_

  - [ ] 12.4 Write frontend integration tests
    - Write tests for AllComplaints page with API mocking
    - Write tests for Dashboard page with analytics data
    - Write tests for UserManagement page with user data
    - Test error handling and loading states
    - _Requirements: 1.1, 8.1, 4.1, 11.1, 11.2_

  - [ ] 12.5 Perform manual testing
    - Test all features on Chrome, Firefox, Safari, Edge browsers
    - Test responsive design on mobile, tablet, desktop
    - Test error scenarios (network errors, API errors)
    - Test authentication flow (login, logout, token expiration)
    - Test all CRUD operations for complaints
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3_

- [ ] 13. Performance Optimization
  - [ ] 13.1 Implement frontend caching
    - Add React Query or SWR for data fetching and caching
    - Implement stale-while-revalidate strategy for complaint list
    - Cache analytics data for 5 minutes
    - Implement optimistic updates for status changes
    - _Requirements: 1.1, 3.2, 8.5_

  - [ ] 13.2 Implement code splitting
    - Use React.lazy() to lazy load ComplaintDetailsModal, ChatModal
    - Use React.lazy() to lazy load Dashboard analytics charts
    - Add Suspense boundaries with loading fallbacks
    - _Requirements: 2.1, 6.1, 8.1_

  - [ ] 13.3 Optimize images
    - Implement lazy loading for complaint images
    - Use thumbnail URLs for image previews
    - Add progressive image loading
    - Compress images before upload
    - _Requirements: 7.1, 7.4_

  - [ ] 13.4 Optimize backend queries
    - Add database indexes for frequently queried fields
    - Use Prisma select to fetch only needed fields
    - Implement cursor-based pagination for large datasets
    - Add Redis caching for analytics data
    - _Requirements: 5.1, 5.2, 8.5_

- [ ] 14. Documentation and Deployment
  - [ ] 14.1 Write API documentation
    - Document all admin API endpoints with request/response examples
    - Document authentication requirements
    - Document error responses
    - Create Postman collection for API testing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 14.2 Write deployment guide
    - Document environment variables for frontend and backend
    - Document database migration steps
    - Document build and deployment process
    - Create deployment checklist
    - _Requirements: All_

  - [ ] 14.3 Deploy to production
    - Run database migrations on production database
    - Build and deploy frontend to hosting platform
    - Build and deploy backend to hosting platform
    - Configure environment variables
    - Test production deployment
    - _Requirements: All_

