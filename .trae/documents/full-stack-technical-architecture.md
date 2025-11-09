# ক্লিন কেয়ার সার্ভিস - সম্পূর্ণ প্রযুক্তিগত স্থাপত্য নথি

## ১. সিস্টেম ওভারভিউ এবং স্থাপত্য

### ১.১ প্রকল্প পরিচিতি
ক্লিন কেয়ার সার্ভিস একটি সম্পূর্ণ ডিজিটাল সমাধান যা পরিষ্কার পরিচ্ছন্নতা সেবা প্রদানকারী সংস্থাগুলোর জন্য কাস্টমার ম্যানেজমেন্ট, অভিযোগ ব্যবস্থাপনা, পেমেন্ট প্রসেসিং এবং রিয়েল-টাইম কমিউনিকেশন সুবিধা প্রদান করে।

### ১.২ সিস্টেম স্থাপত্য

```mermaid
graph TB
    subgraph "Client Layer"
        A[Flutter Mobile App] --> B[User Interface]
        C[Admin Dashboard] --> D[Web Interface]
    end
    
    subgraph "API Gateway"
        E[REST API] --> F[Authentication]
        E --> G[Rate Limiting]
    end
    
    subgraph "Backend Services"
        H[User Service]
        I[Complaint Service]
        J[Payment Service]
        K[Notification Service]
        L[File Service]
    end
    
    subgraph "Data Layer"
        M[(MySQL Database)]
        N[Redis Cache]
        O[File Storage]
    end
    
    A --> E
    C --> E
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    
    H --> M
    I --> M
    J --> M
    K --> N
    L --> O
    
    style A fill:#4CAF50
    style C fill:#2196F3
    style E fill:#FF9800
    style M fill:#9C27B0
```

## ২. প্রযুক্তি স্ট্যাক এবং সরঞ্জাম

### ২.১ ফ্রন্টএন্ড প্রযুক্তি
- **Framework**: Flutter 3.16+
- **Programming Language**: Dart
- **State Management**: Provider/Riverpod
- **HTTP Client**: Dio
- **Local Storage**: SharedPreferences, SQLite
- **Image Processing**: Image Picker, Cached Network Image
- **Maps Integration**: Google Maps Flutter
- **Push Notifications**: Firebase Cloud Messaging

### ২.২ ব্যাকএন্ড প্রযুক্তি
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **Framework**: Express.js
- **ORM**: Prisma 5+
- **Database**: MySQL 8+
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi/Zod
- **File Upload**: Multer
- **Email Service**: Nodemailer
- **SMS Service**: Twilio
- **Real-time Communication**: Socket.io

### ২.৩ ডেভেলপমেন্ট টুলস
- **Version Control**: Git
- **API Testing**: Postman/Insomnia
- **Database Client**: MySQL Workbench
- **Flutter IDE**: Android Studio/VS Code
- **Backend IDE**: VS Code
- **Package Manager**: npm, pub

## ৩. ডেটাবেস স্থাপত্য এবং মডেল ডিজাইন

