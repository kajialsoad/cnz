/// Cloudinary URL transformation helper
/// 
/// This utility provides methods to transform Cloudinary URLs
/// for optimized image loading with different sizes and formats.
class CloudinaryHelper {
  /// Check if a URL is a Cloudinary URL
  static bool isCloudinaryUrl(String? url) {
    if (url == null || url.isEmpty) return false;
    return url.contains('res.cloudinary.com') && url.contains('/upload/');
  }

  /// Transform a Cloudinary URL with custom transformations
  /// 
  /// Example:
  /// ```dart
  /// final thumbnail = CloudinaryHelper.transformUrl(
  ///   originalUrl,
  ///   'w_200,h_200,c_fill,q_auto,f_auto'
  /// );
  /// ```
  static String transformUrl(String url, String transformation) {
    if (!isCloudinaryUrl(url)) {
      return url; // Return original URL if not a Cloudinary URL
    }

    // Insert transformation into the URL
    // Example: https://res.cloudinary.com/demo/image/upload/v123/sample.jpg
    // Becomes: https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v123/sample.jpg
    final uploadIndex = url.indexOf('/upload/');
    if (uploadIndex == -1) {
      return url; // Return original if upload path not found
    }

    final beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
    final afterUpload = url.substring(uploadIndex + 8);

    return '$beforeUpload$transformation/$afterUpload';
  }

  /// Get thumbnail URL (200x200) with automatic format and quality optimization
  /// 
  /// Perfect for list views and small previews
  static String getThumbnailUrl(String url, {int width = 200, int height = 200}) {
    final transformation = 'w_$width,h_$height,c_fill,q_auto,f_auto';
    return transformUrl(url, transformation);
  }

  /// Get medium-sized URL (800x600) with automatic format and quality optimization
  /// 
  /// Perfect for detail views and modal displays
  static String getMediumUrl(String url) {
    const transformation = 'w_800,h_600,c_limit,q_auto,f_auto';
    return transformUrl(url, transformation);
  }

  /// Get optimized URL with custom width and quality
  /// 
  /// Perfect for calendar images and detail views
  static String getOptimizedImageUrl(
    String url, {
    int? width,
    int? height,
    int quality = 90,
  }) {
    final parts = <String>[];
    
    if (width != null) parts.add('w_$width');
    if (height != null) parts.add('h_$height');
    parts.add('c_limit');
    parts.add('q_$quality');
    parts.add('f_auto');
    
    final transformation = parts.join(',');
    return transformUrl(url, transformation);
  }

  /// Get optimized URL with automatic format (WebP) and quality optimization
  /// 
  /// Maintains original dimensions but optimizes format and quality
  static String getOptimizedUrl(String url) {
    const transformation = 'q_auto,f_auto';
    return transformUrl(url, transformation);
  }

  /// Get URL for a specific width while maintaining aspect ratio
  /// 
  /// Useful for responsive layouts
  static String getResponsiveUrl(String url, int width) {
    final transformation = 'w_$width,c_limit,q_auto,f_auto';
    return transformUrl(url, transformation);
  }

  /// Get URL with custom dimensions
  /// 
  /// Allows full control over width, height, and crop mode
  static String getCustomSizeUrl(
    String url, {
    int? width,
    int? height,
    String cropMode = 'limit', // limit, fill, fit, scale, etc.
  }) {
    final parts = <String>[];
    
    if (width != null) parts.add('w_$width');
    if (height != null) parts.add('h_$height');
    parts.add('c_$cropMode');
    parts.add('q_auto');
    parts.add('f_auto');
    
    final transformation = parts.join(',');
    return transformUrl(url, transformation);
  }

  /// Process a list of image URLs to use appropriate sizes
  /// 
  /// Returns a map with different size variants
  static Map<String, String> getImageVariants(String url) {
    return {
      'thumbnail': getThumbnailUrl(url),
      'medium': getMediumUrl(url),
      'optimized': getOptimizedUrl(url),
      'original': url,
    };
  }
}
