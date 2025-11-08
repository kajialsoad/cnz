from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    # API Root
    path('', views.api_root, name='api-root'),
    
    # Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.user_profile, name='user-profile'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Router URLs (users, etc.)
    path('', include(router.urls)),
]
