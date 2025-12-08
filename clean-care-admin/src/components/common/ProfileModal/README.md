# ProfileModal Component

Main modal component for displaying and managing user profile information in the Clean Care Admin panel.

## Features

- **Profile Display**: Shows complete user profile with avatar, name, role, and personal information
- **Role Badge**: Displays role-specific badge with gradient styling and permissions tooltip
- **Personal Information**: Email, phone, ward, zone, address, city corporation
- **Account Information**: Member since, last login, account status
- **Verification Status**: Shows verification status for email and phone
- **Edit Mode**: Toggle to switch to profile editing mode (to be implemented in Task 7)
- **Logout**: Secure logout with loading state
- **Loading State**: Skeleton loading while fetching profile data
- **Responsive Design**: Optimized layouts for mobile, tablet, and desktop
- **Smooth Animations**: Fade-in and slide-up animations for better UX

## Usage

```tsx
import ProfileModal from './components/common/ProfileModal/ProfileModal';

function MyComponent() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsProfileOpen(true)}>
        Open Profile
      </Button>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |

## Requirements Satisfied

- **2.1**: Modal displays complete profile information when user clicks profile
- **2.2**: Shows avatar, name, email, phone, role, and other relevant information
- **2.3**: Formats role name with proper capitalization and spacing (via RoleBadge)
- **2.4**: Displays default avatar with initials when no avatar exists
- **2.5**: Shows loading indicator while profile data is loading
- **8.1**: Mobile-optimized layout (full-screen on mobile)
- **8.2**: Tablet-optimized layout
- **8.3**: Desktop-optimized layout

## Dependencies

- `@mui/material`: UI components
- `react-router-dom`: Navigation for logout redirect
- `ProfileContext`: Global profile state management
- `AuthContext`: Authentication and logout functionality
- `RoleBadge`: Role-specific badge component
- `animations`: Fade-in and slide-up animations

## Responsive Behavior

### Mobile (< 640px)
- Full-screen modal
- Stacked action buttons
- Smaller avatar (100px)
- Compact spacing
- Smaller font sizes

### Tablet (640px - 1024px)
- Medium-sized modal
- Standard layout
- Medium avatar (120px)

### Desktop (> 1024px)
- Standard modal with max-width
- Full layout with all features
- Large avatar (120px)
- Optimal spacing

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Color contrast compliance
- Touch-friendly targets on mobile

## Future Enhancements

- Edit mode implementation (Task 7)
- Avatar upload integration (Task 5)
- Profile update form (Task 7)
- Cross-tab synchronization display
- Profile change animations

## Related Components

- `RoleBadge`: Displays role-specific badge
- `AvatarUpload`: Avatar upload component (to be integrated)
- `ProfileEditForm`: Profile editing form (to be implemented)
- `ProfileButton`: Trigger button in sidebar/header (to be implemented)

## Notes

- The modal uses the ProfileContext for profile data management
- Loading state is handled automatically by the context
- Logout redirects to `/login` after successful logout
- Edit mode toggle is prepared for Task 7 implementation
- All animations use the project's animation configuration
