# Django Custom Admin Panel - Clean Care Bangladesh

## Overview

এই guide এ আমরা Django এর জন্য একটি modern, feature-rich custom admin panel তৈরি করব যা:
- ✅ Bengali language support
- ✅ Beautiful UI with custom styling
- ✅ Dashboard with KPI metrics
- ✅ Advanced filtering and search
- ✅ Bulk actions
- ✅ Export functionality (CSV, Excel, PDF)
- ✅ Custom widgets and forms
- ✅ Role-based permissions

## 1. Django Admin Customization

### 1.1 Install Additional Packages

```bash
# F:\clean_care_backend folder এ
.\venv\Scripts\activate
pip install django-import-export django-admin-rangefilter django-admin-interface
```

**Packages:**
- `django-import-export`: CSV/Excel import/export
- `django-admin-rangefilter`: Date range filtering
- `django-admin-interface`: Modern UI theme

### 1.2 Update settings.py

`clean_care/settings.py` file edit করুন:

```python
INSTALLED_APPS = [
    # Admin interface (must be before django.contrib.admin)
    'admin_interface',
    'colorfield',
    
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'import_export',
    'rangefilter',
    
    # Local apps
    'authentication',
    'users',
    'complaints',
    'payments',
    'dashboard',
]

# Admin site customization
ADMIN_SITE_HEADER = "Clean Care Bangladesh"
ADMIN_SITE_TITLE = "Clean Care Admin"
ADMIN_INDEX_TITLE = "স্বাগতম Clean Care Admin Panel এ"

# Language
LANGUAGE_CODE = 'bn'  # Bengali
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True
```

### 1.3 Create Custom Admin Site

`clean_care/admin.py` file তৈরি করুন:

```python
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _

class CleanCareAdminSite(AdminSite):
    """Custom Admin Site for Clean Care Bangladesh"""
    
    site_header = "Clean Care Bangladesh Admin"
    site_title = "Clean Care Admin Portal"
    index_title = "স্বাগতম Admin Dashboard এ"
    
    def each_context(self, request):
        """Add custom context to all admin pages"""
        context = super().each_context(request)
        
        # Add custom dashboard data
        from complaints.models import Complaint
        from users.models import User
        from payments.models import Payment
        
        context.update({
            'total_complaints': Complaint.objects.count(),
            'pending_complaints': Complaint.objects.filter(status='জমা দেওয়া হয়েছে').count(),
            'total_users': User.objects.filter(user_type='citizen').count(),
            'total_revenue': Payment.objects.filter(status='completed').aggregate(
                total=models.Sum('amount')
            )['total'] or 0,
        })
        
        return context

# Create custom admin site instance
admin_site = CleanCareAdminSite(name='cleancare_admin')
```

### 1.4 Update urls.py

`clean_care/urls.py` file edit করুন:

```python
from django.urls import path, include
from .admin import admin_site

urlpatterns = [
    path('admin/', admin_site.urls),  # Custom admin site
    path('api/auth/', include('authentication.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/payments/', include('payments.urls')),
]
```

## 2. User Model Admin

### 2.1 Create users/admin.py

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Count, Q
from import_export.admin import ImportExportModelAdmin
from rangefilter.filters import DateRangeFilter
from .models import User

