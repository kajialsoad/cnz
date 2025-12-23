import '../models/notification_model.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

/// Service for managing notifications
/// Handles fetching, marking as read, and managing notification state
class NotificationService {
  final ApiClient _apiClient;
  
  // Cache for notifications
  NotificationResponse? _cachedNotifications;
  DateTime? _cacheTimestamp;
  static const Duration _cacheDuration = Duration(minutes: 2);
  
  // Cache for unread count
  int? _cachedUnreadCount;
  DateTime? _unreadCountCacheTimestamp;
  static const Duration _unreadCountCacheDuration = Duration(seconds: 30);

  NotificationService()
      : _apiClient = ApiClient(
          ApiConfig.baseUrl,
          timeout: const Duration(seconds: 30),
        );

  /// Get user notifications with pagination
  /// 
  /// Parameters:
  /// - [page]: Page number (default: 1)
  /// - [limit]: Number of notifications per page (default: 20)
  /// - [unreadOnly]: Filter to show only unread notifications (default: false)
  /// - [forceRefresh]: Force refresh from server, bypassing cache (default: false)
  /// 
  /// Returns: NotificationResponse with notifications and pagination info
  Future<NotificationResponse> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
    bool forceRefresh = false,
  }) async {
    // Check cache if not forcing refresh and requesting first page
    if (!forceRefresh && page == 1 && !unreadOnly && _cachedNotifications != null && _cacheTimestamp != null) {
      final cacheAge = DateTime.now().difference(_cacheTimestamp!);
      if (cacheAge < _cacheDuration) {
        return _cachedNotifications!;
      }
    }

    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      if (unreadOnly) 'unreadOnly': 'true',
    };

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');

    final response = await _apiClient.get(
      '/api/notifications?$queryString',
    );

    if (response['success'] == true && response['data'] != null) {
      final notificationResponse = NotificationResponse.fromJson(response['data']);
      
      // Cache the response if it's the first page and not filtered
      if (page == 1 && !unreadOnly) {
        _cachedNotifications = notificationResponse;
        _cacheTimestamp = DateTime.now();
      }
      
      return notificationResponse;
    } else {
      throw ApiException(
        response['message'] ?? 'Failed to fetch notifications',
      );
    }
  }

  /// Mark a single notification as read
  /// 
  /// Parameters:
  /// - [notificationId]: The ID of the notification to mark as read
  /// 
  /// Returns: Updated NotificationModel
  Future<NotificationModel> markAsRead(int notificationId) async {
    final response = await _apiClient.patch(
      '/api/notifications/$notificationId/read',
      {},
    );

    if (response['success'] == true && response['data'] != null) {
      // Invalidate cache since notification state changed
      _invalidateCache();
      
      return NotificationModel.fromJson(response['data']);
    } else {
      throw ApiException(
        response['message'] ?? 'Failed to mark notification as read',
      );
    }
  }

  /// Mark all user notifications as read
  /// 
  /// Returns: Number of notifications marked as read
  Future<int> markAllAsRead() async {
    final response = await _apiClient.patch(
      '/api/notifications/read-all',
      {},
    );

    if (response['success'] == true && response['data'] != null) {
      // Invalidate cache since notification state changed
      _invalidateCache();
      
      return response['data']['updatedCount'] ?? 0;
    } else {
      throw ApiException(
        response['message'] ?? 'Failed to mark all notifications as read',
      );
    }
  }

  /// Get unread notification count
  /// 
  /// Parameters:
  /// - [forceRefresh]: Force refresh from server, bypassing cache (default: false)
  /// 
  /// Returns: Number of unread notifications
  Future<int> getUnreadCount({bool forceRefresh = false}) async {
    // Check cache if not forcing refresh
    if (!forceRefresh && _cachedUnreadCount != null && _unreadCountCacheTimestamp != null) {
      final cacheAge = DateTime.now().difference(_unreadCountCacheTimestamp!);
      if (cacheAge < _unreadCountCacheDuration) {
        return _cachedUnreadCount!;
      }
    }

    final response = await _apiClient.get(
      '/api/notifications/unread-count',
    );

    if (response['success'] == true && response['data'] != null) {
      final count = response['data']['count'] ?? 0;
      
      // Cache the unread count
      _cachedUnreadCount = count;
      _unreadCountCacheTimestamp = DateTime.now();
      
      return count;
    } else {
      throw ApiException(
        response['message'] ?? 'Failed to fetch unread count',
      );
    }
  }
  
  /// Invalidate all caches
  /// Call this when notification state changes (mark as read, etc.)
  void _invalidateCache() {
    _cachedNotifications = null;
    _cacheTimestamp = null;
    _cachedUnreadCount = null;
    _unreadCountCacheTimestamp = null;
  }
  
  /// Clear all caches manually
  /// Useful when user logs out or switches accounts
  void clearCache() {
    _invalidateCache();
  }
}

/// Response model for notification list with pagination
class NotificationResponse {
  final List<NotificationModel> notifications;
  final PaginationInfo pagination;
  final int unreadCount;

  NotificationResponse({
    required this.notifications,
    required this.pagination,
    required this.unreadCount,
  });

  factory NotificationResponse.fromJson(Map<String, dynamic> json) {
    return NotificationResponse(
      notifications: (json['notifications'] as List?)
              ?.map((item) => NotificationModel.fromJson(item))
              .toList() ??
          [],
      pagination: PaginationInfo.fromJson(json['pagination'] ?? {}),
      unreadCount: json['unreadCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications': notifications.map((n) => n.toJson()).toList(),
      'pagination': pagination.toJson(),
      'unreadCount': unreadCount,
    };
  }
}

/// Pagination information
class PaginationInfo {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
    };
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}
