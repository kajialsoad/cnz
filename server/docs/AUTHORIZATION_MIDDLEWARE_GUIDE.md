# Authorization Middleware Guide

## Overview

This guide provides comprehensive documentation for the authorization middleware system implemented for the Dynamic Admin Management System. The middleware provides role-based access control, City Corporation-based data isolation, zone and ward access validation, and permission-based feature access.

## Requirements Coverage

This implementation satisfies the following requirements:
- **Requirement 12.3**: Role-based authorization
- **Requirement 12.4**: City Corporation access validation
- **Requirement 12.19**: Permission-based feature access
- **Requirements 18.1-18.20**: City Corporation-based dynamic system
- **Requirements 20.1-20.20**: Comprehensive role-based page access and data filtering

## Middleware Functions

### 1. requireRole(...allowedRoles)

Checks if the authenticated user has one of the required roles.

**Usage:**
```typescript
import { requireRole } from '../middlewares/authorization.middleware';
import { users_role } from '@prisma/client';

// Single role
router.get('/admin-only', requireRole(users_role.MASTER_ADMIN), controller.method);

// Multiple roles
router.get('/admin-or-super', 
  requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN), 
  controller.method
);
```

**Access Rules:**
- Returns 401 if user is not authenticated
- Returns 403 if user role is not in the allowed roles list
- Calls next() if user has one of the required roles

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_MISSING",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "AUTH_ROLE_NOT_AUTHORIZED",
    "message": "Access denied. Required roles: MASTER_ADMIN, SUPER_ADMIN",
    "details": {
      "userRole": "ADMIN",
      "requiredRoles": ["MASTER_ADMIN", "SUPER_ADMIN"]
    }
  }
}
```

### 2. validateCityCorporationAccess

Ensures users can only access data from their assigned City Corporation.

**Usage:**
```typescript
import { validateCityCorporationAccess } from '../middlewares/authorization.middleware';

router.get('/data/:cityCorporationCode', 
  authGuard,
  validateCityCorporationAccess,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Can access all City Corporations
- **SUPER_ADMIN**: Can only access their assigned City Corporation
- **ADMIN**: Can only access their assigned City Corporation
- Allows access if no City Corporation is specified (filtered by service layer)

**City Corporation Sources:**
The middleware checks for City Corporation code in:
1. `req.params.cityCorporationCode`
2. `req.query.cityCorporationCode`
3. `req.body.cityCorporationCode`

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_CITY_CORPORATION_MISMATCH",
    "message": "You do not have access to this City Corporation",
    "details": {
      "userCityCorporation": "DSCC",
      "requestedCityCorporation": "DNCC"
    }
  }
}
```

### 3. validateZoneAccess

Ensures users can only access zones they are assigned to.

**Usage:**
```typescript
import { validateZoneAccess } from '../middlewares/authorization.middleware';

router.get('/zones/:zoneId', 
  authGuard,
  validateZoneAccess,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Can access all zones
- **SUPER_ADMIN**: Can only access their assigned zone
- **ADMIN**: Cannot access zone-level data directly (returns 403)
- Allows access if no zone is specified (filtered by service layer)

**Zone ID Sources:**
The middleware checks for zone ID in:
1. `req.params.zoneId`
2. `req.query.zoneId`
3. `req.body.zoneId`

**Error Responses:**
```json
// Zone mismatch
{
  "success": false,
  "error": {
    "code": "AUTH_ZONE_MISMATCH",
    "message": "You do not have access to this zone",
    "details": {
      "userZone": 1,
      "requestedZone": 2
    }
  }
}

// Admin accessing zone data
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "Admins cannot access zone-level data"
  }
}

// Invalid zone ID
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid zone ID format"
  }
}
```

### 4. validateWardAccess

Ensures users can only access wards they are assigned to.

**Usage:**
```typescript
import { validateWardAccess } from '../middlewares/authorization.middleware';

router.get('/wards/:wardId', 
  authGuard,
  validateWardAccess,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Can access all wards
- **SUPER_ADMIN**: Can access all wards in their zone (validated by service layer)
- **ADMIN**: Can only access their assigned ward
- Allows access if no ward is specified (filtered by service layer)

**Ward ID Sources:**
The middleware checks for ward ID in:
1. `req.params.wardId`
2. `req.query.wardId`
3. `req.body.wardId`

**Error Responses:**
```json
// Ward mismatch
{
  "success": false,
  "error": {
    "code": "AUTH_WARD_MISMATCH",
    "message": "You do not have access to this ward",
    "details": {
      "userWard": 1,
      "requestedWard": 2
    }
  }
}

// Invalid ward ID
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid ward ID format"
  }
}
```

### 5. requirePermission(permission)

Checks if user has a specific permission to perform an action.

**Usage:**
```typescript
import { requirePermission } from '../middlewares/authorization.middleware';

