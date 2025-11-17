# Image Loading Manual Test Guide

## Overview
This guide provides step-by-step instructions to manually test image loading functionality in the Clean Care mobile app's complaint system.

## Prerequisites
- Flutter app running on device/emulator
- Backend server running at configured URL
- At least one complaint with images in the database
- Network connectivity

## Test Environment Setup

### 1. Verify Backend Configuration
Check that the API base URL is correctly configured:
- File: `lib/config/api_config.dart`
- For Android emulator: `http://192.168.0.100:4000`
- For iOS simulator: `http://localhost:4000`
- For web: `http://localhost:4000`

### 2. Verify Test Data
Ensure you have complaints with images in the database:
```bash
# Run from server directory
node test-complaint-list.js
```

Expected: At least one complaint should have `imageUrls` or `imageUrl` field populated.

## Test Cases

### Test Case 1: Image Thumbnail Display in Complaint List

**Objective**: Verify that image thumbnails are displayed correctly in the complaint list.

**Steps**:
1. Launch the Flutter app
2. Login with test credentials
3. Navigate to "My Complaints" page
4. Scroll through the complaint list

**Expected Results**:
- ✅ Complaints with images show an image icon indicator
- ✅ Image count is displayed next to the icon (e.g., "2" for 2 images)
- ✅ No image icon appears for complaints without images
- ✅ List loads smoothly without blocking

**Pass Criteria**:
- [ ] Image indicators appear for complaints with images
- [ ] Image count is accurate
- [ ] No crashes or errors in console

---

### Test Case 2: Image Loading in Detail View

**Objective**: Verify that images load correctly in the complaint detail view.

**Steps**:
1. From the complaint list, tap on a complaint that has images
2. Wait for the detail page to load
3. Observe the "Images" section

**Expected Results**:
- ✅ "Images" section appears with image count badge
- ✅ Images are displayed in a horizontal scrollable list
- ✅ Each image shows a loading indicator while loading
- ✅ Images render correctly after loading
- ✅ Images are properly sized (120x120 thumbnails)
- ✅ Images have rounded corners (8px border radius)

**Pass Criteria**:
- [ ] Images section is visible
- [ ] All images load successfully
- [ ] Loading indicators appear during load
- [ ] Images are properly formatted

**Screenshot Location**: `test/screenshots/image_detail_view.png`

---

### Test Case 3: Full-Screen Image Viewer

**Objective**: Verify that tapping an image opens the full-screen viewer.

**Steps**:
1. In the complaint detail view, tap on any image thumbnail
2. Observe the full-screen image viewer
3. Swipe left/right to view other images (if multiple)
4. Pinch to zoom in/out
5. Tap the close button to return

**Expected Results**:
- ✅ Full-screen viewer opens with black background
- ✅ Image counter shows current position (e.g., "1 / 3")
- ✅ Image is centered and fits the screen
- ✅ Swiping navigates between images
- ✅ Pinch-to-zoom works correctly
- ✅ Close button returns to detail view
- ✅ Haptic feedback on tap

**Pass Criteria**:
- [ ] Full-screen viewer opens correctly
- [ ] Image navigation works
- [ ] Zoom functionality works
- [ ] Close button works
- [ ] No crashes or errors

**Screenshot Location**: `test/screenshots/fullscreen_image_viewer.png`

---

### Test Case 4: Image Loading States

**Objective**: Verify that loading states are displayed correctly.

**Steps**:
1. Clear app cache (or use slow network simulation)
2. Navigate to a complaint with images
3. Observe the loading behavior

