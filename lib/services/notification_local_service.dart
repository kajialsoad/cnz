import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import 'database_helper.dart';

class NotificationLocalService {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  static final List<Map<String, dynamic>> _webCache = [];

  /// Save notifications to local database
  Future<void> saveNotifications(List<NotificationModel> notifications) async {
    if (kIsWeb) {
      for (final notification in notifications) {
        final json = notification.toJson();
        final id = json['id'];
        _webCache.removeWhere((e) => e['id'] == id);
        _webCache.add(Map<String, dynamic>.from(json));
      }
      _webCache.sort((a, b) {
        final aTime = (a['createdAt'] ?? '').toString();
        final bTime = (b['createdAt'] ?? '').toString();
        return bTime.compareTo(aTime);
      });
      return;
    }

    final List<Map<String, dynamic>> jsonList = notifications
        .map((n) => n.toJson())
        .toList();
    await _dbHelper.saveNotifications(jsonList);
  }

  /// Get notifications from local database
  Future<List<NotificationModel>> getNotifications({
    int? limit,
    int? offset,
  }) async {
    if (kIsWeb) {
      final start = (offset ?? 0).clamp(0, _webCache.length);
      final end = limit == null
          ? _webCache.length
          : (start + limit).clamp(0, _webCache.length);
      final slice = _webCache.sublist(start, end);

      return slice.map((map) {
        final Map<String, dynamic> mutableMap = Map<String, dynamic>.from(map);
        return NotificationModel.fromJson(mutableMap);
      }).toList();
    }

    final List<Map<String, dynamic>> maps = await _dbHelper.getNotifications(
      limit: limit,
      offset: offset,
    );

    return maps.map((map) {
      // Create a mutable copy of the map
      final Map<String, dynamic> mutableMap = Map<String, dynamic>.from(map);

      // Map DB columns back to Model fields

      // is_read -> isRead
      if (mutableMap.containsKey('is_read')) {
        mutableMap['isRead'] = (mutableMap['is_read'] as int) == 1;
        mutableMap.remove('is_read');
      }

      // created_at -> createdAt
      if (mutableMap.containsKey('created_at')) {
        mutableMap['createdAt'] = mutableMap['created_at'];
        mutableMap.remove('created_at');
      }

      // complaint_id -> complaintId
      if (mutableMap.containsKey('complaint_id')) {
        mutableMap['complaintId'] = mutableMap['complaint_id'];
        mutableMap.remove('complaint_id');
      }

      // status_change -> statusChange
      if (mutableMap.containsKey('status_change')) {
        mutableMap['statusChange'] = mutableMap['status_change'];
        mutableMap.remove('status_change');
      }

      // metadata (String) -> metadata (Map/Object)
      // NotificationModel.fromJson expects metadata to be String or Map, it handles decoding if String.
      // So we can leave it as String if NotificationModel handles it.
      // Checking NotificationModel.fromJson:
      // metadata: json['metadata'] != null ? NotificationMetadata.fromJson(...)
      // And inside: json['metadata'] is String ? jsonDecode(...) : json['metadata']
      // So passing the JSON string directly works fine!

      return NotificationModel.fromJson(mutableMap);
    }).toList();
  }

  /// Mark notification as read locally
  Future<void> markAsRead(int id) async {
    if (kIsWeb) {
      final index = _webCache.indexWhere((e) => e['id'] == id);
      if (index >= 0) {
        _webCache[index] = Map<String, dynamic>.from(_webCache[index])
          ..['isRead'] = true;
      }
      return;
    }

    await _dbHelper.markNotificationAsRead(id);
  }

  /// Mark all notifications as read locally
  Future<void> markAllAsRead() async {
    if (kIsWeb) {
      for (var i = 0; i < _webCache.length; i++) {
        _webCache[i] = Map<String, dynamic>.from(_webCache[i])..['isRead'] = true;
      }
      return;
    }

    await _dbHelper.markAllNotificationsAsRead();
  }

  /// Get unread count from local database
  Future<int> getUnreadCount() async {
    if (kIsWeb) {
      var count = 0;
      for (final item in _webCache) {
        if (item['isRead'] != true) count++;
      }
      return count;
    }

    return await _dbHelper.getUnreadNotificationCount();
  }
}
