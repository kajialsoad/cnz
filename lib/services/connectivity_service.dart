import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

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
      _updateConnectionStatus(result);
      return _isOnline;
    } catch (e) {
      // Error checking connectivity, assume offline
      _isOnline = false;
      return false;
    }
  }

  /// Update connection status based on connectivity result
  void _updateConnectionStatus(ConnectivityResult result) {
    // Consider online if any connection type is available (except none)
    final wasOnline = _isOnline;
    _isOnline = result != ConnectivityResult.none;
    
    // Notify listeners if status changed
    if (wasOnline != _isOnline) {
      _connectivityController.add(_isOnline);
    }
  }

  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectivityController.close();
  }
}