router.post('/complaints', 
  authGuard,
  requirePermission('canEditComplaints'),
  controller.method
);
```

**Available Permissions:**
```typescript
// Complaint Management
'canViewComplaints'
'canApproveComplaints'
'canRejectComplaints'
'canMarkComplaintsPending'
'canEditComplaints'
'canDeleteComplaints'

// User Management
'canViewUsers'
'canEditUsers'
'canDeleteUsers'
'canAddUsers'

// Admin Management
'canViewAdmins'
'canEditAdmins'
'canDeleteAdmins'
'canAddAdmins'

// Messaging
'canViewMessages'
'canSendMessagesToUsers'
'canSendMessagesToAdmins'

// Analytics & Reports
'canViewAnalytics'
'canExportData'
'canDownloadReports'

// View Only Mode
'viewOnlyMode'
```

**Access Rules:**
- **MASTER_ADMIN**: Has all permissions (bypasses check)
- Other roles: Checks permissions from database
- Returns 403 if user doesn't have the required permission

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "You do not have permission to canEditComplaints",
    "details": {
      "requiredPermission": "canEditComplaints"
    }
  }
}
```

### 6. authorize(options)

Combined authorization middleware that validates multiple criteria.

**Usage:**
```typescript
import { authorize } from '../middlewares/authorization.middleware';
import { users_role } from '@prisma/client';

router.post('/admin/users', 
  authGuard,
  authorize({
    roles: [users_role.MASTER_ADMIN, users_role.SUPER_ADMIN],
    requireCityCorporation: true,
    permission: 'canAddUsers'
  }),
  controller.method
);
```

**Options:**
```typescript
{
  roles?: users_role[];                    // Required roles
  requireCityCorporation?: boolean;        // Validate City Corporation access
  requireZone?: boolean;                   // Validate zone access
  requireWard?: boolean;                   // Validate ward access
  permission?: keyof Permissions['features']; // Required permission
}
```

**Example Combinations:**
```typescript
// Only MASTER_ADMIN can access
authorize({ roles: [users_role.MASTER_ADMIN] })

// SUPER_ADMIN with City Corporation validation
authorize({ 
  roles: [users_role.SUPER_ADMIN],
  requireCityCorporation: true 
})

// Any admin with specific permission
authorize({ 
  roles: [users_role.MASTER_ADMIN, users_role.SUPER_ADMIN, users_role.ADMIN],
  permission: 'canViewComplaints'
})

// Full validation
authorize({
  roles: [users_role.SUPER_ADMIN],
  requireCityCorporation: true,
  requireZone: true,
  permission: 'canEditAdmins'
})
```

### 7. Shorthand Middleware

Convenient shortcuts for common role combinations.

**requireMasterAdmin**
```typescript
import { requireMasterAdmin } from '../middlewares/authorization.middleware';

router.post('/super-admins', authGuard, requireMasterAdmin, controller.method);
```
Equivalent to: `requireRole(users_role.MASTER_ADMIN)`

**requireMasterOrSuperAdmin**
```typescript
import { requireMasterOrSuperAdmin } from '../middlewares/authorization.middleware';

router.get('/admins', authGuard, requireMasterOrSuperAdmin, controller.method);
```
Equivalent to: `requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN)`

**requireAnyAdmin**
```typescript
import { requireAnyAdmin } from '../middlewares/authorization.middleware';

router.get('/dashboard', authGuard, requireAnyAdmin, controller.method);
```
Equivalent to: `requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN, users_role.ADMIN)`

### 8. requireAdminManagementAccess

Validates that user can manage other admins.

