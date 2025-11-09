# Clean Care Bangladesh - Complete System Design Document

## Overview

Clean Care Bangladesh হল একটি সম্পূর্ণ স্মার্ট সিটি ম্যানেজমেন্ট সিস্টেম যা Flutter মোবাইল অ্যাপ্লিকেশন এবং Django REST Framework backend নিয়ে গঠিত। এই ডকুমেন্টে সম্পূর্ণ সিস্টেমের technical architecture, database design, authentication flow এবং deployment strategy বর্ণনা করা হয়েছে।

## 1. Frontend Architecture (Flutter Mobile App)

### 1.1 Current Implementation Analysis

**Technology Stack:**
- Flutter 3.8.1+ with Dart SDK
- Material Design 3 UI Framework
- Google Fonts (Noto Sans for Bengali support)
- State Management: Provider pattern
- HTTP Client: Dio + http package
- Local Storage: SharedPreferences + Hive
- Animations: flutter_animate, AnimationController

**Project Structure:**
```
lib/
├── main.dart                 # App entry point with routing
├── components/               # Reusable UI components
│   ├── custom_bottom_nav.dart
│   ├── dscc_notice_board.dart
│   ├── elevated_3d_button.dart
│   └── stats_card.dart
├── pages/                    # Screen implementations
│   ├── welcome_screen.dart
│   ├── login_page.dart
│   ├── signup_page.dart
│   ├── home_page.dart
│   ├── complaint_page.dart
│   ├── payment_page.dart
│   └── [other pages]
├── services/                 # API integration
│   └── api_client.dart
└── repositories/             # Data layer
    └── auth_repository.dart
```

**Key Features Implemented:**
1. Welcome screen with animated background
2. Login/Signup with phone number authentication
3. Home page with 3D feature cluster design
4. Complaint management with form validation
5. Custom bottom navigation with circular notch
6. Bengali language support throughout UI

### 1.2 Frontend Architecture Improvements Needed

**Missing Components:**

1. **State Management Provider Setup** - Currently not configured
2. **Error Handling Interceptor** - API error handling needs centralization
3. **Token Refresh Logic** - JWT token refresh mechanism incomplete
4. **Offline Support** - Hive database not yet implemented
5. **Image Upload Service** - File upload functionality missing
6. **WebSocket Client** - Real-time chat needs WebSocket connection
7. **Push Notification Handler** - FCM integration pending

**Recommended Architecture Pattern:**

```
lib/
├── core/
│   ├── constants/
│   │   ├── api_endpoints.dart
│   │   ├── app_colors.dart
│   │   └── app_strings.dart
│   ├── errors/
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   ├── interceptors.dart
│   │   └── network_info.dart
│   └── utils/
│       ├── validators.dart
│       └── formatters.dart
├── data/
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── complaint_model.dart
│   │   └── payment_model.dart
│   ├── repositories/
│   │   ├── auth_repository_impl.dart
│   │   ├── complaint_repository_impl.dart
│   │   └── payment_repository_impl.dart
│   └── datasources/
│       ├── local/
│       │   └── hive_database.dart
│       └── remote/
│           └── api_service.dart
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
└── presentation/
    ├── providers/
    ├── pages/
    └── widgets/
```

## 2. Backend Architecture (Django REST Framework)

### 2.1 Technology Stack

**Core Framework:**
- Django 4.2 LTS
- Django REST Framework 3.14
- PostgreSQL 15 (Primary Database)
- Redis 7.0 (Cache + Message Broker)
- Celery 5.3 (Background Tasks)
- Django Channels 4.0 (WebSocket)

**Additional Libraries:**
- djangorestframework-simplejwt (JWT Authentication)
- django-cors-headers (CORS handling)
- Pillow (Image processing)
- boto3 (AWS S3 integration)
- psycopg2-binary (PostgreSQL adapter)
- celery-beat (Scheduled tasks)
- drf-spectacular (API documentation)
- django-filter (Query filtering)
- whitenoise (Static file serving)

### 2.2 Project Structure

```
clean_care_backend/
├── manage.py
├── requirements.txt
├── .env
├── Dockerfile
├── docker-compose.yml
├── clean_care/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py
├── apps/
│   ├── authentication/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py
│   │   └── tests.py
│   ├── users/
│   ├── complaints/
│   ├── payments/
│   ├── donations/
│   ├── emergency/
│   ├── waste_management/
│   ├── gallery/
│   ├── chat/
│   ├── notices/
│   ├── calendar/
│   └── dashboard/
├── core/
│   ├── middleware.py
│   ├── permissions.py
│   ├── pagination.py
│   ├── exceptions.py
│   └── utils.py
└── static/
    └── media/
```

