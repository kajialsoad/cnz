# ProfileEditForm Component

A comprehensive form component for editing user profile information with validation, avatar upload integration, and error handling.

## Features

- ✅ Form fields for first name and last name (required)
- ✅ Optional fields for ward, zone, and address
- ✅ Real-time form validation with error messages
- ✅ Integration with AvatarUpload component
- ✅ Save and cancel buttons with loading states
- ✅ Success/error message display via Snackbars
- ✅ Read-only display of email and phone
- ✅ Responsive design for mobile, tablet, and desktop
- ✅ Detects and prevents saving when no changes are made

## Usage

```tsx
import ProfileEditForm from './components/common/ProfileEditForm/ProfileEditForm';
import { useProfile } from './contexts/ProfileContext';

function MyComponent() {
  const { profile, updateProfile } = useProfile();

  const handleSave = async (data: ProfileUpdateData) => {
    await updateProfile(data);
  };

  const handleCancel = () => {
    console.log('Edit cancelled');
  };

  if (!profile) return null;

  return (
    <ProfileEditForm
      initialData={profile}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initialData` | `UserProfile` | Yes | Initial profile data to populate the form |
| `onSave` | `(data: ProfileUpdateData) => Promise<void>` | Yes | Callback when save is successful |
| `onCancel` | `() => void` | Yes | Callback when cancel is clicked |

## Validation Rules

### First Name
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, and apostrophes allowed

### Last Name
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, and apostrophes allowed

### Ward (Optional)
- Maximum 20 characters

### Zone (Optional)
- Maximum 20 characters

### Address (Optional)
- Maximum 200 characters
- Multiline text area

## Form Behavior

1. **Validation**: Fields are validated on blur and on form submission
2. **Error Display**: Inline error messages appear below each field
3. **Change Detection**: Save button is disabled when no changes are made
4. **Loading States**: Buttons show loading indicators during save operation
5. **Success Feedback**: Success snackbar appears after successful save
6. **Error Feedback**: Error snackbar appears if save fails

## Integration with ProfileModal

The ProfileEditForm can be integrated into the ProfileModal by adding an edit mode:

```tsx
const [isEditMode, setIsEditMode] = useState(false);

// In ProfileModal render:
{isEditMode ? (
  <ProfileEditForm
    initialData={profile}
    onSave={async (data) => {
      await updateProfile(data);
      setIsEditMode(false);
    }}
    onCancel={() => setIsEditMode(false)}
  />
) : (
  // ... normal profile display
)}
```

## Requirements Satisfied

- **3.1**: Editable fields for first name and last name ✅
- **3.2**: Validation that names are not empty ✅
- **3.3**: API request to update profile on save ✅
- **3.4**: Success message and refresh on successful update ✅
- **3.5**: Error message display on failure ✅
- **7.3**: Validation of all required fields ✅
- **7.4**: Specific validation error messages ✅
- **7.5**: Authentication token verification (handled by service layer) ✅

## Accessibility

- All form fields have proper labels
- Error messages are associated with their fields
- Keyboard navigation is fully supported
- Focus management is handled automatically
- Color contrast meets WCAG standards

## Responsive Design

- **Mobile**: Full-width fields, stacked buttons
- **Tablet**: Optimized spacing and layout
- **Desktop**: Side-by-side buttons, larger form

## Testing

To test the component:

1. Fill in valid data and submit
2. Try to submit with empty required fields
3. Try to submit with invalid characters
4. Try to submit without making changes
5. Test avatar upload integration
6. Test cancel functionality
7. Test on different screen sizes
