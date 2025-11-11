# Design Document: Admin Panel Multilingual Authentication System

## Overview

This design document outlines the implementation of a complete authentication system with multilingual support for the Clean Care Admin web application. The system will provide secure JWT-based authentication, protected routing, a dynamic admin navbar displaying the logged-in user's account name, and Google Translate API integration for multilingual support across all admin pages.

### Key Design Principles

1. **Security First**: JWT-based authentication with httpOnly cookies and CSRF protection
2. **Seamless UX**: Automatic token refresh and persistent sessions
3. **Real-time Translation**: Google Translate API integration similar to Flutter app
4. **Responsive Design**: Mobile-first navbar and UI components
5. **Type Safety**: Full TypeScript implementation with strict typing
6. **State Management**: React Context API for auth and language state
7. **Performance**: Translation caching and optimized API calls

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login Page  │  │  Dashboard   │  │  Other Pages │      │
│  │              │  │  + Navbar    │  │  + Navbar    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Context/State Layer                         │
│                                                              │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   AuthContext          │  │  LanguageContext         │  │
│  │  - user: User | null   │  │  - language: 'en'|'bn'   │  │
│  │  - isAuthenticated     │  │  - translate(text)       │  │
│  │  - login()             │  │  - setLanguage()         │  │
│  │  - logout()            │  │  - translations cache    │  │
│  └────────────────────────┘  └──────────────────────────┘  │
│                                                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Service Layer                             │
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │   AuthService            │  │  TranslationService      │ │
│  │  - login(credentials)    │  │  - translate(text, lang) │ │
│  │  - logout()              │  │  - translateBatch([])    │ │
│  │  - refreshToken()        │  │  - Cache management      │ │
│  │  - getProfile()          │  │  - Google Translate API  │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                   API/Backend Layer                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Backend API (Express + Prisma)             │     │
│  │  - POST /api/auth/login                            │     │
│  │  - POST /api/auth/logout                           │     │
│  │  - POST /api/auth/refresh                          │     │
│  │  - GET /api/auth/profile                           │     │
│  │                                                    │     │
│  │         Google Translate API                       │     │
│  │  - translate.googleapis.com/v2/translate           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **Login Flow**:
   - User enters credentials on Login page
   - AuthService.login() sends POST to /api/auth/login
   - Backend validates credentials and returns JWT tokens
   - Frontend stores tokens in httpOnly cookies
   - AuthContext updates user state
   - User redirected to Dashboard

2. **Protected Route Access**:
   - User navigates to protected route
   - ProtectedRoute component checks AuthContext.isAuthenticated
   - If not authenticated, redirect to /login
   - If authenticated, render requested page with Navbar

3. **Token Refresh Flow**:
   - Access token expires (15 minutes)
   - API interceptor catches 401 error
   - AuthService.refreshToken() called automatically
   - New access token obtained
   - Original request retried
   - User session continues seamlessly

4. **Logout Flow**:
   - User clicks logout button in Navbar
   - AuthService.logout() called
   - Backend invalidates refresh token
   - Frontend clears auth state
   - User redirected to /login

### Translation Flow

1. **Language Selection**:
   - User clicks language selector in Navbar
   - LanguageContext.setLanguage('bn') called
   - Language preference saved to localStorage
   - All TranslatedText components re-render
   - Text translated via Google Translate API

2. **Text Translation**:
   - Component renders <TranslatedText text="Hello" />
   - TranslationService checks cache
   - If not cached, calls Google Translate API
   - Translation cached for future use
   - Translated text displayed

## Components and Interfaces

### 1. AuthContext (State Management)

**Location**: `clean-care-admin/src/contexts/AuthContext.tsx`

**Interface**:
```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Implementation**:
```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. LanguageContext (Multilingual State)

**Location**: `clean-care-admin/src/contexts/LanguageContext.tsx`

**Interface**:
```typescript
interface LanguageContextType {
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
}
```

**Implementation**:
```typescript
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'bn'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('admin_language');
    if (saved === 'en' || saved === 'bn') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: 'en' | 'bn') => {
    setLanguageState(lang);
    localStorage.setItem('admin_language', lang);
    translationService.clearCache();
  };

  const translate = async (text: string): Promise<string> => {
    if (language === 'en') return text;
    return await translationService.translate(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

### 3. AuthService (API Integration)

**Location**: `clean-care-admin/src/services/authService.ts`

**Interface**:
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse>;
  async logout(): Promise<void>;
  async refreshToken(): Promise<string>;
  async getProfile(): Promise<User>;
}
```