**Usage:**
```typescript
import { requireAdminManagementAccess } from '../middlewares/authorization.middleware';

router.post('/admins', 
  authGuard,
  requireAdminManagementAccess,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Can manage all admins
- **SUPER_ADMIN**: Can manage admins in their zones (requires `canViewAdmins` permission)
- **ADMIN**: Cannot manage other admins (returns 403)

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "Admins cannot manage other admins"
  }
}
```

### 9. requireSuperAdminManagementAccess

Validates that user can manage super admins.

**Usage:**
```typescript
import { requireSuperAdminManagementAccess } from '../middlewares/authorization.middleware';

router.post('/super-admins', 
  authGuard,
  requireSuperAdminManagementAccess,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Can manage all super admins
- **SUPER_ADMIN**: Cannot manage other super admins (returns 403)
- **ADMIN**: Cannot manage super admins (returns 403)

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "Only Master Admins can manage Super Admins"
  }
}
```

### 10. blockIfViewOnly

Blocks write operations if user is in view-only mode.

**Usage:**
```typescript
import { blockIfViewOnly } from '../middlewares/authorization.middleware';

router.put('/complaints/:id', 
  authGuard,
  blockIfViewOnly,
  controller.method
);
```

**Access Rules:**
- **MASTER_ADMIN**: Never in view-only mode (bypasses check)
- Other roles: Checks `viewOnlyMode` permission
- Returns 403 if view-only mode is enabled

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_VIEW_ONLY_MODE",
    "message": "This action is not allowed in view-only mode"
  }
}
```

## Common Usage Patterns

### Pattern 1: User Management Endpoints

```typescript
// Get users (all admins can view)
router.get('/users', 
  authGuard,
  requireAnyAdmin,
  validateCityCorporationAccess,
  userController.getUsers
);

// Create user (MASTER_ADMIN and SUPER_ADMIN only)
router.post('/users', 
  authGuard,
  requireMasterOrSuperAdmin,
  requirePermission('canAddUsers'),
  blockIfViewOnly,
  userController.createUser
);

// Update user
router.put('/users/:id', 
  authGuard,
  requireMasterOrSuperAdmin,
  requirePermission('canEditUsers'),
  blockIfViewOnly,
  userController.updateUser
);

// Delete user (MASTER_ADMIN only)
router.delete('/users/:id', 
  authGuard,
  requireMasterAdmin,
  requirePermission('canDeleteUsers'),
  userController.deleteUser
);
```

### Pattern 2: Admin Management Endpoints

```typescript
// Get admins
router.get('/admins', 
  authGuard,
  requireMasterOrSuperAdmin,
  requireAdminManagementAccess,
  adminController.getAdmins
);

// Create admin
router.post('/admins', 
  authGuard,
  requireMasterOrSuperAdmin,
  requireAdminManagementAccess,
  requirePermission('canAddAdmins'),
  blockIfViewOnly,
  adminController.createAdmin
);

// Update admin
router.put('/admins/:id', 
  authGuard,
  requireMasterOrSuperAdmin,
  requireAdminManagementAccess,
  requirePermission('canEditAdmins'),
  blockIfViewOnly,
  adminController.updateAdmin
);
```

### Pattern 3: Super Admin Management Endpoints

```typescript
// Get super admins (MASTER_ADMIN only)
router.get('/super-admins', 
  authGuard,
  requireSuperAdminManagementAccess,
  superAdminController.getSuperAdmins
);

// Create super admin (MASTER_ADMIN only)
router.post('/super-admins', 
  authGuard,
  requireSuperAdminManagementAccess,
  blockIfViewOnly,
  superAdminController.createSuperAdmin
);
```

### Pattern 4: Complaint Management Endpoints

```typescript
// View complaints
router.get('/complaints', 
  authGuard,
  requireAnyAdmin,
  requirePermission('canViewComplaints'),
  validateCityCorporationAccess,
  complaintController.getComplaints
);

// Approve complaint
router.put('/complaints/:id/approve', 
  authGuard,
  requireAnyAdmin,
  requirePermission('canApproveComplaints'),
  blockIfViewOnly,
  complaintController.approveComplaint
);

// Delete complaint (MASTER_ADMIN only)
router.delete('/complaints/:id', 
  authGuard,
  requireMasterAdmin,
  requirePermission('canDeleteComplaints'),
  complaintController.deleteComplaint
);
```

### Pattern 5: Zone and Ward Endpoints

```typescript
// Get zones
router.get('/zones', 
  authGuard,
  requireMasterOrSuperAdmin,
  validateCityCorporationAccess,
  zoneController.getZones
);

