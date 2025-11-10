import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _accessTokenKey = 'accessToken';
  static const String _refreshTokenKey = 'refreshToken';

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final sp = await SharedPreferences.getInstance();
    final accessToken = sp.getString(_accessTokenKey);
    return accessToken != null && accessToken.isNotEmpty;
  }

  // Get access token
  static Future<String?> getAccessToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString(_accessTokenKey);
  }

  // Get refresh token
  static Future<String?> getRefreshToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString(_refreshTokenKey);
  }

  // Save tokens
  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_accessTokenKey, accessToken);
    await sp.setString(_refreshTokenKey, refreshToken);
  }

  // Clear tokens (logout)
  static Future<void> clearTokens() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_accessTokenKey);
    await sp.remove(_refreshTokenKey);
  }

  // Check if token exists and is valid (basic check)
  static Future<bool> hasValidToken() async {
    final token = await getAccessToken();
    if (token == null || token.isEmpty) return false;
    
    // You can add JWT expiry check here if needed
    // For now, just check if token exists
    return true;
  }
}