**Implementation**:
```typescript
class AuthService {
  private apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // Send cookies
  });

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.apiClient.post('/auth/login', credentials);
    // Tokens stored in httpOnly cookies by backend
    return response.data;
  }

  async logout(): Promise<void> {
    await this.apiClient.post('/auth/logout');
  }

  async refreshToken(): Promise<string> {
    const response = await this.apiClient.post('/auth/refresh');
    return response.data.accessToken;
  }

  async getProfile(): Promise<User> {
    const response = await this.apiClient.get('/auth/profile');
    return response.data;
  }
}

export const authService = new AuthService();
```

### 4. TranslationService (Google Translate Integration)

**Location**: `clean-care-admin/src/services/translationService.ts`

**Interface**:
```typescript
class TranslationService {
  translate(text: string, targetLang: 'bn'): Promise<string>;
  translateBatch(texts: string[], targetLang: 'bn'): Promise<string[]>;
  clearCache(): void;
}
```

**Implementation**:
```typescript
class TranslationService {
  private cache = new Map<string, string>();
  private apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

  async translate(text: string, targetLang: 'bn'): Promise<string> {
    if (!text) return text;

    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {
          q: text,
          target: targetLang,
          format: 'text',
        },
        {
          params: { key: this.apiKey },
        }
      );

      const translated = response.data.data.translations[0].translatedText;
      this.cache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original
    }
  }

  async translateBatch(texts: string[], targetLang: 'bn'): Promise<string[]> {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: texts,
        target: targetLang,
        format: 'text',
      },
      {
        params: { key: this.apiKey },
      }
    );

    return response.data.data.translations.map((t: any) => t.translatedText);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();
```

### 5. TranslatedText Component

**Location**: `clean-care-admin/src/components/common/TranslatedText.tsx`

**Interface**:
```typescript
interface TranslatedTextProps {
  text: string;
  component?: React.ElementType;
  [key: string]: any; // Allow any other props
}
```

**Implementation**:
```typescript
export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  component: Component = 'span',
  ...props 
}) => {
  const { translate, language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(text);
    } else {
      translate(text).then(setTranslatedText);
    }
  }, [text, language]);

  return <Component {...props}>{translatedText}</Component>;
};
```

### 6. AdminNavbar Component

**Location**: `clean-care-admin/src/components/layout/AdminNavbar.tsx`

**Features**:
- Displays logged-in user's name and avatar
- Language selector dropdown
- Navigation links to all admin pages
- Logout button
- Responsive hamburger menu for mobile
- Active route highlighting

**Implementation**:
```typescript
export const AdminNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/complaints', label: 'Complaints', icon: <ComplaintIcon /> },
    { path: '/users', label: 'Users', icon: <PeopleIcon /> },
    { path: '/reports', label: 'Reports', icon: <ReportIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <TranslatedText text="Clean Care Admin" />
        </Typography>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
              }}
            >
              <TranslatedText text={item.label} />
            </Button>
          ))}
        </Box>

        {/* Language Selector */}
        <Select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'bn')}
          sx={{ ml: 2, minWidth: 100 }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="bn">বাংলা</MenuItem>
        </Select>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Avatar src={user?.avatar} sx={{ mr: 1 }}>
            {user?.firstName[0]}
          </Avatar>
          <Typography variant="body2">
            {user?.firstName} {user?.lastName}
          </Typography>
          <IconButton onClick={handleLogout} sx={{ ml: 1 }}>
            <LogoutIcon />
          </IconButton>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          sx={{ display: { xs: 'block', md: 'none' } }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        {/* Mobile menu items */}
      </Drawer>
    </AppBar>
  );
};
```

### 7. ProtectedRoute Component

**Location**: `clean-care-admin/src/components/routing/ProtectedRoute.tsx`

