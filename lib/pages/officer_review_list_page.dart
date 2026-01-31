import 'package:flutter/material.dart';
import '../models/officer_review_model.dart';
import '../services/officer_review_service.dart';
import '../providers/language_provider.dart';
import '../pages/officer_review_detail_page.dart';
import 'package:provider/provider.dart';

/// Officer Review List Page
/// Shows list of all officers with their reviews
class OfficerReviewListPage extends StatefulWidget {
  const OfficerReviewListPage({super.key});

  @override
  State<OfficerReviewListPage> createState() => _OfficerReviewListPageState();
}

class _OfficerReviewListPageState extends State<OfficerReviewListPage> {
  List<OfficerReview> _officerReviews = [];
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadOfficerReviews();
  }

  Future<void> _loadOfficerReviews() async {
    try {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });

      final reviews = await OfficerReviewService.getActiveReviews();

      if (mounted) {
        setState(() {
          _officerReviews = reviews;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading officer reviews: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
          _errorMessage = e.toString();
        });
      }
    }
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
                child: RotationTransition(
                  turns: animation,
                  child: child,
                ),
              );
            },
            child: IconButton(
              key: ValueKey<String>(isBangla ? 'bn' : 'en'),
              icon: const Icon(
                Icons.language,
                color: Colors.white,
              ),
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
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
        ),
      );
    }

    if (_hasError) {
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
                _errorMessage,
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
              label: Text(isBangla ? 'পুনরায় চেষ্টা করুন' : 'Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_officerReviews.isEmpty) {
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
              isBangla ? 'কোনো পর্যালোচনা পাওয়া যায়নি' : 'No reviews found',
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

    return RefreshIndicator(
      onRefresh: _loadOfficerReviews,
      color: const Color(0xFF4CAF50),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _officerReviews.length,
        itemBuilder: (context, index) {
          final review = _officerReviews[index];
          return _buildOfficerCard(review, isBangla);
        },
      ),
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
          child: Opacity(
            opacity: value,
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: () {
          // Navigate to detail page
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OfficerReviewDetailPage(
                officerReview: review.toJson(),
              ),
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
                    builder: (context) => OfficerReviewDetailPage(
                      officerReview: review.toJson(),
                    ),
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
                              ? Image.network(
                                  review.imageUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
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
      child: const Icon(
        Icons.person,
        size: 40,
        color: Colors.white,
      ),
    );
  }
}