**Expected Results**:
- ✅ Circular progress indicator appears while image loads
- ✅ Progress indicator is green (#4CAF50)
- ✅ Progress indicator is centered in the image container
- ✅ Image replaces progress indicator when loaded

**Pass Criteria**:
- [ ] Loading indicator appears
- [ ] Loading indicator has correct color
- [ ] Smooth transition from loading to loaded state

---

### Test Case 5: Image Error Handling

**Objective**: Verify that broken/missing images are handled gracefully.

**Steps**:
1. Modify a complaint in the database to have an invalid image URL
2. Navigate to that complaint's detail view
3. Observe the error handling

**Expected Results**:
- ✅ Broken image icon appears for invalid URLs
- ✅ Icon is grey and clearly indicates an error
- ✅ No app crash or blank screen
- ✅ Other valid images still load correctly

**Pass Criteria**:
- [ ] Error icon appears for broken images
- [ ] App remains stable
- [ ] Other images load normally

**Test Data**:
```sql
-- Update a complaint with invalid image URL
UPDATE complaints 
SET imageUrl = 'invalid/path/image.jpg' 
WHERE id = 13;
```

---

### Test Case 6: Multiple Image Formats

**Objective**: Verify that different image formats are supported.

**Steps**:
1. Create complaints with different image formats:
   - JPG/JPEG
   - PNG
   - WebP (if supported by backend)
2. View each complaint's images

**Expected Results**:
- ✅ All supported formats load correctly
- ✅ Image quality is maintained
- ✅ No format-specific errors

**Pass Criteria**:
- [ ] JPG images load
- [ ] PNG images load
- [ ] WebP images load (if applicable)

---

### Test Case 7: Image URL Parsing

**Objective**: Verify that different image URL formats are parsed correctly.

**Steps**:
1. Test with complaints having different URL formats:
   - Relative path: `uploads/complaints/image.jpg`
   - Absolute URL: `http://192.168.0.100:4000/uploads/complaints/image.jpg`
   - Comma-separated: `image1.jpg,image2.jpg`
   - JSON array: `["image1.jpg", "image2.jpg"]`

**Expected Results**:
- ✅ Relative paths are converted to full URLs
- ✅ Absolute URLs are used as-is
- ✅ Comma-separated strings are parsed into array
- ✅ JSON arrays are parsed correctly

**Pass Criteria**:
- [ ] All URL formats are handled
- [ ] Images load regardless of format
- [ ] No parsing errors in console

**Test Data**:
```javascript
// Test different formats in backend
const testFormats = [
  { imageUrl: 'uploads/complaints/img1.jpg' },
  { imageUrl: 'http://192.168.0.100:4000/uploads/complaints/img1.jpg' },
  { imageUrl: 'img1.jpg,img2.jpg,img3.jpg' },
  { imageUrl: '["img1.jpg", "img2.jpg"]' }
];
```

---

### Test Case 8: Image Caching

**Objective**: Verify that images are cached for better performance.

**Steps**:
1. View a complaint with images
2. Navigate away and return to the same complaint
3. Observe the loading behavior

**Expected Results**:
- ✅ Images load faster on second view
- ✅ No loading indicator on cached images
- ✅ Images display immediately from cache

**Pass Criteria**:
- [ ] Second load is faster than first
- [ ] Cached images display immediately
- [ ] No unnecessary network requests

**Note**: The app uses `cached_network_image` package for caching.

---

### Test Case 9: Image Performance with Multiple Images

**Objective**: Verify that the app handles complaints with many images efficiently.

**Steps**:
1. Create a complaint with 5+ images
2. View the complaint detail page
3. Scroll through the image list
4. Open full-screen viewer and swipe through all images

**Expected Results**:
- ✅ All images load without blocking UI
- ✅ Scrolling is smooth
- ✅ No memory issues or crashes
- ✅ Image counter updates correctly

**Pass Criteria**:
- [ ] Smooth scrolling with multiple images
- [ ] All images load successfully
- [ ] No performance degradation
- [ ] No memory warnings

---

### Test Case 10: Offline Image Handling

**Objective**: Verify behavior when viewing images offline.

**Steps**:
1. View a complaint with images while online (to cache them)
2. Turn off network connectivity
3. View the same complaint again
4. Try to view a different complaint with images

**Expected Results**:
- ✅ Cached images display correctly offline
- ✅ Uncached images show error icon
- ✅ Offline banner appears at top
- ✅ No app crash

**Pass Criteria**:
- [ ] Cached images work offline
- [ ] Uncached images show error gracefully
- [ ] Offline indicator is visible
- [ ] App remains functional

---

## Test Results Summary

### Test Execution Date: _______________
### Tester Name: _______________
### Device/Emulator: _______________
### Flutter Version: _______________

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Thumbnail Display | ⬜ Pass ⬜ Fail | |
| TC2: Detail View Loading | ⬜ Pass ⬜ Fail | |
| TC3: Full-Screen Viewer | ⬜ Pass ⬜ Fail | |
| TC4: Loading States | ⬜ Pass ⬜ Fail | |
| TC5: Error Handling | ⬜ Pass ⬜ Fail | |
| TC6: Multiple Formats | ⬜ Pass ⬜ Fail | |
| TC7: URL Parsing | ⬜ Pass ⬜ Fail | |
| TC8: Image Caching | ⬜ Pass ⬜ Fail | |
| TC9: Multiple Images | ⬜ Pass ⬜ Fail | |
| TC10: Offline Handling | ⬜ Pass ⬜ Fail | |

### Overall Result: ⬜ PASS ⬜ FAIL

---

## Known Issues

Document any issues found during testing:

1. **Issue**: 
   - **Severity**: High/Medium/Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 
   - **Screenshot**: 

---

## Code References

### Image Loading Implementation

**Complaint Detail View** (`lib/pages/complaint_detail_view_page.dart`):
```dart
Widget _buildImagesSection(List<String> imageUrls) {
  // Lines 450-520
  // Displays horizontal scrollable list of image thumbnails
  // Uses CachedNetworkImage for loading and caching
  // Shows loading indicator and error widget
}
```

**Full-Screen Viewer** (`lib/pages/complaint_detail_view_page.dart`):
```dart
class FullScreenImageViewer extends StatefulWidget {
  // Lines 850-950
  // Displays images in full-screen with swipe navigation
  // Supports pinch-to-zoom with InteractiveViewer
}
```

**Image URL Helper** (`lib/pages/complaint_detail_view_page.dart`):
```dart
String _getFullImageUrl(String imageUrl) {
  // Lines 800-805
  // Converts relative URLs to absolute URLs
  // Uses ApiConfig.baseUrl for base URL
}
```

**Complaint Model** (`lib/models/complaint.dart`):
```dart
static List<String> _parseUrlList(dynamic urls) {
  // Lines 70-90
  // Parses various URL formats (JSON array, comma-separated, etc.)
}
```

---

## Troubleshooting

### Images Not Loading

**Symptom**: Images show error icon or don't load

**Possible Causes**:
1. Backend server not running
2. Incorrect API base URL in `api_config.dart`
3. Invalid image paths in database
4. Network connectivity issues
5. CORS issues (for web)

**Solutions**:
1. Verify backend is running: `cd server && npm start`
2. Check API URL matches your network configuration
3. Verify image files exist in `server/uploads/complaints/`
4. Check network connectivity
5. For web, ensure CORS is configured in backend

### Images Load Slowly

**Symptom**: Long loading times for images

**Possible Causes**:
1. Large image file sizes
2. Slow network connection
3. No image caching

**Solutions**:
1. Compress images on backend before saving
2. Use faster network or WiFi
3. Verify `cached_network_image` package is installed

### Full-Screen Viewer Not Opening

**Symptom**: Tapping image doesn't open full-screen view

**Possible Causes**:
1. Navigation route not configured
2. Haptic feedback blocking tap
3. Image container not tappable

**Solutions**:
1. Verify InkWell is wrapping the image
2. Check haptic feedback is not causing issues
3. Ensure onTap handler is properly configured

---

## Additional Notes

- The app uses `cached_network_image` package version ^3.2.0
- Images are cached locally for offline viewing
- Maximum image size should be limited on backend (recommended: 5MB)
- Supported formats: JPG, PNG, WebP
- Image compression is recommended for better performance

---

## Appendix: Test Data Setup

### Create Test Complaint with Images

```javascript
// Run in server directory
const testComplaint = {
  title: "Test Complaint with Images",
  description: "This is a test complaint with multiple images",
  location: "Test Location",
  imageUrl: "uploads/complaints/test1.jpg,uploads/complaints/test2.jpg",
  status: "PENDING",
  userId: 1
};

// Use test-complaint-api.js to create
```

### Verify Image Files Exist

```bash
# Check if image files exist in uploads folder
ls -la server/uploads/complaints/

# Expected output: List of image files
```

---

## Sign-off

**Tester Signature**: _______________
**Date**: _______________
**Approved By**: _______________
**Date**: _______________
