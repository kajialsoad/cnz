# Design Document

## Overview

The Multi-Device Session Management system enables users to maintain concurrent authenticated sessions across multiple mobile devices while ensuring data synchronization and security. The system uses JWT-based session tokens with device-specific identifiers, a centralized session registry in the database, and real-time synchronization mechanisms to keep all devices updated.

## Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Device 1      │     │   Device 2      │     │   Device 3      │
│  (Mobile App)   │     │  (Mobile App)   │     │  (Mobile App)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │        WiFi Network   │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Load Balancer/API    │
                    │       Gateway          │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
         ┌──────────▼──────────┐  ┌─────────▼──────────┐
         │  Auth Service       │  │  Session Service   │
         │  - Login            │  │  - Create Session  │
         │  - Token Generation │  │  - Validate Token  │
         │  - Token Refresh    │  │  - List Sessions   │
         └──────────┬──────────┘  └─────────┬──────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼────────────┐
                    │   PostgreSQL Database  │
                    │   - User Table         │
                    │   - Session Table      │
                    │   - Device Table       │
                    └────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Redis Cache          │
                    │   - Active Sessions    │
                    │   - Token Blacklist    │
                    └────────────────────────┘
```

### Component Interaction Flow

1. **Login Flow**:
   - User enters credentials on Device
   - Device sends login request with device identifier
   - Auth Service validates credentials
   - Session Service creates new session entry
   - System generates JWT token with device ID
   - Token returned to device and cached in Redis

2. **Request Authentication Flow**:
   - Device sends API request with JWT token
   - Middleware extracts and validates token
   - Session Service checks token validity in Redis/Database
   - Request proceeds if valid, rejected if invalid/expired

3. **Real-time Sync Flow**:
   - Device A performs action (e.g., creates complaint)
   - Backend processes action and updates database
   - Backend identifies all active sessions for user
   - Backend sends push notification/websocket message to all devices
   - Devices receive update and refresh local data

## Components and Interfaces

### 1. Session Service

**Responsibilities**:
- Create and manage user sessions
- Validate session tokens
- Track device information
- Handle session expiration and cleanup

**Interface**:
```typescript
interface SessionService {
  createSession(userId: string, deviceInfo: DeviceInfo): Promise<Session>;
  validateSession(token: string): Promise<SessionValidation>;
  listUserSessions(userId: string): Promise<Session[]>;
  terminateSession(sessionId: string): Promise<void>;
  terminateAllUserSessions(userId: string): Promise<void>;
  refreshSession(token: string): Promise<Session>;
  updateLastActive(sessionId: string): Promise<void>;
}

interface DeviceInfo {
  deviceId: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceName: string;
  appVersion: string;
  osVersion: string;
  networkInfo: NetworkInfo;
}

interface NetworkInfo {
  wifiSSID: string;
  localIP: string;
  gatewayIP: string;
  subnetMask: string;
  networkFingerprint: string; // hash of SSID + gateway
}

interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  token: string; // hashed
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  ipAddress: string;
  localIP: string;
  wifiSSID: string;
  networkFingerprint: string;
}

interface SessionValidation {
  isValid: boolean;
  session?: Session;
  error?: string;
}
```

### 2. Auth Service (Enhanced)

**Responsibilities**:
- Authenticate user credentials
- Generate JWT tokens with device context
- Handle token refresh
- Coordinate with Session Service

**Interface**:
```typescript
interface AuthService {
  login(credentials: LoginCredentials, deviceInfo: DeviceInfo): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  logout(sessionId: string): Promise<void>;
  validateToken(token: string): Promise<TokenValidation>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: UserProfile;
}

interface TokenValidation {
  isValid: boolean;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
}
```

### 3. Sync Service

**Responsibilities**:
- Broadcast updates to all user devices
- Manage real-time connections
- Queue updates for offline devices

**Interface**:
```typescript
interface SyncService {
  broadcastToUser(userId: string, event: SyncEvent): Promise<void>;
  broadcastToSession(sessionId: string, event: SyncEvent): Promise<void>;
  queueUpdate(userId: string, update: Update): Promise<void>;
  getQueuedUpdates(sessionId: string, since: Date): Promise<Update[]>;
}

interface SyncEvent {
  type: 'complaint_created' | 'complaint_updated' | 'message_received' | 'profile_updated';
  data: any;
  timestamp: Date;
}

