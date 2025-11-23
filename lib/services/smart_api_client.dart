import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'api_client.dart';

/// Smart API Client with automatic fallback from localhost to production server
class SmartApiClient {
  static ApiClient? _primaryClient;
  static ApiClient? _fallbackClient;
  static bool _useProduction = false;
  static DateTime? _lastLocalCheck;
  
  // Check local server every 30 seconds
  static const Duration _recheckInterval = Duration(seconds: 30);

  static ApiClient get instance {
    _primaryClient ??= ApiClient(
      ApiConfig.baseUrl,
      timeout: ApiConfig.fallbackTimeout,
    );
    _fallbackClient ??= ApiClient(
      ApiConfig.productionUrl,
      timeout: ApiConfig.timeout,
    );

    // If we're using production server, check if local is back online
    if (_useProduction && _shouldRecheckLocal()) {
      _checkLocalServer();
    }

    return _useProduction ? _fallbackClient! : _primaryClient!;
  }

  static bool _shouldRecheckLocal() {
    if (_lastLocalCheck == null) return true;
    return DateTime.now().difference(_lastLocalCheck!) > _recheckInterval;
  }

  static Future<void> _checkLocalServer() async {
    _lastLocalCheck = DateTime.now();
    try {
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/health'))
          .timeout(const Duration(seconds: 2));
      
      if (response.statusCode == 200) {
        print('✅ Local server is back online, switching from production');
        _useProduction = false;
      }
    } catch (e) {
      // Local still not available
    }
  }

  /// Execute API call with automatic fallback
  static Future<T> executeWithFallback<T>(
    Future<T> Function(ApiClient client) apiCall,
  ) async {
    try {
      // Try primary (local) first
      if (!_useProduction) {
        try {
          final result = await apiCall(_primaryClient!);
          return result;
        } catch (e) {
          print('⚠️ Local server failed, trying production server: $e');
          _useProduction = true;
          _lastLocalCheck = DateTime.now();
        }
      }

      // Use production fallback
      print('🌐 Using production server');
      return await apiCall(_fallbackClient!);
    } catch (e) {
      print('❌ Both servers failed: $e');
      rethrow;
    }
  }

  /// Force use of production server
  static void forceProduction() {
    _useProduction = true;
    _lastLocalCheck = DateTime.now();
  }

  /// Force use of local server
  static void forceLocal() {
    _useProduction = false;
  }

  /// Get current server status
  static String getCurrentServer() {
    return _useProduction ? 'Production Server' : 'Local WiFi';
  }

  /// Check if currently using production server
  static bool isUsingProduction() => _useProduction;
}
