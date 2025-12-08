# RoleBadge Component

A flexible and responsive badge component for displaying admin roles with role-specific styling, tooltips, and multiple variants.

## Features

✅ **Role-Specific Styling**: Automatic color schemes and gradients for each role (ADMIN, SUPER_ADMIN, MASTER_ADMIN)
✅ **Size Variants**: Three size options (small, medium, large)
✅ **Multiple Variants**: Filled, outlined, and gradient styles
✅ **Tooltip Support**: Displays role permissions on hover
✅ **Responsive Design**: Automatically adjusts for mobile devices
✅ **Touch-Friendly**: Optimized tooltip behavior for touch devices
✅ **Customizable**: Optional icon display and tooltip control

## Usage

### Basic Usage

```tsx
import RoleBadge from '@/components/common/RoleBadge/RoleBadge';

// Simple usage with defaults
<RoleBadge role="MASTER_ADMIN" />
```

### Size Variants

```tsx
// Small badge
<RoleBadge role="ADMIN" size="small" />

// Medium badge (default)
<RoleBadge role="SUPER_ADMIN" size="medium" />

// Large badge
<RoleBadge role="MASTER_ADMIN" size="large" />
```

### Style Variants

```tsx
// Filled (default) - solid color background
<RoleBadge role="ADMIN" variant="filled" />

// Outlined - transparent background with colored border
<RoleBadge role="SUPER_ADMIN" variant="outlined" />

// Gradient - gradient background
<RoleBadge role="MASTER_ADMIN" variant="gradient" />
```

### Customization Options

```tsx
// Without icon
<RoleBadge role="ADMIN" showIcon={false} />

// Without tooltip
<RoleBadge role="SUPER_ADMIN" showTooltip={false} />

// Combine options
<RoleBadge 
  role="MASTER_ADMIN" 
  size="large" 
  variant="gradient" 
  showIcon={true} 
  showTooltip={true} 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `string` | `undefined` | The admin role (ADMIN, SUPER_ADMIN, MASTER_ADMIN) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the badge |
| `showTooltip` | `boolean` | `true` | Whether to show tooltip with permissions |
| `showIcon` | `boolean` | `true` | Whether to show role icon |
| `variant` | `'filled' \| 'outlined' \| 'gradient'` | `'filled'` | Visual style variant |

## Role Configurations

### MASTER_ADMIN
- **Color**: Purple (#9333EA)
- **Gradient**: Purple to Gold
- **Icon**: 👑
- **Label**: Master Admin
- **Permissions**: Full System Access, User Management, System Configuration, All Admin Functions

### SUPER_ADMIN
- **Color**: Blue (#3B82F6)
- **Gradient**: Blue to Purple
- **Icon**: ⭐
- **Label**: Super Admin
- **Permissions**: User Management, Complaint Management, Analytics Access, Report Generation

### ADMIN
- **Color**: Green (#10B981)
- **Gradient**: Green to Dark Green
- **Icon**: 🛡️
- **Label**: Admin
- **Permissions**: Complaint Management, Basic Analytics, User Support

## Responsive Behavior

The component automatically adapts to different screen sizes:

- **Mobile (< 640px)**: 
  - Large badges are automatically reduced to medium size
  - Font sizes are slightly reduced for better fit
  - Tooltip placement changes to bottom for better visibility
  - Touch-optimized tooltip delays (instant show, 3s hide)

- **Tablet (640px - 1024px)**: 
  - Standard sizing maintained
  - Optimized spacing

- **Desktop (> 1024px)**: 
  - Full sizing and features
  - Tooltip placement on top

## Accessibility

- ✅ Proper ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ High contrast color schemes
- ✅ Touch-friendly tap targets
- ✅ Descriptive tooltips

## Examples

### In a Profile Card

```tsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <Avatar src={user.avatar} />
  <Box>
    <Typography variant="h6">{user.name}</Typography>
    <RoleBadge role={user.role} size="small" variant="gradient" />
  </Box>
</Box>
```

### In a User List

```tsx
<TableCell>
  <RoleBadge role={user.role} size="small" />
</TableCell>
```

### In a Header

```tsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography>{user.name}</Typography>
  <RoleBadge role={user.role} size="medium" variant="outlined" />
</Box>
```

## Testing

A demo component is available at `RoleBadge.demo.tsx` that showcases all features and variants. Import and render it in any page to see the component in action:

```tsx
import RoleBadgeDemo from '@/components/common/RoleBadge/RoleBadge.demo';

// In your component
<RoleBadgeDemo />
```

## Requirements Validation

This component satisfies the following requirements from the Dynamic Admin Profile System spec:

- ✅ **Requirement 6.1**: Distinctive color scheme for MASTER_ADMIN
- ✅ **Requirement 6.2**: Distinctive color scheme for SUPER_ADMIN
- ✅ **Requirement 6.3**: Distinctive color scheme for ADMIN
- ✅ **Requirement 6.4**: Consistent styling across all profile views
- ✅ **Requirement 6.5**: Tooltip explaining role permissions on hover

## Related Files

- `roleConfig.ts` - Role configuration and utility functions
- `RoleBadge.demo.tsx` - Interactive demo component
- `README.md` - This documentation file
