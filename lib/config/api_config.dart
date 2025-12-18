import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  // Get production URL from environment variable (set this to your Render/Railway URL)
  static String get productionUrl => 
    dotenv.env['PRODUCTION_URL'] ?? 'http://localhost:4000';
  
  // Local development URLs
  static String get localWebUrl => 
    dotenv.env['LOCAL_WEB_URL'] ?? 'http://127.0.0.1:4000';
  static String get localAndroidUrl => 
    dotenv.env['LOCAL_ANDROID_URL'] ?? 'http://192.168.0.100:4000';
  static String get localIosUrl => 
    dotenv.env['LOCAL_IOS_URL'] ?? 'http://localhost:4000';
  
  // Check if we should use production server
  static bool get useProduction {
    final envValue = dotenv.env['USE_PRODUCTION']?.toLowerCase();
    return envValue == 'true' || kReleaseMode;
  }
  
  // Get the appropriate base URL based on environment variable and platform
  static String get baseUrl {
    if (useProduction) {
      // Production mode - use production server
      return productionUrl;
    } else {
      // Development mode - use platform-specific local URLs
      if (kIsWeb) {
        return localWebUrl;
      } else if (defaultTargetPlatform == TargetPlatform.android) {
        return localAndroidUrl;
      } else {
        return localIosUrl;
      }
    }
  }
  
  // API endpoints
  static const String authRegister = '/api/auth/register';
  static const String authLogin = '/api/auth/login';
  static const String authLogout = '/api/auth/logout';
  static const String authRefresh = '/api/auth/refresh';
  static const String authMe = '/api/auth/me';
  
  // Timeout duration - optimized for local development
  static const Duration timeout = Duration(seconds: 15); // Reduced for faster failure detection
  static const Duration fallbackTimeout = Duration(seconds: 10); // Increased for reliable local connections
}
