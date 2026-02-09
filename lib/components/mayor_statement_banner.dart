import 'dart:async';

import 'package:flutter/material.dart';

import '../widgets/translated_text.dart';
import '../models/officer_review_model.dart';
import '../services/officer_review_service.dart';
import '../providers/language_provider.dart';
import '../pages/officer_review_detail_page.dart';
import 'package:provider/provider.dart';
import '../widgets/optimized/fast_image.dart';

class MayorStatementBanner extends StatefulWidget {
  const MayorStatementBanner({super.key});

  @override
  State<MayorStatementBanner> createState() => _MayorStatementBannerState();
}

class _MayorStatementBannerState extends State<MayorStatementBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  Timer? _messageAutoScrollTimer;
  Timer? _personAutoScrollTimer;
  int _currentPersonIndex = 0;
  int _currentMessageIndex = 0;
  late PageController _pageController;
  final OfficerReviewService _service = OfficerReviewService();

  // Dynamic data from API
  List<OfficerReview> _officerReviews = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    _fadeController.forward();

    // Load dynamic data
    _initService();
  }

  Future<void> _initService() async {
    await _service.init();
    _loadOfficerReviews();
  }

  Future<void> _loadOfficerReviews() async {
    try {
      // OPTIMIZATION: Cache-first loading strategy
      // 1. Try to load from cache first (instant)
      // 2. Then fetch fresh data in background

      // Load from cache immediately (if available)
      try {
        final cachedReviews = await _service.getActiveReviews(useCache: true);
        if (mounted && cachedReviews.isNotEmpty) {
          setState(() {
            _officerReviews = cachedReviews;
            _isLoading = false;
            _hasError = false;
          });

          // Start auto-scroll with cached data
          _startMessageAutoScroll();
          _startPersonAutoScroll();
        }
      } catch (cacheError) {
        print('Cache load failed, will fetch from API: $cacheError');
      }

      // Fetch fresh data in background (non-blocking)
      // Small delay to let UI render first
      await Future.delayed(const Duration(milliseconds: 100));

      final freshReviews = await _service.getActiveReviews(useCache: false);

      if (mounted) {
        setState(() {
          _officerReviews = freshReviews;
          _isLoading = false;
          _hasError = false;
        });

        // Start auto-scroll if not already started
        if (_messageAutoScrollTimer == null && _officerReviews.isNotEmpty) {
          _startMessageAutoScroll();
          _startPersonAutoScroll();
        }
      }
    } catch (e) {
      print('Error loading officer reviews: $e');
      if (mounted) {
        setState(() {
          // Only show error if we don't have cached data
          if (_officerReviews.isEmpty) {
            _isLoading = false;
            _hasError = true;
          }
        });
      }
    }
  }

  void _startMessageAutoScroll() {
    // OPTIMIZATION: Increased interval from 2s to 4s to reduce CPU usage
    _messageAutoScrollTimer = Timer.periodic(const Duration(seconds: 4), (
      timer,
    ) {
      if (_officerReviews.isNotEmpty && mounted) {
        _nextMessage();
      }
    });
  }

  void _startPersonAutoScroll() {
    // OPTIMIZATION: Increased interval from 6s to 8s to reduce CPU usage
    _personAutoScrollTimer = Timer.periodic(const Duration(seconds: 8), (
      timer,
    ) {
      if (_officerReviews.isNotEmpty && mounted) {
        _nextPerson();
      }
    });
  }

  void _nextMessage() {
    if (_officerReviews.isEmpty) return;

    _fadeController.reverse().then((_) {
      if (mounted) {
        setState(() {
          final maxMessages =
              _officerReviews[_currentPersonIndex].messages.length;
          _currentMessageIndex = (_currentMessageIndex + 1) % maxMessages;
        });
        _fadeController.forward();
      }
    });
  }

  void _nextPerson() {
    if (_officerReviews.isEmpty) return;
    
    // Check if controller is attached to any view
    if (!_pageController.hasClients) return;

    final nextIndex = (_currentPersonIndex + 1) % _officerReviews.length;
    _pageController.animateToPage(
      nextIndex,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPersonIndex = index;
      _currentMessageIndex = 0; // Reset message index when person changes
    });
    _fadeController.forward();
  }

  Widget _buildImage(String imageUrl) {
    // Check if it's a local asset path or network URL
    final isAsset = imageUrl.startsWith('assets/');

    if (isAsset) {
      return Image.asset(
        imageUrl,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholder();
        },
      );
    } else {
      return FastImage(
        imageUrl: imageUrl,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        errorWidget: (context, url, error) {
          return _buildPlaceholder();
        },
      );
    }
  }

  Widget _buildPlaceholder() {
    return Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Color(0xFF1E88E5),
      ),
      child: const Icon(Icons.person, color: Colors.white, size: 24),
    );
  }

  /// Build skeleton loader with shimmer effect for better perceived performance
  Widget _buildSkeletonLoader() {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      height: 120,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            offset: const Offset(0, 2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Skeleton profile image with shimmer
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.grey[300]!,
                  Colors.grey[200]!,
                  Colors.grey[300]!,
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Skeleton text content with shimmer
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name skeleton
                Container(
                  width: 120,
                  height: 14,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.grey[300]!,
                        Colors.grey[200]!,
                        Colors.grey[300]!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                // Message line 1 skeleton
                Container(
                  width: double.infinity,
                  height: 12,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.grey[300]!,
                        Colors.grey[200]!,
                        Colors.grey[300]!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                // Message line 2 skeleton
                Container(
                  width: MediaQuery.of(context).size.width * 0.6,
                  height: 12,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.grey[300]!,
                        Colors.grey[200]!,
                        Colors.grey[300]!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _messageAutoScrollTimer?.cancel();
    _personAutoScrollTimer?.cancel();
    _pageController.dispose();
    _service.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Show skeleton loading state instead of spinner
    if (_isLoading) {
      return _buildSkeletonLoader();
    }

    if (_hasError || _officerReviews.isEmpty) {
      return const SizedBox.shrink(); // Hide banner if error or no data
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      height: 120,
      child: PageView.builder(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        itemCount: _officerReviews.length,
        itemBuilder: (context, personIndex) {
          final review = _officerReviews[personIndex];

          // Safety check for messages
          if (review.messages.isEmpty) {
            return const SizedBox.shrink();
          }

          final currentMessage =
              review.messages[_currentMessageIndex % review.messages.length];
          final languageProvider = Provider.of<LanguageProvider>(context);
          final isEnglish = languageProvider.isEnglish;

          // Get localized content
          final displayName = isEnglish
              ? review.name
              : (review.nameBn ?? review.name);
          final messageContent = isEnglish
              ? currentMessage.content
              : (currentMessage.contentBn ?? currentMessage.content);

          return GestureDetector(
            onTap: () {
              // Navigate to detail page
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      OfficerReviewDetailPage(officerReview: review.toJson()),
                ),
              );
            },
            child: Container(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile Image
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              offset: const Offset(0, 2),
                              blurRadius: 4,
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: review.imageUrl != null
                              ? _buildImage(review.imageUrl!)
                              : Container(
                                  width: 48,
                                  height: 48,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color(0xFF1E88E5),
                                  ),
                                  child: const Icon(
                                    Icons.person,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Statement Content
                      Expanded(
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                displayName,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.normal,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                messageContent,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF333333),
                                  height: 1.35,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 18),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Bottom-centered message indicators (dots)
                  Positioned(
                    bottom: 6,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(review.messages.length, (
                          index,
                        ) {
                          final bool active = _currentMessageIndex == index;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: active ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: active
                                  ? const Color(0xFF044E1F)
                                  : const Color(0xFF044E1F).withOpacity(0.28),
                              borderRadius: BorderRadius.circular(6),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),

                  // Person page indicators (top right)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(_officerReviews.length, (index) {
                        final bool active = _currentPersonIndex == index;
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: active
                                ? const Color(0xFF044E1F)
                                : const Color(0xFF044E1F).withOpacity(0.28),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