@admin.register(User)
class UserAdmin(ImportExportModelAdmin, BaseUserAdmin):
    """Custom User Admin with Bengali support"""
    
    list_display = [
        'phone', 'name', 'user_type_badge', 'ward_number', 
        'is_verified_badge', 'complaint_count', 'created_at'
    ]
    list_filter = [
        'user_type', 'is_verified', 'is_active', 
        ('created_at', DateRangeFilter),
        'ward_number'
    ]
    search_fields = ['phone', 'name', 'email', 'nid']
    ordering = ['-created_at']
    
    fieldsets = (
        ('মূল তথ্য', {
            'fields': ('phone', 'name', 'email', 'password')
        }),
        ('ব্যক্তিগত তথ্য', {
            'fields': ('nid', 'address', 'ward_number', 'profile_picture_url')
        }),
        ('অনুমতি', {
            'fields': ('user_type', 'is_active', 'is_verified', 'is_staff', 'is_superuser')
        }),
        ('গুরুত্বপূর্ণ তারিখ', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    def user_type_badge(self, obj):
        """Display user type with colored badge"""
        colors = {
            'citizen': '#28a745',
            'admin': '#007bff',
            'super_admin': '#dc3545',
            'service_provider': '#ffc107'
        }
        color = colors.get(obj.user_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_user_type_display()
        )
    user_type_badge.short_description = 'ইউজার টাইপ'
    
    def is_verified_badge(self, obj):
        """Display verification status with icon"""
        if obj.is_verified:
            return format_html(
                '<span style="color: green; font-size: 18px;">✓</span>'
            )
        return format_html(
            '<span style="color: red; font-size: 18px;">✗</span>'
        )
    is_verified_badge.short_description = 'যাচাইকৃত'
    
    def complaint_count(self, obj):
        """Display number of complaints"""
        count = obj.complaints.count()
        return format_html(
            '<span style="background-color: #17a2b8; color: white; padding: 2px 8px; '
            'border-radius: 10px;">{}</span>',
            count
        )
    complaint_count.short_description = 'অভিযোগ সংখ্যা'
    
    def get_queryset(self, request):
        """Optimize queryset with prefetch"""
        qs = super().get_queryset(request)
        return qs.annotate(
            complaint_count=Count('complaints')
        )
    
    actions = ['verify_users', 'make_admin', 'export_as_csv']
    
    def verify_users(self, request, queryset):
        """Bulk verify users"""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} জন ইউজার যাচাই করা হয়েছে')
    verify_users.short_description = 'নির্বাচিত ইউজারদের যাচাই করুন'
    
    def make_admin(self, request, queryset):
        """Bulk make users admin"""
        updated = queryset.update(user_type='admin', is_staff=True)
        self.message_user(request, f'{updated} জন ইউজারকে অ্যাডমিন করা হয়েছে')
    make_admin.short_description = 'নির্বাচিত ইউজারদের অ্যাডমিন করুন'
```

## 3. Complaint Model Admin

### 3.1 Create complaints/admin.py

```python
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.urls import reverse
from django.utils.safestring import mark_safe
from import_export.admin import ImportExportModelAdmin
from rangefilter.filters import DateRangeFilter
from .models import Complaint, ComplaintImage, ComplaintUpdate

class ComplaintImageInline(admin.TabularInline):
    """Inline for complaint images"""
    model = ComplaintImage
    extra = 1
    fields = ['image_preview', 'image_url', 'image_name', 'file_size']
    readonly_fields = ['image_preview', 'file_size']
    
    def image_preview(self, obj):
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;"/>',
                obj.image_url
            )
        return "No image"
    image_preview.short_description = 'প্রিভিউ'

class ComplaintUpdateInline(admin.TabularInline):
    """Inline for complaint updates"""
    model = ComplaintUpdate
    extra = 0
    fields = ['new_status', 'comment', 'updated_by', 'created_at']
    readonly_fields = ['created_at']

