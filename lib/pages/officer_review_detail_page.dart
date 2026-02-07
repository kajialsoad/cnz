import 'package:flutter/material.dart';
import '../widgets/translated_text.dart';
import '../widgets/offline_banner.dart';
import '../widgets/optimized/fast_image.dart';
import '../providers/language_provider.dart';
import '../services/connectivity_service.dart';
import 'package:provider/provider.dart';

/// Officer Review Detail Page
/// Shows detailed view of officer reviews/comments (montoboo)
class OfficerReviewDetailPage extends StatefulWidget {
  final Map<String, dynamic> officerReview;

  const OfficerReviewDetailPage({super.key, required this.officerReview});

  @override
  State<OfficerReviewDetailPage> createState() =>
      _OfficerReviewDetailPageState();
}

class _OfficerReviewDetailPageState extends State<OfficerReviewDetailPage> {
  // ValueNotifier for optimized state management
  final ValueNotifier<bool> _isOfflineNotifier = ValueNotifier<bool>(false);

  @override
  void initState() {
    super.initState();
    _initConnectivityMonitoring();
  }

  void _initConnectivityMonitoring() {
    // Initialize connectivity service
    ConnectivityService().init();

    // Listen to connectivity changes
    ConnectivityService().connectivityStream.listen((isConnected) {
      if (mounted) {
        _isOfflineNotifier.value = !isConnected;
      }
    });

    // Set initial state
    _isOfflineNotifier.value = !ConnectivityService().isOnline;
  }

  @override
  void dispose() {
    ConnectivityService().dispose();
    _isOfflineNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final isBangla = languageProvider.languageCode == 'bn';

    final name = isBangla
        ? (widget.officerReview['nameBn'] ?? widget.officerReview['name'])
        : widget.officerReview['name'];

    final designation = isBangla
        ? (widget.officerReview['designationBn'] ??
              widget.officerReview['designation'])
        : widget.officerReview['designation'];

    final messages = (widget.officerReview['messages'] as List?) ?? [];

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF4CAF50),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          splashRadius: 24,
          onPressed: () => Navigator.pop(context),
        ),
        title: TranslatedText(
          'Officer Review Details',
          bn: 'কর্মকর্তা পর্যালোচনা বিস্তারিত',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          // Language toggle with animation
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return ScaleTransition(
                scale: animation,
                child: RotationTransition(turns: animation, child: child),
              );
            },
            child: IconButton(
              key: ValueKey<String>(isBangla ? 'bn' : 'en'),
              icon: const Icon(Icons.language, color: Colors.white),
              tooltip: isBangla ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন',
              splashRadius: 24,
              onPressed: () {
                // Toggle between Bangla and English
                final newLanguage = isBangla ? 'en' : 'bn';
                languageProvider.setLanguage(newLanguage);
              },
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Offline Banner
            ValueListenableBuilder<bool>(
              valueListenable: _isOfflineNotifier,
              builder: (context, isOffline, _) {
                if (!isOffline) return const SizedBox.shrink();
                return OfflineBanner();
              },
            ),

            // Officer Info Card with fade-in animation
            TweenAnimationBuilder<double>(
              duration: const Duration(milliseconds: 400),
              tween: Tween(begin: 0.0, end: 1.0),
              builder: (context, value, child) {
                return Opacity(
                  opacity: value,
                  child: Transform.translate(
                    offset: Offset(0, 20 * (1 - value)),
                    child: child,
                  ),
                );
              },
              child: _buildOfficerInfoCard(name, designation),
            ),

            const SizedBox(height: 16),

            // Messages/Comments Section
            _buildMessagesSection(messages, isBangla),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildOfficerInfoCard(String name, String designation) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFF4CAF50), const Color(0xFF45A049)],
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 24),

          // Officer Image with Hero animation
          Hero(
            tag: 'officer_${widget.officerReview['id']}',
            child: TweenAnimationBuilder<double>(
              duration: const Duration(milliseconds: 500),
              tween: Tween(begin: 0.0, end: 1.0),
              builder: (context, value, child) {
                return Transform.scale(
                  scale: 0.8 + (0.2 * value),
                  child: Opacity(opacity: value, child: child),
                );
              },
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  color: Colors.white,
                ),
                child: ClipOval(
                  child: widget.officerReview['imageUrl'] != null
                      ? FastImage(
                          imageUrl: widget.officerReview['imageUrl'],
                          width: 120,
                          height: 120,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => Icon(
                            Icons.person,
                            size: 60,
                            color: Colors.grey[400],
                          ),
                        )
                      : Icon(Icons.person, size: 60, color: Colors.grey[400]),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Officer Name with fade-in animation
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 600),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, 10 * (1 - value)),
                  child: child,
                ),
              );
            },
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: 8),

          // Designation with fade-in animation
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 700),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, 10 * (1 - value)),
                  child: child,
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                designation,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildMessagesSection(List messages, bool isBangla) {
    if (messages.isEmpty) {
      return TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 500),
        tween: Tween(begin: 0.0, end: 1.0),
        builder: (context, value, child) {
          return Opacity(
            opacity: value,
            child: Transform.scale(scale: 0.95 + (0.05 * value), child: child),
          );
        },
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(Icons.message_outlined, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              TranslatedText(
                'No comments available',
                bn: 'কোন মন্তব্য নেই',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header with fade-in animation
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 500),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(-20 * (1 - value), 0),
                  child: child,
                ),
              );
            },
            child: Row(
              children: [
                const Icon(Icons.comment, size: 20, color: Color(0xFF4CAF50)),
                const SizedBox(width: 8),
                TranslatedText(
                  'Officer Comments',
                  bn: 'কর্মকর্তার মন্তব্য',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${messages.length}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4CAF50),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Messages List with staggered animation
          ...messages.asMap().entries.map((entry) {
            final index = entry.key;
            final message = entry.value;
            return _buildMessageCard(message, index + 1, isBangla, index);
          }),
        ],
      ),
    );
  }

  Widget _buildMessageCard(
    Map<String, dynamic> message,
    int index,
    bool isBangla,
    int cardIndex,
  ) {
    final content = isBangla
        ? (message['contentBn'] ?? message['content'])
        : message['content'];

    // Staggered animation delay based on card index
    final delay = Duration(milliseconds: 600 + (cardIndex * 100));

    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 400),
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        // Apply animation only after delay
        final animationValue = (value * (cardIndex + 1) - cardIndex).clamp(
          0.0,
          1.0,
        );

        return Opacity(
          opacity: animationValue,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - animationValue)),
            child: child,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF4CAF50).withOpacity(0.2),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () {
              // Optional: Add interaction feedback
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Index Badge with scale animation
                  TweenAnimationBuilder<double>(
                    duration: const Duration(milliseconds: 300),
                    tween: Tween(begin: 0.0, end: 1.0),
                    builder: (context, value, child) {
                      return Transform.scale(
                        scale: 0.5 + (0.5 * value),
                        child: child,
                      );
                    },
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFF4CAF50),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF4CAF50).withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          '$index',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Message Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          content,
                          style: TextStyle(
                            fontSize: 15,
                            height: 1.6,
                            color: Colors.grey[800],
                          ),
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
  }
}
