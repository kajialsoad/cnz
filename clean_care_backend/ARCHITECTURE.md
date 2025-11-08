# 🏗️ Clean Care Bangladesh - Complete Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  (Citizens, Admins, Super Admins via Web/Mobile)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vue)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Login      │  │  Dashboard   │  │  Complaints  │         │
│  │   Page       │  │   Page       │  │   Page       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Technology: React/Vue + Tailwind CSS + Chart.js               │
│  Runs on: http://localhost:3000 (or 5173 for Vite)            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS Requests
                     │ (JSON Data)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Django REST API)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API ENDPOINTS                          │  │
│  │  /api/auth/login/          - JWT Authentication          │  │
│  │  /api/auth/refresh/        - Token Refresh               │  │
│  │  /api/dashboard/stats/     - Dashboard Data              │  │
│  │  /api/complaints/          - CRUD Operations             │  │
│  │  /api/users/               - User Management             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Technology: Django + DRF + JWT + CORS                          │
│  Runs on: http://127.0.0.1:8000                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Users      │  │  Complaints  │  │   Payments   │         │
│  │   Table      │  │   Table      │  │   Table      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Technology: SQLite (Dev) / PostgreSQL (Production)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Backend (Django + DRF)

### 🎯 কাজ:
- ✅ শুধু **data manage** করবে
- ✅ **API endpoints** provide করবে
- ✅ **Authentication/Authorization** handle করবে
- ❌ **কোনো template বা UI নেই**

### 📁 Structure:
```
clean_care_backend/
├── api/                          # REST API app
│   ├── views.py                  # API endpoints
│   ├── serializers.py            # Data serialization
│   ├── urls.py                   # API routes
│   └── permissions.py            # Custom permissions
│
├── complaints/                   # Complaints app (to be created)
│   ├── models.py                 # Complaint model
│   ├── serializers.py            # Complaint serializer
│   ├── views.py                  # Complaint API views
│   └── urls.py                   # Complaint routes
│
├── users/                        # Users app (to be created)
│   ├── models.py                 # Custom user model
│   ├── serializers.py            # User serializer
│   ├── views.py                  # User API views
│   └── urls.py                   # User routes
│
├── payments/                     # Payments app (to be created)
│   ├── models.py                 # Payment model
│   ├── serializers.py            # Payment serializer
│   ├── views.py                  # Payment API views
│   └── urls.py                   # Payment routes
│
└── clean_care/                   # Main project
    ├── settings.py               # Django settings
    ├── urls.py                   # Main URL config
    └── wsgi.py                   # WSGI config
```

### 🔌 API Endpoints:

#### Authentication
```
POST   /api/auth/login/          → Login & get JWT tokens
POST   /api/auth/refresh/        → Refresh access token
GET    /api/auth/profile/        → Get current user profile
POST   /api/auth/logout/         → Logout (blacklist token)
```

#### Dashboard
```
GET    /api/dashboard/stats/     → Get all dashboard statistics
GET    /api/dashboard/charts/    → Get chart data
```

#### Complaints
```
GET    /api/complaints/          → List all complaints (paginated)
POST   /api/complaints/          → Create new complaint
GET    /api/complaints/{id}/     → Get complaint details
PUT    /api/complaints/{id}/     → Update complaint
DELETE /api/complaints/{id}/     → Delete complaint
PATCH  /api/complaints/{id}/status/ → Update complaint status
```

#### Users
```
GET    /api/users/               → List all users
POST   /api/users/               → Create new user
GET    /api/users/{id}/          → Get user details
PUT    /api/users/{id}/          → Update user
DELETE /api/users/{id}/          → Delete user
```

#### Payments
```
GET    /api/payments/            → List all payments
POST   /api/payments/            → Create payment
GET    /api/payments/{id}/       → Get payment details
```

---

## 2️⃣ Frontend (React/Vue)

### 🎯 কাজ:
- ✅ **সম্পূর্ণ UI/UX** design করবে
- ✅ Backend API থেকে **data fetch** করবে
- ✅ User interaction handle করবে
- ✅ **Responsive design** (mobile + desktop)

### 📁 Structure (React Example):
```
clean-care-frontend/
├── src/
│   ├── components/              # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Card.jsx
│   │   └── Chart.jsx
│   │
│   ├── pages/                   # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Complaints.jsx
│   │   ├── ComplaintDetail.jsx
│   │   ├── Users.jsx
│   │   └── Profile.jsx
│   │
│   ├── services/                # API service layer
│   │   ├── api.js               # Axios instance
│   │   ├── authService.js       # Auth API calls
│   │   ├── complaintService.js  # Complaint API calls
│   │   └── userService.js       # User API calls
│   │
│   ├── store/                   # State management (Zustand/Redux)
│   │   ├── authStore.js
│   │   ├── complaintStore.js
│   │   └── userStore.js
│   │
│   ├── utils/                   # Utility functions
│   │   ├── formatDate.js
│   │   ├── formatCurrency.js
│   │   └── validators.js
│   │
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # Entry point
│
├── public/
├── package.json
└── vite.config.js
```

### 🔄 Data Flow Example:

```javascript
// 1. User clicks "Login" button
// 2. Frontend sends request to backend

// services/authService.js
export const login = async (username, password) => {
  const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
    username,
    password
  });
  
  // Store tokens
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  
  return response.data;
};

// 3. Backend validates credentials
// 4. Backend returns JWT tokens
// 5. Frontend stores tokens
// 6. Frontend redirects to dashboard

// pages/Dashboard.jsx
useEffect(() => {
  const fetchStats = async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get('http://127.0.0.1:8000/api/dashboard/stats/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(response.data);
  };
  
  fetchStats();
}, []);

// 7. Dashboard displays data from API
```

