import 'api_config.dart';

/// Helper class for handling and fixing URLs from the backend
class UrlHelper {
  /// Fix URL by replacing localhost with the actual server IP
  /// This is needed because the server stores URLs with localhost
  /// which doesn't work on Android devices
  static String fixUrl(String url) {
    if (url.isEmpty) return url;
    
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
  static String getImageUrl(String imageUrl) {
    if (imageUrl.isEmpty) return '';
    
    if (imageUrl.startsWith('http')) {
      return fixUrl(imageUrl);
    }
    
    return '${ApiConfig.baseUrl}$imageUrl';
  }
  
  /// Get full URL for an audio file
  static String getAudioUrl(String audioUrl) {
    if (audioUrl.isEmpty) return '';
    
    if (audioUrl.startsWith('http')) {
      return fixUrl(audioUrl);
    }
    
    return '${ApiConfig.baseUrl}$audioUrl';
  }
}
