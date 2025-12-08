# Profile Context and Hooks

This document describes the Profile Context system and its associated hooks for managing user profile data in the Clean Care Admin panel.

## Overview

The Profile Context provides a centralized state management solution for user profile data with the following features:

- **Global State**: Profile data accessible throughout the application
- **Caching**: Reduces API calls by caching profile data for 5 minutes
- **Cross-Tab Synchronization**: Profile updates sync across browser tabs
- **Error Handling**: Comprehensive error handling and loading states
- **Type Safety**: Full TypeScript support with strict typing

## Architecture

```
ProfileContext
├── ProfileProvider (Context Provider)
├── useProfile (Main Hook)
├── useProfileUpdate (Update Hook)
└── useAvatarUpload (Avatar Upload Hook)
```

## Setup

### 1. Wrap your app with ProfileProvider

```tsx
import { ProfileProvider } from './contexts/ProfileContext';

function App() {
  return (
    <ProfileProvider>
      {/* Your app components */}
    </ProfileProvider>
  );
}
```

### 2. Use the hooks in your components

```tsx
import { useProfile } from './contexts/ProfileContext';

function MyComponent() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Welcome, {profile?.firstName}!</div>;
}
```

## API Reference

### ProfileContext

#### ProfileProvider

The main context provider that wraps your application.

**Props:**
- `children: ReactNode` - Child components

**Example:**
```tsx
<ProfileProvider>
  <App />
</ProfileProvider>
```

### useProfile Hook

Main hook for accessing profile data and operations.

**Returns:**
```typescript
{
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  clearError: () => void;
}
```

**Example:**
```tsx
function ProfileDisplay() {
  const { profile, isLoading, refreshProfile } = useProfile();

  return (
    <div>
      <h1>{profile?.firstName} {profile?.lastName}</h1>
      <button onClick={refreshProfile}>Refresh</button>
    </div>
  );
}
```

### useProfileUpdate Hook

Specialized hook for updating profile data with validation.

**Parameters:**
```typescript
{
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

**Returns:**
```typescript
{
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  isUpdating: boolean;
  updateError: string | null;
  clearUpdateError: () => void;
}
```

**Example:**
```tsx
function ProfileEditForm() {
  const { updateProfile, isUpdating, updateError } = useProfileUpdate({
    onSuccess: () => console.log('Profile updated!'),
    onError: (error) => console.error('Update failed:', error),
  });

  const handleSubmit = async (data) => {
    await updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {updateError && <div className="error">{updateError}</div>}
      <button disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

### useAvatarUpload Hook

Specialized hook for uploading avatar images with validation and preview.

**Parameters:**
```typescript
{
  maxSizeInMB?: number;        // Default: 5
  allowedTypes?: string[];     // Default: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}
```

**Returns:**
```typescript
{
  uploadAvatar: (file: File) => Promise<string>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  previewUrl: string | null;
  clearUploadError: () => void;
  generatePreview: (file: File) => void;
  clearPreview: () => void;
}
```

**Example:**
```tsx
function AvatarUploader() {
  const {
    uploadAvatar,
    isUploading,
    uploadProgress,
    previewUrl,
    generatePreview,
    clearPreview,
  } = useAvatarUpload({
    maxSizeInMB: 5,
    onSuccess: (url) => console.log('Avatar uploaded:', url),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      generatePreview(file);
    }
  };

  const handleUpload = async () => {
    const file = /* get file */;
    await uploadAvatar(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} accept="image/*" />
      {previewUrl && <img src={previewUrl} alt="Preview" />}
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
      </button>
    </div>
  );
}
```

## Types

### UserProfile

```typescript
interface UserProfile {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  emailVerified: boolean;
  phoneVerified: boolean;
  ward?: string;
  zone?: string;
  address?: string;
  cityCorporationCode?: string;
  thanaId?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

### ProfileUpdateData

```typescript
interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  ward?: string;
  zone?: string;
  address?: string;
}
```

## Caching

The Profile Context implements intelligent caching:

- **Cache Duration**: 5 minutes
- **Cache Key**: `cc_profile_cache`
- **Automatic Invalidation**: Cache is cleared when expired
- **Manual Refresh**: Call `refreshProfile()` to force refresh

## Cross-Tab Synchronization

Profile updates are automatically synchronized across browser tabs:

- Uses `localStorage` events for communication
- Updates propagate instantly to all open tabs
- No polling required

## Error Handling

All operations include comprehensive error handling:

```tsx
function ProfileComponent() {
  const { profile, error, clearError } = useProfile();

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  return <div>{/* Normal content */}</div>;
}
```

## Best Practices

1. **Use ProfileProvider at the root level**: Wrap your entire app to ensure profile data is available everywhere.

2. **Leverage caching**: The context automatically caches data, so don't worry about excessive API calls.

3. **Handle loading states**: Always check `isLoading` before rendering profile data.

4. **Handle errors gracefully**: Display user-friendly error messages and provide retry options.

5. **Use specialized hooks**: Use `useProfileUpdate` and `useAvatarUpload` for specific operations instead of the generic `useProfile` hook.

6. **Validate before updating**: The hooks include built-in validation, but add additional validation in your forms.

7. **Clean up previews**: Always call `clearPreview()` when unmounting components that use avatar previews.

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 5.1**: Profile updates sync across application state ✓
- **Requirement 5.2**: Sidebar display refreshes on profile update ✓
- **Requirement 5.3**: Header display refreshes on profile update ✓
- **Requirement 5.4**: Profile persists across login sessions ✓
- **Requirement 5.5**: Cross-tab synchronization implemented ✓

## Testing

Example test cases:

```typescript
describe('ProfileContext', () => {
  it('should load profile from cache on mount', () => {
    // Test cache loading
  });

  it('should refresh profile from API', async () => {
    // Test API refresh
  });

  it('should update profile successfully', async () => {
    // Test profile update
  });

  it('should sync updates across tabs', () => {
    // Test cross-tab sync
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

## Troubleshooting

### Profile not loading

1. Check if ProfileProvider is wrapping your app
2. Verify API endpoints are correct
3. Check browser console for errors
4. Verify authentication token is valid

### Updates not syncing

1. Check localStorage is enabled
2. Verify both tabs are using the same domain
3. Check browser console for sync errors

### Cache not working

1. Verify localStorage is enabled
2. Check cache duration settings
3. Clear browser cache and try again

## Future Enhancements

- [ ] Add optimistic updates
- [ ] Implement retry logic for failed requests
- [ ] Add profile change history
- [ ] Implement profile comparison
- [ ] Add profile export functionality
