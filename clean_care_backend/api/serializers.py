from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    
    total_complaints = serializers.IntegerField()
    solved_complaints = serializers.IntegerField()
    pending_complaints = serializers.IntegerField()
    in_progress_complaints = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_admins = serializers.IntegerField()
    total_super_admins = serializers.IntegerField()
    satisfaction_score = serializers.FloatField()
    average_service_time = serializers.FloatField()
    complaints_by_status = serializers.ListField()
    ward_performance = serializers.ListField()
    weekly_trend = serializers.DictField()