### ৩.১ ইআর ডায়াগ্রাম

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : creates
    USERS ||--o{ PAYMENTS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    COMPLAINTS ||--o{ COMPLAINT_IMAGES : has
    COMPLAINTS ||--o{ COMPLAINT_STATUS : tracks
    COMPLAINTS }o--|| CATEGORIES : belongs_to
    PAYMENTS ||--|| PAYMENT_METHODS : uses
    ADMIN ||--o{ COMPLAINT_STATUS : updates

    USERS {
        uuid id PK
        string email UK
        string password
        string full_name
        string phone
        string address
        string user_type
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    COMPLAINTS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        string title
        text description
        string priority
        string status
        decimal latitude
        decimal longitude
        string address
        timestamp scheduled_date
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string description
        boolean is_active
    }

    COMPLAINT_IMAGES {
        uuid id PK
        uuid complaint_id FK
        string image_url
        string image_type
        timestamp created_at
    }

    COMPLAINT_STATUS {
        uuid id PK
        uuid complaint_id FK
        uuid admin_id FK
        string status
        text notes
        timestamp created_at
    }

    PAYMENTS {
        uuid id PK
        uuid user_id FK
        uuid complaint_id FK
        decimal amount
        string payment_method
        string transaction_id
        string status
        timestamp payment_date
        timestamp created_at
    }

    PAYMENT_METHODS {
        uuid id PK
        string name
        string description
        boolean is_active
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        text message
        string type
        boolean is_read
        timestamp created_at
    }

    ADMIN {
        uuid id PK
        string email UK
        string password
        string full_name
        string role
        boolean is_active
        timestamp created_at
    }
```

### ৩.২ প্রিসমা স্কিমা ডিফিনিশন

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id          String    @id @default(uuid()) @db.VarChar(36)
  email       String    @unique @db.VarChar(255)
  password    String    @db.VarChar(255)
  fullName    String    @map("full_name") @db.VarChar(100)
  phone       String?   @db.VarChar(20)
  address     String?   @db.Text
  userType    String    @default("customer") @map("user_type") @db.VarChar(20)
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  complaints  Complaint[]
  payments    Payment[]
  notifications Notification[]
  
  @@map("users")
}

model Complaint {
  id            String    @id @default(uuid()) @db.VarChar(36)
  userId        String    @map("user_id") @db.VarChar(36)
  categoryId    String    @map("category_id") @db.VarChar(36)
  title         String    @db.VarChar(255)
  description   String    @db.Text
  priority      String    @default("medium") @db.VarChar(20)
  status        String    @default("pending") @db.VarChar(20)
  latitude      Decimal?  @db.Decimal(10, 8)
  longitude     Decimal?  @db.Decimal(11, 8)
  address       String?   @db.Text
  scheduledDate DateTime? @map("scheduled_date")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  user          User      @relation(fields: [userId], references: [id])
  category      Category  @relation(fields: [categoryId], references: [id])
  images        ComplaintImage[]
  statusHistory ComplaintStatus[]
  payments      Payment[]
  
  @@map("complaints")
}

model Category {
  id          String     @id @default(uuid()) @db.VarChar(36)
  name        String     @db.VarChar(100)
  description String?    @db.Text
  isActive    Boolean    @default(true) @map("is_active")
  
  complaints  Complaint[]
  
  @@map("categories")
}

model ComplaintImage {
  id          String    @id @default(uuid()) @db.VarChar(36)
  complaintId String    @map("complaint_id") @db.VarChar(36)
  imageUrl    String    @map("image_url") @db.Text
  imageType   String    @default("before") @map("image_type") @db.VarChar(20)
  createdAt   DateTime  @default(now()) @map("created_at")
  
  complaint   Complaint @relation(fields: [complaintId], references: [id])
  
  @@map("complaint_images")
}

model ComplaintStatus {
  id          String    @id @default(uuid()) @db.VarChar(36)
  complaintId String    @map("complaint_id") @db.VarChar(36)
  adminId     String?   @map("admin_id") @db.VarChar(36)
  status      String    @db.VarChar(20)
  notes       String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")
  
  complaint   Complaint @relation(fields: [complaintId], references: [id])
  
  @@map("complaint_status")
}

model Payment {
  id             String   @id @default(uuid()) @db.VarChar(36)
  userId         String   @map("user_id") @db.VarChar(36)
  complaintId    String   @map("complaint_id") @db.VarChar(36)
  amount         Decimal  @db.Decimal(10, 2)
  paymentMethod  String   @map("payment_method") @db.VarChar(50)
  transactionId  String   @map("transaction_id") @db.VarChar(100)
  status         String   @default("pending") @db.VarChar(20)
  paymentDate    DateTime @default(now()) @map("payment_date")
  createdAt      DateTime @default(now()) @map("created_at")
  
  user           User     @relation(fields: [userId], references: [id])
  complaint      Complaint @relation(fields: [complaintId], references: [id])
  
  @@map("payments")
}

model Notification {
  id        String   @id @default(uuid()) @db.VarChar(36)
  userId    String   @map("user_id") @db.VarChar(36)
  title     String   @db.VarChar(255)
  message   String   @db.Text
  type      String   @db.VarChar(50)
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("notifications")
}

model Admin {
  id        String   @id @default(uuid()) @db.VarChar(36)
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  fullName  String   @map("full_name") @db.VarChar(100)
  role      String   @default("admin") @db.VarChar(20)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("admins")
}
```

## ৪. এপিআই এন্ডপয়েন্ট এবং রিকোয়েস্ট/রেসপন্স স্পেসিফিকেশন

### ৪.১ অথেনটিকেশন এপিআই

#### ইউজার রেজিস্ট্রেশন
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "phone": "+8801234567890",
  "address": "123 Street, City"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### ইউজার লগইন
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "fullName": "John Doe",
      "userType": "customer"
    }
  }
}
```

### ৪.২ কমপ্লেইন্ট ম্যানেজমেন্ট এপিআই

#### নতুন কমপ্লেইন্ট তৈরি
```http
POST /api/complaints
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "House Cleaning Required",
  "description": "Need thorough cleaning of 2 bedroom apartment",
  "categoryId": "category-uuid",
  "priority": "high",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "address": "123 Street, Dhaka",
  "scheduledDate": "2024-01-15T10:00:00Z"
}
```

#### কমপ্লেইন্ট তালিকা
```http
GET /api/complaints?page=1&limit=10&status=pending
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": "complaint-uuid",
        "title": "House Cleaning Required",
        "description": "Need thorough cleaning...",
        "status": "pending",
        "priority": "high",
        "createdAt": "2024-01-10T08:00:00Z",
        "category": {
          "id": "category-uuid",
          "name": "House Cleaning"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### কমপ্লেইন্ট আপডেট
```http
PUT /api/complaints/{complaintId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in-progress",
  "notes": "Technician assigned and will arrive soon"
}
```

### ৪.৩ পেমেন্ট এপিআই

#### পেমেন্ট ইনিশিয়েশন
```http
POST /api/payments/initiate
Authorization: Bearer {token}
Content-Type: application/json

{
  "complaintId": "complaint-uuid",
  "amount": 1500.00,
  "paymentMethod": "bkash",
  "customerPhone": "+8801234567890"
}
```

#### পেমেন্ট ভেরিফিকেশন
```http
POST /api/payments/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "transaction-123",
  "paymentId": "payment-uuid"
}
```

## ৫. ফ্লাটার অ্যাপ স্ট্রাকচার এবং স্টেট ম্যানেজমেন্ট

### ৫.১ প্রজেক্ট স্ট্রাকচার
```
lib/
├── main.dart
├── config/
│   ├── app_config.dart
│   ├── theme.dart
│   └── routes.dart
├── models/
│   ├── user_model.dart
│   ├── complaint_model.dart
│   ├── payment_model.dart
│   └── notification_model.dart
├── providers/
│   ├── auth_provider.dart
│   ├── complaint_provider.dart
│   ├── payment_provider.dart
│   └── notification_provider.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── complaint_service.dart
│   ├── payment_service.dart
│   ├── notification_service.dart
│   └── local_storage_service.dart
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── forgot_password_screen.dart
│   ├── home/
│   │   ├── home_screen.dart
│   │   ├── dashboard_screen.dart
│   │   └── profile_screen.dart
│   ├── complaints/
│   │   ├── complaint_list_screen.dart
│   │   ├── complaint_detail_screen.dart
│   │   ├── create_complaint_screen.dart
│   │   └── complaint_tracking_screen.dart
│   ├── payments/
│   │   ├── payment_screen.dart
│   │   ├── payment_history_screen.dart
│   │   └── invoice_screen.dart
│   └── notifications/
│       ├── notification_screen.dart
│       └── notification_detail_screen.dart
├── widgets/
│   ├── custom_app_bar.dart
│   ├── loading_widget.dart
│   ├── error_widget.dart
│   ├── complaint_card.dart
│   └── payment_card.dart
└── utils/
    ├── constants.dart
    ├── validators.dart
    ├── helpers.dart
    └── extensions.dart
```

### ৫.২ স্টেট ম্যানেজমেন্ট আর্কিটেকচার

```mermaid
graph TD
    A[UI Layer] --> B[Provider Layer]
    B --> C[Service Layer]
    C --> D[API Layer]
    
    subgraph "State Management Flow"
        B --> E[State Changes]
        E --> A
    end
    
    subgraph "Data Flow"
        D --> F[Backend API]
        F --> D
        C --> G[Local Storage]
        G --> C
    end
```

### ৫.৩ অথ প্রোভাইডার উদাহরণ
```dart
// auth_provider.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _authService.login(email, password);
      if (response.success) {
        _user = response.user;
        await _authService.saveToken(response.token);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.message;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final token = await _authService.getToken();
    if (token != null) {
      final user = await _authService.getCurrentUser();
      _user = user;
      notifyListeners();
    }
  }
}
```

## ৬. অথেনটিকেশন এবং অথরাইজেশন ফ্লো

### ৬.১ রেজিস্ট্রেশন ফ্লো
```mermaid
sequenceDiagram
    participant User
    participant FlutterApp
    participant BackendAPI
    participant Database

    User->>FlutterApp: Fill registration form
    FlutterApp->>FlutterApp: Validate input
    FlutterApp->>BackendAPI: POST /api/auth/register
    BackendAPI->>BackendAPI: Validate data
    BackendAPI->>Database: Check email exists
    Database-->>BackendAPI: Email status
    BackendAPI->>BackendAPI: Hash password
    BackendAPI->>Database: Create user
    Database-->>BackendAPI: User created
    BackendAPI-->>FlutterApp: Success response
    FlutterApp-->>User: Registration successful
```

### ৬.২ লগইন ফ্লো
```mermaid
sequenceDiagram
    participant User
    participant FlutterApp
    participant BackendAPI
    participant Database
    participant JWT

    User->>FlutterApp: Enter credentials
    FlutterApp->>BackendAPI: POST /api/auth/login
    BackendAPI->>Database: Find user by email
    Database-->>BackendAPI: User data
    BackendAPI->>BackendAPI: Verify password
    alt Password correct
        BackendAPI->>JWT: Generate token
        JWT-->>BackendAPI: JWT token
        BackendAPI-->>FlutterApp: Token + user data
        FlutterApp->>FlutterApp: Store token locally
        FlutterApp-->>User: Login successful
    else Password incorrect
        BackendAPI-->>FlutterApp: Error response
        FlutterApp-->>User: Show error
    end
```

## ৭. রিয়েল-টাইম ফিচার ইমপ্লিমেন্টেশন

### ৭.১ নোটিফিকেশন সিস্টেম
```typescript
// notification.service.ts
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

export class RealTimeNotificationService {
  constructor(
    private io: Server,
    private notificationService: NotificationService
  ) {}

  handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId;
    
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} connected to notification room`);
    }

    socket.on('disconnect', () => {
      console.log('User disconnected from notifications');
    });
  }

  async sendNotification(userId: string, notification: any) {
    // Save to database
    await this.notificationService.createNotification(userId, notification);
    
    // Send real-time notification
    this.io.to(`user_${userId}`).emit('new_notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: new Date()
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.notificationService.markAsRead(notificationId);
    this.io.to(`user_${userId}`).emit('notification_read', {
      notificationId
    });
  }
}
```

### ৭.২ ফ্লাটার সাইড সকেট ইন্টিগ্রেশন
```dart
// socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? _socket;
  final String _baseUrl = 'https://api.cleancare.com';

  void connect(String userId) {
    _socket = IO.io(_baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'query': {'userId': userId}
    });

    _socket?.connect();

    _socket?.on('connect', (_) {
      print('Connected to socket server');
    });

    _socket?.on('new_notification', (data) {
      // Handle new notification
      NotificationService.handleNewNotification(data);
    });

    _socket?.on('complaint_status_updated', (data) {
      // Handle complaint status update
      ComplaintService.updateComplaintStatus(data);
    });
  }

  void disconnect() {
    _socket?.disconnect();
  }

  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }
}
```

## ৮. ফাইল আপলোড/ডাউনলোড হ্যান্ডলিং

### ৮.১ ব্যাকএন্ড ফাইল সার্ভিস
```typescript
// file.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@@aws-sdk/client-s3';
import { getSignedUrl } from '@@aws-sdk/s3-request-presigner';
import multer from 'multer';

