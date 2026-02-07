import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../components/custom_bottom_nav.dart';
import '../providers/notice_provider.dart';
import '../providers/language_provider.dart';
import '../models/notice_model.dart';
import '../widgets/translated_text.dart';
import '../widgets/offline_banner.dart';
import '../widgets/optimized/fast_image.dart';
import '../widgets/optimized/smart_builder.dart';
import 'notice_detail_page.dart';

class NoticeBoardPage extends StatefulWidget {
  const NoticeBoardPage({super.key});

  @override
  State<NoticeBoardPage> createState() => _NoticeBoardPageState();
}

class _NoticeBoardPageState extends State<NoticeBoardPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  int _currentIndex = 0;
  int? _selectedCategoryId;

  // Color scheme matching the home page
  static const Color green = Color(0xFF2E8B57);
  static const Color greenLight = Color(0xFF3CB371);
  static const Color greenSoft = Color(0xFF7CC289);
  static const Color yellow = Color(0xFFF6D66B);
  static const Color yellowLight = Color(0xFFFFE55C);
  static const Color red = Color(0xFFE86464);
  static const Color redLight = Color(0xFFFF6B6B);
  static const Color blue = Color(0xFF4A90E2);
  static const Color purple = Color(0xFF9B59B6);
  static const Color orange = Color(0xFFFF8C42);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animationController.forward();

    // Load notices and categories
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final noticeProvider = Provider.of<NoticeProvider>(
        context,
        listen: false,
      );
      noticeProvider.loadNotices();
      noticeProvider.loadCategories();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final noticeProvider = Provider.of<NoticeProvider>(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.languageCode;

    return Scaffold(
      backgroundColor: const Color(0xFFF3FAF5),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE9F6EE), Color(0xFFF7FCF9), Color(0xFFF3FAF5)],
          ),
        ),
        child: SafeArea(
          child: noticeProvider.isLoading && noticeProvider.notices.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : noticeProvider.error != null && noticeProvider.notices.isEmpty
              ? _buildErrorState(noticeProvider.error!)
              : RefreshIndicator(
                  onRefresh: () => noticeProvider.loadNotices(refresh: true),
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(child: _buildHeader()),
                      // Offline indicator banner
                      if (noticeProvider.isOffline)
                        SliverToBoxAdapter(
                          child: OfflineBanner(
                            lastSyncTime: noticeProvider.lastSyncTime,
                          ),
                        ),
                      SliverToBoxAdapter(
                        child: _buildCategoryFilter(noticeProvider),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildLatestAnnouncementsSection(),
                            const SizedBox(height: 20),
                          ]),
                        ),
                      ),
                      _buildNoticesListSliver(
                        noticeProvider.filteredNotices,
                        currentLanguage,
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.all(16),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            const SizedBox(height: 20),
                            _buildStayUpdatedCard(),
                            const SizedBox(height: 100),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
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

  Widget _buildNoticesListSliver(List<Notice> notices, String currentLanguage) {
    if (notices.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Column(
            children: [
              Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                'No notices available',
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate((context, index) {
          final notice = notices[index];
          final bool isLast = index == notices.length - 1;

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Timeline Indicator
                Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: notice.isUrgent ? red : green,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: (notice.isUrgent ? red : green).withOpacity(
                              0.4,
                            ),
                            blurRadius: 8,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(width: 2, color: Colors.grey.shade300),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                // Notice Card
                Expanded(
                  child:
                      Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            child: _buildNoticeCard(notice, currentLanguage),
                          )
                          .animate(
                            delay: (index * 50).ms,
                          ) // Reduced delay for smoother list loading
                          .slideX(begin: 0.1, duration: 400.ms)
                          .fadeIn(),
                ),
              ],
            ),
          );
        }, childCount: notices.length),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: green,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: green.withOpacity(0.3),
            offset: const Offset(0, 8),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'Notice Board',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: -1, duration: 600.ms).fadeIn();
  }

  Widget _buildLatestAnnouncementsSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 4),
            blurRadius: 12,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.notifications_active, color: green, size: 24),
          ),
          const SizedBox(width: 16),
          const TranslatedText(
            'Latest Announcements',
            bn: 'সর্বশেষ ঘোষণা',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2C3E50),
            ),
          ),
        ],
      ),
    ).animate().slideX(begin: -1, duration: 800.ms).fadeIn();
  }

  Widget _buildCategoryFilter(NoticeProvider noticeProvider) {
    if (noticeProvider.categories.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 60,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: noticeProvider.categories.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildCategoryChip(
              'All',
              null,
              green,
              _selectedCategoryId == null,
              () {
                setState(() => _selectedCategoryId = null);
                noticeProvider.setCategoryFilter(null);
              },
            );
          }

          final category = noticeProvider.categories[index - 1];
          return _buildCategoryChip(
            category.name,
            category.icon,
            Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
            _selectedCategoryId == category.id,
            () {
              setState(() => _selectedCategoryId = category.id);
              noticeProvider.setCategoryFilter(category.id);
            },
          );
        },
      ),
    );
  }

  Widget _buildCategoryChip(
    String label,
    String? icon,
    Color color,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.3),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Text(icon, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey.shade700,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Failed to load notices',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Provider.of<NoticeProvider>(
                context,
                listen: false,
              ).loadNotices(refresh: true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: green,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildNoticesList(List<Notice> notices, String currentLanguage) {
    if (notices.isEmpty) {
      return Center(
        child: Column(
          children: [
            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No notices available',
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: notices.length,
      itemBuilder: (context, index) {
        final notice = notices[index];
        final bool isLast = index == notices.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Timeline Indicator
              Column(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: notice.isUrgent ? red : green,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (notice.isUrgent ? red : green).withOpacity(
                            0.4,
                          ),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(width: 2, color: Colors.grey.shade300),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              // Notice Card
              Expanded(
                child:
                    Container(
                          margin: const EdgeInsets.only(bottom: 24),
                          child: _buildNoticeCard(notice, currentLanguage),
                        )
                        .animate(delay: (index * 100).ms)
                        .slideX(begin: 0.1, duration: 400.ms)
                        .fadeIn(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNoticeCard(Notice notice, String currentLanguage) {
    final title = notice.getLocalizedTitle(currentLanguage);
    final description = notice.getLocalizedDescription(currentLanguage);

    // Determine tags and colors based on notice properties
    final List<String> tags = [];
    final List<Color> tagColors = [];

    if (notice.isUrgent) {
      tags.add('URGENT');
      tagColors.add(red);
    }

    if (notice.type == 'EVENT') {
      tags.add('Event');
      tagColors.add(greenSoft);
    } else if (notice.type == 'SCHEDULED') {
      tags.add('Scheduled');
      tagColors.add(blue);
    }

    if (notice.category != null) {
      tags.add(notice.category!.name);
      tagColors.add(
        Color(int.parse(notice.category!.color.replaceFirst('#', '0xFF'))),
      );
    }

    return GestureDetector(
      onTap: () {
        // Navigate to detail page
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                NoticeDetailPage(noticeId: notice.id, initialNotice: notice),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withOpacity(0.1), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              offset: const Offset(0, 2),
              blurRadius: 8,
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              offset: const Offset(0, 8),
              blurRadius: 24,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tags
              if (tags.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: tags.asMap().entries.map((entry) {
                    int index = entry.key;
                    String tag = entry.value;
                    Color color = tagColors[index % tagColors.length];

                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: color.withOpacity(0.3),
                            offset: const Offset(0, 2),
                            blurRadius: 4,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                      child: Text(
                        tag,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              if (tags.isNotEmpty) const SizedBox(height: 12),

              // Title
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2C3E50),
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.5,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),

              // Date and stats
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 8),
                  Text(
                    _formatDate(notice.publishDate),
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Icon(Icons.visibility, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    '${notice.viewCount}',
                    style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                  ),
                ],
              ),
              const Divider(height: 32),
              // Interaction Buttons
              _buildInteractionBar(notice),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInteractionBar(Notice notice) {
    final noticeProvider = Provider.of<NoticeProvider>(context, listen: false);
    final bool isLiked = notice.userInteractions?.contains('LIKE') ?? false;
    final bool isLoved = notice.userInteractions?.contains('LOVE') ?? false;
    final bool hasRsvpYes =
        notice.userInteractions?.contains('RSVP_YES') ?? false;
    final bool isOffline = noticeProvider.isOffline;

    return Row(
      children: [
        _buildInteractionButton(
          icon: isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
          label: '${notice.interactionCounts?['LIKE'] ?? 0}',
          color: blue,
          isActive: isLiked,
          onTap: isOffline
              ? null
              : () => noticeProvider.toggleInteraction(notice.id, 'LIKE'),
        ),
        const SizedBox(width: 16),
        _buildInteractionButton(
          icon: isLoved ? Icons.favorite : Icons.favorite_border,
          label: '${notice.interactionCounts?['LOVE'] ?? 0}',
          color: red,
          isActive: isLoved,
          onTap: isOffline
              ? null
              : () => noticeProvider.toggleInteraction(notice.id, 'LOVE'),
        ),
        const Spacer(),
        if (notice.type == 'EVENT')
          ElevatedButton.icon(
            onPressed: isOffline
                ? null
                : () => noticeProvider.toggleInteraction(notice.id, 'RSVP_YES'),
            icon: Icon(
              hasRsvpYes ? Icons.check_circle : Icons.event_available,
              size: 18,
            ),
            label: Text(hasRsvpYes ? 'Going' : 'RSVP'),
            style: ElevatedButton.styleFrom(
              backgroundColor: hasRsvpYes ? green : Colors.white,
              foregroundColor: hasRsvpYes ? Colors.white : green,
              side: BorderSide(color: green),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInteractionButton({
    required IconData icon,
    required String label,
    required Color color,
    required bool isActive,
    required VoidCallback? onTap,
  }) {
    final displayColor = isActive ? Colors.white : color;
    final borderColor = isActive
        ? color.withOpacity(0.35)
        : Colors.grey.withOpacity(0.2);
    final isDisabled = onTap == null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Opacity(
          opacity: isDisabled ? 0.5 : 1.0,
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: isActive ? 1 : 0),
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            builder: (context, value, child) {
              return Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001)
                  ..rotateX(0.06 * value)
                  ..rotateY(-0.06 * value)
                  ..scale(1 + 0.06 * value),
                child: child,
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                gradient: isActive
                    ? LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [color.withOpacity(0.85), color],
                      )
                    : null,
                color: isActive ? null : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: (isActive ? color : Colors.black).withOpacity(
                      isActive ? 0.35 : 0.08,
                    ),
                    blurRadius: isActive ? 12 : 6,
                    offset: Offset(0, isActive ? 6 : 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: displayColor),
                  const SizedBox(width: 4),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      color: displayColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
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
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  Widget _buildStayUpdatedCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [greenSoft.withOpacity(0.1), green.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: green.withOpacity(0.2), width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: green,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: green.withOpacity(0.3),
                      offset: const Offset(0, 4),
                      blurRadius: 12,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.campaign,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              const Text(
                '📢 Stay Updated',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Enable notifications to receive instant updates about waste collection schedules, events, and important announcements.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    ).animate(delay: 1000.ms).slideY(begin: 1, duration: 600.ms).fadeIn();
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        Navigator.pushReplacementNamed(context, '/');
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
      case 4:
        // QR Scanner
        _showQRScanner();
        break;
    }
  }

  void _showQRScanner() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR স্ক্যানার খোলা হচ্ছে...'),
        backgroundColor: Color(0xFF2E8B57),
      ),
    );
  }
}
