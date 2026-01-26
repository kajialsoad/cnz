# Authorization Middleware - Quick Reference

## Import

```typescript
import {
  requireRole,
  requireMasterAdmin,
  requireMasterOrSuperAdmin,
  requireAnyAdmin,
  validateCityCorporationAccess,
  validateZoneAccess,
  validateWardAccess,
  requirePermission,
  authorize,
  requireAdminManagementAccess,
  requireSuperAdminManagementAccess,
  blockIfViewOnly,
} from '../middlewares/authorization.middleware';
```

## Common Patterns

### 1. Master Admin Only
```typescript
router.post('/super-admins', authGuard, requireMasterAdmin, controller.create);
```

### 2. Master or Super Admin
```typescript
router.get('/admins', authGuard, requireMasterOrSuperAdmin, controller.list);
```

### 3. Any Admin Role
```typescript
router.get('/dashboard', authGuard, requireAnyAdmin, controller.dashboard);
```

### 4. City Corporation Validation
```typescript
router.get('/data/:cityCorporationCode', 
  authGuard, 
  validateCityCorporationAccess, 
  controller.getData
);
```

### 5. Zone Validation
```typescript
router.get('/zones/:zoneId', 
  authGuard, 
  validateZoneAccess, 
  controller.getZone
);
```

### 6. Ward Validation
```typescript
router.get('/wards/:wardId', 
  authGuard, 
  validateWardAccess, 
  controller.getWard
);
```

### 7. Permission Check
```typescript
router.post('/complaints', 
  authGuard, 
  requirePermission('canEditComplaints'), 
  controller.update
);
```

### 8. Block View-Only Mode
```typescript
router.put('/users/:id', 
  authGuard, 
  blockIfViewOnly, 
  controller.update
);
```

### 9. Admin Management
```typescript
router.post('/admins', 
  authGuard, 
  requireAdminManagementAccess, 
  controller.createAdmin
);
```

### 10. Super Admin Management
```typescript
router.post('/super-admins', 
  authGuard, 
  requireSuperAdminManagementAccess, 
  controller.createSuperAdmin
);
```

## Combined Authorization

```typescript
router.post('/admins', 
  authGuard,
  authorize({
    roles: [users_role.MASTER_ADMIN, users_role.SUPER_ADMIN],
    requireCityCorporation: true,
    permission: 'canAddAdmins'
  }),
  controller.createAdmin
);
```

## Complete Endpoint Protection

```typescript
router.put('/admins/:id', 
  authGuard,                          // 1. Authenticate
  requireMasterOrSuperAdmin,          // 2. Check role
  requireAdminManagementAccess,       // 3. Check specific access
  requirePermission('canEditAdmins'), // 4. Check permission
  blockIfViewOnly,                    // 5. Check view-only mode
  controller.updateAdmin
);
```

## Available Permissions

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

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | No token |
| `AUTH_ROLE_NOT_AUTHORIZED` | 403 | Wrong role |
| `AUTH_CITY_CORPORATION_MISMATCH` | 403 | Wrong City Corp |
| `AUTH_ZONE_MISMATCH` | 403 | Wrong zone |
| `AUTH_WARD_MISMATCH` | 403 | Wrong ward |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | No permission |
| `AUTH_VIEW_ONLY_MODE` | 403 | View-only |
| `VALIDATION_FAILED` | 400 | Invalid input |
| `SERVER_ERROR` | 500 | Server error |

## Access Rules

### MASTER_ADMIN
- ✅ All City Corporations
- ✅ All zones
- ✅ All wards
- ✅ All permissions
- ✅ Manage super admins
- ✅ Manage admins

### SUPER_ADMIN
- ✅ Their City Corporation only
- ✅ Their zone only
- ✅ All wards in their zone
- ⚠️ Permissions from database
- ❌ Cannot manage super admins
- ✅ Can manage admins (with permission)

### ADMIN
- ✅ Their City Corporation only
- ❌ Cannot access zone data
- ✅ Their ward only
- ⚠️ Permissions from database
- ❌ Cannot manage super admins
- ❌ Cannot manage admins

## Best Practices

1. **Always use authGuard first**
   ```typescript
   router.get('/endpoint', authGuard, requireRole(...), controller.method);
   ```

2. **Order middleware correctly**
   ```typescript
   authGuard → role check → specific access → permission → view-only
   ```

3. **Use shorthand middleware**
   ```typescript
   requireMasterAdmin  // instead of requireRole(users_role.MASTER_ADMIN)
   ```

4. **Combine with service-layer filtering**
   - Middleware: Validates access
   - Service: Filters data

5. **Handle errors gracefully**
   - All middleware returns consistent format
   - Include error details for debugging

## Testing

```bash
npm test -- authorization.middleware.test.ts
```

## Documentation

Full guide: `server/docs/AUTHORIZATION_MIDDLEWARE_GUIDE.md`