export class FileService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }

  // Configure multer for file upload
  getUploadMiddleware() {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    return upload.array('images', 5); // Max 5 images
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    });

    await this.s3Client.send(command);
    
    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

### ৮.২ ফ্লাটার ফাইল আপলোড
```dart
// file_service.dart
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

class FileService {
  final Dio _dio = Dio();
  final String _baseUrl = 'https://api.cleancare.com';

  Future<List<String>> uploadImages(List<XFile> images, String complaintId) async {
    try {
      List<MultipartFile> files = [];
      
      for (var image in images) {
        files.add(await MultipartFile.fromFile(image.path));
      }

      FormData formData = FormData.fromMap({
        'complaintId': complaintId,
        'images': files
      });

      final response = await _dio.post(
        '$_baseUrl/api/files/upload',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer ${await getToken()}',
            'Content-Type': 'multipart/form-data'
          }
        )
      );

      if (response.statusCode == 200) {
        return List<String>.from(response.data['imageUrls']);
      } else {
        throw Exception('Failed to upload images');
      }
    } catch (e) {
      throw Exception('Error uploading images: $e');
    }
  }

  Future<XFile?> pickImage(ImageSource source) async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: source);
    return image;
  }

  Future<List<XFile>> pickMultipleImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> images = await picker.pickMultiImage();
    return images;
  }
}
```

