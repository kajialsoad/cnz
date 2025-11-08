"""
URL configuration for clean_care project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    # Redirect root to API
    path('', RedirectView.as_view(url='/api/', permanent=False)),
    
    # API endpoints (for React/Vue frontend)
    path('api/', include('api.urls')),
    
    # Optional: Keep dashboard for testing (can be removed later)
    path('dashboard/', include('dashboard.urls')),
    
    # Django admin is removed - using custom frontend
    # path('admin/', admin.site.urls),
]
