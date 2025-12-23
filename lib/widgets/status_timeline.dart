import 'package:flutter/material.dart';
import '../models/complaint.dart';
import '../widgets/translated_text.dart';

/// Widget to display complaint status history timeline
class StatusTimeline extends StatelessWidget {
  final Complaint complaint;

  const StatusTimeline({
    super.key,
    required this.complaint,
  });

  @override
  Widget build(BuildContext context) {
    final statusHistory = _buildStatusHistory();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Icon(
                Icons.timeline,
                size: 20,
                color: Color(0xFF4CAF50),
              ),
              const SizedBox(width: 8),
              TranslatedText(
                'Status History',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Timeline items
          ...statusHistory.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isLast = index == statusHistory.length - 1;

            return _buildTimelineItem(
              status: item['status'] as String,
              statusBangla: item['statusBangla'] as String,
              timestamp: item['timestamp'] as DateTime,
              adminName: item['adminName'] as String?,
              isLast: isLast,
              icon: item['icon'] as IconData,
              color: item['color'] as Color,
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required String status,
    required String statusBangla,
    required DateTime timestamp,
    String? adminName,
    required bool isLast,
    required IconData icon,
    required Color color,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(
                  color: color,
                  width: 2,
                ),
              ),
              child: Icon(
                icon,
                size: 16,
                color: color,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 60,
                color: Colors.grey[300],
              ),
          ],
        ),
        const SizedBox(width: 12),

        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status
                Text(
                  status,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  statusBangla,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                ),

                // Admin name
                if (adminName != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'By: $adminName',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],

                // Timestamp
                const SizedBox(height: 4),
                Text(
                  _formatDateTime(timestamp),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<Map<String, dynamic>> _buildStatusHistory() {
    final history = <Map<String, dynamic>>[];

    // Submitted (always present)
    history.add({
      'status': 'Submitted',
      'statusBangla': 'জমা দেওয়া হয়েছে',
      'timestamp': complaint.createdAt,
      'adminName': null,
      'icon': Icons.send_outlined,
      'color': const Color(0xFF2196F3),
    });

    // In Progress (if status is in_progress or resolved)
    if (complaint.status == ComplaintStatus.inProgress ||
        complaint.status == ComplaintStatus.resolved ||
        complaint.status == ComplaintStatus.others) {
      history.add({
        'status': 'In Progress',
        'statusBangla': 'প্রক্রিয়াধীন',
        'timestamp': complaint.updatedAt,
        'adminName': complaint.resolvedByAdminName,
        'icon': Icons.hourglass_empty,
        'color': const Color(0xFF2196F3),
      });
    }

    // Resolved (if status is resolved)
    if (complaint.status == ComplaintStatus.resolved) {
      history.add({
        'status': 'Resolved',
        'statusBangla': 'সমাধান হয়েছে',
        'timestamp': complaint.updatedAt,
        'adminName': complaint.resolvedByAdminName,
        'icon': Icons.check_circle_outline,
        'color': const Color(0xFF4CAF50),
      });
    }

    // Others (if status is others)
    if (complaint.status == ComplaintStatus.others) {
      history.add({
        'status': 'Marked as Others',
        'statusBangla': 'অন্যান্য হিসেবে চিহ্নিত',
        'timestamp': complaint.updatedAt,
        'adminName': complaint.resolvedByAdminName,
        'icon': Icons.category_outlined,
        'color': const Color(0xFF9C27B0),
      });

      // Add subcategory info if available
      if (complaint.othersSubcategory != null) {
        history.last['status'] = 'Marked as Others - ${complaint.othersSubcategory}';
      }
    }

    // Rejected/Closed (if status is closed)
    if (complaint.status == ComplaintStatus.closed) {
      history.add({
        'status': 'Closed',
        'statusBangla': 'বন্ধ',
        'timestamp': complaint.updatedAt,
        'adminName': complaint.resolvedByAdminName,
        'icon': Icons.cancel_outlined,
        'color': const Color(0xFF9E9E9E),
      });
    }

    return history;
  }

  String _formatDateTime(DateTime dateTime) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    final localTime = dateTime.toLocal();

    return '${months[localTime.month - 1]} ${localTime.day}, ${localTime.year} at ${localTime.hour}:${localTime.minute.toString().padLeft(2, '0')}';
  }
}
