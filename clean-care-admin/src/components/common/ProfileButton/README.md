# ProfileButton Component

A reusable button component for triggering the profile modal in the Clean Care Admin panel.

## Features

- ✅ Display user avatar (or initials if no avatar)
- ✅ Show user name and role (optional)
- ✅ Online status indicator
- ✅ Opens ProfileModal on click
- ✅ Responsive design
- ✅ Multiple variants (sidebar, header)
- ✅ Collapsed state support for sidebar
- ✅ Loading state handling
- ✅ Tooltip support for collapsed sidebar

## Requirements

Implements requirements:
- **1.4**: Profile section fetches current user's role from authentication token
- **2.1**: User clicks on profile to display modal with full profile information
- **8.4**: Screen size changes adapt the profile layout responsively

## Usage

### Basic Usage

```tsx
import ProfileButton from './components/common/ProfileButton/ProfileButton';

// In Sidebar
<ProfileButton variant="sidebar" showName={true} showRole={true} />

// In Header
<ProfileButton variant="header" showName={true} showRole={true} />
```

### With Collapsed Sidebar

```tsx
<ProfileButton 
  variant="sidebar" 
  showName={true} 
  showRole={true} 
  collapsed={true}
/>
```

### Header Variant (Minimal)

```tsx
<ProfileButton 
  variant="header" 
  showName={true} 
  showRole={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'sidebar' \| 'header'` | `'sidebar'` | Determines the layout and styling |
| `showName` | `boolean` | `true` | Whether to show the user's name |
| `showRole` | `boolean` | `true` | Whether to show the user's role |
| `collapsed` | `boolean` | `false` | Whether the sidebar is collapsed (sidebar variant only) |

## Variants

### Sidebar Variant

- Large avatar (64x64)
- Vertical layout
- Shows name, role badge, and active status
- Supports collapsed state with tooltip
- White text on gradient background
- Full-width button

### Header Variant

- Small avatar (36x36)
- Horizontal layout
- Shows name and role inline
- Hides on mobile screens
- Dark text on light background
- Compact button

## Features

### Online Status Indicator

Both variants display a green dot indicator showing the user is online:
- Positioned at bottom-right of avatar
- Animated fade-in effect
- Pulsing glow effect

### Role Display

Role is displayed with:
- Role-specific icon
- Role-specific color
- Gradient background (sidebar)
- Inline text (header)

### Responsive Behavior

- **Sidebar variant**: Adapts to collapsed state
- **Header variant**: Hides name/role on mobile
- **Both**: Maintain touch-friendly sizes

### Loading State

- Button is disabled while profile is loading
- Shows placeholder text
- Prevents modal opening

## Integration

The ProfileButton component:
1. Uses `useProfile` hook to get user data
2. Uses `getRoleConfig` to get role-specific styling
3. Opens `ProfileModal` when clicked
4. Manages modal state internally

## Styling

### Sidebar Variant
- Background: Transparent with hover effect
- Text: White
- Avatar: White border with shadow
- Role badge: Gradient background

### Header Variant
- Background: Transparent with hover effect
- Text: Theme text color
- Avatar: Gradient background with colored border
- Role: Colored text

## Accessibility

- Keyboard accessible (ButtonBase)
- Tooltip for collapsed state
- Proper focus states
- Disabled state when loading

## Examples

### Full Sidebar Profile

```tsx
<ProfileButton 
  variant="sidebar"
  showName={true}
  showRole={true}
  collapsed={false}
/>
```

### Collapsed Sidebar Profile

```tsx
<ProfileButton 
  variant="sidebar"
  showName={true}
  showRole={true}
  collapsed={true}
/>
```

### Header Profile

```tsx
<ProfileButton 
  variant="header"
  showName={true}
  showRole={true}
/>
```

### Minimal Header Profile (Avatar Only)

```tsx
<ProfileButton 
  variant="header"
  showName={false}
  showRole={false}
/>
```

## Dependencies

- `@mui/material` - UI components
- `ProfileContext` - User profile data
- `roleConfig` - Role configuration
- `ProfileModal` - Profile modal component
- `animations` - Animation styles

## Related Components

- `ProfileModal` - Modal opened by this button
- `RoleBadge` - Used in ProfileModal
- `Sidebar` - Uses sidebar variant
- `Header` - Uses header variant
