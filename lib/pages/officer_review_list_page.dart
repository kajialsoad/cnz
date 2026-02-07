import 'package:flutter/material.dart';
import '../models/officer_review_model.dart';
import '../services/officer_review_service.dart';
import '../providers/language_provider.dart';
import '../pages/officer_review_detail_page.dart';
import '../widgets/offline_banner.dart';
import '../widgets/optimized/fast_image.dart';
import 'package:provider/provider.dart';

/// Officer Review List Page
/// Shows list of all officers with their reviews
class OfficerReviewListPage extends StatefulWidget {
  const OfficerReviewListPage({super.key});

  @override
  State<OfficerReviewListPage> createState() => _OfficerReviewListPageState();
}

class _OfficerReviewListPageState extends State<OfficerReviewListPage> {
  // ✅ Use ValueNotifiers for better performance
  final ValueNotifier<List<OfficerReview>> _officerReviewsNotifier =
      ValueNotifier([]);
  final ValueNotifier<bool> _isLoadingNotifier = ValueNotifier(true);
  final ValueNotifier<bool> _hasErrorNotifier = ValueNotifier(false);
  final ValueNotifier<String> _errorMessageNotifier = ValueNotifier('');
  final ValueNotifier<bool> _isOfflineNotifier = ValueNotifier(false);
  final ValueNotifier<DateTime?> _lastSyncTimeNotifier = ValueNotifier(null);

  final OfficerReviewService _service = OfficerReviewService();

  @override
  void initState() {
    super.initState();
    _initService();
  }

  Future<void> _initService() async {
    await _service.init();
    _initConnectivityMonitoring();
    _loadOfficerReviews();
  }

  /// Initialize connectivity monitoring
  void _initConnectivityMonitoring() {
    // ✅ Listen to connectivity changes and update notifier
    _service.connectivityStream.listen((isOnline) {
      if (mounted) {
        _isOfflineNotifier.value = !isOnline;

        // Auto-refresh when coming back online
        if (isOnline && _officerReviewsNotifier.value.isNotEmpty) {
          _loadOfficerReviews();
        }
      }
    });

    // Set initial offline status
    _isOfflineNotifier.value = _service.isOffline;
  }

  Future<void> _loadOfficerReviews() async {
    try {
      _isLoadingNotifier.value = true;
      _hasErrorNotifier.value = false;

      final reviews = await _service.getActiveReviews();

      if (mounted) {
        // Get last sync time
        final lastSync = await _service.getLastSyncTime();

        _officerReviewsNotifier.value = reviews;
        _isLoadingNotifier.value = false;
        _lastSyncTimeNotifier.value = lastSync ?? DateTime.now();
      }
    } catch (e) {
      print('Error loading officer reviews: $e');
      if (mounted) {
        _isLoadingNotifier.value = false;
        _hasErrorNotifier.value = true;
        _errorMessageNotifier.value = e.toString();
      }
    }
  }

  @override
  void dispose() {
    // ✅ Dispose all notifiers
    _officerReviewsNotifier.dispose();
    _isLoadingNotifier.dispose();
    _hasErrorNotifier.dispose();
    _errorMessageNotifier.dispose();
    _isOfflineNotifier.dispose();
    _lastSyncTimeNotifier.dispose();
    _service.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final isBangla = languageProvider.languageCode == 'bn';

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF4CAF50),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isBangla ? 'কর্মকর্তা পর্যালোচনা' : 'Officer Reviews',
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
                final newLanguage = isBangla ? 'en' : 'bn';
                languageProvider.setLanguage(newLanguage);
              },
            ),
          ),
          // Refresh button with animation
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            splashRadius: 24,
            onPressed: _loadOfficerReviews,
          ),
        ],
      ),
      body: _buildBody(isBangla),
    );
  }

  Widget _buildBody(bool isBangla) {
    return ValueListenableBuilder<bool>(
      valueListenable: _isLoadingNotifier,
      builder: (context, isLoading, _) {
        if (isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
            ),
          );
        }

        return ValueListenableBuilder<bool>(
          valueListenable: _hasErrorNotifier,
          builder: (context, hasError, _) {
            if (hasError) {
              return ValueListenableBuilder<String>(
                valueListenable: _errorMessageNotifier,
                builder: (context, errorMessage, _) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          isBangla ? 'ত্রুটি ঘটেছে' : 'Error occurred',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Text(
                            errorMessage,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadOfficerReviews,
                          icon: const Icon(Icons.refresh),
                          label: Text(
                            isBangla ? 'পুনরায় চেষ্টা করুন' : 'Try Again',
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4CAF50),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            }

            return ValueListenableBuilder<List<OfficerReview>>(
              valueListenable: _officerReviewsNotifier,
              builder: (context, officerReviews, _) {
                if (officerReviews.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          isBangla
                              ? 'কোনো পর্যালোচনা পাওয়া যায়নি'
                              : 'No reviews found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ValueListenableBuilder<bool>(
                  valueListenable: _isOfflineNotifier,
                  builder: (context, isOffline, _) {
                    return Column(
                      children: [
                        // Offline banner
                        if (isOffline)
                          ValueListenableBuilder<DateTime?>(
                            valueListenable: _lastSyncTimeNotifier,
                            builder: (context, lastSyncTime, _) {
                              return OfflineBanner(lastSyncTime: lastSyncTime);
                            },
                          ),

                        // Officer reviews list
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: _loadOfficerReviews,
                            color: const Color(0xFF4CAF50),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: officerReviews.length,
                              itemBuilder: (context, index) {
                                final review = officerReviews[index];
                                return _buildOfficerCard(review, isBangla);
                              },
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildOfficerCard(OfficerReview review, bool isBangla) {
    final name = isBangla ? (review.nameBn ?? review.name) : review.name;
    final designation = isBangla
        ? (review.designationBn ?? review.designation)
        : review.designation;
    final messageCount = review.messages.length;

    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 300),
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.95 + (0.05 * value),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: GestureDetector(
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
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        OfficerReviewDetailPage(officerReview: review.toJson()),
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    // Officer Image with Hero animation
                    Hero(
                      tag: 'officer_${review.id}',
                      child: Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF4CAF50),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(35),
                          child: review.imageUrl != null
                              ? FastImage(
                                  imageUrl: review.imageUrl!,
                                  width: 70,
                                  height: 70,
                                  fit: BoxFit.cover,
                                  errorWidget: (context, url, error) {
                                    return _buildPlaceholderImage();
                                  },
                                )
                              : _buildPlaceholderImage(),
                        ),
                      ),
                    ),

                    const SizedBox(width: 16),

                    // Officer Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            designation,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.comment,
                                size: 16,
                                color: Colors.grey[500],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isBangla
                                    ? '$messageCount টি মন্তব্য'
                                    : '$messageCount comment${messageCount != 1 ? 's' : ''}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Arrow Icon with animation
                    TweenAnimationBuilder<double>(
                      duration: const Duration(milliseconds: 200),
                      tween: Tween(begin: 0.0, end: 1.0),
                      builder: (context, value, child) {
                        return Transform.translate(
                          offset: Offset(value * 2, 0),
                          child: child,
                        );
                      },
                      child: Icon(
                        Icons.arrow_forward_ios,
                        size: 20,
                        color: Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Color(0xFF4CAF50),
      ),
      child: const Icon(Icons.person, size: 40, color: Colors.white),
    );
  }
}
