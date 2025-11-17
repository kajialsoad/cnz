# Design Document

## Overview

This design document outlines the architecture and implementation approach for the Admin Panel Complaint Management System. The system will transform the current static admin panel into a fully dynamic, backend-integrated application while maintaining the existing UI design. The solution focuses on creating a seamless experience for administrators to manage complaints, track user activities, and maintain full control over the complaint lifecycle.

### Key Design Principles

1. **UI Preservation**: Maintain all existing UI components, layouts, colors, and styling
2. **Backend Integration**: Connect all features to existing backend APIs
3. **Real-time Updates**: Implement optimistic UI updates and proper loading states
4. **Scalability**: Design for future feature additions without major refactoring
5. **Error Resilience**: Graceful error handling with user-friendly messages

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Pages Layer                                                 │
│  ├── AllComplaints (Dynamic)                                │
│  ├── UserManagement (Enhanced)                              │
│  ├── Dashboard (Analytics)                                  │
│  ├── ComplaintDetails (New Modal)                           │
│  └── ChatInterface (New Feature)                            │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── complaintService.ts (New)                              │
│  ├── userManagementService.ts (Existing)                    │
│  ├── chatService.ts (New)                                   │
│  ├── analyticsService.ts (New)                              │
│  └── authService.ts (Existing)                              │
├─────────────────────────────────────────────────────────────┤
│  State Management (React Context/Hooks)                     │
│  ├── ComplaintContext                                        │
│  ├── UserContext                                             │
│  └── AuthContext (Existing)                                 │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                            │
│  ├── ComplaintCard (Enhanced)                               │
│  ├── ComplaintDetailsModal (New)                            │
│  ├── StatusUpdateButton (New)                               │
│  ├── ChatModal (New)                                         │
│  ├── ImageViewer (New)                                       │
│  └── AudioPlayer (New)                                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Node.js/Express)              │
├─────────────────────────────────────────────────────────────┤
│  Admin Routes (New)                                          │
│  ├── GET /api/admin/complaints                              │
│  ├── GET /api/admin/complaints/:id                          │
│  ├── PATCH /api/admin/complaints/:id/status                 │
│  ├── GET /api/admin/users                                   │
│  ├── GET /api/admin/users/:id/complaints                    │
│  ├── GET /api/admin/analytics                               │
│  └── POST/GET /api/admin/chat/:complaintId                  │
├─────────────────────────────────────────────────────────────┤
│  Existing Routes (Enhanced)                                  │
│  ├── /api/complaints (User-facing)                          │
│  ├── /api/auth (Authentication)                             │
│  └── /api/users (User management)                           │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── complaintService.ts (Enhanced)                         │
│  ├── userService.ts (Enhanced)                              │
│  ├── chatService.ts (New)                                   │
│  └── analyticsService.ts (New)                              │
├─────────────────────────────────────────────────────────────┤
│  Database (Prisma ORM + PostgreSQL/MySQL)                   │
│  ├── Complaint Table                                         │
│  ├── User Table                                              │
│  ├── ChatMessage Table (New)                                │
│  └── Admin Table (Enhanced)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. AllComplaints Page (Enhanced)

**Purpose**: Display all complaints with filtering, search, and status management

**Current State**: Static data with hardcoded complaints
**Target State**: Dynamic data from backend with real-time updates

**Key Features**:
- Fetch complaints from backend API
- Real-time search and filtering
- Status count badges (Pending, In Progress, Solved)
- Pagination support
- Loading skeletons
- Error handling

**Component Structure**:
```typescript
interface AllComplaintsProps {}

interface ComplaintListState {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: ComplaintStatus | 'ALL';
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hooks used:
// - useState for local state
// - useEffect for data fetching
// - useCallback for memoized functions
// - Custom hook: useComplaints()
```

#### 2. ComplaintDetailsModal (New Component)

**Purpose**: Display complete complaint information in a modal dialog

**Features**:
- Full complaint details (ID, type, description, location)
- Citizen information (ID, name, phone, email)
- Status history and timestamps
- Image gallery with lightbox
- Audio player for voice recordings
- Status update controls
- Chat button