@admin.register(Complaint)
class ComplaintAdmin(ImportExportModelAdmin):
    """Custom Complaint Admin"""
    
    list_display = [
        'tracking_number', 'title_short', 'user_link', 'category_badge',
        'priority_badge', 'status_badge', 'ward_number', 'created_at'
    ]
    list_filter = [
        'status', 'category', 'priority', 'ward_number',
        ('created_at', DateRangeFilter),
        ('resolved_at', DateRangeFilter),
    ]
    search_fields = ['tracking_number', 'title', 'description', 'user__name', 'user__phone']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('অভিযোগের তথ্য', {
            'fields': ('tracking_number', 'user', 'title', 'description')
        }),
        ('শ্রেণীবিভাগ', {
            'fields': ('category', 'priority', 'status')
        }),
        ('অবস্থান', {
            'fields': ('location', 'latitude', 'longitude', 'ward_number')
        }),
        ('নিয়োগ', {
            'fields': ('assigned_to',)
        }),
        ('তারিখ', {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['tracking_number', 'created_at', 'updated_at']
    inlines = [ComplaintImageInline, ComplaintUpdateInline]
    
    def title_short(self, obj):
        """Display shortened title"""
        if len(obj.title) > 50:
            return obj.title[:50] + '...'
        return obj.title
    title_short.short_description = 'শিরোনাম'
    
    def user_link(self, obj):
        """Display user with link"""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'ইউজার'
    
    def category_badge(self, obj):
        """Display category with badge"""
        colors = {
            'পরিচ্ছন্নতা': '#28a745',
            'বর্জ্য ব্যবস্থাপনা': '#17a2b8',
            'পানি সরবরাহ': '#007bff',
            'রাস্তাঘাট': '#ffc107',
            'বিদ্যুৎ': '#dc3545',
            'অন্যান্য': '#6c757d'
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color, obj.category
        )
    category_badge.short_description = 'ক্যাটাগরি'
    
    def priority_badge(self, obj):
        """Display priority with badge"""
        colors = {'উচ্চ': '#dc3545', 'মধ্যম': '#ffc107', 'নিম্ন': '#28a745'}
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.priority
        )
    priority_badge.short_description = 'অগ্রাধিকার'
    
    def status_badge(self, obj):
        """Display status with badge"""
        colors = {
            'জমা দেওয়া হয়েছে': '#17a2b8',
            'প্রক্রিয়াধীন': '#ffc107',
            'সমাধান হয়েছে': '#28a745',
            'বাতিল': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = 'স্ট্যাটাস'
    
    actions = ['mark_as_processing', 'mark_as_resolved', 'assign_to_me']
    
    def mark_as_processing(self, request, queryset):
        """Mark complaints as processing"""
        updated = queryset.update(status='প্রক্রিয়াধীন')
        self.message_user(request, f'{updated}টি অভিযোগ প্রক্রিয়াধীন করা হয়েছে')
    mark_as_processing.short_description = 'প্রক্রিয়াধীন হিসেবে চিহ্নিত করুন'
    
    def mark_as_resolved(self, request, queryset):
        """Mark complaints as resolved"""
        from django.utils import timezone
        updated = queryset.update(status='সমাধান হয়েছে', resolved_at=timezone.now())
        self.message_user(request, f'{updated}টি অভিযোগ সমাধান করা হয়েছে')
    mark_as_resolved.short_description = 'সমাধান হিসেবে চিহ্নিত করুন'
    
    def assign_to_me(self, request, queryset):
        """Assign complaints to current user"""
        updated = queryset.update(assigned_to=request.user)
        self.message_user(request, f'{updated}টি অভিযোগ আপনাকে নিয়োগ করা হয়েছে')
    assign_to_me.short_description = 'আমাকে নিয়োগ করুন'
```



## 4. Payment Model Admin

### 4.1 Create payments/admin.py

```python
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from import_export.admin import ImportExportModelAdmin
from rangefilter.filters import DateRangeFilter
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(ImportExportModelAdmin):
    """Custom Payment Admin"""
    
    list_display = [
        'transaction_id', 'user_link', 'service_type', 'amount_display',
        'payment_method_badge', 'status_badge', 'created_at'
    ]
    list_filter = [
        'status', 'payment_method', 'service_type',
        ('created_at', DateRangeFilter),
        ('completed_at', DateRangeFilter),
    ]
    search_fields = ['transaction_id', 'gateway_transaction_id', 'user__name', 'user__phone']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('পেমেন্ট তথ্য', {
            'fields': ('user', 'service_type', 'amount', 'payment_method', 'phone_number')
        }),
        ('ট্রানজেকশন', {
            'fields': ('transaction_id', 'gateway_transaction_id', 'status')
        }),
        ('Gateway Response', {
            'fields': ('gateway_response', 'failure_reason'),
            'classes': ('collapse',)
        }),
        ('তারিখ', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['transaction_id', 'created_at', 'updated_at']
    
    def user_link(self, obj):
        """Display user with link"""
        from django.urls import reverse
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name)
    user_link.short_description = 'ইউজার'
    
    def amount_display(self, obj):
        """Display amount with currency"""
        return format_html(
            '<span style="font-weight: bold; color: #28a745;">৳ {}</span>',
            f"{obj.amount:,.2f}"
        )
    amount_display.short_description = 'পরিমাণ'
    
    def payment_method_badge(self, obj):
        """Display payment method with badge"""
        colors = {
            'bkash': '#e2136e',
            'nagad': '#f15a22',
            'rocket': '#8b3eea',
            'upay': '#0066cc'
        }
        color = colors.get(obj.payment_method, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold; text-transform: uppercase;">{}</span>',
            color, obj.payment_method
        )
    payment_method_badge.short_description = 'পেমেন্ট মেথড'
    
    def status_badge(self, obj):
        """Display status with badge"""
        colors = {
            'pending': '#6c757d',
            'processing': '#17a2b8',
            'completed': '#28a745',
            'failed': '#dc3545',
            'cancelled': '#ffc107',
            'refunded': '#fd7e14'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'স্ট্যাটাস'
    
    def changelist_view(self, request, extra_context=None):
        """Add summary statistics to changelist"""
        extra_context = extra_context or {}
        
        # Calculate statistics
        queryset = self.get_queryset(request)
        extra_context['total_revenue'] = queryset.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        extra_context['pending_amount'] = queryset.filter(
            status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return super().changelist_view(request, extra_context)
```

## 5. Custom Dashboard

### 5.1 Create dashboard/admin.py

```python
from django.contrib import admin
from django.shortcuts import render
from django.urls import path
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta

class DashboardAdmin(admin.ModelAdmin):
    """Custom Dashboard Admin"""
    
    def get_urls(self):
        """Add custom dashboard URL"""
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_site.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    def dashboard_view(self, request):
        """Custom dashboard view"""
        from complaints.models import Complaint
        from users.models import User
        from payments.models import Payment
        
        # Time ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Complaint statistics
        total_complaints = Complaint.objects.count()
        complaints_by_status = Complaint.objects.values('status').annotate(
            count=Count('id')
        )
        
        new_complaints_today = Complaint.objects.filter(
            created_at__date=today
        ).count()
        
        new_complaints_week = Complaint.objects.filter(
            created_at__date__gte=week_ago
        ).count()
        
        # User statistics
        total_users = User.objects.filter(user_type='citizen').count()
        new_users_today = User.objects.filter(
            user_type='citizen',
            created_at__date=today
        ).count()
        
        verified_users = User.objects.filter(is_verified=True).count()
        
        # Payment statistics
        total_revenue = Payment.objects.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        revenue_today = Payment.objects.filter(
            status='completed',
            completed_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        revenue_month = Payment.objects.filter(
            status='completed',
            completed_at__date__gte=month_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Ward-wise performance
        ward_performance = Complaint.objects.values('ward_number').annotate(
            total=Count('id'),
            resolved=Count('id', filter=Q(status='সমাধান হয়েছে'))
        ).order_by('-total')[:10]
        
        # Recent complaints
        recent_complaints = Complaint.objects.select_related('user').order_by('-created_at')[:10]
        
        context = {
            'title': 'Dashboard',
            'total_complaints': total_complaints,
            'complaints_by_status': complaints_by_status,
            'new_complaints_today': new_complaints_today,
            'new_complaints_week': new_complaints_week,
            'total_users': total_users,
            'new_users_today': new_users_today,
            'verified_users': verified_users,
            'total_revenue': total_revenue,
            'revenue_today': revenue_today,
            'revenue_month': revenue_month,
            'ward_performance': ward_performance,
            'recent_complaints': recent_complaints,
        }
        
        return render(request, 'admin/dashboard.html', context)

# Register empty model for dashboard
admin.site.register(DashboardAdmin)
```

### 5.2 Create Dashboard Template

`templates/admin/dashboard.html` তৈরি করুন:

```html
{% extends "admin/base_site.html" %}
{% load static %}

{% block title %}Dashboard - Clean Care Bangladesh{% endblock %}

{% block content %}
<div class="dashboard-container" style="padding: 20px;">
    <h1 style="color: #2E8B57; margin-bottom: 30px;">📊 Dashboard Overview</h1>
    
    <!-- KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <!-- Total Complaints Card -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; opacity: 0.9;">মোট অভিযোগ</div>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">{{ total_complaints }}</div>
            <div style="font-size: 12px; opacity: 0.8;">আজ নতুন: {{ new_complaints_today }}</div>
        </div>
        
        <!-- Total Users Card -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; opacity: 0.9;">মোট ইউজার</div>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">{{ total_users }}</div>
            <div style="font-size: 12px; opacity: 0.8;">যাচাইকৃত: {{ verified_users }}</div>
        </div>
        
        <!-- Total Revenue Card -->
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; opacity: 0.9;">মোট রাজস্ব</div>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">৳ {{ total_revenue|floatformat:0 }}</div>
            <div style="font-size: 12px; opacity: 0.8;">এই মাসে: ৳ {{ revenue_month|floatformat:0 }}</div>
        </div>
        
        <!-- New This Week Card -->
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; opacity: 0.9;">এই সপ্তাহে নতুন</div>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">{{ new_complaints_week }}</div>
            <div style="font-size: 12px; opacity: 0.8;">অভিযোগ জমা হয়েছে</div>
        </div>
    </div>
    
    <!-- Charts Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <!-- Complaints by Status -->
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2E8B57; margin-bottom: 15px;">স্ট্যাটাস অনুযায়ী অভিযোগ</h3>
            <table style="width: 100%; border-collapse: collapse;">
                {% for item in complaints_by_status %}
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">{{ item.status }}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">{{ item.count }}</td>
                </tr>
                {% endfor %}
            </table>
        </div>
        
        <!-- Ward Performance -->
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2E8B57; margin-bottom: 15px;">ওয়ার্ড ভিত্তিক পারফরম্যান্স</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 10px; text-align: left;">ওয়ার্ড</th>
                        <th style="padding: 10px; text-align: right;">মোট</th>
                        <th style="padding: 10px; text-align: right;">সমাধান</th>
                    </tr>
                </thead>
                <tbody>
                    {% for ward in ward_performance %}
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">{{ ward.ward_number|default:"N/A" }}</td>
                        <td style="padding: 10px; text-align: right;">{{ ward.total }}</td>
                        <td style="padding: 10px; text-align: right; color: #28a745;">{{ ward.resolved }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Recent Complaints -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color: #2E8B57; margin-bottom: 15px;">সাম্প্রতিক অভিযোগ</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 10px; text-align: left;">ট্র্যাকিং নম্বর</th>
                    <th style="padding: 10px; text-align: left;">শিরোনাম</th>
                    <th style="padding: 10px; text-align: left;">ইউজার</th>
                    <th style="padding: 10px; text-align: left;">স্ট্যাটাস</th>
                    <th style="padding: 10px; text-align: left;">তারিখ</th>
                </tr>
            </thead>
            <tbody>
                {% for complaint in recent_complaints %}
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">
                        <a href="{% url 'admin:complaints_complaint_change' complaint.id %}">
                            {{ complaint.tracking_number }}
                        </a>
                    </td>
                    <td style="padding: 10px;">{{ complaint.title|truncatewords:5 }}</td>
                    <td style="padding: 10px;">{{ complaint.user.name }}</td>
                    <td style="padding: 10px;">
                        <span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
                            {{ complaint.status }}
                        </span>
                    </td>
                    <td style="padding: 10px;">{{ complaint.created_at|date:"d M Y" }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</div>
{% endblock %}
```

## 6. Installation Steps

### Step 1: Install packages
```bash
cd F:\clean_care_backend
.\venv\Scripts\activate
pip install django-import-export django-admin-rangefilter django-admin-interface openpyxl
```

### Step 2: Run migrations
```bash
python manage.py migrate
```

### Step 3: Create superuser
```bash
python manage.py createsuperuser
```

### Step 4: Collect static files
```bash
python manage.py collectstatic
```

### Step 5: Run server
```bash
python manage.py runserver
```

### Step 6: Access admin
Open browser: `http://localhost:8000/admin/`

## 7. Features Summary

✅ **Modern UI** - Beautiful gradient cards and responsive design
✅ **Bengali Support** - Full Bengali language interface
✅ **Dashboard** - KPI metrics, charts, recent activities
✅ **Advanced Filtering** - Date range, status, category filters
✅ **Bulk Actions** - Verify users, assign complaints, update status
✅ **Export** - CSV, Excel export functionality
✅ **Inline Editing** - Edit related models inline
✅ **Custom Badges** - Colored status badges
✅ **Search** - Advanced search across multiple fields
✅ **Permissions** - Role-based access control

## 8. Customization Tips

### Change Admin Colors
Edit `clean_care/settings.py`:
```python
ADMIN_INTERFACE = {
    'THEME': 'green',  # or 'blue', 'red', 'purple'
}
```

### Add Custom Actions
```python
def custom_action(self, request, queryset):
    # Your logic here
    pass
custom_action.short_description = 'Custom Action'

actions = ['custom_action']
```

### Add Custom Filters
```python
class CustomFilter(admin.SimpleListFilter):
    title = 'Custom Filter'
    parameter_name = 'custom'
    
    def lookups(self, request, model_admin):
        return (
            ('option1', 'Option 1'),
            ('option2', 'Option 2'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'option1':
            return queryset.filter(...)
        return queryset
```

**Your custom Django admin panel is ready! 🎉**