### 2.3 API Route Structure

**Base URL:** `https://api.cleancare.gov.bd/api/v1/`

**Authentication Routes:**
```
POST   /auth/register/          # User registration
POST   /auth/login/             # User login
POST   /auth/refresh/           # Refresh JWT token
POST   /auth/logout/            # User logout
POST   /auth/verify-otp/        # OTP verification
POST   /auth/resend-otp/        # Resend OTP
GET    /auth/me/                # Get current user
PUT    /auth/change-password/   # Change password
```

**User Management Routes:**
```
GET    /users/                  # List users (Admin only)
GET    /users/{id}/             # Get user details
PUT    /users/{id}/             # Update user
DELETE /users/{id}/             # Delete user (Admin only)
GET    /users/profile/          # Get own profile
PUT    /users/profile/          # Update own profile
POST   /users/profile/avatar/   # Upload profile picture
```

**Complaint Routes:**
```
GET    /complaints/             # List complaints
POST   /complaints/             # Create complaint
GET    /complaints/{id}/        # Get complaint details
PUT    /complaints/{id}/        # Update complaint
DELETE /complaints/{id}/        # Delete complaint
POST   /complaints/{id}/images/ # Upload complaint images
GET    /complaints/{id}/updates/# Get complaint updates
POST   /complaints/{id}/updates/# Add complaint update
```

**Payment Routes:**
```
GET    /payments/               # List payments
POST   /payments/process/       # Process payment
GET    /payments/{id}/          # Get payment details
POST   /payments/verify/        # Verify payment
GET    /payments/history/       # Payment history
POST   /payments/refund/        # Request refund
```


**Dashboard Routes (Super Admin):**
```
GET    /dashboard/kpi/          # Get KPI metrics
GET    /dashboard/complaints-stats/ # Complaint statistics
GET    /dashboard/user-stats/   # User statistics
GET    /dashboard/ward-performance/ # Ward performance data
GET    /dashboard/satisfaction/ # Citizen satisfaction score
GET    /dashboard/service-time/ # Average service delivery time
GET    /dashboard/sts-overview/ # STS capacity overview
GET    /dashboard/recent-complaints/ # Recent complaints
GET    /dashboard/financial/    # Financial monitoring
POST   /dashboard/reports/generate/ # Generate reports
```

**Admin Management Routes:**
```
GET    /admin-users/            # List admin users
POST   /admin-users/            # Create admin user
GET    /admin-users/{id}/       # Get admin details
PUT    /admin-users/{id}/       # Update admin
DELETE /admin-users/{id}/       # Delete admin
PUT    /admin-users/{id}/permissions/ # Update permissions
GET    /admin-users/{id}/activity-log/ # Admin activity log
```

## 3. Database Design (PostgreSQL)

### 3.1 Core Tables

**users table:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nid VARCHAR(20),
    address TEXT,
    ward_number VARCHAR(10),
    profile_picture_url VARCHAR(500),
    user_type VARCHAR(20) DEFAULT 'citizen' CHECK (user_type IN ('citizen', 'admin', 'super_admin', 'service_provider')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_ward ON users(ward_number);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**otp_verifications table:**
```sql
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('registration', 'login', 'password_reset')),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_verifications(phone);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

**complaints table:**
```sql
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracking_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('পরিচ্ছন্নতা', 'বর্জ্য ব্যবস্থাপনা', 'পানি সরবরাহ', 'রাস্তাঘাট', 'বিদ্যুৎ', 'অন্যান্য')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('উচ্চ', 'মধ্যম', 'নিম্ন')),
    status VARCHAR(30) DEFAULT 'জমা দেওয়া হয়েছে' CHECK (status IN ('জমা দেওয়া হয়েছে', 'প্রক্রিয়াধীন', 'সমাধান হয়েছে', 'বাতিল')),
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ward_number VARCHAR(10),
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_tracking ON complaints(tracking_number);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_ward ON complaints(ward_number);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
```

**complaint_images table:**
```sql
CREATE TABLE complaint_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_name VARCHAR(255),
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_complaint_images_complaint_id ON complaint_images(complaint_id);
```

**complaint_updates table:**
```sql
CREATE TABLE complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id),
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX idx_complaint_updates_created_at ON complaint_updates(created_at DESC);
```

**payments table:**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'upay', 'card', 'bank')),
    phone_number VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    gateway_transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    gateway_response JSONB,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```


