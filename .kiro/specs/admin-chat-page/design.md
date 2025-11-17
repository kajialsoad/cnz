# Admin Chat Page Design Document

## Overview

The Admin Chat Page is a dedicated full-page interface in the Clean Care admin panel that provides a centralized location for managing all chat conversations with citizens about their complaints. The page features a professional two-column layout similar to modern messaging applications (WhatsApp, Messenger), with a chat list on the left and the active conversation on the right.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Chat Page                       │
├──────────────────────┬──────────────────────────────────┤
│   Chat List Panel    │    Chat Conversation Panel       │
│   (30-40% width)     │       (60-70% width)             │
│                      │                                   │
│  ┌────────────────┐  │  ┌────────────────────────────┐  │
│  │ Search & Filter│  │  │   Chat Header              │  │
│  └────────────────┘  │  │   (Complaint + Citizen)    │  │
│                      │  └────────────────────────────┘  │
│  ┌────────────────┐  │                                   │
│  │ Chat Item 1    │  │  ┌────────────────────────────┐  │
│  │ (Unread: 3)    │  │  │                            │  │
│  └────────────────┘  │  │   Message Bubbles          │  │
│  ┌────────────────┐  │  │   (Scrollable)             │  │
│  │ Chat Item 2    │  │  │                            │  │
│  └────────────────┘  │  └────────────────────────────┘  │
│  ┌────────────────┐  │                                   │
│  │ Chat Item 3    │  │  ┌────────────────────────────┐  │
│  └────────────────┘  │  │   Message Input            │  │
│                      │  └────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────┘
```

### Component Hierarchy

```
AdminChatPage
├── ChatListPanel
│   ├── ChatListHeader
│   │   ├── SearchBar
│   │   └── FilterDropdowns (District, Upazila, Status)
│   ├── ChatStatistics (Total, Unread counts)
│   └── ChatList
│       └── ChatListItem[] (Complaint + Citizen info)
│
└── ChatConversationPanel
    ├── ChatHeader
    │   ├── ComplaintInfo (ID, Title, Status)
    │   ├── CitizenInfo (Name, Location, Contact)
    │   └── QuickActions (View Details, Change Status)
    ├── MessageList
    │   └── MessageBubble[] (Admin/Citizen messages)
    └── MessageInput
        ├── TextInput
        ├── ImageUpload
        └── SendButton
