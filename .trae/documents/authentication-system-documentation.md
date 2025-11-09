# 🔐 ক্লিন কেয়ার অ্যাপ - সম্পূর্ণ অথেনটিকেশন সিস্টেম ডকুমেন্টেশন

## 📋 সূচিপত্র
1. [সিস্টেম ওভারভিউ](#-সিস্টেম-ওভারভিউ)
2. [অথেনটিকেশন আর্কিটেকচার](#-অথেনটিকেশন-আর্কিটেকচার)
3. [ইউজার রোল এবং পারমিশন](#-ইউজার-রোল-এবং-পারমিশন)
4. [ডেটাবেস স্কিমা](#-ডেটাবেস-স্কিমা)
5. [API এন্ডপয়েন্টস](#-api-এন্ডপয়েন্টস)
6. [Flutter ইমপ্লিমেন্টেশন](#-flutter-ইমপ্লিমেন্টেশন)
7. [Node.js ব্যাকএন্ড ইমপ্লিমেন্টেশন](#-nodejs-ব্যাকএন্ড-ইমপ্লিমেন্টেশন)
8. [সিকিউরিটি বেস্ট প্র্যাক্টিস](#-সিকিউরিটি-বেস্ট-প্র্যাক্টিস)
9. [এরর হ্যান্ডলিং](#-এরর-হ্যান্ডলিং)
10. [টেস্টিং স্ট্র্যাটেজি](#-টেস্টিং-স্ট্র্যাটেজি)

---

## 🎯 সিস্টেম ওভারভিউ

### অথেনটিকেশন ফ্লো:
1. **ইউজার রেজিস্ট্রেশন** (ইমেইল/ফোন + পাসওয়ার্ড)
2. **ইউজার লগইন** JWT টোকেন জেনারেশন সহ
3. **টোকেন রিফ্রেশ মেকানিজম**
4. **পাসওয়ার্ড রিসেট ফাংশনালিটি**
5. **সোশাল লগইন ইন্টিগ্রেশন** (Google, Facebook)
6. **মাল্টি-ফ্যাক্টর অথেনটিকেশন** (ঐচ্ছিক)

### টেকনোলজি স্ট্যাক:
- **Frontend**: Flutter (Dart)
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MySQL + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Token Storage**: flutter_secure_storage
- **Password Hashing**: bcrypt

---

## 🏗️ অথেনটিকেশন আর্কিটেকচার

```mermaid
graph TD
    A[Flutter App] --> B[API Gateway]
    B --> C[JWT Middleware]
    C --> D[Auth Controller]
    D --> E[Auth Service]
    E --> F[Database]
    
    G[Social Auth] --> B
    H[Email Service] --> E
    I[SMS Service] --> E
    
    subgraph "Frontend Layer"
        A
    end
    
    subgraph "Backend Layer"
        B --> C --> D --> E
    end
    
    subgraph "External Services"
        G
        H
        I
    end
    
    subgraph "Data Layer"
        F
    end
```

---

## 👥 ইউজার রোল এবং পারমিশন

### ইউজার রোলস:

| রোল | বিবরণ | পারমিশন |
|-----|--------|----------|
| **Customer** | সাধারণ ব্যবহারকারী | সার্ভিস বুক করা, কমপ্লেইন করার, পেমেন্ট করা |
| **Service Provider** | ক্লিনার/সার্ভিস প্রোভাইডার | সার্ভিস অফার করা, বুকিং ম্যানেজ করা, ইনকাম ট্র্যাক করা |
| **Admin** | সিস্টেম অ্যাডমিন | ইউজার ম্যানেজ করা, রিপোর্ট দেখা, সেটিংস পরিবর্তন |
| **Super Admin** | প্ল্যাটফর্ম মালিক | সম্পূর্ণ সিস্টেম এক্সেস, সকল অ্যাডমিন ফিচার |

### পারমিশন ম্যাট্রিক্স:

```javascript
const permissions = {
  customer: ['book_service', 'view_profile', 'make_payment', 'submit_complaint'],
  serviceProvider: ['accept_booking', 'update_status', 'view_earnings', 'manage_schedule'],
  admin: ['manage_users', 'view_reports', 'manage_content', 'handle_complaints'],
  superAdmin: ['all_permissions']
};
```

---

## 💾 ডেটাবেস স্কিমা

### প্রিসমা স্কিমা:

```prisma
// User model
model User {
  id                String           @id @default(uuid())
  email             String           @unique
  phone             String?          @unique
  password          String
  firstName         String
  lastName          String
  avatar            String?
  role              UserRole         @default(CUSTOMER)
  status            UserStatus       @default(ACTIVE)
  emailVerified     Boolean          @default(false)
  phoneVerified     Boolean          @default(false)
  twoFactorEnabled  Boolean          @default(false)
  twoFactorSecret   String?
  lastLoginAt       DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  // Relations
  sessions          Session[]
  refreshTokens     RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  emailVerificationTokens EmailVerificationToken[]
  
  @@map("users")
}

// Session model
model Session {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  deviceInfo  String?
  ipAddress   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

// Refresh token model
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
}

// Password reset token model
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_reset_tokens")
}

// Email verification token model
model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("email_verification_tokens")
}

// Enums
enum UserRole {
  CUSTOMER
  SERVICE_PROVIDER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}
```

### MySQL ইনডেক্স:

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Token indexes
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(userId);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
```

---

## 🔌 API এন্ডপয়েন্টস

### অথেনটিকেশন API:

| মেথড | এন্ডপয়েন্ট | বিবরণ |
|-------|------------|--------|
| POST | `/api/auth/register` | নতুন ইউজার রেজিস্ট্রেশন |
| POST | `/api/auth/login` | ইউজার লগইন |
| POST | `/api/auth/logout` | ইউজার লগআউট |
| POST | `/api/auth/refresh-token` | টোকেন রিফ্রেশ |
| POST | `/api/auth/forgot-password` | পাসওয়ার্ড রিসেট রিকোয়েস্ট |
| POST | `/api/auth/reset-password` | পাসওয়ার্ড রিসেট |
| POST | `/api/auth/verify-email` | ইমেইল ভেরিফিকেশন |
| GET | `/api/auth/profile` | ইউজার প্রোফাইল |
| PUT | `/api/auth/profile` | প্রোফাইল আপডেট |
| POST | `/api/auth/change-password` | পাসওয়ার্ড পরিবর্তন |

### API রিকোয়েস্ট/রেসপন্স উদাহরণ:

#### রেজিস্ট্রেশন:
```json
// Request
{
  "email": "user@example.com",
  "phone": "+8801234567890",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### লগইন:
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "avatar": "https://example.com/avatar.jpg"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

---

## 📱 Flutter ইমপ্লিমেন্টেশন

### ডিপেন্ডেন্সি:
```yaml
dependencies:
  flutter_secure_storage: ^8.0.0
  dio: ^5.3.0
  jwt_decoder: ^2.0.1
  provider: ^6.0.5
```

### অথেনটিকেশন সার্ভিস:
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://api.cleancare.com',
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  // Token management
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Check if token is expired
  Future<bool> isTokenExpired() async {
    final token = await getToken();
    if (token == null) return true;
    
    return JwtDecoder.isExpired(token);
  }

  // Auto refresh token
  Future<void> refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);
      if (refreshToken == null) throw Exception('No refresh token');

      final response = await _dio.post('/api/auth/refresh-token', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200) {
        await saveToken(response.data['data']['token']);
        await _storage.write(
          key: _refreshTokenKey,
          value: response.data['data']['refreshToken'],
        );
      }
    } catch (e) {
      await logout();
      throw Exception('Token refresh failed');
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/api/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        await saveToken(data['token']);
        await _storage.write(key: _refreshTokenKey, value: data['refreshToken']);
        await _storage.write(key: _userKey, value: jsonEncode(data['user']));
        
        return data;
      }
      throw Exception('Login failed');
    } catch (e) {
      throw Exception('Login error: ${e.toString()}');
    }
  }

  // Register
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    try {
      final response = await _dio.post('/api/auth/register', data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        await saveToken(data['token']);
        await _storage.write(key: _refreshTokenKey, value: data['refreshToken']);
        await _storage.write(key: _userKey, value: jsonEncode(data['user']));
        
        return data;
      }
      throw Exception('Registration failed');
    } catch (e) {
      throw Exception('Registration error: ${e.toString()}');
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      final token = await getToken();
      if (token != null) {
        await _dio.post('/api/auth/logout',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
      }
    } catch (e) {
      // Silent logout
    } finally {
      await _storage.deleteAll();
    }
  }

  // Get current user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final userData = await _storage.read(key: _userKey);
    if (userData != null) {
      return jsonDecode(userData);
    }
    return null;
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? avatar,
  }) async {
    try {
      final token = await getToken();
      if (token == null) throw Exception('No authentication token');

      final response = await _dio.put('/api/auth/profile',
        data: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (phone != null) 'phone': phone,
          if (avatar != null) 'avatar': avatar,
        },
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _storage.write(key: _userKey, value: jsonEncode(data));
        return data;
      }
      throw Exception('Profile update failed');
    } catch (e) {
      throw Exception('Profile update error: ${e.toString()}');
    }
  }
}
```

### অথেনটিকেশন প্রোভাইডার:
```dart
import 'package:flutter/material.dart';
import 'auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.login(
        email: email,
        password: password,
      );
      _user = data['user'];
      _error = null;
    } catch (e) {
      _error = e.toString();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      _user = data['user'];
      _error = null;
    } catch (e) {
      _error = e.toString();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  Future<void> loadUser() async {
    final userData = await _authService.getCurrentUser();
    if (userData != null) {
      _user = userData;
      notifyListeners();
    }
  }
}
```

### লগইন স্ক্রিন উদাহরণ:
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      try {
        await Provider.of<AuthProvider>(context, listen: false).login(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        );
        
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword
                          ? Icons.visibility
                          : Icons.visibility_off),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _handleLogin,
                    child: authProvider.isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Login'),
                  ),
                ),
                if (authProvider.error != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    authProvider.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ],
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/register');
                  },
                  child: const Text('Don\'t have an account? Register'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 💻 Node.js ব্যাকএন্ড ইমপ্লিমেন্টেশন

### মিডলওয়্যার:
```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

### অথেনটিকেশন কন্ট্রোলার:
```typescript
// controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class AuthController {
  // Register
  async register(req: Request, res: Response) {
    try {
      const { email, phone, password, firstName, lastName, role } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'CUSTOMER'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true
        }
      });

      // Generate tokens
      const token = this.generateToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Send verification email (async)
      this.sendVerificationEmail(user.id, email);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check user status
      if (user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Generate tokens
      const token = this.generateToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          deviceInfo: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar
          },
          token,
          refreshToken,
          expiresIn: 3600
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout
  async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token && req.user) {
        // Delete session
        await prisma.session.deleteMany({
          where: { token }
        });

        // Delete refresh token
        await prisma.refreshToken.deleteMany({
          where: { userId: req.user.id }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Find refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: tokenRecord.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          status: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id }
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        success: true,
        data: {
          user,
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          emailVerified: true,
          phoneVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { firstName, lastName, phone, avatar } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(avatar && { avatar })
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true
        }
      });

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Helper methods
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  private async sendVerificationEmail(userId: string, email: string) {
    // Implementation for sending verification email
    // This should be async and not block the response
  }
}
```

---

## 🔒 সিকিউরিটি বেস্ট প্র্যাক্টিস

### 1. পাসওয়ার্ড সিকিউরিটি:
```typescript
// Password validation
const passwordSchema = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
};

// Bcrypt configuration
const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

### 2. JWT সিকিউরিটি:
```typescript
// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET, // 256-bit secret key
  expiresIn: '1h', // Short expiration time
  issuer: 'cleancare.app',
  audience: 'cleancare-users'
};

