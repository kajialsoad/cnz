# Clean Care Bangladesh - REST API Documentation

## 🚀 Overview

Django backend এখন **REST API** হিসেবে কাজ করবে। তুমি React, Vue, বা যেকোনো frontend framework দিয়ে এই API consume করতে পারবে।

## 📦 Setup Complete

✅ Django REST Framework installed
✅ JWT Authentication configured
✅ CORS enabled (all origins allowed in development)
✅ API endpoints created

## 🔐 Authentication

### 1. Login (Get JWT Token)

```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Refresh Token

```bash
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "your_refresh_token"
}
```

### 3. Get User Profile

```bash
GET /api/auth/profile/
Authorization: Bearer your_access_token
```

## 📊 Dashboard API

### Get Dashboard Statistics

```bash
GET /api/dashboard/stats/
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "total_complaints": 1028,
  "solved_complaints": 342,
  "pending_complaints": 127,
  "in_progress_complaints": 45,
  "total_users": 12847,
  "total_admins": 24,
  "total_super_admins": 3,
  "satisfaction_score": 4.2,
  "average_service_time": 4.3,
  "complaints_by_status": [
    {"status": "Submitted", "count": 514, "percentage": 50},
    {"status": "Solved", "count": 342, "percentage": 33}
  ],
  "ward_performance": [
    {"ward_number": "40", "total": 95, "pending": 15, "resolved": 80}
  ],
  "weekly_trend": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "complaints": [45, 52, 48, 58, 65, 62, 55],
    "resolved": [40, 48, 45, 50, 55, 58, 52]
  }
}
```

## 👥 Users API

### List All Users

```bash
GET /api/users/
Authorization: Bearer your_access_token
```

### Get Single User

```bash
GET /api/users/{id}/
Authorization: Bearer your_access_token
```

### Create User

```bash
POST /api/users/
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123"
}
```

### Update User

```bash
PUT /api/users/{id}/
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "first_name": "Updated Name"
}
```

### Delete User

```bash
DELETE /api/users/{id}/
Authorization: Bearer your_access_token
```

## 🌐 CORS Configuration

CORS is enabled for all origins in development. For production, update `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
```

## 🔧 Frontend Integration Examples

### React Example (using Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Login
const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login/`, {
    username,
    password
  });
  
  // Store tokens
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  
  return response.data;
};

// Get Dashboard Stats
const getDashboardStats = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await axios.get(`${API_URL}/dashboard/stats/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};
```

### Vue Example (using Fetch)

```javascript
// Login
async function login(username, password) {
  const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  return data;
}

// Get Dashboard Stats
async function getDashboardStats() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://127.0.0.1:8000/api/dashboard/stats/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get Dashboard Stats
curl -X GET http://127.0.0.1:8000/api/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Create a new request
2. Set method to POST
3. URL: `http://127.0.0.1:8000/api/auth/login/`
4. Body → raw → JSON:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
5. Send request and copy the `access` token
6. For other requests, add header: `Authorization: Bearer YOUR_TOKEN`

## 📝 Next Steps

1. **Create a superuser** (if not already created):
   ```bash
   python manage.py createsuperuser
   ```

2. **Run the server**:
   ```bash
   python manage.py runserver
   ```

3. **Test the API**:
   - Visit: http://127.0.0.1:8000/api/
   - You'll see the API root with all available endpoints

4. **Build your frontend**:
   - Create a React/Vue app
   - Use the API endpoints to fetch data
   - Build your custom admin dashboard

## 🎨 Frontend Recommendations

### React + Vite
```bash
npm create vite@latest clean-care-frontend -- --template react
cd clean-care-frontend
npm install axios react-router-dom
```

### Vue + Vite
```bash
npm create vite@latest clean-care-frontend -- --template vue
cd clean-care-frontend
npm install axios vue-router
```

### UI Libraries
- **Tailwind CSS**: Modern utility-first CSS
- **Material-UI / Ant Design**: Pre-built components
- **Chart.js / Recharts**: For dashboard charts

## 🔒 Security Notes

- ✅ JWT tokens expire after 5 hours
- ✅ Refresh tokens expire after 7 days
- ✅ CORS is configured
- ⚠️ Change `SECRET_KEY` in production
- ⚠️ Set `DEBUG = False` in production
- ⚠️ Configure specific CORS origins in production

## 📚 Additional Resources

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [CORS Headers](https://github.com/adamchainz/django-cors-headers)