```

## Components and Interfaces

### 1. AdminChatPage (Main Container)

**Purpose**: Main page component that manages the overall layout and state

**State**:
```typescript
interface AdminChatPageState {
  chatList: ChatConversation[];
  selectedChatId: number | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    district: string | null;
    upazila: string | null;
    status: ComplaintStatus | null;
    unreadOnly: boolean;
  };
  statistics: {
    totalChats: number;
    unreadCount: number;
  };
}
```

**Props**: None (top-level page)

**Responsibilities**:
- Fetch and manage chat list data
- Handle chat selection
- Manage search and filter state
- Coordinate between chat list and conversation panels
- Handle real-time updates via polling

---

### 2. ChatListPanel

**Purpose**: Left panel showing all chat conversations

**Props**:
```typescript
interface ChatListPanelProps {
  chats: ChatConversation[];
  selectedChatId: number | null;
  onChatSelect: (chatId: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: ChatFilters;
  onFilterChange: (filters: ChatFilters) => void;
  statistics: ChatStatistics;
  loading: boolean;
}
```

**Responsibilities**:
- Display list of chat conversations
- Handle search and filtering
- Show statistics
- Highlight selected chat
- Show unread badges

---

### 3. ChatListItem

**Purpose**: Individual chat item in the list

**Props**:
```typescript
interface ChatListItemProps {
  chat: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
}

interface ChatConversation {
  complaintId: number;
  complaintTitle: string;
  complaintStatus: ComplaintStatus;
  trackingNumber: string;
  citizen: {
    id: number;
    name: string;
    profilePicture?: string;
    district: string;
    upazila: string;
    ward: string;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    senderType: 'ADMIN' | 'CITIZEN';
  };
  unreadCount: number;
  isNew: boolean; // Never opened by admin
}
```

**UI Elements**:
- Citizen avatar/initials
- Complaint ID and title
- Citizen name and location (district, upazila)
- Last message preview (truncated)
- Timestamp (relative: "2 mins ago", "1 hour ago")
- Unread badge (if unreadCount > 0)
- "New" badge (if isNew)
- Complaint status badge

---

### 4. ChatConversationPanel

**Purpose**: Right panel showing the active conversation

**Props**:
```typescript
interface ChatConversationPanelProps {
  complaintId: number | null;
  onClose?: () => void; // For mobile view
}
```

**State**:
```typescript
interface ChatConversationState {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  complaintDetails: ComplaintDetails | null;
}
```

**Responsibilities**:
- Fetch and display messages for selected complaint
- Handle message sending
- Auto-scroll to latest message
- Poll for new messages
- Mark messages as read

---

### 5. ChatHeader

**Purpose**: Header showing complaint and citizen information

**Props**:
```typescript
interface ChatHeaderProps {
  complaint: {
    id: number;
    trackingNumber: string;
    title: string;
    category: string;
    status: ComplaintStatus;
    createdAt: Date;
  };
  citizen: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    district: string;
    upazila: string;
    ward: string;
    address: string;
    profilePicture?: string;
  };
  onViewDetails: () => void;
  onStatusChange: (newStatus: ComplaintStatus) => void;
}
```

**UI Elements**:
- Citizen avatar and name
- Complaint ID and title
- Status badge
- Location info (district, upazila, ward)
- Contact info (phone, email)
- Quick action buttons:
  - View Full Details
  - Change Status (dropdown)
  - View Complaint History

---

### 6. MessageList

**Purpose**: Scrollable list of messages

**Props**:
```typescript
interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  onLoadMore?: () => void; // For pagination
}

interface ChatMessage {
  id: number;
  complaintId: number;
  senderId: number;
  senderName: string;
  senderType: 'ADMIN' | 'CITIZEN';
  message: string;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
}
```

**Responsibilities**:
- Display messages in chronological order
- Auto-scroll to bottom on new messages
- Load older messages on scroll to top
- Show loading indicators

---

### 7. MessageBubble

**Purpose**: Individual message display

**Props**:
```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  isAdmin: boolean;
}
```

**UI Elements**:
- Message bubble (rounded corners)
- Sender name (for citizen messages)
- Message text
- Image (if present)
- Timestamp
- Read status (checkmarks for admin messages)

**Styling**:
- Admin messages: Right-aligned, blue/green gradient
- Citizen messages: Left-aligned, white/gray background
- Different border radius for sender side

---

### 8. MessageInput

**Purpose**: Input area for sending messages

**Props**:
```typescript
interface MessageInputProps {
  onSend: (message: string, imageUrl?: string) => Promise<void>;
  sending: boolean;
}
```

**State**:
```typescript
interface MessageInputState {
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
}
```

**UI Elements**:
- Text input field (multiline)
- Image upload button
- Image preview (if selected)
- Send button
- Character count (optional)
- Typing indicator (optional)

---

## Data Models

### ChatConversation (Extended)

```typescript
interface ChatConversation {
  complaintId: number;
  trackingNumber: string;
  complaintTitle: string;
  complaintCategory: string;
  complaintStatus: ComplaintStatus;
  complaintCreatedAt: Date;
  citizen: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    district: string;
    upazila: string;
    ward: string;
    address: string;
    profilePicture?: string;
  };
  lastMessage: {
    id: number;
    text: string;
    timestamp: Date;
    senderType: 'ADMIN' | 'CITIZEN';
  };
  unreadCount: number;
  totalMessages: number;
  isNew: boolean;
  lastActivity: Date;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: number;
  complaintId: number;
  senderId: number;
  senderName: string;
  senderType: 'ADMIN' | 'CITIZEN';
  message: string;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatStatistics

```typescript
interface ChatStatistics {
  totalChats: number;
  unreadCount: number;
  byDistrict: { district: string; count: number }[];
  byUpazila: { upazila: string; count: number }[];
  byStatus: { status: ComplaintStatus; count: number }[];
}
```

