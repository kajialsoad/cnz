import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;

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
  static Future<bool> hasInternetAccess({Duration timeout = const Duration(seconds: 3)}) async {
    try {
      final res = await http
          .get(Uri.parse('https://www.google.com/generate_204'))
          .timeout(timeout);
      return res.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectivityController.close();
  }
}
