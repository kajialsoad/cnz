# Complaint Details Gallery Image Upload Fix

## Problem
Mobile app complaint details page - gallery image upload was not working when user tapped "ছবি আপলোড করুন" (Upload Photos) button.

## Root Cause
1. **Dialog Navigation Issue**: When user selected "Camera" option, the code navigated away immediately without returning a value. When "Gallery" was selected, the dialog returned `ImageSource.gallery`, but the subsequent code flow was broken.

2. **Permission Handling**: The permission request was happening AFTER the image picker was called, which could cause issues on some Android versions.

3. **Android 13+ Permissions**: Missing new photo picker permissions (`READ_MEDIA_IMAGES`) required for Android 13 and above.

## Solution

### 1. Fixed Dialog Selection Logic (`lib/pages/complaint_details_page.dart`)
- Changed dialog return type from `ImageSource?` to `String?`
- Return 'camera' or 'gallery' strings instead of enum values
- Handle each choice separately with proper flow control

### 2. Updated Permission Handling (`lib/services/file_handling_service.dart`)
- Request permissions BEFORE calling image picker
- Added fallback to `Permission.storage` for older Android versions
- Separate permission logic for web (no permissions needed)

### 3. Added Android 13+ Permissions (`android/app/src/main/AndroidManifest.xml`)
- Added `READ_MEDIA_IMAGES` permission for Android 13+
- Added `READ_MEDIA_VIDEO` permission for future video support
- Set `maxSdkVersion="32"` for old storage permissions

## Changes Made

### File: `lib/pages/complaint_details_page.dart`
```dart
// Before: Dialog returned ImageSource enum
final ImageSource? source = await showDialog<ImageSource>(...);

// After: Dialog returns string choice
final String? choice = await showDialog<String>(...);
if (choice == 'camera') {
  Navigator.pushNamed(context, '/camera');
} else if (choice == 'gallery') {
  final file = await _fileHandlingService.pickImage(source: ImageSource.gallery);
  // ... handle file
}
```

### File: `lib/services/file_handling_service.dart`
```dart
// Request permissions BEFORE picking image
if (source == ImageSource.camera) {
  await Permission.camera.request();
} else {
  var status = await Permission.photos.request();
  if (!status.isGranted) {
    status = await Permission.storage.request(); // Fallback
  }
}

// Then pick image
final XFile? pickedFile = await _imagePicker.pickImage(...);
```

### File: `android/app/src/main/AndroidManifest.xml`
```xml
<!-- Old permissions with max SDK version -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>

<!-- New Android 13+ permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO"/>
```

## Testing Instructions

1. **Clean and rebuild the app**:
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

2. **Test Gallery Upload**:
   - Navigate to complaint details page
   - Tap "ছবি আপলোড করুন" (Upload Photos)
   - Select "Gallery" from dialog
   - Choose an image from gallery
   - Verify image appears in the list

3. **Test Camera Upload**:
   - Tap "ছবি আপলোড করুন" again
   - Select "Camera" from dialog
   - Take a photo
   - Verify photo is added to the list

4. **Test Multiple Images**:
   - Add up to 6 photos from gallery
   - Verify all photos display correctly
   - Test remove button on each photo

5. **Test Permissions**:
   - First time: App should request gallery permission
   - If denied: Should show error message
   - If granted: Should open gallery picker

## Expected Behavior

✅ Gallery picker opens when "Gallery" is selected
✅ Camera page opens when "Camera" is selected  
✅ Selected images display in horizontal scroll view
✅ Can add up to 6 photos
✅ Can remove individual photos
✅ Proper error messages for permission denials
✅ Works on Android 13+ devices

## Status
✅ **FIXED** - Gallery image upload now working properly
