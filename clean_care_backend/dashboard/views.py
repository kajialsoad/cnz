from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def dashboard_view(request):
    """Custom dashboard view with statistics"""
    
    # Mock data for now - will be replaced with real data later
    context = {
        'total_complaints': 1028,
        'complaints_by_status': [
            {'status': 'সমাধান হয়েছে', 'count': 342},
            {'status': 'জমা দেওয়া হয়েছে', 'count': 127},
            {'status': 'প্রক্রিয়াধীন', 'count': 45},
        ],
        'total_users': 12847,
        'new_complaints_today': 23,
        'new_complaints_week': 156,
        'verified_users': 11234,
        'total_revenue': 245000,
        'revenue_today': 12500,
        'revenue_month': 89000,
        'ward_performance': [
            {'ward_number': '40', 'total': 95},
            {'ward_number': '41', 'total': 78},
            {'ward_number': '42', 'total': 112},
            {'ward_number': '43', 'total': 68},
            {'ward_number': '44', 'total': 87},
        ],
        'recent_complaints': [],
    }
    
    return render(request, 'dashboard/index.html', context)