## ৯. পেমেন্ট ইন্টিগ্রেশন স্থাপত্য

### ৯.১ পেমেন্ট ফ্লো ডায়াগ্রাম
```mermaid
sequenceDiagram
    participant Customer
    participant FlutterApp
    participant BackendAPI
    participant PaymentGateway
    participant Database

    Customer->>FlutterApp: Request service
    FlutterApp->>BackendAPI: Create complaint
    BackendAPI->>Database: Save complaint
    BackendAPI-->>FlutterApp: Complaint created
    
    Customer->>FlutterApp: Initiate payment
    FlutterApp->>BackendAPI: Payment request
    BackendAPI->>PaymentGateway: Create payment
    PaymentGateway-->>BackendAPI: Payment URL
    BackendAPI-->>FlutterApp: Payment details
    
    FlutterApp->>PaymentGateway: Process payment
    PaymentGateway-->>FlutterApp: Payment result
    FlutterApp->>BackendAPI: Verify payment
    BackendAPI->>PaymentGateway: Confirm payment
    PaymentGateway-->>BackendAPI: Payment status
    BackendAPI->>Database: Update payment
    BackendAPI-->>FlutterApp: Payment confirmed
```

### ৯.২ পেমেন্ট সার্ভিস ইমপ্লিমেন্টেশন
```typescript
// payment.service.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private bkashConfig: any
  ) {}

  async initiatePayment(userId: string, complaintId: string, amount: number, paymentMethod: string) {
    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        complaintId,
        amount,
        paymentMethod,
        status: 'pending'
      }
    });

    // Initiate payment based on method
    switch (paymentMethod) {
      case 'bkash':
        return this.initiateBkashPayment(payment.id, amount);
      case 'nagad':
        return this.initiateNagadPayment(payment.id, amount);
      case 'card':
        return this.initiateCardPayment(payment.id, amount);
      default:
        throw new Error('Unsupported payment method');
    }
  }

  private async initiateBkashPayment(paymentId: string, amount: number) {
    try {
      // Get access token
      const tokenResponse = await axios.post(
        `${this.bkashConfig.baseUrl}/token/grant`,
        {
          app_key: this.bkashConfig.appKey,
          app_secret: this.bkashConfig.appSecret
        }
      );

      const accessToken = tokenResponse.data.id_token;

      // Create payment
      const paymentResponse = await axios.post(
        `${this.bkashConfig.baseUrl}/payment/create`,
        {
          amount: amount,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: paymentId
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-App-Key': this.bkashConfig.appKey
          }
        }
      );

      return {
        paymentId,
        bkashURL: paymentResponse.data.bkashURL,
        paymentID: paymentResponse.data.paymentID
      };
    } catch (error) {
      throw new Error(`Bkash payment initiation failed: ${error.message}`);
    }
  }

  async verifyPayment(paymentId: string, transactionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    try {
      // Verify with payment gateway
      const verificationResponse = await this.verifyWithGateway(transactionId, payment.paymentMethod);
      
      if (verificationResponse.status === 'completed') {
        // Update payment status
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'completed',
            transactionId
          }
        });

        // Update complaint status
        await this.prisma.complaint.update({
          where: { id: payment.complaintId },
          data: { status: 'paid' }
        });

        return {
          success: true,
          message: 'Payment verified successfully'
        };
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      // Update payment status to failed
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'failed' }
      });

      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }
}
```