---

## 3️⃣ Complete Workflow

### 🔐 Authentication Flow:

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ User    │                    │Frontend │                    │ Backend  │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ 1. Enter credentials         │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 2. POST /api/auth/login/     │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │                              │ 3. Validate
     │                              │                              │    credentials
     │                              │                              │
     │                              │ 4. Return JWT tokens         │
     │                              │<─────────────────────────────│
     │                              │                              │
     │                              │ 5. Store tokens              │
     │                              │    in localStorage           │
     │                              │                              │
     │ 6. Redirect to dashboard     │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
```

### 📊 Dashboard Data Flow:

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│Dashboard│                    │Frontend │                    │ Backend  │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ 1. Page loads                │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 2. GET /api/dashboard/stats/ │
     │                              │    + JWT token               │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │                              │ 3. Verify token
     │                              │                              │ 4. Query database
     │                              │                              │ 5. Calculate stats
     │                              │                              │
     │                              │ 6. Return JSON data          │
     │                              │<─────────────────────────────│
     │                              │                              │
     │                              │ 7. Update UI with data       │
     │                              │    (charts, cards, tables)   │
     │                              │                              │
     │ 8. Display dashboard         │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
```

### 📝 Create Complaint Flow:

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│  User   │                    │Frontend │                    │ Backend  │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ 1. Fill complaint form       │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │ 2. Click "Submit"            │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 3. POST /api/complaints/     │
     │                              │    + JWT token + form data   │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │                              │ 4. Verify token
     │                              │                              │ 5. Validate data
     │                              │                              │ 6. Save to DB
     │                              │                              │ 7. Generate tracking#
     │                              │                              │
     │                              │ 8. Return complaint object   │
     │                              │<─────────────────────────────│
     │                              │                              │
     │                              │ 9. Show success message      │
     │                              │    + tracking number         │
     │                              │                              │
     │ 10. See confirmation         │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
```

---

## 4️⃣ Technology Stack

### Backend:
```
┌─────────────────────────────────────┐
│ Django 5.2.8                        │
│ Django REST Framework 3.16.1        │
│ djangorestframework-simplejwt 5.5.1 │
│ django-cors-headers 4.9.0           │
│ SQLite (Dev) / PostgreSQL (Prod)    │
└─────────────────────────────────────┘
```

### Frontend Options:

#### Option A: React
```
┌─────────────────────────────────────┐
│ React 18                            │
│ Vite (Build tool)                   │
│ Axios (HTTP client)                 │
│ React Router (Routing)              │
│ Zustand/Redux (State management)    │
│ Tailwind CSS (Styling)              │
│ Chart.js / Recharts (Charts)        │
└─────────────────────────────────────┘
```

#### Option B: Vue
```
┌─────────────────────────────────────┐
│ Vue 3                               │
│ Vite (Build tool)                   │
│ Axios (HTTP client)                 │
│ Vue Router (Routing)                │
│ Pinia (State management)            │
│ Tailwind CSS (Styling)              │
│ Chart.js (Charts)                   │
└─────────────────────────────────────┘
```

---

## 5️⃣ Development Workflow

### Step 1: Backend Development
```bash
# 1. Create models
python manage.py startapp complaints
# Edit models.py

# 2. Create migrations
python manage.py makemigrations
python manage.py migrate

# 3. Create serializers
# Edit serializers.py

# 4. Create API views
# Edit views.py

# 5. Configure URLs
# Edit urls.py

# 6. Test API
python manage.py runserver
# Test with Postman/curl
```

### Step 2: Frontend Development
```bash
# 1. Create React app
npm create vite@latest clean-care-frontend -- --template react

# 2. Install dependencies
cd clean-care-frontend
npm install axios react-router-dom zustand

# 3. Create API service
# Create src/services/api.js

# 4. Create pages
# Create src/pages/Dashboard.jsx

# 5. Run dev server
npm run dev
```

### Step 3: Integration
```bash
# Terminal 1: Backend
cd clean_care_backend
python manage.py runserver

# Terminal 2: Frontend
cd clean-care-frontend
npm run dev

# Now frontend (localhost:5173) can call backend (localhost:8000)
```

---

## 6️⃣ Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean):
```
1. Set environment variables
2. Configure PostgreSQL
3. Collect static files
4. Run migrations
5. Deploy
```

### Frontend Deployment (Vercel/Netlify):
```
1. Build production bundle
2. Configure environment variables
3. Deploy
4. Update CORS settings in backend
```

---

## 🎯 Summary

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Backend** | Django + DRF | 8000 | API, Data, Auth |
| **Frontend** | React/Vue | 3000/5173 | UI, UX, User Interaction |
| **Database** | SQLite/PostgreSQL | - | Data Storage |

### Key Points:
- ✅ Backend = **API only** (no templates)
- ✅ Frontend = **Complete UI** (React/Vue)
- ✅ Communication = **REST API** (JSON)
- ✅ Authentication = **JWT tokens**
- ✅ CORS = **Enabled** for cross-origin requests
- ✅ Deployment = **Separate** (backend + frontend)

---

**🚀 এখন তুমি পুরো system বুঝে গেছো! Backend ready আছে, এখন frontend বানাও!**