// Refresh token rotation
const refreshTokenRotation = true;
const refreshTokenExpiresIn = '7d';
```

### 3. Rate Limiting:
```typescript
import rateLimit from 'express-rate-limit';

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many registration attempts, please try again later'
});
```

### 4. CORS Configuration:
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

### 5. Security Headers:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## ⚠️ এরর হ্যান্ডলিং

### কমন এরর কোড:

| কোড | বিবরণ | সমাধান |
|-----|--------|---------|
| **400** | Bad Request | ইনভ্যালিড ইনপুট ডেটা |
| **401** | Unauthorized | ইনভ্যালিড ক্রেডেনশিয়ালস |
| **403** | Forbidden | ইনসাফিশিয়েন্ট পারমিশন |
| **404** | Not Found | ইউজার নট ফাউন্ড |
| **409** | Conflict | ইউজার আলরেডি এক্সিস্ট |
| **429** | Too Many Requests | রেট লিমিট এক্সিসড |
| **500** | Internal Server Error | সার্ভার এরর |

### এরর রেসপন্স ফরম্যাট:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "field": "password",
      "reason": "incorrect_password"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🧪 টেস্টিং স্ট্র্যাটেজি

### 1. ইউনিট টেস্টিং:
```typescript
// tests/auth.test.ts
import { AuthController } from '../controllers/auth.controller';
import { PrismaClient } from '@prisma/client';

