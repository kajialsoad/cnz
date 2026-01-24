import 'dart:async';
import 'api_client.dart';
import '../config/api_config.dart';

/// Service for polling notifications from the server
/// Checks for new notifications every 30 seconds
class NotificationPollingService {
  static Timer? _pollingTimer;
  static final ApiClient _apiClient = ApiClient(ApiConfig.baseUrl);
  static final List<Function(Map<String, dynamic>)> _listeners = [];
  static bool _isPolling = false;

  /// Start polling for notifications
  /// Polls every 30 seconds and notifies listeners of new notifications
  static void startPolling() {
    if (_isPolling) {
      print('⚠️ Notification polling already started');
      return;
    }

    _isPolling = true;

    // Poll every 5 seconds for near real-time notification delivery
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _checkForNewNotifications();
    });

    // Check immediately on start
    _checkForNewNotifications();

    print('✅ Notification polling started (every 5 seconds - near real-time)');
  }

  /// Stop polling
  static void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _isPolling = false;
    print('⏹️ Notification polling stopped');
  }

  /// Check for new notifications from the server
  static Future<void> _checkForNewNotifications() async {
    try {
      // Check if user is logged in before making API call
      final token = await _apiClient.getToken();
      if (token == null || token.isEmpty) {
        // User not logged in, skip notification check silently
        return;
      }

      final response = await _apiClient.get('/api/notifications/unread');

      if (response['success'] == true) {
        final List notifications = response['data'] ?? [];

        if (notifications.isNotEmpty) {
          print('📬 Found ${notifications.length} unread notification(s)');

          // Notify all listeners about each notification
          for (var notification in notifications) {
            for (var listener in _listeners) {
              listener(notification);
            }
          }
        }
      }
    } catch (e) {
      // Only log error if it's not an authentication error
      if (!e.toString().contains('401') && !e.toString().contains('Invalid credentials')) {
        print('❌ Failed to check notifications: $e');
      }
      // Don't throw error - just log it and continue polling
    }
  }

  /// Add a listener for new notifications
  /// The listener will be called with notification data when a new notification arrives
  static void addListener(Function(Map<String, dynamic>) listener) {
    if (!_listeners.contains(listener)) {
      _listeners.add(listener);
      print('✅ Notification listener added (total: ${_listeners.length})');
    }
  }

  /// Remove a listener
  static void removeListener(Function(Map<String, dynamic>) listener) {
    _listeners.remove(listener);
    print('✅ Notification listener removed (remaining: ${_listeners.length})');
  }

  /// Mark a notification as read
  static Future<void> markAsRead(int notificationId) async {
    try {
      await _apiClient.patch('/api/notifications/$notificationId/read', {});
      print('✅ Notification marked as read: $notificationId');
    } catch (e) {
      print('❌ Failed to mark notification as read: $e');
    }
  }

  /// Mark all notifications as read
  static Future<void> markAllAsRead() async {
    try {
      await _apiClient.patch('/api/notifications/read-all', {});
      print('✅ All notifications marked as read');
    } catch (e) {
      print('❌ Failed to mark all notifications as read: $e');
    }
  }

  /// Get current polling status
  static bool get isPolling => _isPolling;

  /// Get number of active listeners
  static int get listenerCount => _listeners.length;
}