interface Update {
  id: string;
  userId: string;
  event: SyncEvent;
  createdAt: Date;
  deliveredTo: string[]; // session IDs
}
```

### 4. Network Detection Service

**Responsibilities**:
- Detect WiFi connection status
- Extract local IP address
- Get WiFi SSID and gateway information
- Generate network fingerprint
- Monitor network changes

**Interface**:
```dart
class NetworkDetectionService {
  Future<NetworkInfo?> getCurrentNetworkInfo();
  Future<bool> isConnectedToWiFi();
  Future<String> getLocalIPAddress();
  Future<String> getWiFiSSID();
  Future<String> getGatewayIP();
  String generateNetworkFingerprint(String ssid, String gateway);
  Stream<NetworkInfo> get networkChanges;
}
```

### 5. Mobile App Session Manager

**Responsibilities**:
- Store session token securely
- Handle token refresh automatically
- Manage local session state
- Listen for real-time updates
- Monitor network changes and update session

**Interface**:
```dart
class SessionManager {
  Future<void> saveSession(Session session);
  Future<Session?> getSession();
  Future<void> clearSession();
  Future<bool> isSessionValid();
  Future<void> refreshSessionIfNeeded();
  Future<void> updateNetworkInfo(NetworkInfo networkInfo);
  Stream<SyncEvent> get syncEvents;
  Stream<NetworkInfo> get networkChanges;
}
```

## Data Models

### Database Schema

**Session Table**:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  device_name VARCHAR(255),
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  local_ip VARCHAR(45),
  wifi_ssid VARCHAR(255),
  gateway_ip VARCHAR(45),
  subnet_mask VARCHAR(45),
  network_fingerprint VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(user_id, device_id),
  INDEX idx_user_sessions (user_id, is_active),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at),
  INDEX idx_network_fingerprint (user_id, network_fingerprint)
);
```

**Update Queue Table**:
```sql
CREATE TABLE update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_to TEXT[], -- array of session IDs
  
  INDEX idx_user_updates (user_id, created_at),
  INDEX idx_created_at (created_at)
);
```

### JWT Token Structure

```json
{
  "sub": "user_id",
  "sessionId": "session_uuid",
  "deviceId": "device_identifier",
  "iat": 1234567890,
  "exp": 1234567890,
  "type": "access"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session Isolation
*For any* user with multiple active sessions, logging out from one device should only invalidate that device's session while all other device sessions remain valid and functional.
**Validates: Requirements 1.5**

### Property 2: Session Creation Independence
*For any* valid login attempt with correct credentials, the system should successfully create a new session regardless of existing active sessions (up to the maximum limit).
**Validates: Requirements 1.1**

### Property 3: Device Limit Enforcement
*For any* user attempting to create a 6th concurrent session, the system should reject the login attempt and return an error indicating the maximum device limit has been reached.
**Validates: Requirements 1.4**

### Property 4: Real-time Broadcast Consistency
*For any* data modification event (complaint creation, profile update, etc.), all active sessions for the affected user should receive the update notification within the specified time window.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Token Uniqueness
*For any* two sessions, even for the same user, the generated session tokens should be cryptographically unique and not collide.
**Validates: Requirements 4.1**

### Property 6: Session Expiration Consistency
*For any* session that has been inactive for 30 days, the system should automatically mark it as expired and reject any subsequent requests using that session's token.
**Validates: Requirements 4.4**

### Property 7: Token Validation Performance
*For any* session token validation request, the system should complete the validation check within 50 milliseconds.
**Validates: Requirements 4.5**

### Property 8: Session Termination Propagation
*For any* session terminated by an administrator, the corresponding device should receive an authentication error on its next API request and be forced to re-authenticate.
**Validates: Requirements 3.2, 3.5**

### Property 9: Concurrent Login Handling
*For any* two simultaneous login attempts from different devices with the same credentials, the system should successfully create separate sessions for both devices without race conditions.
**Validates: Requirements 7.1**

### Property 10: Token Refresh Continuity
*For any* active session approaching expiration (within 24 hours), the automatic token refresh should generate a new valid token and invalidate the old token without interrupting the user's session.
**Validates: Requirements 6.2, 6.3**

### Property 11: Session List Accuracy
*For any* user viewing their active sessions, the displayed list should accurately reflect all currently valid sessions with correct device information and timestamps.
**Validates: Requirements 5.1**

### Property 12: New Login Notification
*For any* new device login, all other active sessions for that user should receive a notification about the new login within 5 seconds.
**Validates: Requirements 5.5**

## Error Handling

### Error Categories

1. **Authentication Errors**:
   - Invalid credentials
   - Expired token
   - Invalid token format
   - Session not found
   - Maximum device limit reached

2. **Network Errors**:
   - Connection timeout
   - Server unavailable
   - Request timeout

3. **Sync Errors**:
   - Failed to broadcast update
   - Update queue full
   - Device unreachable

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}
```

### Error Codes

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `AUTH_004`: Session not found
- `AUTH_005`: Maximum device limit reached
- `SESSION_001`: Session creation failed
- `SESSION_002`: Session validation failed
- `SESSION_003`: Session termination failed
- `SYNC_001`: Broadcast failed
- `SYNC_002`: Update queue error
- `NETWORK_001`: Connection timeout
- `NETWORK_002`: Server unavailable

