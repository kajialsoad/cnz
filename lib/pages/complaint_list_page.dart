import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:shimmer/shimmer.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../widgets/notification_badge.dart';
import '../widgets/notification_sheet.dart';
import '../widgets/offline_banner.dart';
import '../widgets/optimized/fast_image.dart';
import '../providers/complaint_provider.dart';
import '../providers/notification_provider.dart';
import '../models/complaint.dart';
import '../config/url_helper.dart';

class ComplaintListPage extends StatefulWidget {
  const ComplaintListPage({super.key});

  @override
  State<ComplaintListPage> createState() => _ComplaintListPageState();
}

class _ComplaintListPageState extends State<ComplaintListPage> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load complaints when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final complaintProvider = Provider.of<ComplaintProvider>(
        context,
        listen: false,
      );
      final notificationProvider = Provider.of<NotificationProvider>(
        context,
        listen: false,
      );

      // Load complaints
      complaintProvider.loadMyComplaints();

      // Refresh unread notification count
      notificationProvider.refreshUnreadCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: _buildAppBar(),
      body: Consumer<ComplaintProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              // Offline indicator banner (using reusable widget)
              if (provider.isOffline)
                OfflineBanner(lastSyncTime: provider.lastSyncTime),

              // Main content
              Expanded(child: _buildContent(provider)),
            ],
          );
        },
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _handleNavigation(index);
        },
      ),
    );
  }

  Widget _buildContent(ComplaintProvider provider) {
    if (provider.isLoading && provider.complaints.isEmpty) {
      return _buildLoadingState();
    }

    if (provider.error != null && provider.complaints.isEmpty) {
      return _buildErrorState(provider.error!);
    }

    if (provider.complaints.isEmpty) {
      return _buildEmptyState();
    }

    return _buildComplaintList(provider);
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF4CAF50),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      title: TranslatedText(
        'My Complaints',
        style: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: false,
      actions: [
        // Notification badge with unread count
        Consumer<NotificationProvider>(
          builder: (context, notificationProvider, child) {
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: NotificationBadge(
                count: notificationProvider.unreadCount,
                child: IconButton(
                  icon: const Icon(
                    Icons.notifications_outlined,
                    color: Colors.white,
                    size: 26,
                  ),
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    // Show notifications bottom sheet
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => const NotificationSheet(),
                    );
                  },
                  tooltip: 'Notifications',
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: 5, // Show 5 skeleton cards
      itemBuilder: (context, index) {
        return AnimationConfiguration.staggeredList(
          position: index,
          duration: const Duration(milliseconds: 375),
          child: SlideAnimation(
            verticalOffset: 50.0,
            child: FadeInAnimation(child: _buildSkeletonCard()),
          ),
        );
      },
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: Offset(0, 2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: ID and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 60,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Container(
                    width: 80,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 12),

              // Title
              Container(
                width: double.infinity,
                height: 16,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              SizedBox(height: 8),

              // Location
              Container(
                width: 200,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              SizedBox(height: 8),

              // Time
              Container(
                width: 100,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            SizedBox(height: 16),
            TranslatedText(
              'Failed to load complaints',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                HapticFeedback.mediumImpact();
                Provider.of<ComplaintProvider>(
                  context,
                  listen: false,
                ).loadMyComplaints();
              },
              icon: Icon(Icons.refresh),
              label: TranslatedText('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 80, color: Colors.grey[400]),
            SizedBox(height: 16),
            TranslatedText(
              'No complaints yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: 8),
            TranslatedText(
              'Your submitted complaints will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                HapticFeedback.mediumImpact();
                Navigator.pushNamed(context, '/complaint');
              },
              icon: Icon(Icons.add),
              label: TranslatedText('Submit Complaint'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComplaintList(ComplaintProvider provider) {
    return RefreshIndicator(
      onRefresh: () async {
        HapticFeedback.lightImpact();

        // Refresh both complaints and notification count
        final notificationProvider = Provider.of<NotificationProvider>(
          context,
          listen: false,
        );

        await Future.wait([
          provider.loadMyComplaints(forceRefresh: true),
          notificationProvider.refreshUnreadCount(),
        ]);
      },
      color: Color(0xFF4CAF50),
      child: Stack(
        children: [
          AnimationLimiter(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: provider.complaints.length,
              cacheExtent: 500,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: true,
              itemBuilder: (context, index) {
                final complaint = provider.complaints[index];

                // ✅ Only animate first 5 items for better performance
                if (index < 5) {
                  return AnimationConfiguration.staggeredList(
                    position: index,
                    duration: const Duration(
                      milliseconds: 200,
                    ), // ✅ Faster animation
                    child: SlideAnimation(
                      verticalOffset: 20.0, // ✅ Smaller offset
                      child: RepaintBoundary(
                        // ✅ Isolate repaints
                        child: _buildComplaintCard(complaint),
                      ),
                    ),
                  );
                }

                // ✅ No animation for rest of items
                return RepaintBoundary(child: _buildComplaintCard(complaint));
              },
            ),
          ),
          // Show subtle loading indicator at top when refreshing with existing data
          if (provider.isLoading && provider.complaints.isNotEmpty)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 3,
                child: LinearProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildComplaintCard(Complaint complaint) {
    return Consumer<NotificationProvider>(
      builder: (context, notificationProvider, child) {
        // Check if this complaint has unread notifications
        // Parse complaint ID to int for notification lookup
        final complaintId = int.tryParse(complaint.id) ?? 0;
        final hasUnreadNotifications = notificationProvider
            .hasUnreadForComplaint(complaintId);

        return Container(
          margin: EdgeInsets.only(bottom: 16),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // Haptic feedback on tap
                HapticFeedback.selectionClick();

                // Load the complaint into provider first
                final provider = Provider.of<ComplaintProvider>(
                  context,
                  listen: false,
                );
                // Set current complaint immediately to avoid showing stale data
                provider.setCurrentComplaint(complaint);

                // Navigate to complaint detail view
                Navigator.pushNamed(
                  context,
                  '/complaint-detail-view',
                  arguments: complaint.id,
                ).then((_) {
                  // Refresh unread count when returning from detail page
                  notificationProvider.refreshUnreadCount();
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Ink(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: hasUnreadNotifications
                      ? Border.all(
                          color: const Color(0xFF4CAF50).withValues(alpha: 0.3),
                          width: 2,
                        )
                      : null,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      offset: Offset(0, 2),
                      blurRadius: 8,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Unread indicator dot
                      if (hasUnreadNotifications)
                        Padding(
                          padding: const EdgeInsets.only(right: 8.0, top: 4.0),
                          child: UnreadIndicator(
                            size: 10,
                            color: const Color(0xFF4CAF50),
                          ),
                        ),

                      // Thumbnail image if available
                      if (complaint.imageUrls.isNotEmpty)
                        Container(
                          width: 80,
                          height: 80,
                          margin: EdgeInsets.only(right: 12),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: FastImage(
                              imageUrl: UrlHelper.getImageUrl(
                                complaint.imageUrls.first,
                              ),
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),

                      // Complaint details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header: ID and Status
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '#${complaint.id}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF4CAF50),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                _buildStatusBadge(complaint.status),
                              ],
                            ),
                            SizedBox(height: 8),

                            // Title
                            Text(
                              complaint.title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[800],
                                height: 1.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            SizedBox(height: 6),

                            // Location
                            Row(
                              children: [
                                Icon(
                                  Icons.location_on_outlined,
                                  size: 14,
                                  color: Colors.grey[600],
                                ),
                                SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    complaint.location,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey[600],
                                      height: 1.2,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 6),

                            // Geographical Information
                            if (complaint.geographicalInfo.isNotEmpty)
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Color(
                                    0xFF4CAF50,
                                  ).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.location_city,
                                      size: 12,
                                      color: Color(0xFF4CAF50),
                                    ),
                                    SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        complaint.geographicalInfo,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFF4CAF50),
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            if (complaint.geographicalInfo.isNotEmpty)
                              SizedBox(height: 6),

                            // Time and Media indicators
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.access_time,
                                      size: 14,
                                      color: Colors.grey[600],
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      _getTimeAgo(complaint.createdAt),
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    // Media indicators
                                    if (complaint.imageUrls.isNotEmpty ||
                                        complaint.audioUrls.isNotEmpty)
                                      Row(
                                        children: [
                                          if (complaint.imageUrls.isNotEmpty)
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.image_outlined,
                                                  size: 14,
                                                  color: Colors.grey[600],
                                                ),
                                                SizedBox(width: 4),
                                                Text(
                                                  '${complaint.imageUrls.length}',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          if (complaint.imageUrls.isNotEmpty &&
                                              complaint.audioUrls.isNotEmpty)
                                            SizedBox(width: 8),
                                          if (complaint.audioUrls.isNotEmpty)
                                            Icon(
                                              Icons.mic_outlined,
                                              size: 14,
                                              color: Colors.grey[600],
                                            ),
                                        ],
                                      ),
                                    // New update indicator
                                    if (hasUnreadNotifications)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          left: 8.0,
                                        ),
                                        child: Container(
                                          padding: EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(
                                              0xFF4CAF50,
                                            ).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.fiber_new,
                                                size: 14,
                                                color: const Color(0xFF4CAF50),
                                              ),
                                              SizedBox(width: 4),
                                              Text(
                                                'Update',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                  color: const Color(
                                                    0xFF4CAF50,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    // Map backend status to display
    switch (status.toUpperCase()) {
      case 'PENDING':
        backgroundColor = Color(0xFFFFF3CD);
        textColor = Color(0xFF856404);
        displayText = 'Pending';
        break;
      case 'IN_PROGRESS':
        backgroundColor = Color(0xFFD1ECF1);
        textColor = Color(0xFF0C5460);
        displayText = 'In Progress';
        break;
      case 'RESOLVED':
        backgroundColor = Color(0xFFD4EDDA);
        textColor = Color(0xFF155724);
        displayText = 'Resolved';
        break;
      case 'REJECTED':
        backgroundColor = Color(0xFFF8D7DA);
        textColor = Color(0xFF721C24);
        displayText = 'Rejected';
        break;
      default:
        backgroundColor = Color(0xFFF8F9FA);
        textColor = Color(0xFF6C757D);
        displayText = status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        Navigator.pushReplacementNamed(context, '/home');
        break;
      case 1:
        Navigator.pushReplacementNamed(context, '/emergency');
        break;
      case 2:
        Navigator.pushReplacementNamed(context, '/waste-management');
        break;
      case 3:
        Navigator.pushReplacementNamed(context, '/gallery');
        break;
    }
  }
}