## ১০. এরর হ্যান্ডলিং এবং লগিং স্ট্র্যাটেজি

### ১০.১ গ্লোবাল এরর হ্যান্ডলিং
```typescript
// error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  console.error({
    error: err,
    request: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
```

### ১০.২ লগিং সিস্টেম
```typescript
// logger.service.ts
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'clean-care-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join('logs', 'combined.log')
    }),
    
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
  ]
});

// Custom log levels for different scenarios
export const logLevels = {
  HTTP_REQUEST: 'http',
  DATABASE_QUERY: 'db',
  AUTHENTICATION: 'auth',
  PAYMENT_PROCESSING: 'payment',
  NOTIFICATION: 'notification'
};
```

## ১১. নিরাপত্তা সেরা অনুশীলন

### ১১.১ সিকিউরিটি মিডলওয়্যার
```typescript
// security.middleware.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Strict rate limiting for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions: cors.Options = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://cleancare.com',
      'https://admin.cleancare.com'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Data sanitization against NoSQL query injection
export const mongoSanitizeMiddleware = mongoSanitize();

// Data sanitization against XSS
export const xssMiddleware = xss();

// Prevent parameter pollution
export const hppMiddleware = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit']
});
```

### ১১.২ এনক্রিপশন এবং হ্যাশিং
```typescript
// crypto.service.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class CryptoService {
  private algorithm = 'aes-256-gcm';
  private secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Encrypt sensitive data
  encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate secure random token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
```

