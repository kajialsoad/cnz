# Clean Care Bangladesh - সম্পূর্ণ Implementation গাইড (বাংলা)

## 📚 সূচিপত্র
1. [প্রজেক্ট সেটআপ](#১-প্রজেক্ট-সেটআপ)
2. [ডাটাবেস তৈরি](#২-ডাটাবেস-তৈরি)
3. [Authentication সিস্টেম](#৩-authentication-সিস্টেম)
4. [Complaint Management](#৪-complaint-management)
5. [Payment Gateway](#৫-payment-gateway)
6. [Super Admin Dashboard](#৬-super-admin-dashboard)
7. [Real-time Chat](#৭-real-time-chat)
8. [Deployment](#৮-deployment)

---

## ১. প্রজেক্ট সেটআপ

### ১.১ প্রয়োজনীয় Software Install

**Step 1: Python Install করুন**
```bash
# Windows এ Python 3.11 download করুন
# https://www.python.org/downloads/
# Installation এর সময় "Add Python to PATH" চেক করুন
```

**Step 2: PostgreSQL Install করুন**
```bash
# Windows এ PostgreSQL 15 download করুন
# https://www.postgresql.org/download/windows/
# Installation এর সময় password মনে রাখুন
```

**Step 3: Redis Install করুন**
```bash
# Windows এ Redis download করুন
# https://github.com/microsoftarchive/redis/releases
# অথবা Docker ব্যবহার করুন
```

### ১.২ Django Project তৈরি

**Step 1: Virtual Environment তৈরি করুন**
```bash
# Terminal open করুন
cd Desktop
mkdir clean_care_backend
cd clean_care_backend

# Virtual environment তৈরি করুন
python -m venv venv

# Activate করুন
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

**Step 2: Django এবং প্রয়োজনীয় packages install করুন**
```bash
# requirements.txt তৈরি করুন
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.0
pip install psycopg2-binary==2.9.9
pip install redis==5.0.1
pip install celery==5.3.4
pip install channels==4.0.0
pip install Pillow==10.1.0
pip install requests==2.31.0

# অথবা একসাথে install করুন
pip install -r requirements.txt
```

**Step 3: Django project তৈরি করুন**
```bash
# Project তৈরি করুন
django-admin startproject clean_care .

# Apps তৈরি করুন
python manage.py startapp authentication
python manage.py startapp users
python manage.py startapp complaints
python manage.py startapp payments
python manage.py startapp donations
python manage.py startapp emergency
python manage.py startapp notices
python manage.py startapp chat
python manage.py startapp dashboard
python manage.py startapp admin_users
```

**ব্যাখ্যা:**
- `venv` হল virtual environment যেখানে সব packages আলাদাভাবে install হবে
- প্রতিটি app একটি আলাদা feature handle করবে
- Django project structure এভাবে organized রাখলে maintain করা সহজ হয়

### ১.৩ Settings Configure করুন

**Step 1: settings.py edit করুন**

`clean_care/settings.py` file open করুন এবং নিচের changes করুন:

```python
# INSTALLED_APPS এ নতুন apps যোগ করুন
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    
    # Local apps
    'authentication',
    'users',
    'complaints',
    'payments',
    'donations',
    'emergency',
    'notices',
    'chat',
    'dashboard',
    'admin_users',
]

# MIDDLEWARE এ CORS যোগ করুন
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # এটা যোগ করুন
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cleancare_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',  # আপনার PostgreSQL password
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Flutter web
    "http://127.0.0.1:3000",
]

# Custom user model
AUTH_USER_MODEL = 'users.User'
```

**ব্যাখ্যা:**
- `INSTALLED_APPS`: সব apps এখানে register করতে হয়
- `DATABASES`: PostgreSQL connection setup
- `REST_FRAMEWORK`: API configuration
- `SIMPLE_JWT`: JWT token এর lifetime এবং settings
- `CORS_ALLOWED_ORIGINS`: কোন frontend থেকে API call করা যাবে
- `AUTH_USER_MODEL`: Custom user model ব্যবহার করার জন্য

---

## ২. ডাটাবেস তৈরি

### ২.১ PostgreSQL Database তৈরি

**Step 1: PostgreSQL এ login করুন**
```bash
# Command Prompt open করুন
psql -U postgres
# Password enter করুন
```

**Step 2: Database তৈরি করুন**
```sql
-- Database তৈরি করুন
CREATE DATABASE cleancare_db;

-- User তৈরি করুন (optional)
CREATE USER cleancare_user WITH PASSWORD 'secure_password';

-- Permissions দিন
GRANT ALL PRIVILEGES ON DATABASE cleancare_db TO cleancare_user;

-- Database এ connect করুন
\c cleancare_db

-- UUID extension enable করুন
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**ব্যাখ্যা:**
- `CREATE DATABASE`: নতুন database তৈরি করে
- `CREATE USER`: আলাদা user তৈরি করলে security ভালো হয়
- `uuid-ossp`: UUID generate করার জন্য প্রয়োজন

### ২.২ User Model তৈরি

**Step 1: users/models.py file তৈরি করুন**

```python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

class UserManager(BaseUserManager):
    """Custom user manager যেখানে phone number দিয়ে login হবে"""
    
    def create_user(self, phone, password=None, **extra_fields):
        """সাধারণ user তৈরি করার method"""
        if not phone:
            raise ValueError('Phone number অবশ্যই দিতে হবে')
        
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)  # Password hash করে save করবে
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        """Super admin তৈরি করার method"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'super_admin')
        
        return self.create_user(phone, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model যেখানে phone number হবে username"""
    
    USER_TYPE_CHOICES = [
        ('citizen', 'সাধারণ নাগরিক'),
        ('admin', 'অ্যাডমিন'),
        ('super_admin', 'সুপার অ্যাডমিন'),
        ('service_provider', 'সেবা প্রদানকারী'),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, verbose_name='ফোন নম্বর')
    name = models.CharField(max_length=100, verbose_name='নাম')
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name='ইমেইল')
    
    # Additional fields
    nid = models.CharField(max_length=20, null=True, blank=True, verbose_name='NID')
    address = models.TextField(null=True, blank=True, verbose_name='ঠিকানা')
    ward_number = models.CharField(max_length=10, null=True, blank=True, verbose_name='ওয়ার্ড নম্বর')
    profile_picture_url = models.URLField(max_length=500, null=True, blank=True)
    
    # User type and status
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='citizen')
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False, verbose_name='যাচাইকৃত')
    is_staff = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'  # Login এর জন্য phone ব্যবহার হবে
    REQUIRED_FIELDS = ['name']  # Superuser তৈরির সময় এগুলো লাগবে

    class Meta:
        db_table = 'users'
        verbose_name = 'ইউজার'
        verbose_name_plural = 'ইউজারগণ'
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['ward_number']),
            models.Index(fields=['user_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone})"
```

**ব্যাখ্যা:**
- `AbstractBaseUser`: Django এর built-in user model এর base class
- `UserManager`: User তৈরি করার custom logic
- `USERNAME_FIELD = 'phone'`: Phone number দিয়ে login হবে
- `UUID`: প্রতিটি user এর unique ID
- `indexes`: Database query fast করার জন্য

**Step 2: Migration run করুন**
```bash
# Migration files তৈরি করুন
python manage.py makemigrations

# Database এ apply করুন
python manage.py migrate
```



### ২.৩ Complaint Model তৈরি

**Step 1: complaints/models.py file তৈরি করুন**

```python
from django.db import models
from users.models import User
import uuid
import random
import string

def generate_tracking_number():
    """Unique tracking number generate করার function"""
    from datetime import datetime
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.digits, k=4))
    return f"CC{date_str}{random_str}"

class Complaint(models.Model):
    """অভিযোগ model"""
    
    CATEGORY_CHOICES = [
        ('পরিচ্ছন্নতা', 'পরিচ্ছন্নতা'),
        ('বর্জ্য ব্যবস্থাপনা', 'বর্জ্য ব্যবস্থাপনা'),
        ('পানি সরবরাহ', 'পানি সরবরাহ'),
        ('রাস্তাঘাট', 'রাস্তাঘাট'),
        ('বিদ্যুৎ', 'বিদ্যুৎ'),
        ('অন্যান্য', 'অন্যান্য'),
    ]
    
    PRIORITY_CHOICES = [
        ('উচ্চ', 'উচ্চ'),
        ('মধ্যম', 'মধ্যম'),
        ('নিম্ন', 'নিম্ন'),
    ]
    
    STATUS_CHOICES = [
        ('জমা দেওয়া হয়েছে', 'জমা দেওয়া হয়েছে'),
        ('প্রক্রিয়াধীন', 'প্রক্রিয়াধীন'),
        ('সমাধান হয়েছে', 'সমাধান হয়েছে'),
        ('বাতিল', 'বাতিল'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    tracking_number = models.CharField(max_length=20, unique=True, default=generate_tracking_number)
    
    # Complaint details
    title = models.CharField(max_length=200, verbose_name='শিরোনাম')
    description = models.TextField(verbose_name='বিবরণ')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='ক্যাটাগরি')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, verbose_name='অগ্রাধিকার')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='জমা দেওয়া হয়েছে')
    
    # Location
    location = models.CharField(max_length=255, verbose_name='অবস্থান')
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    ward_number = models.CharField(max_length=10, null=True, blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'complaints'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['tracking_number']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.tracking_number} - {self.title}"

class ComplaintImage(models.Model):
    """অভিযোগের ছবি model"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    image_name = models.CharField(max_length=255, null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_images'

    def __str__(self):
        return f"Image for {self.complaint.tracking_number}"

class ComplaintUpdate(models.Model):
    """অভিযোগের status update history"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='updates')
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    old_status = models.CharField(max_length=30, null=True, blank=True)
    new_status = models.CharField(max_length=30)
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_updates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.complaint.tracking_number} - {self.new_status}"
```

**ব্যাখ্যা:**
- `ForeignKey`: User এর সাথে relation তৈরি করে
- `generate_tracking_number()`: Automatic tracking number তৈরি করে
- `related_name`: Reverse relation এর জন্য (user.complaints.all())
- `ComplaintImage`: একটি complaint এ multiple images থাকতে পারে
- `ComplaintUpdate`: Status change এর history track করে

**Step 2: Migration run করুন**
```bash
python manage.py makemigrations complaints
python manage.py migrate
```

---

## ৩. Authentication সিস্টেম

### ৩.১ OTP Service তৈরি

**Step 1: authentication/services.py file তৈরি করুন**

```python
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
import requests

class OTPService:
    """OTP generate এবং verify করার service"""
    
    OTP_EXPIRY_MINUTES = 5  # OTP 5 মিনিট valid থাকবে
    
    def generate_otp(self, phone, purpose='registration'):
        """6 digit OTP generate করে"""
        # Random 6 digit number তৈরি করুন
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Redis cache এ store করুন
        cache_key = f"otp_{phone}_{purpose}"
        cache.set(cache_key, otp_code, timeout=self.OTP_EXPIRY_MINUTES * 60)
        
        # Database এ audit এর জন্য save করুন
        from .models import OTPVerification
        OTPVerification.objects.create(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)
        )
        
        return otp_code
    
    def verify_otp(self, phone, otp_code, purpose='registration'):
        """OTP verify করে"""
        cache_key = f"otp_{phone}_{purpose}"
        stored_otp = cache.get(cache_key)
        
        if stored_otp and stored_otp == otp_code:
            # Database এ verified mark করুন
            from .models import OTPVerification
            OTPVerification.objects.filter(
                phone=phone,
                otp_code=otp_code,
                is_verified=False
            ).update(is_verified=True)
            
            # Cache থেকে delete করুন
            cache.delete(cache_key)
            return True
        
        return False
    
    def send_otp(self, phone, otp_code):
        """SMS gateway দিয়ে OTP পাঠায়"""
        # Bangladesh এর SMS gateway integration
        # Example: SSL Wireless, Banglalink, etc.
        
        message = f"আপনার Clean Care verification code: {otp_code}। এটি 5 মিনিটের জন্য valid।"
        
        # Demo mode - শুধু console এ print করুন
        print(f"SMS to {phone}: {message}")
        
        # Production এ actual SMS gateway ব্যবহার করুন
        # try:
        #     response = requests.post(
        #         'https://sms-gateway-url.com/api/send',
        #         json={
        #             'phone': phone,
        #             'message': message,
        #             'api_key': 'your-api-key'
        #         }
        #     )
        #     return response.status_code == 200
        # except Exception as e:
        #     print(f"SMS sending failed: {e}")
        #     return False
        
        return True
```

**ব্যাখ্যা:**
- `cache.set()`: Redis এ temporary data store করে
- `timeout`: কত সময় পর data expire হবে
- `random.choices()`: Random OTP generate করে
- Production এ actual SMS gateway API ব্যবহার করতে হবে

### ৩.২ OTP Model তৈরি

**Step 1: authentication/models.py file তৈরি করুন**

```python
from django.db import models
import uuid

class OTPVerification(models.Model):
    """OTP verification tracking model"""
    
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_verifications'
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"OTP for {self.phone} - {self.purpose}"
```

**Step 2: Migration run করুন**
```bash
python manage.py makemigrations authentication
python manage.py migrate
```

### ৩.৩ Registration API তৈরি

**Step 1: authentication/serializers.py তৈরি করুন**

```python
from rest_framework import serializers
from users.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration এর জন্য serializer"""
    
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['phone', 'name', 'email', 'password', 'nid', 'address']
    
    def validate_phone(self, value):
        """Phone number validation"""
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("এই ফোন নম্বর দিয়ে ইতিমধ্যে একাউন্ট আছে")
        return value
    
    def create(self, validated_data):
        """User তৈরি করে"""
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
```

**ব্যাখ্যা:**
- `serializers.ModelSerializer`: Model থেকে automatic serializer তৈরি করে
- `write_only=True`: Response এ password দেখাবে না
- `validate_phone()`: Custom validation method
- `create()`: User তৈরি করার custom logic

**Step 2: authentication/views.py তৈরি করুন**

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer
from .services import OTPService
from users.models import User

@api_view(['POST'])
@permission_classes([AllowAny])  # কেউ access করতে পারবে
def register(request):
    """
    User registration endpoint
    
    Request body:
    {
        "phone": "+8801700000000",
        "name": "জন ডো",
        "email": "john@example.com",
        "password": "123456",
        "nid": "1234567890",
        "address": "ঢাকা"
    }
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        # User তৈরি করুন
        user = serializer.save()
        
        # OTP generate এবং send করুন
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
    """
    OTP verification endpoint
    
    Request body:
    {
        "phone": "+8801700000000",
        "otp_code": "123456"
    }
    """
    phone = request.data.get('phone')
    otp_code = request.data.get('otp_code')
    
    if not phone or not otp_code:
        return Response({
            'error': 'Phone এবং OTP code দিতে হবে'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # OTP verify করুন
    otp_service = OTPService()
    if otp_service.verify_otp(phone, otp_code):
        # User এর is_verified = True করুন
        user = User.objects.get(phone=phone)
        user.is_verified = True
        user.save()
        
        # JWT tokens generate করুন
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
    """
    User login endpoint
    
    Request body:
    {
        "phone": "+8801700000000",
        "password": "123456"
    }
    """
    phone = request.data.get('phone')
    password = request.data.get('password')
    
    # Authenticate user
    user = authenticate(phone=phone, password=password)
    
    if user is not None:
        if not user.is_verified:
            return Response({
                'error': 'Please verify your account first'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # JWT tokens generate করুন
        refresh = RefreshToken.for_user(user)
        
        # Last login update করুন
        from django.utils import timezone
        user.last_login = timezone.now()
        user.save()
        
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
@permission_classes([IsAuthenticated])  # শুধু logged in user access করতে পারবে
def get_current_user(request):
    """Current user এর information return করে"""
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

**ব্যাখ্যা:**
- `@api_view(['POST'])`: এটি একটি POST endpoint
- `@permission_classes([AllowAny])`: কেউ access করতে পারবে
- `@permission_classes([IsAuthenticated])`: শুধু logged in user
- `RefreshToken.for_user()`: JWT token generate করে
- `authenticate()`: Django এর built-in authentication



### ৩.৪ URL Configuration

**Step 1: authentication/urls.py তৈরি করুন**

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('verify-otp/', views.verify_otp, name='verify-otp'),
    path('login/', views.login, name='login'),
    path('me/', views.get_current_user, name='current-user'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
```

**Step 2: Main urls.py update করুন**

`clean_care/urls.py` file edit করুন:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
]
```

**ব্যাখ্যা:**
- `include()`: অন্য app এর URLs include করে
- `api/auth/`: সব authentication endpoints এই prefix এ থাকবে
- Final URLs হবে: `/api/auth/register/`, `/api/auth/login/` ইত্যাদি

### ৩.৫ Test করুন

**Step 1: Server run করুন**
```bash
python manage.py runserver
```

**Step 2: Postman দিয়ে test করুন**

**Registration test:**
```
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
    "phone": "+8801700000000",
    "name": "Test User",
    "password": "123456",
    "email": "test@example.com"
}
```

**OTP Verification test:**
```
POST http://localhost:8000/api/auth/verify-otp/
Content-Type: application/json

{
    "phone": "+8801700000000",
    "otp_code": "123456"
}
```

**Login test:**
```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
    "phone": "+8801700000000",
    "password": "123456"
}
```

---

## ৪. Complaint Management

### ৪.১ Complaint Serializer তৈরি

**Step 1: complaints/serializers.py তৈরি করুন**

```python
from rest_framework import serializers
from .models import Complaint, ComplaintImage, ComplaintUpdate
from users.models import User

class ComplaintImageSerializer(serializers.ModelSerializer):
    """Complaint image serializer"""
    
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image_url', 'image_name', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class ComplaintSerializer(serializers.ModelSerializer):
    """Complaint serializer with nested images"""
    
    images = ComplaintImageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'tracking_number', 'user', 'user_name',
            'title', 'description', 'category', 'priority', 'status',
            'location', 'latitude', 'longitude', 'ward_number',
            'assigned_to', 'assigned_to_name',
            'created_at', 'updated_at', 'resolved_at',
            'images'
        ]
        read_only_fields = ['id', 'tracking_number', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Complaint তৈরি করার সময় user automatically set হবে"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    """Complaint update history serializer"""
    
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True)
    
    class Meta:
        model = ComplaintUpdate
        fields = ['id', 'old_status', 'new_status', 'comment', 'updated_by', 'updated_by_name', 'created_at']
        read_only_fields = ['id', 'updated_by', 'created_at']
```

**ব্যাখ্যা:**
- `many=True`: Multiple images এর জন্য
- `source='user.name'`: Related field থেকে data নেয়
- `read_only=True`: শুধু read করা যাবে, update করা যাবে না
- `context['request'].user`: Current logged in user

### ৪.২ Complaint Views তৈরি

**Step 1: complaints/views.py তৈরি করুন**

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Complaint, ComplaintImage, ComplaintUpdate
from .serializers import ComplaintSerializer, ComplaintImageSerializer, ComplaintUpdateSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    """
    Complaint CRUD operations
    
    List: GET /api/complaints/
    Create: POST /api/complaints/
    Retrieve: GET /api/complaints/{id}/
    Update: PUT /api/complaints/{id}/
    Delete: DELETE /api/complaints/{id}/
    """
    
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering options
    filterset_fields = ['status', 'category', 'priority', 'ward_number']
    search_fields = ['title', 'description', 'tracking_number']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        """User শুধু নিজের complaints দেখতে পারবে, admin সব দেখতে পারবে"""
        user = self.request.user
        if user.user_type in ['admin', 'super_admin']:
            return Complaint.objects.all()
        return Complaint.objects.filter(user=user)
    
    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        """
        Complaint এ images upload করার endpoint
        
        POST /api/complaints/{id}/upload_images/
        
        Request body (multipart/form-data):
        - images: List of image files (max 5)
        """
        complaint = self.get_object()
        
        # Check if user owns this complaint
        if complaint.user != request.user:
            return Response({
                'error': 'You can only upload images to your own complaints'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get uploaded files
        images = request.FILES.getlist('images')
        
        if not images:
            return Response({
                'error': 'No images provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(images) > 5:
            return Response({
                'error': 'Maximum 5 images allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save images
        uploaded_images = []
        for image in images:
            # Check file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                return Response({
                    'error': f'Image {image.name} is too large. Max 5MB allowed.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Save to storage (S3 or local)
            # For now, we'll just save the URL
            complaint_image = ComplaintImage.objects.create(
                complaint=complaint,
                image_url=f'/media/complaints/{image.name}',
                image_name=image.name,
                file_size=image.size
            )
            uploaded_images.append(complaint_image)
        
        serializer = ComplaintImageSerializer(uploaded_images, many=True)
        return Response({
            'message': f'{len(uploaded_images)} images uploaded successfully',
            'images': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def updates(self, request, pk=None):
        """
        Complaint এর update history দেখার endpoint
        
        GET /api/complaints/{id}/updates/
        """
        complaint = self.get_object()
        updates = ComplaintUpdate.objects.filter(complaint=complaint)
        serializer = ComplaintUpdateSerializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Complaint এর status update করার endpoint (শুধু admin)
        
        POST /api/complaints/{id}/update_status/
        
        Request body:
        {
            "new_status": "প্রক্রিয়াধীন",
            "comment": "আমরা আপনার অভিযোগ দেখছি"
        }
        """
        complaint = self.get_object()
        
        # Check if user is admin
        if request.user.user_type not in ['admin', 'super_admin']:
            return Response({
                'error': 'Only admins can update complaint status'
            }, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('new_status')
        comment = request.data.get('comment', '')
        
        if not new_status:
            return Response({
                'error': 'new_status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create update record
        old_status = complaint.status
        complaint.status = new_status
        
        # If resolved, set resolved_at
        if new_status == 'সমাধান হয়েছে':
            from django.utils import timezone
            complaint.resolved_at = timezone.now()
        
        complaint.save()
        
        # Create update history
        ComplaintUpdate.objects.create(
            complaint=complaint,
            updated_by=request.user,
            old_status=old_status,
            new_status=new_status,
            comment=comment
        )
        
        return Response({
            'message': 'Status updated successfully',
            'complaint': ComplaintSerializer(complaint).data
        })
```

**ব্যাখ্যা:**
- `viewsets.ModelViewSet`: Automatic CRUD operations তৈরি করে
- `@action(detail=True)`: Custom endpoint তৈরি করে
- `filter_backends`: Filtering, searching, ordering enable করে
- `get_queryset()`: User based filtering

### ৪.৩ Complaint URLs

**Step 1: complaints/urls.py তৈরি করুন**

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Step 2: Main urls.py update করুন**

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/complaints/', include('complaints.urls')),  # নতুন line
]
```

**ব্যাখ্যা:**
- `DefaultRouter`: ViewSet এর জন্য automatic URLs তৈরি করে
- এটি তৈরি করবে: `/api/complaints/`, `/api/complaints/{id}/`, ইত্যাদি

---

## ৫. Payment Gateway

### ৫.১ Payment Model তৈরি

**Step 1: payments/models.py তৈরি করুন**

```python
from django.db import models
from users.models import User
import uuid

class Payment(models.Model):
    """Payment model"""
    
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    service_type = models.CharField(max_length=50, verbose_name='সেবার ধরন')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='পরিমাণ')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    phone_number = models.CharField(max_length=20, verbose_name='পেমেন্ট ফোন নম্বর')
    
    # Transaction tracking
    transaction_id = models.CharField(max_length=100, unique=True, null=True)
    gateway_transaction_id = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Gateway response
    gateway_response = models.JSONField(null=True, blank=True)
    failure_reason = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} BDT"
```

**Step 2: Migration run করুন**
```bash
python manage.py makemigrations payments
python manage.py migrate
```

### ৫.২ bKash Payment Service

**Step 1: payments/services/bkash_service.py তৈরি করুন**

```python
import requests
from django.conf import settings

class BkashPaymentService:
    """bKash payment gateway integration"""
    
    def __init__(self):
        self.base_url = getattr(settings, 'BKASH_BASE_URL', 'https://checkout.pay.bka.sh/v1.2.0-beta')
        self.app_key = getattr(settings, 'BKASH_APP_KEY', '')
        self.app_secret = getattr(settings, 'BKASH_APP_SECRET', '')
        self.username = getattr(settings, 'BKASH_USERNAME', '')
        self.password = getattr(settings, 'BKASH_PASSWORD', '')
        self.token = None
    
    def get_token(self):
        """bKash access token নেয়"""
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
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                self.token = response.json().get('id_token')
                return self.token
        except Exception as e:
            print(f"Token generation failed: {e}")
        
        return None
    
    def create_payment(self, amount, invoice_number, merchant_invoice_number):
        """Payment তৈরি করে"""
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
        
        try:
            response = requests.post(url, json=data, headers=headers)
            return response.json()
        except Exception as e:
            print(f"Payment creation failed: {e}")
            return {'statusCode': '9999', 'statusMessage': str(e)}
    
    def execute_payment(self, payment_id):
        """Payment execute করে"""
        url = f"{self.base_url}/checkout/payment/execute/{payment_id}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.token,
            'X-APP-Key': self.app_key
        }
        
        try:
            response = requests.post(url, headers=headers)
            return response.json()
        except Exception as e:
            print(f"Payment execution failed: {e}")
            return {'statusCode': '9999', 'statusMessage': str(e)}
```

**ব্যাখ্যা:**
- `get_token()`: bKash থেকে access token নেয়
- `create_payment()`: Payment initiate করে
- `execute_payment()`: Payment complete করে
- Production এ actual bKash credentials ব্যবহার করতে হবে



### ৫.৩ Payment Views

**Step 1: payments/views.py তৈরি করুন**

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from .models import Payment
from .services.bkash_service import BkashPaymentService
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """
    Payment process করার endpoint
    
    POST /api/payments/process/
    
    Request body:
    {
        "service_type": "Holding Tax",
        "amount": 1000,
        "payment_method": "bkash",
        "phone_number": "+8801700000000"
    }
    """
    user = request.user
    service_type = request.data.get('service_type')
    amount = request.data.get('amount')
    payment_method = request.data.get('payment_method')
    phone_number = request.data.get('phone_number')
    
    # Validation
    if not all([service_type, amount, payment_method, phone_number]):
        return Response({
            'error': 'সব field পূরণ করুন'
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
                'status': 'processing',
                'message': 'Payment initiated. Please complete on bKash.'
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
@permission_classes([AllowAny])
def bkash_callback(request):
    """
    bKash payment callback handler
    
    POST /api/payments/bkash/callback/
    """
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
                # TODO: Implement notification
                
                return Response({
                    'message': 'Payment successful',
                    'transaction_id': payment.transaction_id
                })
        
        payment.status = 'failed'
        payment.save()
        return Response({'message': 'Payment failed'})
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """
    User এর payment history
    
    GET /api/payments/history/
    """
    user = request.user
    payments = Payment.objects.filter(user=user)
    
    data = []
    for payment in payments:
        data.append({
            'id': str(payment.id),
            'transaction_id': payment.transaction_id,
            'service_type': payment.service_type,
            'amount': float(payment.amount),
            'payment_method': payment.payment_method,
            'status': payment.status,
            'created_at': payment.created_at.isoformat(),
            'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
        })
    
    return Response({'payments': data})
```

**ব্যাখ্যা:**
- `process_payment()`: Payment initiate করে
- `bkash_callback()`: bKash থেকে callback receive করে
- `payment_history()`: User এর সব payments দেখায়

---

## ৬. Super Admin Dashboard

### ৬.১ Dashboard Views

**Step 1: dashboard/views.py তৈরি করুন**

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from datetime import timedelta
from complaints.models import Complaint
from users.models import User
from payments.models import Payment

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_kpi_metrics(request):
    """
    Super Admin Dashboard এর KPI metrics
    
    GET /api/dashboard/kpi/
    """
    # Check if user is super admin
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    # 1. Complaint statistics
    total_complaints = Complaint.objects.count()
    complaints_by_status = Complaint.objects.values('status').annotate(count=Count('id'))
    
    # 2. User statistics
    user_stats = {
        'total_users': User.objects.filter(user_type='citizen').count(),
        'total_admins': User.objects.filter(user_type='admin').count(),
        'total_super_admins': User.objects.filter(user_type='super_admin').count(),
        'verified_users': User.objects.filter(is_verified=True).count(),
    }
    
    # 3. Citizen satisfaction score (dummy data for now)
    avg_satisfaction = 4.2  # Out of 5
    
    # 4. Average service delivery time
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
    
    # 5. Ward-wise performance
    ward_performance = Complaint.objects.values('ward_number').annotate(
        total_complaints=Count('id'),
        resolved_complaints=Count('id', filter=Q(status='সমাধান হয়েছে')),
    ).order_by('-total_complaints')[:10]
    
    return Response({
        'complaint_stats': {
            'total': total_complaints,
            'by_status': list(complaints_by_status),
        },
        'user_stats': user_stats,
        'citizen_satisfaction': avg_satisfaction,
        'avg_service_time_hours': round(avg_resolution_time, 2) if avg_resolution_time else None,
        'ward_performance': list(ward_performance),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_complaints(request):
    """
    Last 1 hour এর complaints
    
    GET /api/dashboard/recent-complaints/
    """
    if request.user.user_type != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=403)
    
    one_hour_ago = timezone.now() - timedelta(hours=1)
    recent_complaints = Complaint.objects.filter(
        created_at__gte=one_hour_ago
    ).select_related('user')[:20]
    
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
            'user_name': complaint.user.name,
            'created_at': complaint.created_at.isoformat()
        })
    
    return Response({'complaints': data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_financial_monitoring(request):
    """
    Financial statistics
    
    GET /api/dashboard/financial/
    """
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
    
    # Monthly revenue
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
```

**ব্যাখ্যা:**
- `get_kpi_metrics()`: Dashboard এর সব KPI metrics return করে
- `get_recent_complaints()`: Last 1 hour এর complaints
- `get_financial_monitoring()`: Revenue এবং payment statistics
- `user_type != 'super_admin'`: শুধু super admin access করতে পারবে

---

## ৭. Real-time Chat

### ৭.১ Django Channels Setup

**Step 1: asgi.py configure করুন**

`clean_care/asgi.py` file edit করুন:

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat import routing

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

**Step 2: settings.py এ Channels configure করুন**

```python
# settings.py এ যোগ করুন

ASGI_APPLICATION = 'clean_care.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### ৭.২ Chat Consumer তৈরি

**Step 1: chat/consumers.py তৈরি করুন**

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat"""
    
    async def connect(self):
        """WebSocket connection establish করে"""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """WebSocket connection close করে"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Message receive করে"""
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
        """Message send করে WebSocket এ"""
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        """Database এ message save করে"""
        from django.utils import timezone
        ChatMessage.objects.create(
            sender_id=sender_id,
            receiver_id=receiver_id,
            room_id=self.room_id,
            message=message
        )
```

**ব্যাখ্যা:**
- `AsyncWebsocketConsumer`: Async WebSocket handler
- `connect()`: Connection establish হলে call হয়
- `disconnect()`: Connection close হলে call হয়
- `receive()`: Message receive করলে call হয়
- `group_send()`: Room এর সব members কে message পাঠায়

---

## ৮. Deployment

### ৮.১ Docker Setup

**Step 1: Dockerfile তৈরি করুন**

```dockerfile
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Work directory
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

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "clean_care.wsgi:application"]
```

**Step 2: docker-compose.yml তৈরি করুন**

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
    command: gunicorn clean_care.wsgi:application --bind 0.0.0.0:8000
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

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### ৮.২ Production এ Deploy

**Step 1: Server এ Docker install করুন**
```bash
# Ubuntu server এ
sudo apt update
sudo apt install docker.io docker-compose -y
```

**Step 2: Code upload করুন**
```bash
# Git repository থেকে clone করুন
git clone https://github.com/your-repo/clean-care-backend.git
cd clean-care-backend
```

**Step 3: .env file তৈরি করুন**
```bash
# .env file তৈরি করুন production values দিয়ে
nano .env
```

**Step 4: Docker containers run করুন**
```bash
# Build এবং run করুন
docker-compose up -d

# Migrations run করুন
docker-compose exec web python manage.py migrate

# Superuser তৈরি করুন
docker-compose exec web python manage.py createsuperuser

# Logs দেখুন
docker-compose logs -f
```

---

## 🎯 সারসংক্ষেপ

এই guide এ আমরা শিখেছি:

1. ✅ **Django Project Setup** - Virtual environment, apps তৈরি
2. ✅ **Database Models** - User, Complaint, Payment models
3. ✅ **Authentication** - JWT + OTP based authentication
4. ✅ **Complaint Management** - CRUD operations, image upload
5. ✅ **Payment Gateway** - bKash integration
6. ✅ **Super Admin Dashboard** - KPI metrics, statistics
7. ✅ **Real-time Chat** - WebSocket with Django Channels
8. ✅ **Deployment** - Docker, docker-compose setup

## 📝 পরবর্তী পদক্ষেপ

1. **Frontend Integration**: Flutter app থেকে API call করুন
2. **Testing**: Unit tests এবং integration tests লিখুন
3. **Security**: Rate limiting, HTTPS configure করুন
4. **Monitoring**: Sentry, logging setup করুন
5. **Backup**: Automated backup system তৈরি করুন

## 🆘 সাহায্য প্রয়োজন?

যেকোনো step এ আটকে গেলে:
1. Error message carefully পড়ুন
2. Django documentation দেখুন
3. Stack Overflow এ search করুন
4. আমাকে জিজ্ঞাসা করুন!

**শুভকামনা! 🚀**
