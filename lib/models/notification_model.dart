import 'dart:convert';
import 'notification_metadata.dart';

/// Notification model for user notifications
/// Represents notifications sent to users when complaint status changes
class NotificationModel {
  final int id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final int? complaintId;
  final String? statusChange;
  final NotificationMetadata? metadata;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    this.complaintId,
    this.statusChange,
    this.metadata,
    required this.createdAt,
  });

  /// Create NotificationModel from JSON
  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'INFO',
      isRead: json['isRead'] ?? false,
      complaintId: json['complaintId'] != null
          ? (json['complaintId'] is int
              ? json['complaintId']
              : int.tryParse(json['complaintId'].toString()))
          : null,
      statusChange: json['statusChange'],
      metadata: json['metadata'] != null
          ? NotificationMetadata.fromJson(
              json['metadata'] is String
                  ? jsonDecode(json['metadata'])
                  : json['metadata'],
            )
          : null,
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  /// Convert NotificationModel to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'isRead': isRead,
      'complaintId': complaintId,
      'statusChange': statusChange,
      'metadata': metadata?.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Create a copy with updated fields
  NotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    String? type,
    bool? isRead,
    int? complaintId,
    String? statusChange,
    NotificationMetadata? metadata,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      isRead: isRead ?? this.isRead,
      complaintId: complaintId ?? this.complaintId,
      statusChange: statusChange ?? this.statusChange,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Get time ago string (e.g., "2 hours ago")
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else {
      return 'Just now';
    }
  }

  /// Check if notification is about status change
  bool get isStatusChange => statusChange != null;

  /// Check if notification has metadata
  bool get hasMetadata => metadata != null;

  /// Check if notification is related to a complaint
  bool get hasComplaint => complaintId != null;

  /// Get status change display text
  String? get statusChangeDisplay {
    if (statusChange == null) return null;

    // Parse status change format: "OLD_STATUS_TO_NEW_STATUS"
    final parts = statusChange!.split('_TO_');
    if (parts.length == 2) {
      final oldStatus = _formatStatus(parts[0]);
      final newStatus = _formatStatus(parts[1]);
      return '$oldStatus → $newStatus';
    }

    return statusChange;
  }

  /// Format status string for display
  String _formatStatus(String status) {
    return status
        .split('_')
        .map((word) => word.isEmpty
            ? ''
            : word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ');
  }

  @override
  String toString() {
    return 'NotificationModel(id: $id, title: $title, type: $type, isRead: $isRead, complaintId: $complaintId)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is NotificationModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

/// Notification type constants
class NotificationType {
  static const String info = 'INFO';
  static const String success = 'SUCCESS';
  static const String warning = 'WARNING';
  static const String error = 'ERROR';
  static const String statusChange = 'STATUS_CHANGE';

  static List<String> get all => [
        info,
        success,
        warning,
        error,
        statusChange,
      ];
}

/// Status change constants
class StatusChange {
  static const String pendingToInProgress = 'PENDING_TO_IN_PROGRESS';
  static const String pendingToResolved = 'PENDING_TO_RESOLVED';
  static const String pendingToOthers = 'PENDING_TO_OTHERS';
  static const String inProgressToResolved = 'IN_PROGRESS_TO_RESOLVED';
  static const String inProgressToOthers = 'IN_PROGRESS_TO_OTHERS';
  static const String resolvedToInProgress = 'RESOLVED_TO_IN_PROGRESS';
  static const String othersToInProgress = 'OTHERS_TO_IN_PROGRESS';
  static const String othersToResolved = 'OTHERS_TO_RESOLVED';

  static List<String> get all => [
        pendingToInProgress,
        pendingToResolved,
        pendingToOthers,
        inProgressToResolved,
        inProgressToOthers,
        resolvedToInProgress,
        othersToInProgress,
        othersToResolved,
      ];
}
