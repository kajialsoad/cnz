# Rate Limiting Quick Reference

## Overview
Comprehensive rate limiting system to prevent abuse, brute force attacks, and ensure fair API usage.

## Rate Limits

### Global Limits

| Type | Limit | Window | Scope |
|------|-------|--------|-------|
| IP-based | 1000 requests | 1 minute | All `/api` routes |
| API General | 100 requests | 1 minute | Per authenticated user |
| Strict Operations | 10 requests | 1 minute | Sensitive operations |

### Login Protection

| Type | Limit | Window | Action |
|------|-------|--------|--------|
| Failed Attempts | 5 attempts | 15 minutes | Account lockout |
| Lockout Duration | - | 15 minutes | Temporary block |

### Message Limits

| Type | Limit | Window | Scope |
|------|-------|--------|-------|
| Per Minute | 10 messages | 1 minute | Per user |
| Per Hour | 100 messages | 1 hour | Per user |

## Middleware Functions

### 1. IP Rate Limiting
```typescript
import { ipRateLimit } from './middlewares/rate-limit.middleware';

// Apply to routes
app.use('/api', ipRateLimit(1000, 60 * 1000));

// Custom limits
router.use(ipRateLimit(100, 60 * 1000)); // 100 req/min
```

### 2. API Rate Limiting
```typescript
import { apiRateLimit } from './middlewares/rate-limit.middleware';

// Apply to routes
router.use(apiRateLimit);
```

### 3. Strict Rate Limiting
```typescript
import { strictRateLimit } from './middlewares/rate-limit.middleware';

// Apply to sensitive operations
router.post('/users', strictRateLimit, createUser);
router.delete('/users/:id', strictRateLimit, deleteUser);
```

### 4. Login Rate Limiting
```typescript
import { loginRateLimit } from './middlewares/rate-limit.middleware';

// Apply to login endpoints
router.post('/login', loginRateLimit, loginHandler);
```

### 5. Message Rate Limiting
```typescript
import { messageRateLimit } from './middlewares/rate-limit.middleware';

// Apply to message endpoints
router.post('/messages', messageRateLimit, sendMessage);
```

## Login Attempt Tracking

### Track Login Attempts
```typescript
import { trackLoginAttempt } from './middlewares/rate-limit.middleware';

// Track failed attempt
await trackLoginAttempt(email, false, ipAddress);

// Track successful attempt (clears failed attempts)
await trackLoginAttempt(email, true, ipAddress);
```

### Check Account Lockout
```typescript
import { checkAccountLockout } from './middlewares/rate-limit.middleware';

const lockout = checkAccountLockout(email);
if (lockout.locked) {
    // Account is locked
    console.log(`Retry after ${lockout.retryAfter} seconds`);
}
```

### Get Remaining Attempts
```typescript
import { getRemainingLoginAttempts } from './middlewares/rate-limit.middleware';

const remaining = getRemainingLoginAttempts(email);
console.log(`${remaining} attempts remaining`);
```

## Error Responses

### Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Too many requests. Please slow down.",
  "retryAfter": 45
}
```

### Account Locked
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.",
    "retryAfter": 900,
    "remainingAttempts": 0
  }
}
```

### IP Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP address. Please try again later.",
    "retryAfter": 45
  }
}
```

## Response Headers

Rate limit responses include these headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 2024-12-13T10:30:00.000Z
```

## Configuration

### Current Settings
```typescript
// In rate-limit.middleware.ts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// API limits
const API_RATE_LIMIT = 100; // per minute
const STRICT_RATE_LIMIT = 10; // per minute

// Message limits
const MESSAGE_PER_MINUTE = 10;
const MESSAGE_PER_HOUR = 100;
```

### Environment Variables (Recommended)
```env
# Rate Limiting
RATE_LIMIT_API=100
RATE_LIMIT_STRICT=10
RATE_LIMIT_IP=1000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

## Usage Examples

### Protect Admin Routes
```typescript
import { apiRateLimit, strictRateLimit } from './middlewares/rate-limit.middleware';

const router = Router();

// Apply general rate limiting to all routes
router.use(apiRateLimit);

