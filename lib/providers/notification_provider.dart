import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';
import '../services/notification_local_service.dart';

/// Provider for managing notification state and operations
/// Handles notification fetching, marking as read, and state management
class NotificationProvider extends ChangeNotifier {
  final NotificationService _notificationService;
  final NotificationLocalService _localService;

  NotificationProvider()
    : _notificationService = NotificationService(),
      _localService = NotificationLocalService();

  // State variables
  List<NotificationModel> _notifications = [];
  Set<int> _unreadComplaintIds = {}; // Cache for O(1) unread check
  int _unreadCount = 0;
  bool _loading = false;
  String? _error;
  bool _hasMore = true;
  int _currentPage = 1;
  final int _limit = 20;

  // Getters
  List<NotificationModel> get notifications =>
      List.unmodifiable(_notifications);
  int get unreadCount => _unreadCount;
  bool get loading => _loading;
  String? get error => _error;
  bool get hasMore => _hasMore;
  int get currentPage => _currentPage;

  /// Update unread complaint IDs cache
  void _updateUnreadComplaintIds() {
    _unreadComplaintIds = _notifications
        .where((n) => !n.isRead && n.complaintId != null)
        .map((n) => n.complaintId!)
        .toSet();
  }

  /// Fetch notifications with pagination
  ///
  /// Parameters:
  /// - [page]: Page number to fetch (default: 1)
  /// - [unreadOnly]: Filter to show only unread notifications (default: false)
  /// - [refresh]: If true, clears existing notifications before fetching (default: false)
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> fetchNotifications({
    int? page,
    bool unreadOnly = false,
    bool refresh = false,
  }) async {
    // Prevent multiple simultaneous requests
    if (_loading) return false;

    // If refreshing, reset pagination
    if (refresh) {
      _currentPage = 1;
      _notifications = [];
      _hasMore = true;
    }

    final pageToFetch = page ?? _currentPage;

    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _notificationService.getNotifications(
        page: pageToFetch,
        limit: _limit,
        unreadOnly: unreadOnly,
      );

      // Save to local DB for offline access
      if (response.notifications.isNotEmpty) {
        await _localService.saveNotifications(response.notifications);
      }

      if (refresh) {
        _notifications = response.notifications;
      } else {
        // Append new notifications, avoiding duplicates
        for (final notification in response.notifications) {
          if (!_notifications.any((n) => n.id == notification.id)) {
            _notifications.add(notification);
          }
        }
      }

      _unreadCount = response.unreadCount;
      _currentPage = response.pagination.page;
      _hasMore = response.pagination.hasNextPage;

      _updateUnreadComplaintIds(); // Update cache
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      print('Error fetching notifications from API: $e');

      // Try to load from local DB if API fails
      try {
        final localNotifications = await _localService.getNotifications(
          limit: _limit,
          offset: (pageToFetch - 1) * _limit,
        );

        // If we have local data, use it
        if (localNotifications.isNotEmpty || pageToFetch > 1) {
          if (refresh) {
            _notifications = localNotifications;
          } else {
            // Append new notifications, avoiding duplicates
            for (final notification in localNotifications) {
              if (!_notifications.any((n) => n.id == notification.id)) {
                _notifications.add(notification);
              }
            }
          }

          // Get unread count from local DB
          _unreadCount = await _localService.getUnreadCount();
          _currentPage = pageToFetch;
          // Assume more if we got a full page
          _hasMore = localNotifications.length == _limit;

          _updateUnreadComplaintIds(); // Update cache
          _loading = false;
          // Don't set error if we successfully loaded local data
          notifyListeners();
          return true;
        }

        // If no local data and it's the first page, show error
        if (pageToFetch == 1) {
          _error = e.toString();
        }

        _loading = false;
        notifyListeners();
        return false;
      } catch (localError) {
        print('Error fetching notifications from Local DB: $localError');
        _error = e.toString();
        _loading = false;
        notifyListeners();
        return false;
      }
    }
  }

  /// Load more notifications (next page)
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> loadMore({bool unreadOnly = false}) async {
    if (!_hasMore || _loading) return false;

    return await fetchNotifications(
      page: _currentPage + 1,
      unreadOnly: unreadOnly,
      refresh: false,
    );
  }

  /// Refresh notifications (reload from first page)
  ///
  /// Parameters:
  /// - [unreadOnly]: Filter to show only unread notifications (default: false)
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> refreshNotifications({bool unreadOnly = false}) async {
    return await fetchNotifications(
      page: 1,
      unreadOnly: unreadOnly,
      refresh: true,
    );
  }

  /// Mark a single notification as read
  ///
  /// Parameters:
  /// - [notificationId]: The ID of the notification to mark as read
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> markAsRead(int notificationId) async {
    try {
      // Optimistically update UI and local DB
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index >= 0) {
        final oldNotification = _notifications[index];
        if (!oldNotification.isRead) {
          _notifications[index] = oldNotification.copyWith(isRead: true);
          _unreadCount = (_unreadCount - 1).clamp(0, double.infinity).toInt();
          _updateUnreadComplaintIds(); // Update cache
          notifyListeners();

          // Update local DB
          await _localService.markAsRead(notificationId);
        }
      }

      // Try to sync with server
      try {
        final updatedNotification = await _notificationService.markAsRead(
          notificationId,
        );

        // Ensure list is consistent with server response
        final idx = _notifications.indexWhere((n) => n.id == notificationId);
        if (idx >= 0) {
          _notifications[idx] = updatedNotification;
          _updateUnreadComplaintIds(); // Update cache
          notifyListeners();
        }
      } catch (e) {
        print('Error syncing read status with server: $e');
        // Ignore API error as we updated locally
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Mark all notifications as read
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> markAllAsRead() async {
    try {
      // Optimistically update UI
      _notifications = _notifications.map((notification) {
        return notification.copyWith(isRead: true);
      }).toList();
      _unreadCount = 0;
      _updateUnreadComplaintIds(); // Update cache
      notifyListeners();

      // Update local DB
      await _localService.markAllAsRead();

      // Try to sync with server
      try {
        await _notificationService.markAllAsRead();
      } catch (e) {
        print('Error syncing mark all read with server: $e');
        // Ignore API error as we updated locally
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Refresh unread count only (lightweight operation)
  ///
  /// Returns: true if successful, false otherwise
  Future<bool> refreshUnreadCount() async {
    try {
      final count = await _notificationService.getUnreadCount();
      _unreadCount = count;
      notifyListeners();
      return true;
    } catch (e) {
      print('Error fetching unread count from API: $e');
      // Fallback to local DB
      try {
        final count = await _localService.getUnreadCount();
        _unreadCount = count;
        notifyListeners();
        return true;
      } catch (localError) {
        _error = e.toString();
        notifyListeners();
        return false;
      }
    }
  }

  /// Get a specific notification by ID
  ///
  /// Parameters:
  /// - [notificationId]: The ID of the notification to find
  ///
  /// Returns: NotificationModel if found, null otherwise
  NotificationModel? getNotificationById(int notificationId) {
    try {
      return _notifications.firstWhere((n) => n.id == notificationId);
    } catch (e) {
      return null;
    }
  }

  /// Get unread notifications only
  ///
  /// Returns: List of unread notifications
  List<NotificationModel> get unreadNotifications {
    return _notifications.where((n) => !n.isRead).toList();
  }

  /// Get read notifications only
  ///
  /// Returns: List of read notifications
  List<NotificationModel> get readNotifications {
    return _notifications.where((n) => n.isRead).toList();
  }

  /// Get notifications for a specific complaint
  ///
  /// Parameters:
  /// - [complaintId]: The ID of the complaint
  ///
  /// Returns: List of notifications related to the complaint
  List<NotificationModel> getNotificationsByComplaint(int complaintId) {
    return _notifications.where((n) => n.complaintId == complaintId).toList();
  }

  /// Check if a complaint has unread notifications
  /// Optimized for list view performance using O(1) lookup
  bool hasUnreadForComplaint(int complaintId) {
    return _unreadComplaintIds.contains(complaintId);
  }

  /// Check if there are any unread notifications
  ///
  /// Returns: true if there are unread notifications, false otherwise
  bool get hasUnreadNotifications => _unreadCount > 0;

  /// Clear error message
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Clear all notifications from state
  void clearNotifications() {
    _notifications = [];
    _unreadCount = 0;
    _currentPage = 1;
    _hasMore = true;
    notifyListeners();
  }

  /// Reset provider state
  void reset() {
    _notifications = [];
    _unreadCount = 0;
    _loading = false;
    _error = null;
    _hasMore = true;
    _currentPage = 1;
    notifyListeners();
  }

  @override
  void dispose() {
    reset();
    super.dispose();
  }
}
