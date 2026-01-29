import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:ui';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../models/waste_post_model.dart';
import '../services/waste_management_service.dart';
import '../services/auth_service.dart';
import '../widgets/translated_text.dart';

class WasteManagementDetailPage extends StatefulWidget {
  final WastePost post;
  final String? heroTag;

  const WasteManagementDetailPage({
    super.key,
    required this.post,
    this.heroTag,
  });

  @override
  State<WasteManagementDetailPage> createState() =>
      _WasteManagementDetailPageState();
}

class _WasteManagementDetailPageState extends State<WasteManagementDetailPage>
    with SingleTickerProviderStateMixin {
  final WasteManagementService _service = WasteManagementService();
  final ScrollController _scrollController = ScrollController();

  late WastePost _post;
  String? _token;
  bool _isLoading = false;
  double _scrollOffset = 0.0;

  // Modern Color palette
  static const Color primaryGreen = Color(0xFF2E8B57); // Sea Green
  static const Color accentGreen = Color(0xFF3CB371);
  static const Color lightGreen = Color(0xFFE8F5E9);
  static const Color surfaceColor = Color(0xFFF5F7FA);
  static const Color textColor = Color(0xFF2D3748);
  static const Color subtitleColor = Color(0xFF718096);

  @override
  void initState() {
    super.initState();
    _post = widget.post;
    _loadToken();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    setState(() {
      _scrollOffset = _scrollController.offset;
    });
  }

  Future<void> _loadToken() async {
    final token = await AuthService.getAccessToken();
    if (!mounted) return;
    setState(() {
      _token = token;
    });
  }

  Future<void> _toggleReaction(String reactionType) async {
    if (_token == null) return;

    final oldPost = _post;
    final String? oldReaction = _post.userReaction;

    // Optimistic UI update
    setState(() {
      int newLikeCount = _post.likeCount;
      int newLoveCount = _post.loveCount;
      String? newReaction;

      if (oldReaction == reactionType) {
        // Removing reaction
        newReaction = null;
        if (reactionType == 'LIKE') newLikeCount--;
        if (reactionType == 'LOVE') newLoveCount--;
      } else {
        // Adding or changing reaction
        newReaction = reactionType;
        if (reactionType == 'LIKE') {
          newLikeCount++;
          if (oldReaction == 'LOVE') newLoveCount--;
        } else {
          newLoveCount++;
          if (oldReaction == 'LIKE') newLikeCount--;
        }
      }

      _post = _post.copyWith(
        likeCount: newLikeCount,
        loveCount: newLoveCount,
        userReaction: newReaction,
      );
    });

    try {
      final response = await _service.toggleReaction(
        _token!,
        _post.id,
        reactionType,
      );

      if (!mounted) return;

      // Update with server response
      if (response.containsKey('post')) {
        setState(() {
          _post = WastePost.fromJson(response['post']);
        });
      }
    } catch (e) {
      if (!mounted) return;
      // Revert on error
      setState(() {
        _post = oldPost;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update reaction: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final imageHeight = screenHeight * 0.45;

    return Scaffold(
      backgroundColor: surfaceColor,
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: imageHeight,
                pinned: true,
                backgroundColor: primaryGreen,
                stretch: true,
                leading: _buildBackButton(),
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [
                    StretchMode.zoomBackground,
                    StretchMode.blurBackground,
                  ],
                  background: _buildParallaxImage(imageHeight),
                ),
              ),

              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(30),
                      topRight: Radius.circular(30),
                    ),
                  ),
                  transform: Matrix4.translationValues(0, -20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildContent(),
                    ],
                  ),
                ),
              ),
            ],
          ),

          _buildFloatingActions(),
        ],
      ),
    );
  }

  Widget _buildBackButton() {
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 20,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
    );
  }

  Widget _buildParallaxImage(double imageHeight) {
    if (_post.imageUrl == null || _post.imageUrl!.isEmpty) {
      return _buildPlaceholderImage(imageHeight);
    }

    return Stack(
      children: [
        Positioned.fill(
          child: Hero(
            tag: widget.heroTag ?? 'waste_post_${_post.id}',
            child: CachedNetworkImage(
              imageUrl: _post.imageUrl!,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: Colors.grey[200],
                child: const Center(
                  child: CircularProgressIndicator(color: primaryGreen),
                ),
              ),
              errorWidget: (context, url, error) =>
                  _buildPlaceholderImage(imageHeight),
            ),
          ),
        ),
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.2),
                  Colors.transparent,
                  Colors.black.withOpacity(0.6),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 30,
          left: 20,
          child: _buildCategoryBadge(),
        ),
      ],
    );
  }

  Widget _buildPlaceholderImage(double height) {
    return Container(
      height: height,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryGreen, accentGreen],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.image_outlined,
          size: 80,
          color: Colors.white.withOpacity(0.5),
        ),
      ),
    );
  }

  Widget _buildCategoryBadge() {
    final isCurrentWaste = _post.category == 'CURRENT_WASTE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isCurrentWaste
                    ? Icons.recycling_rounded
                    : Icons.lightbulb_outline_rounded,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                isCurrentWaste ? 'বর্তমান বর্জ্য' : 'ভবিষ্যৎ বর্জ্য',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _post.title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: textColor,
              height: 1.3,
            ),
          ),

          const SizedBox(height: 16),
          _buildMetaInfo(),

          const SizedBox(height: 24),
          _buildReactionSection(),

          const SizedBox(height: 24),
          const Divider(height: 1),
          const SizedBox(height: 24),

          _buildContentSection(),

          const SizedBox(height: 32),
          _buildTipsSection(),

          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildMetaInfo() {
    return Row(
      children: [
        Icon(Icons.access_time_rounded, size: 16, color: subtitleColor),
        const SizedBox(width: 6),
        Text(
          _formatDate(_post.publishedAt ?? _post.createdAt),
          style: const TextStyle(fontSize: 13, color: subtitleColor),
        ),
        const SizedBox(width: 16),
        Icon(Icons.visibility_outlined, size: 16, color: subtitleColor),
        const SizedBox(width: 6),
        Text(
          '${_post.likeCount + _post.loveCount} reactions',
          style: const TextStyle(fontSize: 13, color: subtitleColor),
        ),
      ],
    );
  }

  Widget _buildReactionSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _AnimatedReactionButton(
            icon: Icons.thumb_up_rounded,
            label: 'Like',
            count: _post.likeCount,
            isSelected: _post.userReaction == 'LIKE',
            color: primaryGreen,
            onTap: () => _toggleReaction('LIKE'),
          ),
          Container(height: 40, width: 1, color: Colors.grey[200]),
          _AnimatedReactionButton(
            icon: Icons.favorite_rounded,
            label: 'Love',
            count: _post.loveCount,
            isSelected: _post.userReaction == 'LOVE',
            color: Colors.pink,
            onTap: () => _toggleReaction('LOVE'),
          ),
        ],
      ),
    );
  }

  Widget _buildContentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: primaryGreen.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.article_outlined,
                color: primaryGreen,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'বিস্তারিত তথ্য',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          _post.content,
          style: const TextStyle(
            fontSize: 16,
            color: Color(0xFF4A5568),
            height: 1.8,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }

  Widget _buildTipsSection() {
    final isCurrentWaste = _post.category == 'CURRENT_WASTE';
    final tips = isCurrentWaste
        ? [
            {
              'text': 'জৈব এবং অজৈব বর্জ্য আলাদা করুন',
              'icon': Icons.check_circle_outline,
            },
            {
              'text': 'পুনর্ব্যবহারযোগ্য জিনিস পরিষ্কার রাখুন',
              'icon': Icons.cleaning_services_outlined,
            },
            {
              'text': 'নির্ধারিত সময়ে বর্জ্য সংগ্রহ করুন',
              'icon': Icons.schedule_outlined,
            },
          ]
        : [
            {
              'text': 'পরিবেশ বান্ধব পদ্ধতি অনুসরণ করুন',
              'icon': Icons.eco_outlined,
            },
            {'text': 'বর্জ্য কমানোর চেষ্টা করুন', 'icon': Icons.trending_down},
            {'text': 'পুনর্ব্যবহার বৃদ্ধি করুন', 'icon': Icons.autorenew},
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.lightbulb_outline,
                color: Colors.amber,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              isCurrentWaste ? 'বর্জ্য ব্যবস্থাপনা টিপস' : 'ভবিষ্যৎ পরিকল্পনা',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...tips.asMap().entries.map((entry) {
          final index = entry.key;
          final tip = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.withOpacity(0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(
                    tip['icon'] as IconData,
                    size: 20,
                    color: primaryGreen,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      tip['text'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        color: textColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildFloatingActions() {
    if (_post.imageUrl == null || _post.imageUrl!.isEmpty) {
      return const SizedBox.shrink();
    }

    return Positioned(
      right: 20,
      bottom: 30,
      child: FloatingActionButton(
        onPressed: () => _showFullScreenImage(context),
        backgroundColor: primaryGreen,
        elevation: 4,
        child: const Icon(Icons.zoom_in_rounded, color: Colors.white),
      ),
    );
  }

  void _showFullScreenImage(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.9),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: CachedNetworkImage(
                  imageUrl: _post.imageUrl!,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => const Center(
                    child: CircularProgressIndicator(color: primaryGreen),
                  ),
                  errorWidget: (context, url, error) =>
                      const Icon(Icons.error, color: Colors.white, size: 50),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'আজ';
    } else if (difference.inDays == 1) {
      return 'গতকাল';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} দিন আগে';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks সপ্তাহ আগে';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months মাস আগে';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class _AnimatedReactionButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final int count;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;

  const _AnimatedReactionButton({
    required this.icon,
    required this.label,
    required this.count,
    required this.isSelected,
    required this.color,
    required this.onTap,
  });

  @override
  State<_AnimatedReactionButton> createState() =>
      _AnimatedReactionButtonState();
}

class _AnimatedReactionButtonState extends State<_AnimatedReactionButton> {
  bool _isAnimating = false;

  void _handleTap() {
    if (!_isAnimating) {
      setState(() => _isAnimating = true);
      widget.onTap();
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) {
          setState(() => _isAnimating = false);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: Colors.transparent,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedScale(
              scale: _isAnimating ? 1.2 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                widget.icon,
                size: 28,
                color: widget.isSelected ? widget.color : Colors.grey[400],
              ),
            ),

            const SizedBox(height: 4),

            Text(
              widget.count > 0 ? '${widget.count}' : widget.label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: widget.isSelected ? widget.color : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
