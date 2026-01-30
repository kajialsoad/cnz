import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/notice_model.dart';
import '../providers/notice_provider.dart';
import '../providers/language_provider.dart';
import '../widgets/translated_text.dart';

class NoticeDetailPage extends StatefulWidget {
  final int noticeId;

  const NoticeDetailPage({super.key, required this.noticeId});

  @override
  State<NoticeDetailPage> createState() => _NoticeDetailPageState();
}

class _NoticeDetailPageState extends State<NoticeDetailPage>
    with SingleTickerProviderStateMixin {
  Notice? _notice;
  bool _isLoading = true;
  String? _error;
  late AnimationController _animationController;
  bool _isMarkedAsRead = false;

  // Color scheme
  static const Color green = Color(0xFF2E8B57);
  static const Color greenLight = Color(0xFF3CB371);
  static const Color red = Color(0xFFE86464);
  static const Color blue = Color(0xFF4A90E2);
  static const Color orange = Color(0xFFFF8C42);
  static const Color purple = Color(0xFF9B59B6);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animationController.forward();
    _loadNotice();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadNotice() async {
    try {
      final noticeProvider = Provider.of<NoticeProvider>(
        context,
        listen: false,
      );
      final notice = await noticeProvider.getNoticeById(widget.noticeId);

      // Increment view count
      await noticeProvider.incrementViewCount(widget.noticeId);

      if (mounted) {
        setState(() {
          _notice = notice;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleInteraction(String type) async {
    if (!mounted || _notice == null) return;
    final currentInteractions = List<String>.from(
      _notice!.userInteractions ?? [],
    );
    final currentCounts = Map<String, int>.from(
      _notice!.interactionCounts ?? {},
    );
    final bool isAdding = !currentInteractions.contains(type);

    if (type == 'LIKE' || type == 'LOVE') {
      final otherType = type == 'LIKE' ? 'LOVE' : 'LIKE';
      if (currentInteractions.contains(otherType)) {
        currentInteractions.remove(otherType);
        currentCounts[otherType] = (currentCounts[otherType] ?? 1) - 1;
        if ((currentCounts[otherType] ?? 0) < 0) {
          currentCounts[otherType] = 0;
        }
      }
    }

    if (isAdding) {
      currentInteractions.add(type);
      currentCounts[type] = (currentCounts[type] ?? 0) + 1;
    } else {
      currentInteractions.remove(type);
      currentCounts[type] = (currentCounts[type] ?? 1) - 1;
      if ((currentCounts[type] ?? 0) < 0) {
        currentCounts[type] = 0;
      }
    }

    setState(() {
      _notice = _notice!.copyWith(
        interactionCounts: currentCounts,
        userInteractions: currentInteractions,
      );
    });

    await Provider.of<NoticeProvider>(
      context,
      listen: false,
    ).toggleInteraction(_notice!.id, type);
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.languageCode;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: const Color(0xFFF3FAF5),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF2E8B57)),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.share, color: Color(0xFF2E8B57)),
              onPressed: () {
                // Share functionality
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Share feature coming soon!')),
                );
              },
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: green),
                  const SizedBox(height: 16),
                  Text(
                    currentLanguage == 'bn' ? 'লোড হচ্ছে...' : 'Loading...',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            )
          : _error != null
          ? _buildErrorState(currentLanguage)
          : _notice == null
          ? _buildNotFoundState(currentLanguage)
          : _buildNoticeContent(currentLanguage),
    );
  }

  Widget _buildErrorState(String currentLanguage) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.error_outline, size: 64, color: red),
            ),
            const SizedBox(height: 24),
            Text(
              currentLanguage == 'bn' ? 'ত্রুটি ঘটেছে' : 'Error Occurred',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadNotice,
              icon: const Icon(Icons.refresh),
              label: Text(
                currentLanguage == 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ).animate().scale(duration: 400.ms).fadeIn(),
    );
  }

  Widget _buildNotFoundState(String currentLanguage) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: orange.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search_off, size: 64, color: orange),
            ),
            const SizedBox(height: 24),
            Text(
              currentLanguage == 'bn'
                  ? 'নোটিশ পাওয়া যায়নি'
                  : 'Notice Not Found',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text(
              currentLanguage == 'bn'
                  ? 'এই নোটিশটি মুছে ফেলা হয়েছে বা আর উপলব্ধ নেই'
                  : 'This notice has been removed or is no longer available',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back),
              label: Text(currentLanguage == 'bn' ? 'ফিরে যান' : 'Go Back'),
              style: ElevatedButton.styleFrom(
                backgroundColor: green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ).animate().scale(duration: 400.ms).fadeIn(),
    );
  }

  Widget _buildNoticeContent(String currentLanguage) {
    return CustomScrollView(
      slivers: [
        // Hero Image Section
        if (_notice!.imageUrl != null && _notice!.imageUrl!.isNotEmpty)
          SliverToBoxAdapter(child: _buildHeroImage()),

        // Content Section
        SliverToBoxAdapter(
          child: Transform.translate(
            offset: _notice!.imageUrl != null && _notice!.imageUrl!.isNotEmpty
                ? const Offset(0, -30)
                : Offset.zero,
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFE9F6EE),
                    Color(0xFFF7FCF9),
                    Color(0xFFF3FAF5),
                  ],
                ),
                borderRadius:
                    _notice!.imageUrl != null && _notice!.imageUrl!.isNotEmpty
                    ? const BorderRadius.only(
                        topLeft: Radius.circular(30),
                        topRight: Radius.circular(30),
                      )
                    : null,
              ),
              child: Column(
                children: [
                  _buildHeaderSection(currentLanguage),
                  _buildContentSection(currentLanguage),
                  _buildStatsSection(currentLanguage),
                  _buildInteractionSection(currentLanguage),
                  _buildActionButtons(currentLanguage),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroImage() {
    return Hero(
      tag: 'notice-image-${_notice!.id}',
      child: Stack(
        children: [
          CachedNetworkImage(
            imageUrl: _notice!.imageUrl!,
            width: double.infinity,
            height: 350,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              height: 350,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [green.withOpacity(0.3), greenLight.withOpacity(0.2)],
                ),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
            errorWidget: (context, url, error) => Container(
              height: 350,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [green.withOpacity(0.3), greenLight.withOpacity(0.2)],
                ),
              ),
              child: const Center(
                child: Icon(
                  Icons.image_not_supported,
                  size: 64,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          // Gradient overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withOpacity(0.3)],
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms);
  }

  Widget _buildHeaderSection(String currentLanguage) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (_notice!.isUrgent)
                _buildGlassBadge(
                  currentLanguage == 'bn' ? '🚨 জরুরি' : '🚨 URGENT',
                  red,
                ),
              if (_notice!.category != null)
                _buildGlassBadge(
                  '${_notice!.category!.icon ?? '📢'} ${currentLanguage == 'bn' && _notice!.category!.nameBn != null ? _notice!.category!.nameBn! : _notice!.category!.name}',
                  Color(
                    int.parse(
                      _notice!.category!.color.replaceFirst('#', '0xFF'),
                    ),
                  ),
                ),
              _buildGlassBadge(
                _getTypeLabel(_notice!.type, currentLanguage),
                _getTypeColor(_notice!.type),
              ),
            ],
          ).animate().slideX(begin: -0.2, duration: 500.ms).fadeIn(),

          const SizedBox(height: 20),

          // Title
          Text(
            _notice!.getLocalizedTitle(currentLanguage),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
              height: 1.3,
            ),
          ).animate().slideY(begin: 0.3, duration: 600.ms).fadeIn(),

          const SizedBox(height: 12),

          // Description
          Text(
                _notice!.getLocalizedDescription(currentLanguage),
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              )
              .animate(delay: 100.ms)
              .slideY(begin: 0.3, duration: 600.ms)
              .fadeIn(),

          const SizedBox(height: 20),

          // Date Info
          _buildGlassInfoCard([
            _buildInfoRow(
              Icons.calendar_today,
              currentLanguage == 'bn' ? 'প্রকাশিত' : 'Published',
              _formatDate(_notice!.publishDate, currentLanguage),
              green,
            ),
            if (_notice!.expiryDate != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.event_busy,
                currentLanguage == 'bn' ? 'মেয়াদ শেষ' : 'Expires',
                _formatDate(_notice!.expiryDate!, currentLanguage),
                orange,
              ),
            ],
          ]).animate(delay: 200.ms).scale(duration: 500.ms).fadeIn(),
        ],
      ),
    );
  }

  Widget _buildContentSection(String currentLanguage) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.article, color: green, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    currentLanguage == 'bn'
                        ? 'বিস্তারিত তথ্য'
                        : 'Detailed Information',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2C3E50),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                _notice!.getLocalizedContent(currentLanguage),
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.8,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate(delay: 300.ms).slideY(begin: 0.3, duration: 600.ms).fadeIn();
  }

  Widget _buildStatsSection(String currentLanguage) {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                Icons.visibility,
                _notice!.viewCount.toString(),
                currentLanguage == 'bn' ? 'দেখা হয়েছে' : 'Views',
                blue,
              ),
              Container(
                width: 1,
                height: 50,
                color: Colors.grey.withOpacity(0.3),
              ),
              _buildStatItem(
                Icons.check_circle,
                _notice!.readCount.toString(),
                currentLanguage == 'bn' ? 'পড়া হয়েছে' : 'Reads',
                green,
              ),
              Container(
                width: 1,
                height: 50,
                color: Colors.grey.withOpacity(0.3),
              ),
              _buildStatItem(
                Icons.favorite,
                (_notice!.interactionCounts?['LOVE'] ?? 0).toString(),
                currentLanguage == 'bn' ? 'পছন্দ' : 'Loves',
                red,
              ),
            ],
          ),
        ),
      ),
    ).animate(delay: 400.ms).scale(duration: 500.ms).fadeIn();
  }

  Widget _buildInteractionSection(String currentLanguage) {
    final bool isLiked = _notice!.userInteractions?.contains('LIKE') ?? false;
    final bool isLoved = _notice!.userInteractions?.contains('LOVE') ?? false;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildInteractionButton(
                isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                (_notice!.interactionCounts?['LIKE'] ?? 0).toString(),
                currentLanguage == 'bn' ? 'লাইক' : 'Like',
                blue,
                isLiked,
                () => _handleInteraction('LIKE'),
              ),
              _buildInteractionButton(
                isLoved ? Icons.favorite : Icons.favorite_border,
                (_notice!.interactionCounts?['LOVE'] ?? 0).toString(),
                currentLanguage == 'bn' ? 'ভালোবাসা' : 'Love',
                red,
                isLoved,
                () => _handleInteraction('LOVE'),
              ),
            ],
          ),
        ),
      ),
    ).animate(delay: 500.ms).slideY(begin: 0.3, duration: 600.ms).fadeIn();
  }

  Widget _buildActionButtons(String currentLanguage) {
    return Container(
      margin: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Mark as Read Button
          Container(
                width: double.infinity,
                height: 60,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [green, greenLight],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: green.withOpacity(0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _isMarkedAsRead
                        ? null
                        : () async {
                            final noticeProvider = Provider.of<NoticeProvider>(
                              context,
                              listen: false,
                            );
                            await noticeProvider.markAsRead(widget.noticeId);
                            if (mounted) {
                              setState(() {
                                _isMarkedAsRead = true;
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    currentLanguage == 'bn'
                                        ? '✓ পড়া হয়েছে হিসেবে চিহ্নিত'
                                        : '✓ Marked as read',
                                  ),
                                  backgroundColor: green,
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              );
                            }
                          },
                    borderRadius: BorderRadius.circular(20),
                    child: Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isMarkedAsRead ? Icons.check_circle : Icons.check,
                            color: Colors.white,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _isMarkedAsRead
                                ? (currentLanguage == 'bn'
                                      ? 'পড়া হয়েছে ✓'
                                      : 'Marked as Read ✓')
                                : (currentLanguage == 'bn'
                                      ? 'পড়া হয়েছে হিসেবে চিহ্নিত করুন'
                                      : 'Mark as Read'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              )
              .animate(delay: 600.ms)
              .slideY(begin: 0.5, duration: 600.ms)
              .fadeIn(),
        ],
      ),
    );
  }

  Widget _buildGlassBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGlassInfoCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2C3E50),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatItem(
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildInteractionButton(
    IconData icon,
    String count,
    String label,
    Color color,
    bool isActive,
    VoidCallback onTap,
  ) {
    final baseColor = isActive ? Colors.white : Colors.grey[600]!;
    final borderColor = isActive
        ? color.withOpacity(0.4)
        : Colors.grey.withOpacity(0.2);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: isActive ? 1 : 0),
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          builder: (context, value, child) {
            return Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateX(0.08 * value)
                ..rotateY(-0.08 * value)
                ..scale(1 + 0.08 * value),
              child: child,
            );
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
            decoration: BoxDecoration(
              gradient: isActive
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        color.withOpacity(0.85),
                        color,
                        color.withOpacity(0.9),
                      ],
                    )
                  : null,
              color: isActive ? null : Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: borderColor, width: 1),
              boxShadow: [
                BoxShadow(
                  color: (isActive ? color : Colors.black).withOpacity(
                    isActive ? 0.35 : 0.08,
                  ),
                  blurRadius: isActive ? 18 : 10,
                  offset: Offset(0, isActive ? 10 : 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Icon(icon, color: baseColor, size: 30),
                const SizedBox(height: 6),
                Text(
                  count,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: baseColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isActive ? Colors.white70 : Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getTypeLabel(String type, String currentLanguage) {
    if (currentLanguage == 'bn') {
      switch (type) {
        case 'URGENT':
          return 'জরুরি';
        case 'EVENT':
          return 'ইভেন্ট';
        case 'SCHEDULED':
          return 'নির্ধারিত';
        case 'GENERAL':
          return 'সাধারণ';
        default:
          return type;
      }
    }
    return type;
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'URGENT':
        return red;
      case 'EVENT':
        return green;
      case 'SCHEDULED':
        return orange;
      default:
        return blue;
    }
  }

  String _formatDate(DateTime date, String currentLanguage) {
    if (currentLanguage == 'bn') {
      final months = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
      ];
      return '${date.day} ${months[date.month - 1]}, ${date.year}';
    } else {
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
  }
}
