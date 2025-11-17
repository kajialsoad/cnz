# Implementation Plan

- [x] 1. Backend API Enhancement for Chat List





  - [x] 1.1 Create chat list endpoint


    - Create GET /api/admin/chats endpoint to fetch all complaints with chat messages
    - Add query parameters for search, district, upazila, status, unreadOnly, page, limit
    - Return chat conversations with complaint details, citizen info, last message, unread count
    - Add sorting by last activity (most recent first)
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Create chat statistics endpoint

    - Create GET /api/admin/chat/statistics endpoint
    - Calculate total chats, unread count, chats by district, chats by upazila, chats by status
    - Return aggregated statistics
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 1.3 Enhance existing chat endpoints


    - Ensure GET /api/admin/chat/:complaintId returns complete complaint and citizen details
    - Ensure POST /api/admin/chat/:complaintId works correctly
    - Ensure PATCH /api/admin/chat/:complaintId/read marks messages as read
    - _Requirements: 2.1, 3.1, 4.4_

- [x] 2. Frontend Service Layer Extension





  - [x] 2.1 Extend chatService with new methods


    - Add getChatConversations() method with filter parameters
    - Add getChatStatistics() method
    - Add TypeScript interfaces for ChatConversation, ChatStatistics, ChatFilters
    - Implement error handling for all methods
    - _Requirements: 1.1, 1.4, 12.1_

  - [x] 2.2 Create chat-page-specific types


    - Create types file for chat page interfaces
    - Define ChatConversation, ChatStatistics, ChatFilters, MessageBubbleProps
    - Export all types for use in components
    - _Requirements: All_

- [x] 3. Create AdminChatPage Component





  - [x] 3.1 Create page structure and layout


    - Create AdminChatPage.tsx in src/pages/AdminChatPage/
    - Implement two-column layout (chat list + conversation)
    - Add responsive breakpoints for desktop, tablet, mobile
    - Integrate with MainLayout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.1_

  - [x] 3.2 Implement state management

    - Add state for chatList, selectedChatId, loading, error
    - Add state for searchTerm and filters
    - Add state for statistics
    - Implement useEffect for initial data fetch
    - _Requirements: 1.1, 5.1, 12.1_

  - [x] 3.3 Implement real-time polling

    - Add polling interval (5 seconds) for chat list updates
    - Add polling for new messages in active conversation
    - Implement cleanup on component unmount
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Create ChatListPanel Component





  - [x] 4.1 Create panel structure


    - Create ChatListPanel.tsx component
    - Implement header with search and filters
    - Implement scrollable chat list area
    - Add loading skeletons
    - _Requirements: 1.1, 1.2, 7.2_

  - [x] 4.2 Implement search functionality

    - Add search input with debounce (500ms)
    - Filter chat list by search term
    - Show "no results" message when empty
    - _Requirements: 1.4, 5.1, 7.5_

  - [x] 4.3 Implement filter dropdowns

    - Add district filter dropdown
    - Add upazila filter dropdown
    - Add status filter dropdown
    - Add "Unread Only" toggle
    - Implement filter clear button
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 4.4 Display chat statistics

    - Show total chats count
    - Show unread messages count
    - Add visual badges/chips for statistics
    - _Requirements: 12.1, 12.2_

- [x] 5. Create ChatListItem Component







  - [x] 5.1 Create chat item UI

    - Create ChatListItem.tsx component
    - Display citizen avatar/initials
    - Display complaint ID and title
    - Display citizen name and location
    - Display last message preview (truncated to 50 chars)
    - Display relative timestamp
    - _Requirements: 1.2, 1.5_

  - [x] 5.2 Add status indicators

    - Add unread badge with count
    - Add "New" badge for never-opened chats
    - Add complaint status badge
    - Highlight selected chat
    - Use bold font for unread chats
    - _Requirements: 1.3, 1.5_


  - [x] 5.3 Implement click handler


    - Handle chat selection on click
    - Update selected state
    - Trigger conversation load
    - _Requirements: 2.1_

- [x] 6. Create ChatConversationPanel Component





  - [x] 6.1 Create panel structure


    - Create ChatConversationPanel.tsx component
    - Implement chat header
    - Implement scrollable message list
    - Implement message input area
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Implement data fetching

    - Fetch messages when complaint selected
    - Fetch complaint and citizen details
    - Handle loading states
    - Handle error states
    - _Requirements: 2.1, 2.5, 7.3, 7.4_

  - [x] 6.3 Implement auto-scroll

    - Scroll to bottom on initial load
    - Scroll to bottom on new message
    - Maintain scroll position when loading older messages
    - _Requirements: 2.4, 10.5_

  - [x] 6.4 Implement mark as read

    - Mark messages as read when conversation opens
    - Update unread count in chat list
    - _Requirements: 4.4_



- [x] 7. Create ChatHeader Component



  - [x] 7.1 Create header UI


    - Create ChatHeader.tsx component
    - Display complaint ID, title, category, status
    - Display citizen name, avatar, location
    - Display contact info (phone, email)
    - Make header collapsible/expandable
    - _Requirements: 2.5, 6.1, 6.2, 6.3_

  - [x] 7.2 Add quick action buttons

    - Add "View Full Details" button (opens ComplaintDetailsModal)
    - Add status change dropdown
    - Add "View Complaint History" button
    - Implement button click handlers
    - _Requirements: 6.5, 6.6_

  - [x] 7.3 Implement responsive design

    - Adjust layout for mobile (stack vertically)
    - Show/hide details based on screen size
    - Add expand/collapse button for mobile
    - _Requirements: 8.3, 8.4_

