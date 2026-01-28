import 'api_config.dart';

/// Helper class for handling and fixing URLs from the backend
class UrlHelper {
  /// Fix URL by replacing localhost with the actual server IP from ApiConfig
  /// This is needed because the server stores URLs with localhost
  /// which doesn't work on Android devices
  /// 
  /// Note: Cloudinary URLs (res.cloudinary.com) are returned as-is
  /// since they're already full HTTPS URLs
  static String fixUrl(String url) {
    if (url.isEmpty) return url;
    
    // Cloudinary URLs are already full HTTPS URLs, return as-is
    if (url.contains('cloudinary.com')) {
      return url;
    }
    
    // If URL contains localhost, replace it with the actual IP
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', '192.168.0.100');
    }
    
    // If URL contains 127.0.0.1, replace it with the actual IP
    if (url.contains('127.0.0.1')) {
      return url.replaceAll('127.0.0.1', '192.168.0.100');
    }
    
    return url;
  }
  
  /// Get full URL for an image
  /// Handles both Cloudinary URLs (full HTTPS) and local server paths
  static String getImageUrl(String imageUrl) {
    if (imageUrl.isEmpty) return '';
    
    // If it's already a full URL (http/https), fix and return
    if (imageUrl.startsWith('http')) {
      return fixUrl(imageUrl);
    }
    
    // Otherwise, it's a relative path - prepend base URL
    return '${ApiConfig.baseUrl}$imageUrl';
  }
  
  /// Get full URL for an audio file
  /// Handles both Cloudinary URLs (full HTTPS) and local server paths
  static String getAudioUrl(String audioUrl) {
    if (audioUrl.isEmpty) return '';
    
    // If it's already a full URL (http/https), fix and return
    if (audioUrl.startsWith('http')) {
      return fixUrl(audioUrl);
    }
    
    // Otherwise, it's a relative path - prepend base URL
    return '${ApiConfig.baseUrl}$audioUrl';
  }
}