**donations table:**
```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_project ON donations(project_name);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
```

**emergency_requests table:**
```sql
CREATE TABLE emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('অগ্নিকাণ্ড', 'চিকিৎসা জরুরি', 'পুলিশ', 'প্রাকৃতিক দুর্যোগ', 'অন্যান্য')),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(30) DEFAULT 'জমা দেওয়া হয়েছে' CHECK (status IN ('জমা দেওয়া হয়েছে', 'প্রক্রিয়াধীন', 'সমাধান হয়েছে')),
    priority VARCHAR(20) DEFAULT 'উচ্চ',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_emergency_user_id ON emergency_requests(user_id);
CREATE INDEX idx_emergency_status ON emergency_requests(status);
CREATE INDEX idx_emergency_created_at ON emergency_requests(created_at DESC);
```

**notices table:**
```sql
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    is_urgent BOOLEAN DEFAULT FALSE,
    target_wards TEXT[],
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notices_active ON notices(is_active);
CREATE INDEX idx_notices_priority ON notices(priority);
CREATE INDEX idx_notices_published_at ON notices(published_at DESC);
```

**chat_messages table:**
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    room_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at DESC);
```

**admin_permissions table:**
```sql
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    ward_numbers TEXT[],
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT TRUE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_permissions_admin_id ON admin_permissions(admin_id);
CREATE INDEX idx_admin_permissions_type ON admin_permissions(permission_type);
```

**activity_logs table:**
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### 3.2 Database Functions and Triggers

**Auto-update timestamp trigger:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Generate tracking number function:**
```sql
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
    new_tracking_number TEXT;
    counter INTEGER;
BEGIN
    counter := (SELECT COUNT(*) FROM complaints WHERE DATE(created_at) = CURRENT_DATE) + 1;
    new_tracking_number := 'CC' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    RETURN new_tracking_number;
