from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import UserSerializer, DashboardStatsSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter users based on permissions"""
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics
    
    Returns comprehensive dashboard data including:
    - Total complaints by status
    - User statistics
    - Ward performance
    - Weekly trends
    - Satisfaction scores
    """
    
    # Mock data - replace with real database queries
    stats = {
        'total_complaints': 1028,
        'solved_complaints': 342,
        'pending_complaints': 127,
        'in_progress_complaints': 45,
        'total_users': 12847,
        'total_admins': 24,
        'total_super_admins': 3,
        'satisfaction_score': 4.2,
        'average_service_time': 4.3,
        'complaints_by_status': [
            {'status': 'Submitted', 'count': 514, 'percentage': 50},
            {'status': 'Solved', 'count': 342, 'percentage': 33},
            {'status': 'Pending', 'count': 127, 'percentage': 13},
            {'status': 'In Progress', 'count': 45, 'percentage': 4},
        ],
        'ward_performance': [
            {'ward_number': '40', 'total': 95, 'pending': 15, 'resolved': 80},
            {'ward_number': '41', 'total': 78, 'pending': 12, 'resolved': 66},
            {'ward_number': '42', 'total': 112, 'pending': 20, 'resolved': 92},
            {'ward_number': '43', 'total': 68, 'pending': 10, 'resolved': 58},
            {'ward_number': '44', 'total': 87, 'pending': 18, 'resolved': 69},
        ],
        'weekly_trend': {
            'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'complaints': [45, 52, 48, 58, 65, 62, 55],
            'resolved': [40, 48, 45, 50, 55, 58, 52],
        }
    }
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    API Root - Welcome endpoint
    """
    return Response({
        'message': 'Welcome to Clean Care Bangladesh API',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'login': '/api/auth/login/',
                'refresh': '/api/auth/refresh/',
                'profile': '/api/auth/profile/',
            },
            'dashboard': {
                'stats': '/api/dashboard/stats/',
            },
            'users': {
                'list': '/api/users/',
                'detail': '/api/users/{id}/',
            }
        }
    })
