"""
Quick API Test Script
Run this to test if the API is working
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_api_root():
    """Test API root endpoint"""
    print("🧪 Testing API Root...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_login(username, password):
    """Test login endpoint"""
    print("🔐 Testing Login...")
    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"username": username, "password": password}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Login successful!")
        print(f"Access Token: {data['access'][:50]}...")
        return data['access']
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_dashboard_stats(token):
    """Test dashboard stats endpoint"""
    print("📊 Testing Dashboard Stats...")
    response = requests.get(
        f"{BASE_URL}/dashboard/stats/",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Dashboard stats retrieved!")
        data = response.json()
        print(f"Total Complaints: {data['total_complaints']}")
        print(f"Total Users: {data['total_users']}")
    else:
        print(f"❌ Failed: {response.text}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("Clean Care Bangladesh - API Test")
    print("=" * 60)
    print()
    
    # Test API root
    try:
        test_api_root()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure the server is running: python manage.py runserver")
        exit(1)
    
    # Test login (you need to create a superuser first)
    print("To test login, create a superuser first:")
    print("python manage.py createsuperuser")
    print()
    
    username = input("Enter username (or press Enter to skip): ")
    if username:
        password = input("Enter password: ")
        token = test_login(username, password)
        
        if token:
            test_dashboard_stats(token)
    
    print("=" * 60)
    print("✅ API is ready for frontend integration!")
    print("=" * 60)