### Error Handling Strategies

1. **Token Expiration**: Automatically attempt token refresh, if fails, redirect to login
2. **Network Timeout**: Retry up to 3 times with exponential backoff
3. **Session Invalid**: Clear local session and redirect to login
4. **Device Limit**: Display clear message with option to view and terminate existing sessions
5. **Sync Failure**: Queue update locally and retry when connection restored

## Testing Strategy

### Unit Tests

1. **Session Service Tests**:
   - Test session creation with valid device info
   - Test session validation with valid/invalid tokens
   - Test session termination
   - Test session expiration logic
   - Test device limit enforcement

2. **Auth Service Tests**:
   - Test login with multiple devices
   - Test token generation uniqueness
   - Test token refresh mechanism
   - Test logout functionality

3. **Sync Service Tests**:
   - Test broadcast to all user sessions
   - Test update queuing
   - Test queued update retrieval

### Property-Based Tests

The testing framework will use **fast-check** for TypeScript/Node.js backend and **Flutter's built-in test framework** with custom property test helpers for the mobile app.

Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Backend Property Tests** (using fast-check):

1. **Property 1 Test**: Generate random user with N sessions, terminate one randomly, verify others remain valid
2. **Property 3 Test**: Generate random user, create 5 sessions, attempt 6th, verify rejection
3. **Property 5 Test**: Generate N sessions for same user, verify all tokens are unique
4. **Property 6 Test**: Generate sessions with random inactive periods, verify 30+ day sessions are expired
5. **Property 7 Test**: Generate random tokens, measure validation time, verify < 50ms
6. **Property 9 Test**: Simulate concurrent login attempts, verify both succeed with unique sessions
7. **Property 10 Test**: Generate sessions near expiration, trigger refresh, verify new token validity

**Mobile App Property Tests** (using Dart):

1. **Session Persistence Test**: Generate random session data, save and retrieve, verify data integrity
2. **Token Storage Security Test**: Generate random tokens, verify secure storage mechanism
3. **Sync Event Handling Test**: Generate random sync events, verify proper handling and UI updates

### Integration Tests

1. **Multi-Device Login Flow**:
   - Login from Device A
   - Login from Device B with same credentials
   - Verify both sessions are active
   - Perform action on Device A
   - Verify Device B receives update

2. **Session Termination Flow**:
   - Create multiple sessions
   - Terminate one session
   - Verify terminated session cannot make requests
   - Verify other sessions still work

3. **Token Refresh Flow**:
   - Create session near expiration
   - Trigger automatic refresh
   - Verify new token works
   - Verify old token is invalid

4. **Device Limit Flow**:
   - Create 5 sessions
   - Attempt 6th login
   - Verify rejection
   - Terminate one session
   - Verify new login succeeds

### Performance Tests

1. **Session Validation Performance**:
   - Measure token validation time under load
   - Target: < 50ms per validation
   - Test with 1000 concurrent validations

2. **Broadcast Performance**:
   - Measure time to broadcast to N devices
   - Target: < 2 seconds for updates
   - Test with up to 5 devices per user

3. **Database Query Performance**:
   - Measure session lookup time
   - Target: < 10ms
   - Test with 10,000+ sessions in database

## Security Considerations

1. **Token Security**:
   - Use JWT with RS256 algorithm
   - Store only hashed tokens in database
   - Implement token rotation on refresh
   - Use secure random generation (crypto.randomBytes)

2. **Session Security**:
   - Implement rate limiting on login attempts
   - Log all session creation/termination events
   - Monitor for suspicious patterns (multiple rapid logins)
   - Implement account lockout after suspicious activity

3. **Device Security**:
   - Validate device identifiers
   - Store device fingerprints
   - Alert users of new device logins
   - Allow users to revoke device access

4. **Network Security**:
   - Enforce HTTPS for all API calls
   - Implement certificate pinning in mobile app
   - Use secure WebSocket connections for real-time sync
   - Validate all incoming requests

## Implementation Notes

1. **Redis Usage**:
   - Cache active sessions for fast validation
   - Store token blacklist for revoked tokens
   - Set TTL matching session expiration

2. **Database Optimization**:
   - Index on user_id and is_active for fast session lookup
   - Partition sessions table by created_at for better performance
   - Regular cleanup job to remove expired sessions

3. **Mobile App Considerations**:
   - Use Flutter Secure Storage for token storage
   - Implement background token refresh
   - Handle app lifecycle events (pause/resume)
   - Implement retry logic with exponential backoff

4. **Scalability**:
   - Use connection pooling for database
   - Implement horizontal scaling for API servers
   - Use message queue (Redis Pub/Sub) for real-time updates
   - Consider WebSocket server clustering for high load
