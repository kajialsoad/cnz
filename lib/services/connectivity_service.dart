import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';

/// Service to monitor network connectivity status
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  
  bool _isOnline = true;
  final _connectivityController = StreamController<bool>.broadcast();

  /// Stream of connectivity status (true = online, false = offline)
  Stream<bool> get connectivityStream => _connectivityController.stream;

  /// Current connectivity status
  bool get isOnline => _isOnline;

  /// Initialize connectivity monitoring
  Future<void> init() async {
    // Check initial connectivity
    await checkConnectivity();

    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (ConnectivityResult result) {
        _updateConnectionStatus(result);
      },
    );
  }

  /// Check current connectivity status
  Future<bool> checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      await _updateConnectionStatus(result);
      return _isOnline;
    } catch (e) {
      _isOnline = false;
      return false;
    }
  }

  /// Update connection status based on connectivity result
  Future<void> _updateConnectionStatus(ConnectivityResult result) async {
    final wasOnline = _isOnline;
    final hasNetwork = result != ConnectivityResult.none;
    bool hasInternet = false;
    if (hasNetwork) {
      hasInternet = await hasInternetAccess();
    }
    _isOnline = hasNetwork && hasInternet;

    if (wasOnline != _isOnline) {
      _connectivityController.add(_isOnline);
    }
  }

  /// Perform a lightweight request to ensure actual internet availability
  /// First tries to reach the API server, then falls back to public endpoints
  static Future<bool> hasInternetAccess({Duration timeout = const Duration(seconds: 3)}) async {
    // First, try to reach our API server (most important for the app)
    try {
      final apiUri = Uri.parse('${ApiConfig.baseUrl}/api/health');
      final apiRes = await http.get(apiUri).timeout(timeout);
      if (apiRes.statusCode == 200) {
        print('✅ API server reachable');
        return true;
      }
    } catch (e) {
      print('⚠️ API server not reachable: $e');
    }

    // Fallback: Check general internet connectivity
    try {
      final uri = kIsWeb
          ? Uri.parse('https://httpbin.org/get')
          : Uri.parse('https://www.google.com/generate_204');
      final res = await http.get(uri).timeout(timeout);
      final isOnline = kIsWeb ? res.statusCode == 200 : res.statusCode == 204;
      if (isOnline) {
        print('✅ Internet available but API server not reachable');
      }
      return isOnline;
    } catch (e) {
      print('❌ No internet connection: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectivityController.close();
  }
}
