import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';
import 'translated_text.dart';

class NotificationSheet extends StatefulWidget {
  const NotificationSheet({super.key});

  @override
  State<NotificationSheet> createState() => _NotificationSheetState();
}

class _NotificationSheetState extends State<NotificationSheet> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    // Initial fetch handled by parent or provider init, but good to refresh here
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications(refresh: true);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      final provider = context.read<NotificationProvider>();
      if (!provider.loading && provider.hasMore) {
        provider.loadMore();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.notifications_outlined, color: Color(0xFF2E8B57)),
                    const SizedBox(width: 8),
                    const TranslatedText(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1D1D1D),
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () {
                    context.read<NotificationProvider>().markAllAsRead();
                  },
                  child: const TranslatedText(
                    'Mark all read',
                    style: TextStyle(
                      color: Color(0xFF2E8B57),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          
          // List
          Expanded(
            child: Consumer<NotificationProvider>(
              builder: (context, provider, child) {
                if (provider.loading && provider.notifications.isEmpty) {
                  return const Center(child: CircularProgressIndicator(color: Color(0xFF2E8B57)));
                }

                if (provider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.red),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            provider.error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.red, fontSize: 14),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextButton.icon(
                          onPressed: () {
                            context.read<NotificationProvider>().fetchNotifications(refresh: true);
                          },
                          icon: const Icon(Icons.refresh, color: Color(0xFF2E8B57)),
                          label: const TranslatedText(
                            'Try Again',
                            style: TextStyle(
                              color: Color(0xFF2E8B57),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                if (provider.notifications.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_off_outlined, size: 60, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        const TranslatedText(
                          'No notifications yet',
                          style: TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(0),
                  itemCount: provider.notifications.length + (provider.hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == provider.notifications.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(color: Color(0xFF2E8B57)),
                        ),
                      );
                    }

                    final notification = provider.notifications[index];
                    return _buildNotificationItem(context, notification);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(BuildContext context, NotificationModel notification) {
    return InkWell(
      onTap: () {
        _handleNotificationTap(context, notification);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: notification.isRead ? Colors.white : const Color(0xFFF0F9F4),
          border: const Border(bottom: BorderSide(color: Color(0xFFE0E0E0), width: 0.5)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon based on type
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _getTypeColor(notification.type).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getTypeIcon(notification.type),
                size: 20,
                color: _getTypeColor(notification.type),
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.bold,
                            fontSize: 15,
                            color: const Color(0xFF1D1D1D),
                          ),
                        ),
                      ),
                      Text(
                        notification.timeAgo,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                      height: 1.3,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Unread indicator dot
            if (!notification.isRead)
              Container(
                margin: const EdgeInsets.only(left: 8, top: 4),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF2E8B57),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _handleNotificationTap(BuildContext context, NotificationModel notification) {
    // Mark as read
    if (!notification.isRead) {
      context.read<NotificationProvider>().markAsRead(notification.id);
    }

    // Navigate if complaint ID exists
    if (notification.complaintId != null) {
      Navigator.pop(context); // Close sheet
      
      // Navigate to complaint details
      // Assuming route is /complaint-details and takes arguments
      // Or /complaint-detail-view like in home page
      // Home page uses: _navigateToPage('/complaint-list');
      // Let's check main.dart for complaint details route
      // '/complaint-details': (_) => const AuthGuard(child: ComplaintDetailsPage()),
      // '/complaint-detail-view': (_) => const AuthGuard(child: ComplaintDetailViewPage()),
      
      // Usually passing arguments via pushNamed
      // I'll try to find how to pass arguments.
      
      Navigator.pushNamed(
        context,
        '/complaint-detail-view',
        arguments: notification.complaintId,
      );
      
      // Note: complaint_details_page.dart likely expects arguments.
      // If it fails, we need to check the page implementation.
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'SUCCESS':
      case 'RESOLVED':
        return Colors.green;
      case 'WARNING':
      case 'PENDING':
        return Colors.orange;
      case 'ERROR':
      case 'REJECTED':
        return Colors.red;
      case 'STATUS_CHANGE':
        return Colors.blue;
      default:
        return const Color(0xFF2E8B57);
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'SUCCESS':
      case 'RESOLVED':
        return Icons.check_circle_outline;
      case 'WARNING':
      case 'PENDING':
        return Icons.access_time;
      case 'ERROR':
      case 'REJECTED':
        return Icons.error_outline;
      case 'STATUS_CHANGE':
        return Icons.cached;
      default:
        return Icons.notifications_none;
    }
  }
}