**Component Structure**:
```typescript
interface ComplaintDetailsModalProps {
  complaintId: number | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (newStatus: ComplaintStatus) => void;
  onChatOpen: () => void;
}

interface ComplaintDetails {
  id: number;
  complaintId: string; // Display ID (e.g., C001234)
  title: string;
  description: string;
  category: string;
  priority: number;
  status: ComplaintStatus;
  location: {
    address: string;
    district: string;
    thana: string;
    ward: string;
    latitude?: number;
    longitude?: number;
  };
  citizen: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  imageUrls: string[];
  audioUrls: string[];
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistoryEntry[];
}
```

#### 3. ChatModal (New Component)

**Purpose**: Enable admin-citizen communication about complaints

**Features**:
- Message history display
- Real-time message updates
- Text input with send button
- Image attachment support
- Typing indicators
- Read receipts

**Component Structure**:
```typescript
interface ChatModalProps {
  complaintId: number;
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  complaintId: number;
  senderId: number;
  senderType: 'ADMIN' | 'CITIZEN';
  message: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}
```

#### 4. ImageViewer (New Component)

**Purpose**: Display complaint images in a lightbox with navigation

**Features**:
- Full-screen image display
- Image navigation (prev/next)
- Zoom controls
- Download option
- Close button

#### 5. AudioPlayer (New Component)

**Purpose**: Play voice recordings attached to complaints

**Features**:
- Play/pause controls
- Progress bar
- Volume control
- Download option
- Playback speed control

### Backend Components

#### 1. Admin Complaint Routes (New)

**Purpose**: Provide admin-specific endpoints for complaint management

**Endpoints**:

```typescript
// Get all complaints (admin view)
GET /api/admin/complaints
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'ALL'
  - search: string (search by ID, location, citizen name)
  - category: string
  - ward: string
  - startDate: string (ISO date)
  - endDate: string (ISO date)
  - sortBy: 'createdAt' | 'updatedAt' | 'priority'
  - sortOrder: 'asc' | 'desc'

Response:
{
  success: boolean;
  data: {
    complaints: Complaint[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    statusCounts: {
      pending: number;
      inProgress: number;
      resolved: number;
      rejected: number;
    };
  };
}

// Get single complaint details (admin view)
GET /api/admin/complaints/:id
Response:
{
  success: boolean;
  data: {
    complaint: ComplaintDetails;
  };
}

// Update complaint status
PATCH /api/admin/complaints/:id/status
Body:
{
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  note?: string; // Optional admin note
}
Response:
{
  success: boolean;
  message: string;
  data: {
    complaint: Complaint;
  };
}

// Get user complaints (admin view)
GET /api/admin/users/:userId/complaints
Query Parameters:
  - page: number
  - limit: number
  - status: ComplaintStatus
Response:
{
  success: boolean;
  data: {
    user: UserDetails;
    complaints: Complaint[];
    statistics: {
      total: number;
      resolved: number;
      unresolved: number;
      pending: number;
      inProgress: number;
    };
  };
}

// Get analytics data
GET /api/admin/analytics
Query Parameters:
  - period: 'day' | 'week' | 'month' | 'year'
  - startDate: string
  - endDate: string
Response:
{
  success: boolean;
  data: {
    totalComplaints: number;
    statusBreakdown: {
      pending: number;
      inProgress: number;
      resolved: number;
      rejected: number;
    };
    categoryBreakdown: Record<string, number>;
    wardBreakdown: Record<string, number>;
    trends: {
      date: string;
      count: number;
    }[];
    averageResolutionTime: number; // in hours
    resolutionRate: number; // percentage
  };
}
```

#### 2. Chat Routes (New)

**Purpose**: Handle admin-citizen communication

**Endpoints**:

```typescript
// Get chat messages for a complaint
GET /api/admin/chat/:complaintId
Query Parameters:
  - page: number
  - limit: number
Response:
{
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: PaginationInfo;
  };
}

// Send a message
POST /api/admin/chat/:complaintId
Body:
{
  message: string;
  imageUrl?: string;
}
Response:
{
  success: boolean;
  data: {
    message: ChatMessage;
  };
}

// Mark messages as read
PATCH /api/admin/chat/:complaintId/read
Response:
{
  success: boolean;
  message: string;
}
```

## Data Models

### Frontend TypeScript Interfaces