// Get specific zone
router.get('/zones/:zoneId', 
  authGuard,
  requireMasterOrSuperAdmin,
  validateZoneAccess,
  zoneController.getZone
);

// Get wards
router.get('/wards', 
  authGuard,
  requireAnyAdmin,
  validateCityCorporationAccess,
  wardController.getWards
);

// Get specific ward
router.get('/wards/:wardId', 
  authGuard,
  requireAnyAdmin,
  validateWardAccess,
  wardController.getWard
);
```

## Testing

Comprehensive tests are available in `tests/middlewares/authorization.middleware.test.ts`.

**Test Coverage:**
- ✅ Role-based authorization
- ✅ City Corporation access validation
- ✅ Zone access validation
- ✅ Ward access validation
- ✅ Permission-based access
- ✅ Admin management access
- ✅ Super admin management access
- ✅ Shorthand middleware
- ✅ Error handling
- ✅ Edge cases

**Running Tests:**
```bash
npm test -- authorization.middleware.test.ts
```

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | No authentication token provided |
| `AUTH_ROLE_NOT_AUTHORIZED` | 403 | User role not authorized for this action |
| `AUTH_CITY_CORPORATION_MISMATCH` | 403 | Attempting to access different City Corporation |
| `AUTH_ZONE_MISMATCH` | 403 | Attempting to access different zone |
| `AUTH_WARD_MISMATCH` | 403 | Attempting to access different ward |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permission |
| `AUTH_VIEW_ONLY_MODE` | 403 | Action not allowed in view-only mode |
| `VALIDATION_FAILED` | 400 | Invalid input format |
| `SERVER_ERROR` | 500 | Internal server error during authorization |

## Best Practices

1. **Always use authGuard first**: Ensure user is authenticated before checking authorization
   ```typescript
   router.get('/endpoint', authGuard, requireRole(...), controller.method);
   ```

2. **Order middleware correctly**: Place more specific checks after general ones
   ```typescript
   router.post('/admins', 
     authGuard,                          // 1. Authenticate
     requireMasterOrSuperAdmin,          // 2. Check role
     requireAdminManagementAccess,       // 3. Check specific access
     requirePermission('canAddAdmins'),  // 4. Check permission
     blockIfViewOnly,                    // 5. Check view-only mode
     controller.method
   );
   ```

3. **Use shorthand middleware**: Prefer `requireMasterAdmin` over `requireRole(users_role.MASTER_ADMIN)`

4. **Combine with service-layer filtering**: Middleware validates access, services filter data
   ```typescript
   // Middleware: Validates user can access endpoint
   router.get('/users', authGuard, requireAnyAdmin, controller.getUsers);
   
   // Service: Filters data based on role and assignments
   async getUsers(requestingUser) {
     const where = {};
     if (requestingUser.role === 'SUPER_ADMIN') {
       where.zoneId = requestingUser.zoneId;
     }
     return prisma.user.findMany({ where });
   }
   ```

5. **Handle errors gracefully**: All middleware returns consistent error format

6. **Test authorization**: Write tests for all authorization scenarios

## Migration from Old Middleware

If you're migrating from the old `auth.middleware.ts`:

**Old:**
```typescript
import { rbacGuard, cityCorporationGuard } from './auth.middleware';

router.get('/endpoint', authGuard, rbacGuard('MASTER_ADMIN'), controller.method);
```

**New:**
```typescript
import { requireMasterAdmin } from './authorization.middleware';

router.get('/endpoint', authGuard, requireMasterAdmin, controller.method);
```

**Old:**
```typescript
router.get('/data/:cityCorporationCode', 
  authGuard, 
  cityCorporationGuard, 
  controller.method
);
```

**New:**
```typescript
import { validateCityCorporationAccess } from './authorization.middleware';

router.get('/data/:cityCorporationCode', 
  authGuard, 
  validateCityCorporationAccess, 
  controller.method
);
```

## Conclusion

The authorization middleware provides a comprehensive, type-safe, and well-tested solution for implementing role-based access control, City Corporation-based data isolation, and permission-based feature access. It fully satisfies requirements 12.3, 12.4, and 12.19, and provides the foundation for secure multi-tenant admin management.
