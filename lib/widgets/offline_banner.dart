import 'package:flutter/material.dart';

/// Reusable offline indicator banner widget
/// 
/// Shows an orange banner at the top of the screen when the app is offline,
/// displaying the last sync time if available.
/// 
/// Usage:
/// ```dart
/// if (provider.isOffline) 
///   OfflineBanner(lastSyncTime: provider.lastSyncTime),
/// ```
class OfflineBanner extends StatelessWidget {
  /// The last time data was synced from the server
  final DateTime? lastSyncTime;

  /// Whether to show the last sync time
  final bool showLastSync;

  const OfflineBanner({
    super.key,
    this.lastSyncTime,
    this.showLastSync = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.orange[100],
        border: Border(
          bottom: BorderSide(
            color: Colors.orange[300]!,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.cloud_off,
            size: 20,
            color: Colors.orange[800],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'অফলাইন মোড - Cached data দেখাচ্ছে',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.orange[900],
                  ),
                ),
                if (showLastSync && lastSyncTime != null)
                  Text(
                    'শেষ আপডেট: ${_formatLastSync(lastSyncTime!)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.orange[800],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Format the last sync time in a human-readable format
  /// 
  /// Examples:
  /// - Less than 1 minute: "just now"
  /// - Less than 1 hour: "5m ago"
  /// - Less than 24 hours: "3h ago"
  /// - More than 24 hours: "2d ago"
  String _formatLastSync(DateTime lastSync) {
    final now = DateTime.now();
    final difference = now.difference(lastSync);

    if (difference.inMinutes < 1) {
      return 'এইমাত্র (just now)';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}মি আগে (${difference.inMinutes}m ago)';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}ঘ আগে (${difference.inHours}h ago)';
    } else {
      return '${difference.inDays}দি আগে (${difference.inDays}d ago)';
    }
  }
}