```typescript
// Complaint Types
export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export interface Complaint {
  id: number;
  complaintId: string; // Display ID (e.g., C001234)
  title: string;
  description: string;
  category: string;
  priority: number;
  status: ComplaintStatus;
  location: string; // Formatted location string
  locationDetails?: {
    address: string;
    district: string;
    thana: string;
    ward: string;
    latitude?: number;
    longitude?: number;
  };
  imageUrls: string[];
  audioUrls: string[];
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
  timeAgo: string; // Computed field
}

export interface ComplaintFilters {
  search: string;
  status: ComplaintStatus | 'ALL';
  category?: string;
  ward?: string;
  startDate?: string;
  endDate?: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

// Chat Types
export interface ChatMessage {
  id: number;
  complaintId: number;
  senderId: number;
  senderType: 'ADMIN' | 'CITIZEN';
  senderName: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

// Analytics Types
export interface AnalyticsData {
  totalComplaints: number;
  statusBreakdown: ComplaintStats;
  categoryBreakdown: Record<string, number>;
  wardBreakdown: Record<string, number>;
  trends: TrendData[];
  averageResolutionTime: number;
  resolutionRate: number;
}

export interface TrendData {
  date: string;
  count: number;
  resolved: number;
  pending: number;
}
```

### Backend Database Schema (Prisma)

```prisma
// Enhanced Complaint Model
model Complaint {
  id            Int              @id @default(autoincrement())
  title         String
  description   String           @db.Text
  category      String?
  priority      Int              @default(1)
  status        ComplaintStatus  @default(PENDING)
  location      String
  imageUrl      String?          @db.Text // JSON array of image URLs
  audioUrl      String?          @db.Text // JSON array of audio URLs
  userId        Int?
  user          User?            @relation(fields: [userId], references: [id])
  trackingNumber String?         @unique
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  // Relations
  chatMessages  ChatMessage[]
  statusHistory StatusHistory[]
  
  @@index([status])
  @@index([userId])
  @@index([createdAt])
  @@index([category])
}

// New ChatMessage Model
model ChatMessage {
  id          Int      @id @default(autoincrement())
  complaintId Int
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)
  senderId    Int
  senderType  SenderType // ADMIN or CITIZEN
  message     String   @db.Text
  imageUrl    String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([complaintId])
  @@index([createdAt])
}

// New StatusHistory Model (for tracking status changes)
model StatusHistory {
  id          Int             @id @default(autoincrement())
  complaintId Int
  complaint   Complaint       @relation(fields: [complaintId], references: [id], onDelete: Cascade)
  oldStatus   ComplaintStatus
  newStatus   ComplaintStatus
  changedBy   Int             // Admin user ID
  note        String?         @db.Text
  createdAt   DateTime        @default(now())
  
  @@index([complaintId])
}

// Enums
enum ComplaintStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  REJECTED
}

enum SenderType {
  ADMIN
  CITIZEN
}
```

## Error Handling

### Frontend Error Handling Strategy

```typescript
// Error Types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error Handler Utility
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || 'An error occurred';
  }
  
  if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred';
};

// Usage in Components
try {
  await complaintService.updateStatus(id, newStatus);
  showToast('Status updated successfully', 'success');
} catch (error) {
  const errorMessage = handleApiError(error);
  showToast(errorMessage, 'error');
}
```

### Backend Error Handling

```typescript
// Custom Error Classes
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string, public errors?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Global Error Handler Middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message
    });
  }
  
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

## Testing Strategy

### Frontend Testing

#### Unit Tests
- Test individual components in isolation
- Test service functions
- Test utility functions
- Test custom hooks

**Tools**: Jest, React Testing Library

**Example Test Cases**:
```typescript
// ComplaintCard.test.tsx
describe('ComplaintCard', () => {
  it('should render complaint information correctly', () => {
    // Test implementation
  });
  
  it('should call onViewDetails when View Details button is clicked', () => {
    // Test implementation
  });
  
  it('should disable Mark Solved button for solved complaints', () => {
    // Test implementation
  });
});