**Implementation**:
```typescript
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### 8. Login Page

**Location**: `clean-care-admin/src/pages/Login/Login.tsx`

**Features**:
- Email and password input fields
- Form validation
- Error message display
- Language selector
- Remember me checkbox
- Loading state during authentication

**Implementation**:
```typescript
export const Login: React.FC = () => {
  const { login } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <TranslatedText text="Admin Login" />
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField
            fullWidth
            label={<TranslatedText text="Email" />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={<TranslatedText text="Password" />}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <TranslatedText text={error} />
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : <TranslatedText text="Login" />}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
```

### 9. Dashboard Page

**Location**: `clean-care-admin/src/pages/Dashboard/Dashboard.tsx`

**Features**:
- Welcome message with admin name
- Key metrics cards (total users, complaints, etc.)
- Recent activity feed
- Quick action buttons
- AdminNavbar integration

## Data Models

### User Model (Frontend)

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}
```

### Auth State Model

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Language State Model

```typescript
interface LanguageState {
  language: 'en' | 'bn';
  translations: Map<string, string>;
}
```

### Translation Cache Model

```typescript
// Stored in memory (Map)
{
  "Hello_bn": "হ্যালো",
  "Dashboard_bn": "ড্যাশবোর্ড",
  "Logout_bn": "লগআউট",
  // ... more cached translations
}
```

### LocalStorage Models

```typescript
// Language preference
{
  "admin_language": "en" | "bn"
}
```

## Error Handling

### Authentication Errors

**Scenario**: Invalid credentials during login

**Handling**:
1. Catch error in login form
2. Display translated error message
3. Clear password field
4. Focus on password input

**Code**:
```typescript
try {
  await login(email, password);
} catch (err: any) {
  const errorMessage = err.response?.data?.message || 'Invalid credentials';
  setError(errorMessage);
}
```

### Token Expiration

**Scenario**: Access token expires during API call

**Handling**:
1. API interceptor catches 401 error
2. Automatically call refreshToken()
3. Retry original request with new token
4. If refresh fails, redirect to login

**Code**:
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await authService.refreshToken();
        return apiClient(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Translation API Failures

**Scenario**: Google Translate API is unavailable

**Handling**:
1. Catch exception in TranslationService
2. Log error to console
3. Return original English text
4. Show subtle notification (optional)

**Code**:
```typescript
try {
  const translated = await translateAPI(text);
  return translated;
} catch (error) {
  console.error('Translation failed:', error);
  return text; // Fallback to English
}
```

### Network Connectivity Issues

**Scenario**: Device loses internet connection

**Handling**:
1. Show offline indicator in navbar
2. Queue failed requests for retry
3. Use cached translations when available
4. Display user-friendly error messages

## Security Considerations

### JWT Token Storage

**Strategy**: httpOnly cookies for refresh tokens, memory for access tokens

**Implementation**:
- Backend sets httpOnly cookie with refresh token
- Access token stored in memory (React state)
- No tokens in localStorage (XSS protection)

### CSRF Protection

**Implementation**:
```typescript
// Backend sends CSRF token in cookie
// Frontend includes token in headers
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf-token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### API Key Protection

**Google Translate API Key**:
- Store in environment variable (VITE_GOOGLE_TRANSLATE_API_KEY)
- Never commit to version control
- Use API key restrictions in Google Cloud Console
- Implement rate limiting on backend proxy (optional)

### Role-Based Access Control

**Implementation**:
```typescript
// Check user role before rendering admin features
const canAccessUserManagement = user?.role === 'SUPER_ADMIN';

{canAccessUserManagement && (
  <Button onClick={() => navigate('/users')}>
    <TranslatedText text="User Management" />
  </Button>
)}
```

## Performance Considerations

### Translation Caching

**Strategy**:
- Cache all translations in memory (Map)
- Cache persists during session
- Clear cache on language change
- Expected cache size: ~500 entries (~50KB)

### API Call Optimization

**Strategies**:
1. **Batch Translation**: Translate multiple texts in single API call
2. **Lazy Loading**: Only translate visible content
3. **Debouncing**: Prevent rapid repeated translations
4. **Preloading**: Translate common UI text on app load

**Implementation**:
```typescript
// Preload common translations
useEffect(() => {
  if (language === 'bn') {
    const commonTexts = ['Dashboard', 'Logout', 'Settings', 'Users', 'Complaints'];
    translationService.translateBatch(commonTexts, 'bn');
  }
}, [language]);
```

### Code Splitting

**Strategy**: Lazy load pages to reduce initial bundle size

**Implementation**:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

<Suspense fallback={<CircularProgress />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/users" element={<UserManagement />} />
  </Routes>
</Suspense>
```

## Testing Strategy

### Unit Tests

**AuthContext Tests**:
- Test login updates user state
- Test logout clears user state
- Test token refresh on expiration

**LanguageContext Tests**:
- Test language switching
- Test translation caching
- Test fallback to English on error

**TranslationService Tests**:
- Test successful translation
- Test cache hit/miss
- Test error handling

### Integration Tests

**Login Flow Test**:
1. Navigate to /login
2. Enter credentials
3. Submit form
4. Verify redirect to dashboard
5. Verify navbar shows user name

**Language Switching Test**:
1. Login as admin
2. Click language selector
3. Select Bangla
4. Verify all text translates
5. Refresh page
6. Verify language persists

### E2E Tests

**Complete Auth Flow**:
1. Login → Dashboard → Navigate pages → Logout
2. Verify protected routes redirect to login
3. Verify token refresh works seamlessly

## Configuration

### Environment Variables

**File**: `clean-care-admin/.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
VITE_APP_NAME=Clean Care Admin
```

### Google Translate API Setup

**Steps**:
1. Create Google Cloud project
2. Enable Cloud Translation API
3. Create API key with restrictions
4. Add key to .env file
5. Configure API key restrictions (HTTP referrers)

### Backend Configuration

**CORS Settings**:
```typescript
app.use(cors({
  origin: 'http://localhost:5173', // Admin panel URL
  credentials: true, // Allow cookies
}));
```

**Cookie Settings**:
```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

## Routing Structure

```
/login                    → Login Page (public)
/                         → Dashboard (protected)
/complaints               → All Complaints (protected)
/users                    → User Management (protected)
/reports                  → Reports (protected)
/notifications            → Notifications (protected)
/settings                 → Settings (protected)
```

## Accessibility Considerations

### Keyboard Navigation

- All interactive elements accessible via Tab
- Enter key submits forms
- Escape key closes modals/dropdowns

### Screen Reader Support

- Proper ARIA labels on all inputs
- TranslatedText maintains semantic HTML
- Loading states announced to screen readers

### Font Support

**Bangla Font**: Use Noto Sans Bengali

```typescript
// theme.ts
import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: [
      'Noto Sans',
      'Noto Sans Bengali',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});
```

## Migration Path

### Phase 1: Authentication Setup
- Implement AuthContext and AuthService
- Create Login page
- Add ProtectedRoute component
- Update App.tsx with routing

### Phase 2: Navbar Implementation
- Create AdminNavbar component
- Add user profile display
- Implement logout functionality
- Add responsive mobile menu

### Phase 3: Multilingual System
- Implement LanguageContext
- Create TranslationService
- Build TranslatedText component
- Add language selector to navbar

### Phase 4: Page Integration
- Wrap all pages with ProtectedRoute
- Add AdminNavbar to all pages
- Replace all text with TranslatedText
- Test complete flow

## Future Enhancements

### Additional Languages

**Support**: Hindi, Urdu, etc.

**Implementation**:
```typescript
type Language = 'en' | 'bn' | 'hi' | 'ur';

<MenuItem value="hi">हिन्दी</MenuItem>
<MenuItem value="ur">اردو</MenuItem>
```

### Offline Mode

**Enhancement**: Service worker for offline functionality

**Features**:
- Cache API responses
- Queue failed requests
- Sync when online

### Advanced RBAC

**Enhancement**: Granular permissions system

**Implementation**:
```typescript
interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

const hasPermission = (user: User, resource: string, action: string) => {
  return user.permissions.some(
    p => p.resource === resource && p.actions.includes(action)
  );
};
```

### Real-time Notifications

**Enhancement**: WebSocket integration for live updates

**Use Cases**:
- New complaint notifications
- User activity alerts
- System status updates

## Conclusion

This design provides a complete authentication and multilingual system for the Clean Care Admin panel. The architecture is secure, performant, and user-friendly, with JWT-based authentication, Google Translate API integration, and a responsive UI. The system follows React best practices with TypeScript, Context API for state management, and Material-UI for consistent design.

Key features:
- ✅ Secure JWT authentication with httpOnly cookies
- ✅ Dynamic navbar showing logged-in admin name
- ✅ Google Translate API integration for multilingual support
- ✅ Protected routing with automatic token refresh
- ✅ Responsive design for mobile and desktop
- ✅ Translation caching for performance
- ✅ Type-safe implementation with TypeScript
