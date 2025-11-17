# Design Document

## Overview

This design document outlines the architecture and implementation details for the Clean Care mobile app complaint management system. The system enables users to submit complaints with text, images, and audio recordings, view their complaint history, and track complaint status in real-time.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├── ComplaintPage (Type Selection)                         │
│  ├── ComplaintDetailsPage (Form)                            │
│  ├── ComplaintListPage (User's Complaints)                  │
│  └── ComplaintDetailViewPage (Single Complaint)             │
├─────────────────────────────────────────────────────────────┤
│  State Management                                            │
│  └── ComplaintProvider (Provider pattern)                   │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                                            │
│  └── ComplaintRepository (API calls)                        │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  ├── ApiClient (HTTP client)                                │
│  ├── ImagePickerService (Image selection)                   │
│  └── AudioRecorderService (Audio recording)                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Routes                                                      │
│  └── /api/complaints/*                                       │
├─────────────────────────────────────────────────────────────┤
│  Controllers                                                 │
│  └── ComplaintController                                     │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ├── ComplaintService                                        │
│  └── FileUploadService                                       │
├─────────────────────────────────────────────────────────────┤
│  Middleware                                                  │
│  ├── AuthMiddleware (JWT validation)                        │
│  └── MulterMiddleware (File uploads)                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                            │
│  ├── users table                                             │
│  └── complaints table                                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Flutter Mobile App Components

#### ComplaintListPage
**Purpose**: Display all complaints submitted by the logged-in user

**UI Elements**:
- AppBar with title "My Complaints"
- Pull-to-refresh functionality
- List of complaint cards showing:
  - Complaint ID (e.g., "C001234")
  - Complaint type/title
  - Location
  - Status badge (color-coded)
  - Timestamp ("2 hours ago")
  - Thumbnail image (if available)
- Empty state message when no complaints exist
- Loading indicator during data fetch
- Error message with retry button

**State Management**:
```dart
class ComplaintListState {
  List<Complaint> complaints;
  bool isLoading;
  String? errorMessage;
  DateTime? lastRefresh;
}
```

#### ComplaintDetailViewPage
**Purpose**: Show detailed information about a single complaint

**UI Elements**:
- AppBar with back button and complaint ID
- Complaint information card:
  - Title and description
  - Full address details (district, thana, ward, city corporation)
  - Status badge
  - Submission timestamp
- Image gallery (if images attached)
  - Swipeable image carousel
  - Tap to view full-screen
- Audio player (if audio attached)
  - Play/pause button
  - Progress bar
  - Duration display
- Admin response section (if any updates)

#### ComplaintDetailsPage (Form)
**Purpose**: Collect complaint information from user

**Form Fields**:
- Complaint type (pre-selected from previous page)
- Description (TextFormField, multiline, min 10 chars)
- District (Dropdown)
- Thana (Dropdown, filtered by district)
- Ward (TextFormField, numeric)
- City Corporation (Dropdown)
- Full Address (TextFormField, multiline)
- Image attachment (optional, up to 3 images)
- Audio recording (optional, record or upload)

**Validation Rules**:
- Description: Required, minimum 10 characters
- District: Required
- Thana: Required
- Ward: Required, must be numeric
- City Corporation: Required
- Full Address: Required, minimum 10 characters

**UI Features**:
- Real-time validation with error messages
- Image preview thumbnails with remove option
- Audio recording interface with record/stop/play controls
- Submit button (disabled until form is valid)
- Loading indicator during submission

### 2. State Management (Provider)

#### ComplaintProvider
```dart
class ComplaintProvider extends ChangeNotifier {
  final ComplaintRepository _repository;
  
  // State
  List<Complaint> _complaints = [];
  bool _isLoading = false;
  String? _errorMessage;
  String? _selectedCategory;
  
  // Getters
  List<Complaint> get complaints => _complaints;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get selectedCategory => _selectedCategory;
  
  // Methods
  Future<void> fetchComplaints();
  Future<void> createComplaint(ComplaintFormData data);
  Future<Complaint> getComplaintById(int id);
  void setCategory(String category);
  void clearError();
}
```

### 3. Repository Layer

#### ComplaintRepository
```dart
class ComplaintRepository {
  final ApiClient _api;
  
  // Fetch all complaints for logged-in user
  Future<List<Complaint>> getMyComplaints();
  
  // Fetch single complaint by ID
  Future<Complaint> getComplaintById(int id);
  
  // Create new complaint with files
  Future<Complaint> createComplaint({
    required String description,
    required String complaintType,
    required String district,
    required String thana,
    required String ward,
    required String cityCorporation,
    required String fullAddress,
    List<File>? images,
    File? audio,
  });
  
  // Update complaint status (for admin use later)
  Future<void> updateComplaintStatus(int id, String status);
}
```

### 4. Service Layer

#### ImagePickerService
```dart
class ImagePickerService {
  final ImagePicker _picker = ImagePicker();
  
  // Pick single image from gallery
  Future<File?> pickImage();
  
  // Pick multiple images (max 3)
  Future<List<File>> pickMultipleImages({int maxImages = 3});
  
  // Take photo with camera
  Future<File?> takePhoto();
  
  // Compress image before upload
  Future<File> compressImage(File image);
}
```

#### AudioRecorderService
```dart
class AudioRecorderService {
  final FlutterSoundRecorder _recorder = FlutterSoundRecorder();
  
  // Initialize recorder
  Future<void> init();
  
  // Start recording
  Future<void> startRecording(String path);
  
  // Stop recording and return file
  Future<File?> stopRecording();
  
  // Check if recording
  bool get isRecording;
  
  // Get recording duration
  Stream<Duration> get recordingDuration;
  
  // Dispose recorder
  Future<void> dispose();
}
```

## Data Models

### Complaint Model (Flutter)
```dart
class Complaint {
  final int id;
  final int userId;
  final String title;
  final String description;
  final String location;
  final String? imageUrl;
  final String? audioUrl;
  final ComplaintStatus status;
  final int priority;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Additional fields for display
  String? district;
  String? thana;
  String? ward;
  String? cityCorporation;
  String? fullAddress;
  
  // Helper methods
  String get statusText;
  Color get statusColor;
  String get timeAgo;
  List<String> get imageUrls; // Parse comma-separated URLs
}

enum ComplaintStatus {
  pending,
  inProgress,
  resolved,
  rejected,
}
```

### ComplaintFormData (Flutter)
```dart
class ComplaintFormData {
  final String description;
  final String complaintType;
  final String district;
  final String thana;
  final String ward;
  final String cityCorporation;
  final String fullAddress;
  final List<File>? images;
  final File? audio;
  
  Map<String, dynamic> toJson();
}
```

## Backend API Design

### Database Schema Updates

The existing Complaint table needs to be updated to store additional location details:

```prisma
model Complaint {
  id              Int             @id @default(autoincrement())
  title           String
  description     String          @db.Text
  location        String          // Keep for backward compatibility
  district        String?
  thana           String?
  ward            String?
  cityCorporation String?
  fullAddress     String?         @db.Text
  imageUrl        String?         @db.Text  // Comma-separated URLs
  audioUrl        String?         @db.Text  // Single URL
  status          ComplaintStatus @default(PENDING)
  priority        Int             @default(1)
  userId          Int?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  user            User?           @relation(fields: [userId], references: [id])

  @@index([userId, status])
  @@index([createdAt])
}
```

### API Endpoints

#### 1. Create Complaint
```
POST /api/complaints
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- description: string (required)
- complaintType: string (required)
- district: string (required)
- thana: string (required)
- ward: string (required)
- cityCorporation: string (required)
- fullAddress: string (required)
- images: File[] (optional, max 3)
- audio: File (optional)

Response 201:
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "id": 123,
    "title": "Household Waste",
    "description": "...",
    "location": "Dhaka, Uttara, Ward 300",
    "district": "Dhaka",
    "thana": "Uttara",
    "ward": "300",
    "cityCorporation": "DNCC",
    "fullAddress": "...",
    "imageUrl": "uploads/complaints/img1.jpg,uploads/complaints/img2.jpg",
    "audioUrl": "uploads/complaints/audio1.mp3",
    "status": "PENDING",
    "userId": 1,
    "createdAt": "2025-11-14T10:30:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}

Response 400:
{
  "success": false,
  "message": "Validation error",
  "errors": ["Description is required", "Ward must be numeric"]
}
```

#### 2. Get My Complaints
```
GET /api/complaints/my
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string (optional: PENDING, IN_PROGRESS, RESOLVED)

Response 200:
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
        "cityCorporation": "DNCC",
        "fullAddress": "...",
        "imageUrl": "uploads/complaints/img1.jpg",
        "audioUrl": "uploads/complaints/audio1.mp3",
        "status": "PENDING",
        "createdAt": "2025-11-14T10:30:00Z",
        "updatedAt": "2025-11-14T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### 3. Get Complaint by ID
```
GET /api/complaints/:id
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Household Waste",
    "description": "...",
    "location": "Dhaka, Uttara, Ward 300",
    "district": "Dhaka",
    "thana": "Uttara",
    "ward": "300",
    "cityCorporation": "DNCC",
    "fullAddress": "...",
    "imageUrl": "uploads/complaints/img1.jpg,uploads/complaints/img2.jpg",
    "audioUrl": "uploads/complaints/audio1.mp3",
    "status": "PENDING",
    "priority": 1,
    "userId": 1,
    "createdAt": "2025-11-14T10:30:00Z",
    "updatedAt": "2025-11-14T10:30:00Z",
    "user": {
      "id": 1,
      "firstName": "Rahim",
      "lastName": "Ahmed",
      "phone": "01712345678",
      "email": "customer1@demo.com"
    }
  }
}

Response 404:
{
  "success": false,
  "message": "Complaint not found"
}

Response 403:
{
  "success": false,
  "message": "You don't have permission to view this complaint"
}
```

### Backend Implementation Structure

#### Routes (server/src/routes/complaint.routes.ts)
```typescript
import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const controller = new ComplaintController();

// All routes require authentication
router.use(authMiddleware);

// Create complaint with file uploads
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'audio', maxCount: 1 }
  ]),
  controller.create
);

// Get my complaints
router.get('/my', controller.getMyComplaints);

// Get complaint by ID
router.get('/:id', controller.getById);

// Update complaint status (admin only)
router.patch('/:id/status', controller.updateStatus);

export default router;
```

#### Controller (server/src/controllers/complaint.controller.ts)
```typescript
import { Request, Response } from 'express';
import { ComplaintService } from '../services/complaint.service';

export class ComplaintController {
  private service = new ComplaintService();

  create = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const complaint = await this.service.create({
        ...req.body,
        userId,
        images: files?.images,
        audio: files?.audio?.[0],
      });

      res.status(201).json({
        success: true,
        message: 'Complaint created successfully',
        data: complaint,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getMyComplaints = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const result = await this.service.getByUserId(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;

      const complaint = await this.service.getById(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
      }

      // Check ownership (users can only view their own complaints, admins can view all)
      if (complaint.userId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this complaint",
        });
      }

      res.json({
        success: true,
        data: complaint,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    // Admin only - will implement later
  };
}
```

#### Service (server/src/services/complaint.service.ts)
```typescript
import { PrismaClient, ComplaintStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ComplaintService {
  async create(data: {
    userId: number;
    description: string;
    complaintType: string;
    district: string;
    thana: string;
    ward: string;
    cityCorporation: string;
    fullAddress: string;
    images?: Express.Multer.File[];
    audio?: Express.Multer.File;
  }) {
    // Validate required fields
    this.validateComplaintData(data);

    // Build location string for backward compatibility
    const location = `${data.district}, ${data.thana}, Ward ${data.ward}`;

    // Process image URLs
    const imageUrl = data.images
      ? data.images.map(img => img.path).join(',')
      : null;

    // Process audio URL
    const audioUrl = data.audio ? data.audio.path : null;

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        userId: data.userId,
        title: data.complaintType,
        description: data.description,
        location,
        district: data.district,
        thana: data.thana,
        ward: data.ward,
        cityCorporation: data.cityCorporation,
        fullAddress: data.fullAddress,
        imageUrl,
        audioUrl,
        status: ComplaintStatus.PENDING,
        priority: 1,
      },
    });

    return complaint;
  }

  async getByUserId(
    userId: number,
    options: { page: number; limit: number; status?: string }
  ) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status: status as ComplaintStatus }),
    };

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    return prisma.complaint.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  private validateComplaintData(data: any) {
    const errors: string[] = [];

    if (!data.description || data.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (!data.complaintType) {
      errors.push('Complaint type is required');
    }

    if (!data.district) {
      errors.push('District is required');
    }

    if (!data.thana) {
      errors.push('Thana is required');
    }

    if (!data.ward) {
      errors.push('Ward is required');
    }

    if (data.ward && isNaN(Number(data.ward))) {
      errors.push('Ward must be a number');
    }

    if (!data.cityCorporation) {
      errors.push('City Corporation is required');
    }

    if (!data.fullAddress || data.fullAddress.length < 10) {
      errors.push('Full address must be at least 10 characters');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
```

#### File Upload Middleware (server/src/middleware/upload.middleware.ts)
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/complaints');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'images') {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for images field'));
    }
  } else if (file.fieldname === 'audio') {
    // Accept audio only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for audio field'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
```

## Error Handling

### Flutter Error Handling
```dart
class ComplaintException implements Exception {
  final String message;
  final int? statusCode;
  
  ComplaintException(this.message, [this.statusCode]);
  
  @override
  String toString() => message;
}

// In ComplaintRepository
try {
  final response = await _api.post('/api/complaints', data);
  return Complaint.fromJson(response['data']);
} on ApiException catch (e) {
  if (e.statusCode == 400) {
    throw ComplaintException('Invalid complaint data: ${e.message}', 400);
  } else if (e.statusCode == 401) {
    throw ComplaintException('Please login to submit complaints', 401);
  } else {
    throw ComplaintException('Failed to create complaint: ${e.message}');
  }
} catch (e) {
  throw ComplaintException('Network error: ${e.toString()}');
}
```

### Backend Error Handling
```typescript
// Global error handler in app.ts
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});
```

## Testing Strategy

### Unit Tests
1. **ComplaintRepository Tests**
   - Test API calls with mock responses
   - Test error handling
   - Test data transformation

2. **ComplaintProvider Tests**
   - Test state updates
   - Test loading states
   - Test error states

3. **Backend Service Tests**
   - Test complaint creation with valid data
   - Test validation errors
   - Test file upload handling

### Integration Tests
1. **End-to-End Complaint Flow**
   - User submits complaint with images and audio
   - Verify complaint appears in list
   - Verify complaint details are correct

2. **API Integration Tests**
   - Test all API endpoints
   - Test authentication
   - Test file uploads

### Manual Testing Checklist
- [ ] Submit complaint with all fields
- [ ] Submit complaint with images only
- [ ] Submit complaint with audio only
- [ ] Submit complaint with both images and audio
- [ ] View complaint list
- [ ] Pull to refresh complaint list
- [ ] View complaint details
- [ ] Play audio in complaint details
- [ ] View images in complaint details
- [ ] Test with no internet connection
- [ ] Test with slow internet connection

## Performance Considerations

1. **Image Optimization**
   - Compress images before upload (max 1MB per image)
   - Use thumbnails in list view
   - Lazy load full-size images

2. **Audio Optimization**
   - Limit audio recording to 2 minutes
   - Compress audio files (use AAC format)
   - Stream audio instead of downloading

3. **List Performance**
   - Implement pagination (20 items per page)
   - Use ListView.builder for efficient rendering
   - Cache complaint list locally

4. **Network Optimization**
   - Implement retry logic for failed requests
   - Show cached data while loading fresh data
   - Use connection status to show offline indicator

## Security Considerations

1. **Authentication**
   - All API endpoints require valid JWT token
   - Validate token on every request
   - Users can only view their own complaints

2. **File Upload Security**
   - Validate file types (images: jpg, png, webp; audio: mp3, aac, m4a)
   - Limit file sizes (images: 5MB, audio: 10MB)
   - Sanitize file names
   - Store files outside web root

3. **Data Validation**
   - Validate all input on both client and server
   - Sanitize user input to prevent XSS
   - Use parameterized queries to prevent SQL injection

4. **Privacy**
   - Don't expose user personal information in complaint list
   - Only show full details to complaint owner and admins
   - Implement proper access control

## Deployment Considerations

1. **Database Migration**
   - Update Complaint table schema
   - Run migration on production database
   - Backup database before migration

2. **File Storage**
   - Create uploads/complaints directory
   - Set proper permissions (755)
   - Consider using cloud storage (S3, Cloudinary) for production

3. **Environment Variables**
   - Set proper API URLs for production
   - Configure file upload limits
   - Set JWT secrets

4. **Monitoring**
   - Log all complaint submissions
   - Monitor file upload errors
   - Track API response times