// complaintService.test.ts
describe('complaintService', () => {
  it('should fetch complaints with correct parameters', async () => {
    // Test implementation
  });
  
  it('should handle API errors gracefully', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
- Test component interactions
- Test API integration
- Test state management

#### E2E Tests (Optional)
- Test complete user flows
- Test critical paths

**Tools**: Cypress or Playwright

### Backend Testing

#### Unit Tests
- Test service methods
- Test utility functions
- Test validation logic

**Tools**: Jest

**Example Test Cases**:
```typescript
// complaint.service.test.ts
describe('ComplaintService', () => {
  describe('getComplaints', () => {
    it('should return paginated complaints', async () => {
      // Test implementation
    });
    
    it('should filter complaints by status', async () => {
      // Test implementation
    });
  });
  
  describe('updateComplaintStatus', () => {
    it('should update complaint status successfully', async () => {
      // Test implementation
    });
    
    it('should create status history entry', async () => {
      // Test implementation
    });
  });
});
```

#### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication/authorization

**Tools**: Supertest, Jest

```typescript
// complaint.routes.test.ts
describe('Admin Complaint Routes', () => {
  it('GET /api/admin/complaints should return complaints', async () => {
    const response = await request(app)
      .get('/api/admin/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.complaints).toBeInstanceOf(Array);
  });
  
  it('PATCH /api/admin/complaints/:id/status should update status', async () => {
    const response = await request(app)
      .patch(`/api/admin/complaints/${complaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
      
    expect(response.body.data.complaint.status).toBe('IN_PROGRESS');
  });
});
```

## Performance Considerations

### Frontend Optimization

1. **Code Splitting**
   - Lazy load routes and heavy components
   - Use React.lazy() and Suspense

2. **Memoization**
   - Use React.memo() for expensive components
   - Use useMemo() and useCallback() for expensive computations

3. **Virtual Scrolling**
   - Implement virtual scrolling for long complaint lists
   - Use libraries like react-window or react-virtualized

4. **Image Optimization**
   - Lazy load images
   - Use thumbnails for previews
   - Implement progressive image loading

5. **Caching**
   - Cache API responses
   - Implement stale-while-revalidate strategy
   - Use React Query or SWR for data fetching

### Backend Optimization

1. **Database Indexing**
   - Add indexes on frequently queried fields
   - Optimize query performance

2. **Pagination**
   - Implement cursor-based pagination for large datasets
   - Limit default page size

3. **Caching**
   - Cache frequently accessed data (Redis)
   - Implement cache invalidation strategy

4. **Query Optimization**
   - Use Prisma's select to fetch only needed fields
   - Avoid N+1 queries with proper includes

5. **File Serving**
   - Use CDN for static assets
   - Implement image resizing and optimization

## Security Considerations

### Authentication & Authorization

1. **Admin Role Verification**
   - Verify admin role on every request
   - Implement role-based access control (RBAC)

2. **JWT Token Management**
   - Use secure token storage
   - Implement token refresh mechanism
   - Set appropriate token expiration

3. **API Security**
   - Validate all inputs
   - Sanitize user data
   - Implement rate limiting
   - Use HTTPS only

### Data Protection

1. **Sensitive Data**
   - Don't expose sensitive user information unnecessarily
   - Implement field-level permissions

2. **File Upload Security**
   - Validate file types and sizes
   - Scan for malware
   - Store files securely

3. **SQL Injection Prevention**
   - Use Prisma's parameterized queries
   - Never concatenate user input into queries

## Deployment Strategy

### Frontend Deployment

1. **Build Process**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://api.cleancare.com
   VITE_ENVIRONMENT=production
   ```

3. **Hosting Options**
   - Vercel (recommended)
   - Netlify
   - AWS S3 + CloudFront

### Backend Deployment

1. **Build Process**
   ```bash
   npm run build
   npx prisma generate
   npx prisma migrate deploy
   ```

2. **Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   NODE_ENV=production
   PORT=3000
   ```

3. **Hosting Options**
   - Railway
   - Heroku
   - AWS EC2/ECS
   - DigitalOcean

### Database Migration

1. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_chat_and_status_history
   ```

2. **Apply Migration**
   ```bash
   npx prisma migrate deploy
   ```

## Implementation Phases

### Phase 1: Backend API Development
- Create admin complaint routes
- Implement chat functionality
- Add analytics endpoints
- Create database migrations
- Write API tests

### Phase 2: Frontend Service Layer
- Create complaintService.ts
- Create chatService.ts
- Create analyticsService.ts
- Implement error handling
- Add TypeScript interfaces

### Phase 3: UI Components
- Enhance AllComplaints page
- Create ComplaintDetailsModal
- Create ChatModal
- Create ImageViewer
- Create AudioPlayer

### Phase 4: Integration & Testing
- Connect frontend to backend
- Implement loading states
- Add error handling
- Write integration tests
- Perform E2E testing

### Phase 5: Polish & Optimization
- Optimize performance
- Add animations
- Improve accessibility
- Fix bugs
- Documentation