// Strict rate limiting for sensitive operations
router.post('/users', strictRateLimit, createUser);
router.delete('/users/:id', strictRateLimit, deleteUser);
router.put('/users/:id/permissions', strictRateLimit, updatePermissions);
```

### Protect Login Endpoints
```typescript
import { loginRateLimit, ipRateLimit } from './middlewares/rate-limit.middleware';

router.post('/login', 
    loginRateLimit,           // Account lockout protection
    ipRateLimit(100, 60000),  // IP-based rate limiting
    loginHandler
);
```

### Custom Rate Limits
```typescript
// Very strict limit for password reset
router.post('/reset-password', 
    ipRateLimit(3, 60 * 60 * 1000), // 3 per hour
    resetPasswordHandler
);

// Moderate limit for registration
router.post('/register',
    ipRateLimit(10, 60 * 60 * 1000), // 10 per hour
    registerHandler
);
```

## Monitoring

### Check Rate Limit Status
```typescript
import { getRateLimitStatus } from './middlewares/rate-limit.middleware';

const status = getRateLimitStatus(userId);
console.log(status);
// {
//   perMinute: { used: 5, limit: 10, remaining: 5, resetIn: 45 },
//   perHour: { used: 50, limit: 100, remaining: 50, resetIn: 2700 }
// }
```

### Activity Logging
All account lockouts are automatically logged to the ActivityLog table:
```typescript
{
  userId: user.id,
  action: 'ACCOUNT_LOCKED',
  entityType: 'USER',
  entityId: user.id,
  oldValue: { status: 'ACTIVE' },
  newValue: {
    status: 'LOCKED',
    reason: 'Too many failed login attempts',
    lockoutUntil: new Date(lockoutTime)
  },
  ipAddress: ip,
  timestamp: new Date()
}
```

## Production Recommendations

### 1. Use Redis for Distributed Systems
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store rate limit data in Redis
await redis.setex(`rate_limit:${key}`, ttl, count);
```

### 2. Monitor Rate Limit Hits
- Track rate limit violations
- Alert on suspicious patterns
- Dashboard for metrics

### 3. Adjust Limits Based on Traffic
- Monitor actual usage patterns
- Adjust limits for different user tiers
- Implement dynamic rate limiting

### 4. Whitelist Trusted IPs
```typescript
const WHITELISTED_IPS = ['10.0.0.1', '192.168.1.1'];

if (WHITELISTED_IPS.includes(req.ip)) {
    return next(); // Skip rate limiting
}
```

## Testing

Run rate limiting tests:
```bash
npm test -- rate-limit.middleware.test.ts
```

Test coverage:
- ✅ API rate limiting
- ✅ Strict rate limiting
- ✅ IP-based rate limiting
- ✅ Login attempt tracking
- ✅ Account lockout
- ✅ Message rate limiting

## Troubleshooting

### Issue: Rate limit hit too quickly
**Solution:** Increase limits or implement user tiers

### Issue: Legitimate users getting locked out
**Solution:** Adjust MAX_LOGIN_ATTEMPTS or LOCKOUT_DURATION

### Issue: Memory usage growing
**Solution:** Verify cleanup interval is running, consider Redis

### Issue: Rate limits not working
**Solution:** Check middleware order, ensure it's applied before routes

## Security Best Practices

1. ✅ Always apply IP-based rate limiting globally
2. ✅ Use strict rate limiting for sensitive operations
3. ✅ Implement account lockout for login endpoints
4. ✅ Log all rate limit violations
5. ✅ Monitor for attack patterns
6. ✅ Use Redis in production for distributed systems
7. ✅ Set appropriate limits based on your use case
8. ✅ Provide clear error messages with retry times

## Related Documentation

- [Security Measures](./SECURITY_MEASURES.md)
- [Authorization Guide](./AUTHORIZATION_MIDDLEWARE_GUIDE.md)
- [Input Validation](./INPUT_VALIDATION_SECURITY.md)

## Support

For issues or questions:
1. Check the test suite for examples
2. Review the middleware implementation
3. Consult the security documentation
4. Monitor application logs for rate limit events