## API Integration

### Endpoints

1. **GET /api/admin/chats**
   - Fetch all chat conversations
   - Query params: search, district, upazila, status, unreadOnly, page, limit
   - Returns: ChatConversation[]

2. **GET /api/admin/chat/:complaintId**
   - Fetch messages for a specific complaint
   - Query params: page, limit
   - Returns: ChatMessage[]

3. **POST /api/admin/chat/:complaintId**
   - Send a new message
   - Body: { message: string, imageUrl?: string }
   - Returns: ChatMessage

4. **PATCH /api/admin/chat/:complaintId/read**
   - Mark all messages as read
   - Returns: { success: boolean }

5. **GET /api/admin/chat/statistics**
   - Get chat statistics
   - Returns: ChatStatistics

### Service Layer

```typescript
// chatService.ts (extend existing)

export const chatService = {
  // Get all chat conversations
  async getChatConversations(filters?: ChatFilters): Promise<ChatConversation[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.district) params.append('district', filters.district);
    if (filters?.upazila) params.append('upazila', filters.upazila);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.unreadOnly) params.append('unreadOnly', 'true');
    
    const response = await apiClient.get(`/admin/chats?${params}`);
    return response.data.data.chats;
  },

  // Get chat statistics
  async getChatStatistics(): Promise<ChatStatistics> {
    const response = await apiClient.get('/admin/chat/statistics');
    return response.data.data;
  },

  // Existing methods: getChatMessages, sendMessage, markMessagesAsRead
};
```

## Responsive Design

### Desktop (≥1024px)
- Two-column layout (30% chat list, 70% conversation)
- All features visible
- Hover effects on chat items

### Tablet (768px - 1023px)
- Two-column layout (35% chat list, 65% conversation)
- Slightly reduced padding
- Smaller font sizes

### Mobile (<768px)
- Single column view
- Show chat list by default
- When chat selected, show conversation in full screen
- Back button to return to chat list
- Floating action button for new chat (if applicable)

## Real-time Updates

### Polling Strategy

```typescript
// Poll for new messages every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (selectedChatId) {
      fetchNewMessages(selectedChatId);
    }
    fetchChatList(); // Update chat list for new conversations
  }, 5000);

  return () => clearInterval(interval);
}, [selectedChatId]);
```

### Optimistic Updates

When sending a message:
1. Add message to local state immediately
2. Show sending indicator
3. Send to backend
4. Update with server response (ID, timestamp)
5. Handle errors and allow retry

## Error Handling

### Network Errors
- Show toast notification
- Provide retry button
- Maintain local state

### Message Send Failures
- Keep message in input
- Show error message
- Provide retry option

### Load Failures
- Show error state in panel
- Provide reload button
- Log error for debugging

## Performance Optimization

### Chat List
- Virtual scrolling for large lists (>100 chats)
- Lazy load images
- Debounce search input (500ms)

### Message List
- Pagination (load 50 messages at a time)
- Load older messages on scroll to top
- Virtual scrolling for very long conversations

### Caching
- Cache chat list for 30 seconds
- Cache messages per complaint
- Invalidate cache on new message

## Accessibility

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for all interactive elements
- Screen reader support
- Focus management
- High contrast mode support

## Testing Strategy

### Unit Tests
- Component rendering
- State management
- Message formatting
- Time formatting

### Integration Tests
- Chat selection flow
- Message sending flow
- Search and filter functionality
- Real-time updates

### E2E Tests
- Complete chat conversation flow
- Multiple chat management
- Error scenarios
- Responsive behavior

## Future Enhancements

1. **WebSocket Integration**: Replace polling with WebSocket for true real-time updates
2. **Typing Indicators**: Show when citizen is typing
3. **Message Reactions**: Allow admins to react to messages
4. **File Attachments**: Support PDF, documents
5. **Voice Messages**: Record and send voice messages
6. **Chat Templates**: Quick reply templates for common responses
7. **Chat Assignment**: Assign chats to specific admins
8. **Chat Analytics**: Response time, resolution rate
9. **Push Notifications**: Browser notifications for new messages
10. **Chat Export**: Export conversation history
