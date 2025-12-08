# AvatarUpload Component

A comprehensive avatar upload component with drag-and-drop support, image preview, validation, and Cloudinary integration.

## Features

- ✅ **Drag and Drop**: Drag image files directly onto the avatar
- ✅ **Click to Browse**: Click the camera icon to select files
- ✅ **Image Preview**: Preview images before uploading
- ✅ **File Validation**: Validates file type and size
- ✅ **Upload Progress**: Shows upload progress indicator
- ✅ **Cloudinary Integration**: Uploads to Cloudinary cloud storage
- ✅ **Responsive Design**: Adapts to mobile, tablet, and desktop screens
- ✅ **Error Handling**: Displays user-friendly error messages
- ✅ **Accessibility**: Full keyboard navigation and ARIA labels

## Requirements Validation

This component satisfies the following requirements:

- **4.1**: Click on avatar provides option to upload new image ✅
- **4.2**: Validates file is an image format (jpg, png, webp) ✅
- **4.3**: Uploads image to cloud storage and updates profile ✅
- **4.4**: Displays new avatar immediately on success ✅
- **4.5**: Displays error message and retains previous avatar on failure ✅

## Usage

### Basic Usage

```tsx
import AvatarUpload from '../components/common/AvatarUpload';

function ProfilePage() {
  const handleUpload = async (url: string) => {
    // Update profile with new avatar URL
    await updateProfile({ avatar: url });
  };

  return (
    <AvatarUpload
      currentAvatar={user.avatar}
      onUpload={handleUpload}
      initials={`${user.firstName[0]}${user.lastName[0]}`}
    />
  );
}
```

### With Custom Configuration

```tsx
<AvatarUpload
  currentAvatar={user.avatar}
  onUpload={handleUpload}
  size={150}
  initials="JD"
  maxSizeInMB={10}
  allowedTypes={['image/jpeg', 'image/png']}
  disabled={isLoading}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentAvatar` | `string` | `undefined` | Current avatar URL |
| `onUpload` | `(url: string) => Promise<void>` | **Required** | Callback when upload completes |
| `size` | `number` | `120` | Avatar size in pixels |
| `initials` | `string` | `'?'` | User's initials for default avatar |
| `disabled` | `boolean` | `false` | Whether the component is disabled |
| `maxSizeInMB` | `number` | `5` | Maximum file size in MB |
| `allowedTypes` | `string[]` | `['image/jpeg', 'image/jpg', 'image/png', 'image/webp']` | Allowed file types |

## Features in Detail

### Drag and Drop

Users can drag image files from their file system and drop them onto the avatar. The component provides visual feedback during the drag operation with a dashed border and upload icon overlay.

### Click to Browse

Clicking the camera icon button opens the native file picker dialog. This provides an alternative to drag-and-drop for users who prefer traditional file selection.

### Image Preview

Before uploading, users see a preview modal showing:
- Large preview of the selected image
- Upload and Cancel buttons
- Upload progress indicator
- Error messages if validation fails

### File Validation

The component validates:
- **File Type**: Only allows image formats (JPEG, PNG, WebP by default)
- **File Size**: Enforces maximum file size limit (5MB by default)
- **Error Messages**: Shows clear error messages for validation failures

### Upload Progress

During upload:
- Circular progress indicator overlays the avatar
- Percentage display shows upload progress
- UI is disabled to prevent multiple uploads

### Responsive Design

The component adapts to different screen sizes:
- **Mobile**: Smaller avatar size, touch-optimized buttons
- **Tablet**: Medium avatar size, optimized spacing
- **Desktop**: Full-size avatar, hover effects

### Error Handling

Comprehensive error handling for:
- Invalid file types
- File size exceeds limit
- Network errors during upload
- Server errors
- Cloudinary upload failures

## Integration with Profile System

The AvatarUpload component integrates seamlessly with the profile system:

1. Uses `useAvatarUpload` hook for upload logic
2. Calls `onUpload` callback with Cloudinary URL
3. Parent component updates profile with new avatar
4. Profile context refreshes to show new avatar everywhere

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- Focus management for modal
- High contrast mode support
- Touch-friendly on mobile devices

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch gestures

## Testing

### Manual Testing Checklist

- [ ] Click camera icon opens file picker
- [ ] Drag and drop image onto avatar
- [ ] Preview modal shows selected image
- [ ] Upload button uploads to Cloudinary
- [ ] Progress indicator shows during upload
- [ ] Success updates avatar immediately
- [ ] Invalid file type shows error
- [ ] File too large shows error
- [ ] Cancel button closes preview
- [ ] Works on mobile devices
- [ ] Works on tablet devices
- [ ] Keyboard navigation works

### Test Scenarios

1. **Valid Upload**: Select valid image → Preview → Upload → Success
2. **Invalid Type**: Select PDF file → Error message
3. **File Too Large**: Select 10MB image → Error message
4. **Cancel Preview**: Select image → Preview → Cancel
5. **Network Error**: Disconnect network → Upload → Error message
6. **Drag and Drop**: Drag image → Drop → Preview → Upload

## Known Limitations

- Maximum file size is configurable but defaults to 5MB
- Only supports image formats (no GIF animations)
- Requires Cloudinary configuration on backend
- Preview modal doesn't support image cropping (future enhancement)

## Future Enhancements

- [ ] Image cropping before upload
- [ ] Multiple image selection
- [ ] Webcam capture support
- [ ] GIF animation support
- [ ] Image filters and effects
- [ ] Batch upload support

## Related Components

- `useAvatarUpload` - Hook for upload logic
- `ProfileContext` - Profile state management
- `profileService` - API service for uploads
- `RoleBadge` - Role display component

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/dynamic-admin-profile/design.md`
- Requirements: `.kiro/specs/dynamic-admin-profile/requirements.md`
- Integration guide: `.kiro/specs/dynamic-admin-profile/INTEGRATION_GUIDE.md`
