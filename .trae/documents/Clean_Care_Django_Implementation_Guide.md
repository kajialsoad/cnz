# Clean Care Django Backend - ইমপ্লিমেন্টেশন গাইড

## ১. প্রজেক্ট সেটআপ

### ১.১ প্রয়োজনীয় সফটওয়্যার
```bash
# Python 3.11+ ইনস্টল করুন
# PostgreSQL 15+ ইনস্টল করুন
# Redis 7.0+ ইনস্টল করুন
```

### ১.২ ভার্চুয়াল এনভায়রনমেন্ট তৈরি
```bash
# প্রজেক্ট ডিরেক্টরি তৈরি
mkdir clean_care_backend
cd clean_care_backend

# ভার্চুয়াল এনভায়রনমেন্ট তৈরি
python -m venv venv

# এক্টিভেট করুন (Windows)
venv\Scripts\activate

# এক্টিভেট করুন (Linux/Mac)
source venv/bin/activate
```

### ১.৩ Dependencies ইনস্টল
```bash
# requirements.txt তৈরি করুন
pip install django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.1
pip install psycopg2-binary==2.9.7
pip install redis==5.0.1
pip install celery==5.3.4
pip install channels==4.0.0
pip install channels-redis==4.1.0
pip install pillow==10.1.0
pip install django-storages==1.14.2
pip install boto3==1.29.7
pip install drf-spectacular==0.26.5
pip install django-filter==23.3
pip install python-decouple==3.8

# requirements.txt এ সেভ করুন
pip freeze > requirements.txt
```

## ২. Django প্রজেক্ট স্ট্রাকচার

```
clean_care_backend/
├── manage.py
├── requirements.txt
├── .env
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
│   ├── __init__.py
│   ├── authentication/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── utils.py
│   ├── users/
│   ├── complaints/
│   ├── payments/
│   ├── donations/
│   ├── emergency/
│   ├── waste_management/
│   ├── gallery/
│   ├── chat/
│   ├── notices/
│   ├── calendar_events/
│   └── dashboard/
├── static/
├── media/
└── templates/
```

## ৩. Settings Configuration

### ৩.১ Base Settings (clean_care/settings/base.py)
```python
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'drf_spectacular',
    'django_filters',
]

LOCAL_APPS = [
    'apps.authentication',
    'apps.users',
    'apps.complaints',
    'apps.payments',
    'apps.donations',
    'apps.emergency',
    'apps.waste_management',
    'apps.gallery',
    'apps.chat',
    'apps.notices',
    'apps.calendar_events',
    'apps.dashboard',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'clean_care.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'clean_care.wsgi.application'
ASGI_APPLICATION = 'clean_care.asgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='clean_care_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Redis Configuration
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

# Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL],
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Dhaka'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = 'bn-bd'
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'Clean Care API',
    'DESCRIPTION': 'Clean Care Mobile App Backend API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

## ৪. Models Implementation

### ৪.১ User Model (apps/authentication/models.py)
```python
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.name} ({self.phone})"
```

### ৪.২ Complaint Model (apps/complaints/models.py)
```python
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Complaint(models.Model):
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
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='জমা দেওয়া হয়েছে')
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.name}"

class ComplaintAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='complaint_attachments/')
    file_type = models.CharField(max_length=20)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_attachments'
```

### ৪.৩ Payment Model (apps/payments/models.py)
```python
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('bkash', 'বিকাশ'),
        ('nagad', 'নগদ'),
        ('rocket', 'রকেট'),
        ('upay', 'উপায়'),
    ]

    STATUS_CHOICES = [
        ('pending', 'অপেক্ষমান'),
        ('completed', 'সম্পন্ন'),
        ('failed', 'ব্যর্থ'),
        ('cancelled', 'বাতিল'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    service_type = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    phone_number = models.CharField(max_length=20)
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    gateway_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.service_type} - {self.amount} - {self.user.name}"
```

## ৫. API Views Implementation

### ৫.১ Authentication Views (apps/authentication/views.py)
```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .models import User

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'name': user.name,
                'phone': user.phone,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']
        
        user = authenticate(phone=phone, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': str(user.id),
                    'name': user.name,
                    'phone': user.phone,
                    'email': user.email,
                }
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### ৫.২ Complaint Views (apps/complaints/views.py)
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintCreateSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Complaint.objects.all()
        return Complaint.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Complaint.STATUS_CHOICES):
            complaint.status = new_status
            complaint.save()
            return Response({'status': 'Status updated successfully'})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
```

## ৬. WebSocket Implementation

### ৬.১ Chat Consumer (apps/chat/consumers.py)
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        self.room_name = f"user_{self.user.id}"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        receiver_id = text_data_json.get('receiver_id')

        # Save message to database
        chat_message = await self.save_message(
            sender=self.user,
            receiver_id=receiver_id,
            message=message
        )

        # Send message to receiver
        if receiver_id:
            await self.channel_layer.group_send(
                f"chat_user_{receiver_id}",
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': str(self.user.id),
                    'sender_name': self.user.name,
                    'timestamp': chat_message.created_at.isoformat(),
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp'],
        }))

    @database_sync_to_async
    def save_message(self, sender, receiver_id, message):
        receiver = None
        if receiver_id:
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                pass

        return ChatMessage.objects.create(
            sender=sender,
            receiver=receiver,
            message=message
        )
```

## ৭. Celery Tasks

### ৭.১ Notification Tasks (apps/notifications/tasks.py)
```python
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import requests

@shared_task
def send_sms_notification(phone_number, message):
    """Send SMS notification using SMS gateway"""
    # SMS Gateway API implementation
    api_url = settings.SMS_GATEWAY_URL
    api_key = settings.SMS_API_KEY
    
    payload = {
        'api_key': api_key,
        'phone': phone_number,
        'message': message,
    }
    
    try:
        response = requests.post(api_url, json=payload)
        return response.json()
    except Exception as e:
        return {'error': str(e)}

@shared_task
def send_push_notification(user_id, title, body):
    """Send push notification to mobile app"""
    # Firebase Cloud Messaging implementation
    pass

@shared_task
def process_payment_callback(payment_id, gateway_response):
    """Process payment gateway callback"""
    from apps.payments.models import Payment
    
    try:
        payment = Payment.objects.get(id=payment_id)
        payment.gateway_response = gateway_response
        
        if gateway_response.get('status') == 'success':
            payment.status = 'completed'
            payment.transaction_id = gateway_response.get('transaction_id')
        else:
            payment.status = 'failed'
        
        payment.save()
        
        # Send notification to user
        send_sms_notification.delay(
            payment.user.phone,
            f"আপনার পেমেন্ট {payment.status} হয়েছে। পরিমাণ: {payment.amount} টাকা"
        )
        
    except Payment.DoesNotExist:
        pass
```

## ৮. Deployment Configuration

### ৮.১ Docker Configuration
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "clean_care.wsgi:application"]
```

### ৮.২ Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: clean_care_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
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
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379/0

  celery:
    build: .
    command: celery -A clean_care worker --loglevel=info
    volumes:
      - .:/app
    depends_on:
      - db
      - redis
    environment:
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379/0

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

এই ডকুমেন্টেশন আপনার Flutter Clean Care অ্যাপের জন্য একটি সম্পূর্ণ Django backend সিস্টেম তৈরি করার জন্য প্রয়োজনীয় সব তথ্য প্রদান করে। এটি production-ready এবং scalable backend সিস্টেম তৈরি করতে সাহায্য করবে।