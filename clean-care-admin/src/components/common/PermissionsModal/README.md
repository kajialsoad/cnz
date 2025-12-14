# PermissionsModal Component

A comprehensive permission management modal for the Clean Care Admin Panel that allows Master Admins and Super Admins to configure granular permissions for Admins and Super Admins.

## Features

### View Only Mode
- **Toggle**: Enable/disable view-only mode with a single switch
- **When Enabled**: User can only view data, all action permissions are disabled
- **Visual Feedback**: Orange background and warning alert when enabled

### Granular Permissions

#### 1. Complaint Management
- View Complaints
- Approve Complaints
- Reject Complaints
- Mark as Pending
- Edit Complaints
- Delete Complaints

#### 2. User Management
- View Users
- Add Users
- Edit Users
- Delete Users

#### 3. Admin Management (Super Admin & Master Admin only)
- View Admins
- Add Admins
- Edit Admins
- Delete Admins

#### 4. Messaging
- View Messages
- Send Messages to Users
- Send Messages to Admins

#### 5. Analytics & Reports
- View Analytics
- Export Data
- Download Reports

## Usage

```tsx
import PermissionsModal from '@/components/common/PermissionsModal';

const MyComponent = () => {
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    zones: [1, 2],
    wards: [10, 11],
    categories: [],
    features: {
      canViewComplaints: true,
      canApproveComplaints: true,
      canRejectComplaints: true,
      canMarkComplaintsPending: true,
      canEditComplaints: true,
      canDeleteComplaints: false,
      canViewUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canAddUsers: true,
      canViewAdmins: true,
      canEditAdmins: true,
      canDeleteAdmins: false,
      canAddAdmins: true,
      canViewMessages: true,
      canSendMessagesToUsers: true,
      canSendMessagesToAdmins: true,
      canViewAnalytics: true,
      canExportData: true,
      canDownloadReports: true,
      viewOnlyMode: false,
    },
  });

  const handleSave = (newPermissions: Permissions) => {
    setPermissions(newPermissions);
    // Save to backend
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Edit Permissions
      </Button>
      
      <PermissionsModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initialPermissions={permissions}
        userRole="ADMIN"
        title="Edit Admin Permissions"
      />
    </>
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Called when modal is closed |
| `onSave` | `(permissions: Permissions) => void` | Yes | Called when permissions are saved |
| `initialPermissions` | `Permissions` | Yes | Initial permission values |
| `userRole` | `'ADMIN' \| 'SUPER_ADMIN' \| 'MASTER_ADMIN'` | Yes | User role being edited |
| `title` | `string` | No | Modal title (default: "Edit Permissions") |

## Permission Structure

```typescript
interface Permissions {
  zones: number[];
  wards: number[];
  categories: string[];
  features: {
    // Complaint Management
    canViewComplaints: boolean;
    canApproveComplaints: boolean;
    canRejectComplaints: boolean;
    canMarkComplaintsPending: boolean;
    canEditComplaints: boolean;
    canDeleteComplaints: boolean;
    
    // User Management
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canAddUsers: boolean;
    
    // Admin Management
    canViewAdmins: boolean;
    canEditAdmins: boolean;
    canDeleteAdmins: boolean;
    canAddAdmins: boolean;
    
    // Messaging
    canViewMessages: boolean;
    canSendMessagesToUsers: boolean;
    canSendMessagesToAdmins: boolean;
    
    // Analytics & Reports
    canViewAnalytics: boolean;
    canExportData: boolean;
    canDownloadReports: boolean;
    
    // View Only Mode
    viewOnlyMode: boolean;
  };
}
```

## View Only Mode Behavior

When View Only Mode is enabled:
- ✅ Can view User List
- ✅ Can view Admin List
- ✅ Can view Complaints
- ❌ Cannot Edit, Add, or Delete anything
- ❌ Cannot Approve, Reject, or Mark Pending complaints
- ❌ Cannot send messages
- ❌ Cannot download reports
- ❌ Cannot export data

## Role-Based Visibility

### Admin
- Shows: Complaint Management, User Management, Messaging, Analytics & Reports
- Hides: Admin Management section

### Super Admin
- Shows: All sections including Admin Management
- Can manage Admins in their assigned zones

### Master Admin
- Shows: All sections
- Full control over all permissions

## Integration with Backend

The component works with the backend `PermissionService`:

```typescript
// Backend: server/src/services/permission.service.ts
export interface Permissions {
  zones: number[];
  wards: number[];
  categories: string[];
  features: PermissionFeatures;
}
```

## Styling

- Uses Material-UI components
- Responsive grid layout
- Color-coded icons for different actions
- Visual feedback for View Only Mode
- Organized into collapsible sections

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- Clear visual indicators
- Descriptive tooltips

## Best Practices

1. **Always validate permissions on backend**: Frontend permissions are for UI only
2. **Use View Only Mode for read-only access**: Simplifies permission management
3. **Test permission changes**: Verify that UI updates correctly based on permissions
4. **Log permission changes**: Track who changed what permissions when

## Related Components

- `AdminEditModal`: Uses PermissionsModal for editing admin permissions
- `SuperAdminEditModal`: Uses PermissionsModal for editing super admin permissions
- `usePermissions` hook: Frontend hook for checking permissions

## Backend Integration

See:
- `server/src/services/permission.service.ts` - Permission service
- `server/src/middlewares/auth.middleware.ts` - Permission enforcement
- `server/src/controllers/admin.user.controller.ts` - Permission updates
