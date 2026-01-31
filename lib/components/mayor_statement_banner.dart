import 'dart:async';

import 'package:flutter/material.dart';

import '../widgets/translated_text.dart';
import '../models/officer_review_model.dart';
import '../services/officer_review_service.dart';
import '../providers/language_provider.dart';
import 'package:provider/provider.dart';

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

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _fadeController.forward();
    
    // Load dynamic data
    _loadOfficerReviews();
  }

  Future<void> _loadOfficerReviews() async {
    try {
      final reviews = await OfficerReviewService.getActiveReviews();
      
      if (mounted) {
        setState(() {
          _officerReviews = reviews;
          _isLoading = false;
          _hasError = false;
        });
        
        // Start auto-scroll only after data is loaded
        if (_officerReviews.isNotEmpty) {
          _startMessageAutoScroll();
          _startPersonAutoScroll();
        }
      }
    } catch (e) {
      print('Error loading officer reviews: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  void _startMessageAutoScroll() {
    _messageAutoScrollTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (_officerReviews.isNotEmpty) {
        _nextMessage();
      }
    });
  }

  void _startPersonAutoScroll() {
    _personAutoScrollTimer = Timer.periodic(const Duration(seconds: 6), (timer) {
      if (_officerReviews.isNotEmpty) {
        _nextPerson();
      }
    });
  }

  void _nextMessage() {
    if (_officerReviews.isEmpty) return;
    
    _fadeController.reverse().then((_) {
      if (mounted) {
        setState(() {
          final maxMessages = _officerReviews[_currentPersonIndex].messages.length;
          _currentMessageIndex = (_currentMessageIndex + 1) % maxMessages;
        });
        _fadeController.forward();
      }
    });
  }

  void _nextPerson() {
    if (_officerReviews.isEmpty) return;
    
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
      return Image.network(
        imageUrl,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
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
      child: const Icon(
        Icons.person,
        color: Colors.white,
        size: 24,
      ),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _messageAutoScrollTimer?.cancel();
    _personAutoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Show loading or error state
    if (_isLoading) {
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        height: 120,
        child: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
          ),
        ),
      );
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
          
          final currentMessage = review.messages[_currentMessageIndex % review.messages.length];
          final languageProvider = Provider.of<LanguageProvider>(context);
          final isEnglish = languageProvider.isEnglish;
          
          // Get localized content
          final displayName = isEnglish ? review.name : (review.nameBn ?? review.name);
          final messageContent = isEnglish 
              ? currentMessage.content 
              : (currentMessage.contentBn ?? currentMessage.content);
          
          return Container(
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
                      children: List.generate(review.messages.length, (index) {
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
          );
        },
      ),
    );
  }
}