- [x] 8. Create MessageList Component





  - [x] 8.1 Create message list UI

    - Create MessageList.tsx component
    - Implement scrollable container
    - Display messages in chronological order
    - Add loading indicator
    - _Requirements: 2.2, 2.3, 7.2_


  - [x] 8.2 Implement message pagination

    - Load initial 50 messages
    - Detect scroll to top
    - Load older messages on scroll
    - Show loading indicator at top
    - Show "Start of conversation" message when all loaded
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


  - [x] 8.3 Handle empty state

    - Show empty state when no messages
    - Display helpful message
    - _Requirements: 7.1_

- [x] 9. Create MessageBubble Component





  - [x] 9.1 Create message bubble UI
    - Create MessageBubble.tsx component
    - Style admin messages (right-aligned, blue/green gradient)
    - Style citizen messages (left-aligned, white/gray)
    - Add rounded corners with different radius for sender side
    - Display sender name for citizen messages
    - _Requirements: 2.2, 2.3, 13.2, 13.3_


  - [x] 9.2 Display message content
    - Display message text with proper line breaks
    - Display image if present (with lightbox on click)
    - Display timestamp (relative format)
    - Display read status (checkmarks for admin messages)
    - _Requirements: 2.2, 13.4, 13.6_


  - [x] 9.3 Add animations

    - Fade in animation for new messages
    - Slide up animation
    - Smooth transitions
    - _Requirements: 13.7_

- [x] 10. Create MessageInput Component





  - [x] 10.1 Create input UI


    - Create MessageInput.tsx component
    - Add multiline text input
    - Add image upload button
    - Add send button
    - Style with proper spacing and colors
    - _Requirements: 3.1, 3.2_


  - [x] 10.2 Implement message sending
    - Handle text input change
    - Handle Enter key to send (Shift+Enter for new line)
    - Call sendMessage API
    - Clear input after send
    - Show sending indicator
    - _Requirements: 3.1, 3.3, 3.4_


  - [x] 10.3 Implement image upload
    - Handle image file selection
    - Show image preview
    - Upload image to server
    - Send message with image URL
    - Handle upload errors

    - _Requirements: 3.2, 3.5_

  - [x] 10.4 Handle errors
    - Show error toast on send failure
    - Keep message in input on error
    - Provide retry option
    - _Requirements: 3.5_

- [x] 11. Add Routing and Navigation




  - [x] 11.1 Add route for chat page


    - Add /chats route in App.tsx
    - Add ChatPage to protected routes
    - _Requirements: All_

  - [x] 11.2 Add navigation menu item


    - Add "Messages" or "Chats" item to sidebar
    - Add chat icon
    - Show unread count badge on menu item
    - _Requirements: 9.2_

  - [x] 11.3 Implement deep linking


    - Support /chats/:complaintId route to open specific chat
    - Navigate to chat page from complaint list "Chat" button
    - _Requirements: 9.3_

- [x] 12. Implement Notifications





  - [x] 12.1 Add toast notifications


    - Show toast when new message arrives
    - Include sender name and message preview
    - Make toast clickable to open chat
    - _Requirements: 9.1, 9.3_

  - [x] 12.2 Add menu badge


    - Show unread count on sidebar menu item
    - Update badge in real-time
    - _Requirements: 9.2_



  - [x] 12.3 Add browser notifications (optional)
    - Request notification permission
    - Show browser notification for new messages
    - Handle notification click
    - _Requirements: 9.5_

- [x] 13. Responsive Design Implementation






  - [x] 13.1 Desktop layout (≥1024px)

    - Two-column layout (30% list, 70% conversation)
    - All features visible
    - Hover effects
    - _Requirements: 8.1, 13.8_



  - [x] 13.2 Tablet layout (768px - 1023px)

    - Two-column layout (35% list, 65% conversation)
    - Adjusted padding and font sizes
    - _Requirements: 8.2_




  - [x] 13.3 Mobile layout (<768px)

    - Single column view
    - Show list by default
    - Full screen conversation when selected
    - Back button to return to list
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 14. Error Handling and Loading States





  - [x] 14.1 Implement loading states


    - Chat list loading skeletons
    - Conversation loading indicator
    - Message sending indicator
    - _Requirements: 7.2, 7.3_


  - [x] 14.2 Implement error handling

    - Network error handling with retry
    - API error handling with user-friendly messages
    - Toast notifications for errors
    - _Requirements: 7.4_


  - [x] 14.3 Implement empty states

    - No chats empty state
    - No messages empty state
    - No search results state
    - _Requirements: 7.1, 7.5_


- [x] 15. Performance Optimization





  - [x] 15.1 Implement virtual scrolling

    - Use react-window for chat list (if >100 items)
    - Use react-window for message list (if >200 messages)
    - _Requirements: Performance_


  - [x] 15.2 Implement caching

    - Cache chat list for 30 seconds
    - Cache messages per complaint
    - Invalidate cache on new message
    - _Requirements: Performance_



  - [x] 15.3 Optimize images
    - Lazy load images in messages
    - Use thumbnails for image previews
    - Compress images before upload
    - _Requirements: Performance_

- [ ] 16. Testing
  - [ ]* 16.1 Write unit tests
    - Test ChatListItem component
    - Test MessageBubble component
    - Test MessageInput component
    - Test time formatting utilities
    - _Requirements: All_

  - [ ]* 16.2 Write integration tests
    - Test chat selection flow
    - Test message sending flow
    - Test search and filter functionality
    - _Requirements: All_

  - [ ]* 16.3 Manual testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test responsive design on mobile, tablet, desktop
    - Test real-time updates
    - Test error scenarios
    - _Requirements: All_

- [-] 17. Documentation





  - [ ] 17.1 Update README
    - Document chat page features
    - Add screenshots
    - _Requirements: All_

  - [ ] 17.2 Add code comments
    - Document complex logic
    - Add JSDoc comments for components
    - _Requirements: All_