## ১২. পারফরম্যান্স অপটিমাইজেশন

### ১২.১ ক্যাশিং স্ট্র্যাটেজি
```typescript
// cache.service.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  // Cache wrapper for database queries
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetchFunction();
    await this.set(key, JSON.stringify(data), ttl || this.defaultTTL);
    
    return data;
  }
}
```

### ১২.২ ডেটাবেস অপটিমাইজেশন
```sql
-- Database indexes for performance optimization

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Complaint indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_category_id ON complaints(category_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_scheduled_date ON complaints(scheduled_date);

-- Payment indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_complaint_id ON payments(complaint_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_complaints_user_status ON complaints(user_id, status);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### ১২.৩ পেজিনেশন এবং কেরি ফ্ল্যাগ ইমপ্লিমেন্টেশন
```typescript
// pagination.service.ts
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationService {
  async paginate<T>(
    model: any,
    options: PaginationOptions,
    where: any = {},
    include: any = {}
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort = 'createdAt', order = 'desc' } = options;
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        include,
        skip: offset,
        take: limit,
        orderBy: { [sort]: order }
      }),
      model.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  // Cursor-based pagination for real-time data
  async cursorPaginate<T>(
    model: any,
    cursor: string | null,
    limit: number,
    where: any = {}
  ): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query: any = {
      where,
      take: limit + 1, // Get one extra to check if there's more
      orderBy: { createdAt: 'desc' }
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const results = await model.findMany(query);
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? results[results.length - 2].id : null;

    return {
      data,
      nextCursor,
      hasMore
    };
  }
}
```

## ১৩. টেস্টিং স্ট্র্যাটেজি

### ১৩.১ ইউনিট টেস্টিং
```typescript
// user.service.test.ts
import { UserService } from '../user.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    mockReset(prismaMock);
    userService = new UserService(prismaMock as any);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      const expectedUser = {
        id: 'uuid-123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.user.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(expectedUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          password: expect.any(String) // Should be hashed
        })
      });
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      prismaMock.user.create.mockRejectedValue(
        new Error('Unique constraint failed on email')
      );

      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'uuid-123';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User'
      };

      prismaMock.user.findUnique.mockResolvedValue(expectedUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(expectedUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent';
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeNull();
    });
  });
});
```

### ১৩.২ ইন্টিগ্রেশন টেস্টিং
```typescript
// complaint.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { generateAuthToken } from '../../utils/auth';