const authController = new AuthController();

describe('AuthController', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully'
        })
      );
    });

    it('should return error for duplicate email', async () => {
      const req = {
        body: {
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already exists'
        })
      );
    });
  });
});
```

### 2. ইন্টিগ্রেশন টেস্টিং:
```typescript
// tests/integration/auth.integration.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth API Integration', () => {
  describe('POST /api/auth/register', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });
});
```

### 3. Flutter উইজেট টেস্টিং:
```dart
// test/auth_widget_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:clean_care/pages/login_page.dart';
import 'package:clean_care/providers/auth_provider.dart';

void main() {
  testWidgets('Login form validation', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    // Test empty form submission
    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(find.text('Please enter your email'), findsOneWidget);
    expect(find.text('Please enter your password'), findsOneWidget);

    // Test invalid email
    await tester.enterText(find.byType(TextFormField).first, 'invalid-email');
    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(find.text('Please enter a valid email'), findsOneWidget);
  });
}
```

---

## 🔧 এনভায়রনমেন্ট ভেরিয়েবল

### .env.example:
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="mysql://user:password@localhost:3306/clean_care_db"

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here-minimum-256-bits
JWT_REFRESH_SECRET=your-refresh-token-secret-here-also-256-bits

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Service (Optional)
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret

# File Upload
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-s3-bucket

# Social Auth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

---

## 📋 ডিপ্লয়মেন্ট চেকলিস্ট

### প্রি-ডিপ্লয়মেন্ট:
- [ ] সব টেস্ট পাস করা
- [ ] সিকিউরিটি অডিট সম্পন্ন
- [ ] এনভায়রনমেন্ট ভেরিয়েবল সেট করা
- [ ] ডেটাবেস মাইগ্রেশন চেক করা
- [ ] ব্যাকআপ সিস্টেম চেক করা

### প্রোডাকশন ডিপ্লয়মেন্ট:
- [ ] HTTPS ইনেবল করা
- [ ] রেট লিমিটিং অ্যাক্টিভ করা
- [ ] মনিটরিং সেটআপ করা
- [ ] লগিং কনফিগার করা
- [ ] সিকিউরিটি হেডারস চেক করা

---

## 🔗 রেফারেন্স

### Flutter প্যাকেজ:
- [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)
- [dio](https://pub.dev/packages/dio)
- [jwt_decoder](https://pub.dev/packages/jwt_decoder)
- [provider](https://pub.dev/packages/provider)

### Node.js লাইব্রেরি:
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [helmet](https://www.npmjs.com/package/helmet)
- [cors](https://www.npmjs.com/package/cors)

### ডকুমেন্টেশন:
- [JWT.io](https://jwt.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Flutter Documentation](https://flutter.dev/docs)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 সাপোর্ট

প্রযুক্তিগত সহায়তার জন্য:
- ইমেইল: tech-support@cleancare.com
- ফোন: +8801234567890
- টিকেট সিস্টেম: https://support.cleancare.com

---

**© 2024 ক্লিন কেয়ার. সর্বস্বত্ব সংরক্ষিত.**