END;
$$ LANGUAGE plpgsql;
```

## 4. Authentication System

### 4.1 JWT Token Structure

**Access Token (Expires in 24 hours):**
```json
{
  "token_type": "access",
  "exp": 1735689600,
  "iat": 1735603200,
  "jti": "abc123...",
  "user_id": "uuid-here",
  "phone": "+8801700000000",
  "user_type": "citizen",
  "is_verified": true
}
```

**Refresh Token (Expires in 7 days):**
```json
{
  "token_type": "refresh",
  "exp": 1736208000,
  "iat": 1735603200,
  "jti": "xyz789...",
  "user_id": "uuid-here"
}
```

### 4.2 Authentication Flow

**Registration Flow:**
```
1. User submits phone, name, password, NID
2. Backend validates data
3. Backend generates 6-digit OTP
4. Backend sends OTP via SMS gateway
5. Backend creates user with is_verified=false
6. User enters OTP
7. Backend verifies OTP
8. Backend sets is_verified=true
9. Backend generates JWT tokens
10. Backend returns tokens + user data
```

**Login Flow:**
```
1. User submits phone + password
2. Backend validates credentials
3. Backend checks is_verified status
4. Backend generates JWT tokens
5. Backend updates last_login timestamp
6. Backend returns tokens + user data
```

**Token Refresh Flow:**
```
1. Frontend detects access token expiry
2. Frontend sends refresh token
3. Backend validates refresh token
4. Backend generates new access token
5. Backend returns new access token
```


### 4.3 Django Authentication Implementation

**settings.py configuration:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'apps.authentication',
    'apps.users',
    'apps.complaints',
    # ... other apps
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

**User Model (apps/users/models.py):**
```python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('Phone number is required')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'super_admin')
        return self.create_user(phone, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = [
        ('citizen', 'Citizen'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
        ('service_provider', 'Service Provider'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True, blank=True)
    nid = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    ward_number = models.CharField(max_length=10, null=True, blank=True)
    profile_picture_url = models.URLField(max_length=500, null=True, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='citizen')
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['ward_number']),
            models.Index(fields=['user_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone})"
```

**Authentication Views (apps/authentication/views.py):**
```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .services import OTPService

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate and send OTP
        otp_service = OTPService()
        otp_code = otp_service.generate_otp(user.phone, 'registration')
        otp_service.send_otp(user.phone, otp_code)
        
        return Response({
            'message': 'Registration successful. Please verify OTP.',
            'user_id': str(user.id),
            'phone': user.phone
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    phone = request.data.get('phone')
    otp_code = request.data.get('otp_code')
    
    otp_service = OTPService()
    if otp_service.verify_otp(phone, otp_code):
        user = User.objects.get(phone=phone)
        user.is_verified = True
        user.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'OTP verified successfully',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'phone': user.phone,
                'name': user.name,
                'user_type': user.user_type
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid or expired OTP'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    phone = request.data.get('phone')
    password = request.data.get('password')
    
    user = authenticate(phone=phone, password=password)
    
    if user is not None:
        if not user.is_verified:
            return Response({
                'error': 'Please verify your account first'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'phone': user.phone,
                'name': user.name,
                'email': user.email,
                'user_type': user.user_type,
                'ward_number': user.ward_number
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    return Response({
        'id': str(user.id),
        'phone': user.phone,
        'name': user.name,
        'email': user.email,
        'user_type': user.user_type,
        'ward_number': user.ward_number,
        'is_verified': user.is_verified
    })
```

**OTP Service (apps/authentication/services.py):**
```python
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
import requests

class OTPService:
    OTP_EXPIRY_MINUTES = 5
    
    def generate_otp(self, phone, purpose):
        """Generate 6-digit OTP"""
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Store in cache with expiry
        cache_key = f"otp_{phone}_{purpose}"
        cache.set(cache_key, otp_code, timeout=self.OTP_EXPIRY_MINUTES * 60)
        
        # Also store in database for audit
        from .models import OTPVerification
        OTPVerification.objects.create(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)
        )
        
        return otp_code
    
    def verify_otp(self, phone, otp_code, purpose='registration'):
        """Verify OTP code"""
        cache_key = f"otp_{phone}_{purpose}"
        stored_otp = cache.get(cache_key)
        
        if stored_otp and stored_otp == otp_code:
            # Mark as verified in database
            from .models import OTPVerification
            OTPVerification.objects.filter(
                phone=phone,
                otp_code=otp_code,
                is_verified=False
            ).update(is_verified=True)
            
            # Delete from cache
            cache.delete(cache_key)
            return True
        
        return False
    
    def send_otp(self, phone, otp_code):
        """Send OTP via SMS gateway"""
        # Integration with SMS gateway (e.g., SSL Wireless, Banglalink)
        sms_api_url = "https://sms.example.com/api/send"
        message = f"Your Clean Care verification code is: {otp_code}. Valid for 5 minutes."
        
        try:
            response = requests.post(sms_api_url, json={
                'phone': phone,
                'message': message,
                'api_key': 'your-api-key'
            })
            return response.status_code == 200
        except Exception as e:
            print(f"SMS sending failed: {e}")
            return False
```


## 5. Payment Gateway Integration

### 5.1 Supported Payment Methods

**Mobile Banking:**
- bKash (Most popular in Bangladesh)
- Nagad
- Rocket
- Upay

**Payment Flow:**
```
1. User selects service and amount
2. User chooses payment method
3. Frontend calls /api/payments/process/
4. Backend initiates payment with gateway
5. Gateway returns payment URL
6. User redirected to gateway
7. User completes payment
8. Gateway sends callback to backend
9. Backend verifies payment
10. Backend updates payment status
11. Backend sends confirmation to user
```

### 5.2 bKash Integration Example

**Payment Model (apps/payments/models.py):**
```python
from django.db import models
import uuid

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('upay', 'Upay'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    service_type = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    phone_number = models.CharField(max_length=20)
    transaction_id = models.CharField(max_length=100, unique=True, null=True)
    gateway_transaction_id = models.CharField(max_length=100, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    gateway_response = models.JSONField(null=True, blank=True)
    failure_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
```

**bKash Service (apps/payments/services/bkash_service.py):**
```python
import requests
from django.conf import settings
from datetime import datetime

class BkashPaymentService:
    def __init__(self):
        self.base_url = settings.BKASH_BASE_URL
        self.app_key = settings.BKASH_APP_KEY
        self.app_secret = settings.BKASH_APP_SECRET
        self.username = settings.BKASH_USERNAME
        self.password = settings.BKASH_PASSWORD
        self.token = None
    
    def get_token(self):
        """Get bKash access token"""
        url = f"{self.base_url}/checkout/token/grant"
        headers = {
            'Content-Type': 'application/json',
            'username': self.username,
            'password': self.password
        }
        data = {
            'app_key': self.app_key,
            'app_secret': self.app_secret
        }
        
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            self.token = response.json().get('id_token')
            return self.token
        return None
    
    def create_payment(self, amount, invoice_number, merchant_invoice_number):
        """Create bKash payment"""
        if not self.token:
            self.get_token()
        
        url = f"{self.base_url}/checkout/payment/create"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.token,
            'X-APP-Key': self.app_key
        }
        data = {
            'amount': str(amount),
            'currency': 'BDT',
            'intent': 'sale',
            'merchantInvoiceNumber': merchant_invoice_number,
            'callbackURL': f"{settings.BACKEND_URL}/api/payments/bkash/callback/"
        }
        
        response = requests.post(url, json=data, headers=headers)
        return response.json()
    
    def execute_payment(self, payment_id):
        """Execute bKash payment"""
        url = f"{self.base_url}/checkout/payment/execute/{payment_id}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.token,
            'X-APP-Key': self.app_key
        }
        
        response = requests.post(url, headers=headers)
        return response.json()
    
    def query_payment(self, payment_id):
        """Query payment status"""
        url = f"{self.base_url}/checkout/payment/query/{payment_id}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.token,
            'X-APP-Key': self.app_key
        }
        
        response = requests.get(url, headers=headers)
        return response.json()
```

**Payment Views (apps/payments/views.py):**
```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Payment
from .services.bkash_service import BkashPaymentService
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    user = request.user
    service_type = request.data.get('service_type')
    amount = request.data.get('amount')
    payment_method = request.data.get('payment_method')
    phone_number = request.data.get('phone_number')
    
    # Create payment record
    payment = Payment.objects.create(
        user=user,
        service_type=service_type,
        amount=amount,
        payment_method=payment_method,
        phone_number=phone_number,
        transaction_id=f"TXN{uuid.uuid4().hex[:12].upper()}",
        status='pending'
    )
    
    # Process based on payment method
    if payment_method == 'bkash':
        bkash_service = BkashPaymentService()
        result = bkash_service.create_payment(
            amount=amount,
            invoice_number=str(payment.id),
            merchant_invoice_number=payment.transaction_id
        )
        
        if result.get('statusCode') == '0000':
            payment.gateway_transaction_id = result.get('paymentID')
            payment.gateway_response = result
            payment.status = 'processing'
            payment.save()
            
            return Response({
                'payment_id': str(payment.id),
                'transaction_id': payment.transaction_id,
                'bkash_url': result.get('bkashURL'),
                'status': 'processing'
            }, status=status.HTTP_200_OK)
        else:
            payment.status = 'failed'
            payment.failure_reason = result.get('statusMessage')
            payment.save()
            
            return Response({
                'error': 'Payment initiation failed',
                'message': result.get('statusMessage')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': 'Unsupported payment method'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def bkash_callback(request):
    """Handle bKash payment callback"""
    payment_id = request.data.get('paymentID')
    status_code = request.data.get('status')
    
    try:
        payment = Payment.objects.get(gateway_transaction_id=payment_id)
        
        if status_code == 'success':
            bkash_service = BkashPaymentService()
            result = bkash_service.execute_payment(payment_id)
            
            if result.get('statusCode') == '0000':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.gateway_response = result
                payment.save()
                
                # Send notification to user
                # ... notification logic
                
                return Response({'message': 'Payment successful'})
        
        payment.status = 'failed'
        payment.save()
        return Response({'message': 'Payment failed'})
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
```

## 6. Real-time Chat System (WebSocket)

### 6.1 Django Channels Configuration

**asgi.py:**
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.chat import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clean_care.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
```

**Chat Consumer (apps/chat/consumers.py):**
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender_id = data['sender_id']
        receiver_id = data.get('receiver_id')
        
        # Save message to database
        await self.save_message(sender_id, receiver_id, message)
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender_id,
                'timestamp': str(timezone.now())
            }
        )
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        ChatMessage.objects.create(
            sender_id=sender_id,
            receiver_id=receiver_id,
            room_id=self.room_id,
            message=message
        )
```


## 7. Super Admin Dashboard Implementation

### 7.1 KPI Metrics API

**Dashboard Views (apps/dashboard/views.py):**
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from apps.complaints.models import Complaint
from apps.users.models import User
from apps.payments.models import Payment

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_kpi_metrics(request):
    """Get comprehensive KPI metrics for super admin dashboard"""
    
    # Check if user is super admin
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    # Complaint statistics
    total_complaints = Complaint.objects.count()
    complaints_by_status = Complaint.objects.values('status').annotate(count=Count('id'))
    
    # User statistics
    user_stats = {
        'total_users': User.objects.filter(user_type='citizen').count(),
        'total_admins': User.objects.filter(user_type='admin').count(),
        'total_super_admins': User.objects.filter(user_type='super_admin').count(),
        'verified_users': User.objects.filter(is_verified=True).count(),
    }
    
    # Citizen satisfaction score (based on ratings)
    # Assuming we have a rating field in complaints
    avg_satisfaction = Complaint.objects.filter(
        rating__isnull=False
    ).aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    
    # Average service delivery time
    resolved_complaints = Complaint.objects.filter(
        status='সমাধান হয়েছে',
        resolved_at__isnull=False
    )
    
    avg_resolution_time = None
    if resolved_complaints.exists():
        total_time = sum([
            (c.resolved_at - c.created_at).total_seconds() / 3600  # in hours
            for c in resolved_complaints
        ])
        avg_resolution_time = total_time / resolved_complaints.count()
    
    # Ward-wise performance
    ward_performance = Complaint.objects.values('ward_number').annotate(
        total_complaints=Count('id'),
        resolved_complaints=Count('id', filter=Q(status='সমাধান হয়েছে')),
        avg_resolution_time=Avg(
            F('resolved_at') - F('created_at'),
            filter=Q(status='সমাধান হয়েছে')
        )
    ).order_by('-total_complaints')
    
    return Response({
        'complaint_stats': {
            'total': total_complaints,
            'by_status': list(complaints_by_status),
        },
        'user_stats': user_stats,
        'citizen_satisfaction': round(avg_satisfaction, 2),
        'avg_service_time_hours': round(avg_resolution_time, 2) if avg_resolution_time else None,
        'ward_performance': list(ward_performance[:10]),  # Top 10 wards
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_complaints(request):
    """Get complaints from last hour"""
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    one_hour_ago = timezone.now() - timedelta(hours=1)
    recent_complaints = Complaint.objects.filter(
        created_at__gte=one_hour_ago
    ).select_related('user').prefetch_related('images')
    
    data = []
    for complaint in recent_complaints:
        data.append({
            'id': str(complaint.id),
            'tracking_number': complaint.tracking_number,
            'title': complaint.title,
            'category': complaint.category,
            'status': complaint.status,
            'priority': complaint.priority,
            'location': complaint.location,
            'user': {
                'name': complaint.user.name,
                'phone': complaint.user.phone
            },
            'images': [img.image_url for img in complaint.images.all()],
            'created_at': complaint.created_at.isoformat()
        })
    
    return Response({'complaints': data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_financial_monitoring(request):
    """Get financial statistics"""
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    # Total revenue from completed payments
    total_revenue = Payment.objects.filter(
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Pending payments
    pending_amount = Payment.objects.filter(
        status='pending'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue trend
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0)
    monthly_revenue = Payment.objects.filter(
        status='completed',
        completed_at__gte=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    return Response({
        'total_revenue': float(total_revenue),
        'pending_amount': float(pending_amount),
        'monthly_revenue': float(monthly_revenue),
        'currency': 'BDT'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate reports in PDF/Excel format"""
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    report_type = request.data.get('report_type')  # daily, weekly, monthly, quarterly, yearly
    format_type = request.data.get('format')  # pdf, excel
    
    # Generate report based on type
    # This would use libraries like reportlab for PDF or openpyxl for Excel
    
    # For now, return a task ID for async processing
    from apps.dashboard.tasks import generate_report_task
    task = generate_report_task.delay(report_type, format_type, str(request.user.id))
    
    return Response({
        'task_id': task.id,
        'message': 'Report generation started',
        'status': 'processing'
    })
```

### 7.2 Admin Management API

**Admin Management Views (apps/admin_users/views.py):**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.models import User
from .models import AdminPermission
from .serializers import AdminUserSerializer, AdminPermissionSerializer

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(user_type__in=['admin', 'service_provider'])
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only super admins can access
        if self.request.user.user_type != 'super_admin':
            return User.objects.none()
        return super().get_queryset()
    
    def create(self, request):
        """Create new admin user"""
        if request.user.user_type != 'super_admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            admin_user = serializer.save(user_type='admin')
            
            # Create default permissions
            ward_numbers = request.data.get('ward_numbers', [])
            AdminPermission.objects.create(
                admin_id=admin_user.id,
                permission_type='complaints',
                ward_numbers=ward_numbers,
                can_read=True,
                can_update=True
            )
            
            return Response({
                'message': 'Admin user created successfully',
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'])
    def update_permissions(self, request, pk=None):
        """Update admin permissions"""
        if request.user.user_type != 'super_admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        admin_user = self.get_object()
        permissions_data = request.data.get('permissions', [])
        
        # Delete existing permissions
        AdminPermission.objects.filter(admin_id=admin_user.id).delete()
        
        # Create new permissions
        for perm_data in permissions_data:
            AdminPermission.objects.create(
                admin_id=admin_user.id,
                **perm_data
            )
        
        return Response({'message': 'Permissions updated successfully'})
    
    @action(detail=True, methods=['get'])
    def activity_log(self, request, pk=None):
        """Get admin activity log"""
        if request.user.user_type != 'super_admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        admin_user = self.get_object()
        logs = ActivityLog.objects.filter(user_id=admin_user.id).order_by('-created_at')[:100]
        
        return Response({
            'logs': [
                {
                    'action': log.action,
                    'resource_type': log.resource_type,
                    'resource_id': str(log.resource_id) if log.resource_id else None,
                    'details': log.details,
                    'created_at': log.created_at.isoformat()
                }
                for log in logs
            ]
        })
```

## 8. Deployment & Hosting

### 8.1 Infrastructure Architecture

**Recommended Setup:**
```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                 │
│                  SSL/TLS Termination                     │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│  Django App    │  │  Django App  │  │  Django App    │
│  Instance 1    │  │  Instance 2  │  │  Instance 3    │
└────────────────┘  └──────────────┘  └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│  PostgreSQL    │  │    Redis     │  │   Celery       │
│  Primary       │  │    Cache     │  │   Workers      │
└────────────────┘  └──────────────┘  └────────────────┘
        │
┌───────▼────────┐
│  PostgreSQL    │
│  Replica       │
└────────────────┘
```

### 8.2 Hosting Options

**Option 1: AWS (Recommended for Production)**

**Services:**
- EC2: Django application servers (t3.medium or larger)
- RDS: PostgreSQL database (db.t3.medium with Multi-AZ)
- ElastiCache: Redis (cache.t3.micro)
- S3: Static files and media storage
- CloudFront: CDN for static assets
- ELB: Application Load Balancer
- Route 53: DNS management
- Certificate Manager: SSL/TLS certificates

**Estimated Monthly Cost:**
- EC2 (3 instances): $150
- RDS PostgreSQL: $100
- ElastiCache Redis: $15
- S3 + CloudFront: $20
- Load Balancer: $20
- **Total: ~$305/month**

**Option 2: DigitalOcean (Cost-effective)**

**Services:**
- Droplets: 3x $24/month (4GB RAM, 2 vCPUs)
- Managed PostgreSQL: $60/month
- Managed Redis: $15/month
- Spaces (S3-compatible): $5/month
- Load Balancer: $12/month
- **Total: ~$164/month**

**Option 3: Railway/Render (Easiest for MVP)**

**Services:**
- Railway Pro: $20/month per service
- PostgreSQL: Included
- Redis: Included
- **Total: ~$60-80/month**


### 8.3 Docker Configuration

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations
RUN python manage.py migrate

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "clean_care.wsgi:application"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=cleancare_db
      - POSTGRES_USER=cleancare_user
      - POSTGRES_PASSWORD=secure_password
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: gunicorn clean_care.wsgi:application --bind 0.0.0.0:8000 --workers 4
    volumes:
      - .:/app
      - static_volume:/app/static
      - media_volume:/app/media
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
      - redis

  celery:
    build: .
    command: celery -A clean_care worker -l info
    volumes:
      - .:/app
    env_file:
      - .env
    depends_on:
      - db
      - redis

  celery-beat:
    build: .
    command: celery -A clean_care beat -l info
    volumes:
      - .:/app
    env_file:
      - .env
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/static
      - media_volume:/app/media
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

**requirements.txt:**
```
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.0
django-filter==23.3
drf-spectacular==0.26.5
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
django-celery-beat==2.5.0
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0
Pillow==10.1.0
boto3==1.29.7
gunicorn==21.2.0
whitenoise==6.6.0
python-decouple==3.8
requests==2.31.0
```

**.env.example:**
```
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=api.cleancare.gov.bd,localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://cleancare_user:secure_password@db:5432/cleancare_db

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# SMS Gateway
SMS_API_URL=https://sms.example.com/api/send
SMS_API_KEY=your-sms-api-key

# bKash Payment Gateway
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your-bkash-app-key
BKASH_APP_SECRET=your-bkash-app-secret
BKASH_USERNAME=your-bkash-username
BKASH_PASSWORD=your-bkash-password

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=cleancare-media
AWS_S3_REGION_NAME=ap-south-1

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@cleancare.gov.bd
EMAIL_HOST_PASSWORD=your-email-password
EMAIL_USE_TLS=True

# Frontend URL
FRONTEND_URL=https://cleancare.gov.bd
BACKEND_URL=https://api.cleancare.gov.bd
```

### 8.4 Nginx Configuration

**nginx.conf:**
```nginx
upstream django {
    server web:8000;
}

server {
    listen 80;
    server_name api.cleancare.gov.bd;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cleancare.gov.bd;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /app/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /ws/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 8.5 Deployment Steps

**Step 1: Server Setup (Ubuntu 22.04)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Create project directory
mkdir -p /var/www/cleancare
cd /var/www/cleancare
```

**Step 2: Clone and Configure**
```bash
# Clone repository
git clone https://github.com/your-org/cleancare-backend.git .

# Create .env file
cp .env.example .env
nano .env  # Edit with production values

# Create SSL certificates directory
mkdir -p nginx/ssl
# Copy SSL certificates to nginx/ssl/
```

**Step 3: Build and Run**
```bash
# Build Docker images
docker-compose build

# Run migrations
docker-compose run web python manage.py migrate

# Create superuser
docker-compose run web python manage.py createsuperuser

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Step 4: Setup Monitoring**
```bash
# Install monitoring tools
pip install sentry-sdk

# Configure Sentry in settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

### 8.6 CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          python manage.py test
      
      - name: Run linting
        run: |
          flake8 .

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/cleancare
            git pull origin main
            docker-compose down
            docker-compose build
            docker-compose run web python manage.py migrate
            docker-compose up -d
```

## 9. Security Best Practices

### 9.1 Security Checklist

**Django Security Settings:**
```python
# settings/production.py

# Security
DEBUG = False
SECRET_KEY = os.getenv('SECRET_KEY')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://cleancare.gov.bd",
    "https://www.cleancare.gov.bd",
]

# Rate Limiting
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

**Database Security:**
```sql
-- Create read-only user for reporting
CREATE USER cleancare_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE cleancare_db TO cleancare_readonly;
GRANT USAGE ON SCHEMA public TO cleancare_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cleancare_readonly;

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own data
CREATE POLICY user_isolation_policy ON complaints
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 9.2 Backup Strategy

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/cleancare"
DB_NAME="cleancare_db"
DB_USER="cleancare_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/cleancare/media/

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://cleancare-backups/
aws s3 cp $BACKUP_DIR/media_$DATE.tar.gz s3://cleancare-backups/

# Delete local backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Cron Job:**
```bash
# Run backup daily at 2 AM
0 2 * * * /var/www/cleancare/backup.sh >> /var/log/cleancare-backup.log 2>&1
```

## 10. Testing Strategy

### 10.1 Unit Tests Example

**tests/test_authentication.py:**
```python
from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User

class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'phone': '+8801700000000',
            'name': 'Test User',
            'password': 'testpass123'
        }
    
    def test_user_registration(self):
        response = self.client.post('/api/auth/register/', self.user_data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('user_id', response.data)
    
    def test_user_login(self):
        # Create user first
        user = User.objects.create_user(**self.user_data)
        user.is_verified = True
        user.save()
        
        # Test login
        response = self.client.post('/api/auth/login/', {
            'phone': self.user_data['phone'],
            'password': self.user_data['password']
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.data)
```

## Summary

এই design document এ Clean Care Bangladesh সিস্টেমের সম্পূর্ণ technical architecture বর্ণনা করা হয়েছে:

1. **Frontend (Flutter)**: Current implementation analysis এবং recommended improvements
2. **Backend (Django)**: Complete API structure, authentication, payment integration
3. **Database (PostgreSQL)**: Detailed schema design with indexes and triggers
4. **Authentication**: JWT-based system with OTP verification
5. **Payment Gateway**: bKash integration example
6. **Real-time Chat**: WebSocket implementation with Django Channels
7. **Super Admin Dashboard**: KPI metrics and admin management APIs
8. **Deployment**: Docker configuration, hosting options, CI/CD pipeline
9. **Security**: Best practices and backup strategy
10. **Testing**: Unit test examples

এই document অনুসরণ করে আপনি একটি production-ready, scalable এবং secure Clean Care Bangladesh সিস্টেম তৈরি করতে পারবেন।
