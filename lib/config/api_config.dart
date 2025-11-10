import 'package:flutter/foundation.dart';

class ApiConfig {
  // Change this to your production API URL when deploying
  static const String productionUrl = 'https://your-domain.com';
  
  // Local development URLs
  static const String localWebUrl = 'http://localhost:4000';
  static const String localAndroidUrl = 'http://192.168.0.100:4000'; // Real Android device - use your computer's IP
  static const String localIosUrl = 'http://localhost:4000'; // iOS simulator
  
  // Get the appropriate base URL based on platform and environment
  static String get baseUrl {
    if (kReleaseMode) {
      // Production mode
      return productionUrl;
    } else {
      // Development mode
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
  
  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
}