describe('Complaint API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      });

    userId = userResponse.body.data.userId;
    authToken = generateAuthToken(userId);
  });

  describe('POST /api/complaints', () => {
    it('should create a new complaint successfully', async () => {
      const complaintData = {
        title: 'Test Complaint',
        description: 'Test description',
        categoryId: 'category-123',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${authToken}`)
        .send(complaintData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: complaintData.title,
          status: 'pending'
        })
      });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          title: 'Test Complaint',
          description: 'Test description'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: 'Access denied. No token provided.'
        })
      });
    });
  });

  describe('GET /api/complaints', () => {
    it('should return user complaints with pagination', async () => {
      const response = await request(app)
        .get('/api/complaints?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          complaints: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: expect.any(Number)
          })
        })
      });
    });
  });
});
```

### ১৩.৩ ফ্লাটার উইজেট টেস্টিং
```dart
// complaint_card_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care/widgets/complaint_card.dart';
import 'package:clean_care/models/complaint_model.dart';

void main() {
  group('ComplaintCard Widget Tests', () {
    testWidgets('should display complaint information correctly', (WidgetTester tester) async {
      // Create test complaint
      final complaint = Complaint(
        id: 'test-123',
        title: 'Test Complaint',
        description: 'Test description',
        status: 'pending',
        priority: 'high',
        createdAt: DateTime.now(),
      );

      // Build our widget
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComplaintCard(complaint: complaint),
          ),
        ),
      );

      // Verify widget displays correct information
      expect(find.text('Test Complaint'), findsOneWidget);
      expect(find.text('Test description'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('High Priority'), findsOneWidget);
    });

    testWidgets('should call onTap when card is tapped', (WidgetTester tester) async {
      bool wasTapped = false;
      final complaint = Complaint(
        id: 'test-123',
        title: 'Test Complaint',
        description: 'Test description',
        status: 'pending',
        priority: 'high',
        createdAt: DateTime.now(),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComplaintCard(
              complaint: complaint,
              onTap: () => wasTapped = true,
            ),
          ),
        ),
      );

      // Tap the card
      await tester.tap(find.byType(ComplaintCard));
      await tester.pump();

      // Verify onTap was called
      expect(wasTapped, isTrue);
    });

    testWidgets('should display different colors for different priorities', (WidgetTester tester) async {
      final highPriorityComplaint = Complaint(
        id: 'test-123',
        title: 'High Priority',
        description: 'High priority complaint',
        status: 'pending',
        priority: 'high',
        createdAt: DateTime.now(),
      );

      final lowPriorityComplaint = Complaint(
        id: 'test-456',
        title: 'Low Priority',
        description: 'Low priority complaint',
        status: 'pending',
        priority: 'low',
        createdAt: DateTime.now(),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                ComplaintCard(complaint: highPriorityComplaint),
                ComplaintCard(complaint: lowPriorityComplaint),
              ],
            ),
          ),
        ),
      );

      // Verify different colors are used (you would need to expose colors for testing)
      final highPriorityCard = tester.widget<ComplaintCard>(find.byType(ComplaintCard).first);
      final lowPriorityCard = tester.widget<ComplaintCard>(find.byType(ComplaintCard).last);

      // Add specific color verification based on your implementation
    });
  });
}
```

## ১৪. ডিপ্লয়মেন্ট এবং এনভায়রনমেন্ট কনফিগারেশন

### ১৪.১ এনভায়রনমেন্ট ভেরিয়েবল
```bash
# .env.example
# Database
DATABASE_URL="mysql://username:password@localhost:3306/clean_care_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE="7d"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_REFRESH_EXPIRE="30d"

# Server
NODE_ENV="development"
PORT=3000
BASE_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="clean-care-bucket"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Payment Gateways
BKASH_APP_KEY="your-bkash-app-key"
BKASH_APP_SECRET="your-bkash-app-secret"
BKASH_USERNAME="your-bkash-username"
BKASH_PASSWORD="your-bkash-password"

NAGAD_MERCHANT_ID="your-nagad-merchant-id"
NAGAD_MERCHANT_NUMBER="your-nagad-number"
NAGAD_PRIVATE_KEY="your-nagad-private-key"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"

# Logging
LOG_LEVEL="info"

# Flutter App
FLUTTER_BASE_URL="http://localhost:3000"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
FCM_SERVER_KEY="your-fcm-server-key"
```

### ১৪.২ ডকার কনফিগারেশন
```dockerfile
# Dockerfile for Node.js Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: clean_care_mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: clean_care_db
      MYSQL_USER: clean_care_user
      MYSQL_PASSWORD: clean_care_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - clean_care_network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: clean_care_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - clean_care_network

  # Node.js Backend
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: clean_care_backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://clean_care_user:clean_care_password@mysql:3306/clean_care_db
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - clean_care_network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: clean_care_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - clean_care_network

volumes:
  mysql_data:
  redis_data:

networks:
  clean_care_network:
    driver: bridge
```

### ১৪.৩ সিআই/সিডি পাইপলাইন
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: mysql://root:rootpassword@localhost:3306/test_db
        REDIS_HOST: localhost
        JWT_SECRET: test-secret
    
    - name: Run integration tests
      run: npm run test:integration

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          yourusername/clean-care-backend:latest
          yourusername/clean-care-backend:${{ github.sha }}
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/clean-care
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

## ১৫. মনিটরিং এবং মেইনটেনেন্স

### ১৫.১ হেলথ চেক এপিআই
```typescript
// health.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

export class HealthController {
  async getHealth(req: Request, res: Response) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        storage: 'unknown'
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
