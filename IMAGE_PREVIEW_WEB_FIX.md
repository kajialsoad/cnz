# Flutter Web Image Preview Fix - "Mock" Issue

## Problem
When selecting images from gallery on Flutter web, the preview shows "Mock" text instead of the actual image.

## Root Cause
`Image.file()` doesn't work on Flutter web because web browsers don't have direct file system access. Flutter shows a "Mock" placeholder instead.

## Solution

### For Image Preview Widget

Replace `Image.file()` with platform-specific code:

```dart
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';

// Store XFile instead of File for web compatibility
List<XFile> _selectedImages = [];

// Display image widget
Widget _buildImagePreview(XFile imageFile, int index) {
  return FutureBuilder<Uint8List>(
    future: imageFile.readAsBytes(),
    builder: (context, snapshot) {
      if (snapshot.hasData) {
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: kIsWeb
                  ? Image.memory(
                      snapshot.data!,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    )
                  : Image.file(
                      File(imageFile.path),
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
            ),
            // Remove button
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => _removeImage(index),
                child: Container(
                  padding: EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
            ),
          ],
        );
      }
      return Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    },
  );
}

// Pick images method
Future<void> _pickImages() async {
  final ImagePicker picker = ImagePicker();
  final List<XFile> images = await picker.pickMultiImage();
  
  if (images.isNotEmpty) {
    setState(() {
      _selectedImages.addAll(images);
    });
  }
}

// Remove image method
void _removeImage(int index) {
  setState(() {
    _selectedImages.removeAt(index);
  });
}
```

### Alternative: Simpler Approach

If you don't want to use FutureBuilder:

```dart
Widget _buildImagePreview(XFile imageFile, int index) {
  return Stack(
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: kIsWeb
            ? Image.network(
                imageFile.path, // XFile.path on web is a blob URL
                width: 100,
                height: 100,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 100,
                    height: 100,
                    color: Colors.grey[300],
                    child: Icon(Icons.image, color: Colors.grey),
                  );
                },
              )
            : Image.file(
                File(imageFile.path),
                width: 100,
                height: 100,
                fit: BoxFit.cover,
              ),
      ),
      // Remove button
      Positioned(
        top: 4,
        right: 4,
        child: GestureDetector(
          onTap: () => _removeImage(index),
          child: Container(
            padding: EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.red,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.close,
              color: Colors.white,
              size: 16,
            ),
          ),
        ),
      ),
    ],
  );
}
```

## Implementation Steps

1. Find the widget that displays selected images (likely in a complaint creation page)
2. Replace `Image.file()` with the platform-specific code above
3. Store `XFile` objects instead of `File` objects
4. Use `Image.memory()` for web and `Image.file()` for mobile

## Testing

1. Run on web: `flutter run -d chrome`
2. Select images from gallery
3. Verify images display correctly (not "Mock")
4. Test on mobile to ensure it still works

## Note

The actual upload to server will work fine - this is only a preview issue on web.
