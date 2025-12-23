import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui'; // For ImageFilter
import 'package:provider/provider.dart';
import '../providers/review_provider.dart';
import '../widgets/translated_text.dart';

/// Modal for submitting complaint reviews
class ReviewSubmissionModal extends StatefulWidget {
  final int complaintId;
  final VoidCallback? onSuccess;

  const ReviewSubmissionModal({
    super.key,
    required this.complaintId,
    this.onSuccess,
  });

  @override
  State<ReviewSubmissionModal> createState() => _ReviewSubmissionModalState();
}

class _ReviewSubmissionModalState extends State<ReviewSubmissionModal> {
  int _rating = 0;
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    // Validate rating
    if (_rating == 0) {
      _showError('Please select a rating');
      return;
    }

    // Validate comment length
    if (_commentController.text.length > 300) {
      _showError('Comment must be 300 characters or less');
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final reviewProvider = Provider.of<ReviewProvider>(context, listen: false);
      
      await reviewProvider.submitReview(
        complaintId: widget.complaintId,
        rating: _rating,
        comment: _commentController.text.trim().isEmpty
            ? null
            : _commentController.text.trim(),
      );

      if (mounted) {
        // Show success dialog
        await _showModernDialog(
          title: 'Success!',
          subtitle: 'সফল!',
          message: 'Review submitted successfully',
          messageBangla: 'রিভিউ সফলভাবে জমা হয়েছে',
          isError: false,
        );

        if (mounted) {
          Navigator.of(context).pop();
          widget.onSuccess?.call();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        
        final errorMessage = e.toString().toLowerCase();
        if (errorMessage.contains('already submitted') || 
            errorMessage.contains('duplicate')) {
          await _showModernDialog(
            title: 'Already Reviewed',
            subtitle: 'ইতিমধ্যে পর্যালোচনা করা হয়েছে',
            message: 'You have already reviewed this complaint.',
            messageBangla: 'আপনি ইতিমধ্যে এই অভিযোগের পর্যালোচনা করেছেন।',
            isError: false, // Treat as info, not red error
          );
          if (mounted) Navigator.of(context).pop();
        } else {
          _showModernDialog(
            title: 'Error',
            subtitle: 'ত্রুটি',
            message: e.toString(),
            messageBangla: '',
            isError: true,
          );
        }
      }
    }
  }

  Future<void> _showModernDialog({
    required String title,
    required String subtitle,
    required String message,
    required String messageBangla,
    required bool isError,
  }) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Dismiss',
      barrierColor: Colors.black.withOpacity(0.6), // Darker backdrop
      transitionDuration: const Duration(milliseconds: 500),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Center(
          child: Material(
            color: Colors.transparent,
            child: _FuturisticDialogContent(
              title: title,
              subtitle: subtitle,
              message: message,
              messageBangla: messageBangla,
              isError: isError,
            ),
          ),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return ScaleTransition(
          scale: CurvedAnimation(
            parent: animation,
            curve: Curves.elasticOut, // Bouncy pop effect
            reverseCurve: Curves.easeInBack,
          ),
          child: FadeTransition(
            opacity: animation,
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5), // Blur background
              child: child,
            ),
          ),
        );
      },
    );
  }

  void _showError(String message) {
    _showModernDialog(
      title: 'Error',
      subtitle: 'ত্রুটি',
      message: message,
      messageBangla: '',
      isError: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
            spreadRadius: 5,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle (Visual Indicator)
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Submit Review',
                          style: TextStyle(
                            fontSize: 24, // Larger
                            fontWeight: FontWeight.w800,
                            color: Colors.grey[900],
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'রিভিউ জমা দিন',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.close_rounded), // Rounded icon
                        onPressed: () => Navigator.of(context).pop(),
                        color: Colors.grey[700],
                        splashRadius: 20,
                      ),
                    ),
                  ],
                ),
            const SizedBox(height: 24),

            // Rating section
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How satisfied are you?',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'আপনি কতটা সন্তুষ্ট?',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 16),
                _buildStarRating(),
              ],
            ),
            const SizedBox(height: 24),

            // Comment section
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Comments (Optional)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'মন্তব্য (ঐচ্ছিক)',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${_commentController.text.length}/300',
                      style: TextStyle(
                        fontSize: 12,
                        color: _commentController.text.length > 300
                            ? Colors.red
                            : Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _commentController,
                  maxLines: 4,
                  maxLength: 300,
                  decoration: InputDecoration(
                    hintText: 'Share your experience...',
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    fillColor: Colors.grey[50], // Light background
                    filled: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12), // Softer corners
                      borderSide: BorderSide(color: Colors.grey[200]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[200]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFF4CAF50),
                        width: 1.5,
                      ),
                    ),
                    counterText: '',
                    contentPadding: const EdgeInsets.all(16), // More breathing room
                  ),
                  onChanged: (value) {
                    setState(() {}); // Update character count
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4CAF50),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0, // Flat modern look
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12), // Consistent with input
                  ),
                  disabledBackgroundColor: Colors.grey[200],
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        'Submit Review',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    ],
  ),
);
  }

  Widget _buildStarRating() {
    return Column(
      children: [
        // Star Row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            final starNumber = index + 1;
            final isSelected = starNumber <= _rating;

            return GestureDetector(
              onTap: () {
                HapticFeedback.heavyImpact(); // Stronger haptic
                setState(() {
                  _rating = starNumber;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                curve: Curves.elasticOut, // Bouncy spring effect
                padding: const EdgeInsets.symmetric(horizontal: 4),
                transform: Matrix4.identity()
                  ..scale(isSelected && _rating == starNumber ? 1.3 : 1.0)
                  ..rotateZ(isSelected && _rating == starNumber ? 0.2 : 0), // Slight tilt
                child: TweenAnimationBuilder(
                  tween: ColorTween(
                    begin: Colors.grey[300],
                    end: isSelected ? _getColorForRating(_rating) : Colors.grey[300],
                  ),
                  duration: const Duration(milliseconds: 300),
                  builder: (context, Color? color, child) {
                    return Icon(
                      isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 52, // Slightly larger
                      color: color,
                      shadows: isSelected ? [
                        BoxShadow(
                          color: color!.withOpacity(0.4),
                          blurRadius: 10,
                          spreadRadius: 2,
                        )
                      ] : [], // Glow effect
                    );
                  },
                ),
              ),
            );
          }),
        ),
        
        // Professional Label (Text Only)
        if (_rating > 0) ...[
          const SizedBox(height: 12),
          Text(
            _getLabelForRating(_rating),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: _getColorForRating(_rating),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ],
    );
  }

  // Removed _getEmojiForRating

  String _getLabelForRating(int rating) {
    switch (rating) {
      case 1: return 'Very Dissatisfied / খুব অসন্তুষ্ট';
      case 2: return 'Dissatisfied / অসন্তুষ্ট';
      case 3: return 'Neutral / মোটামুটি';
      case 4: return 'Satisfied / সন্তুষ্ট';
      case 5: return 'Very Satisfied / খুব সন্তুষ্ট';
      default: return '';
    }
  }

  Color _getColorForRating(int rating) {
    switch (rating) {
      case 1: return const Color(0xFFE53935); // Softer Red
      case 2: return const Color(0xFFFB8C00); // Orange
      case 3: return const Color(0xFFFFB300); // Amber
      case 4: return const Color(0xFF7CB342); // Light Green
      case 5: return const Color(0xFF43A047); // Green
      default: return const Color(0xFFFFC107);
    }
  }
}

/// Helper function to show the review submission modal
void showReviewSubmissionModal(
  BuildContext context, {
  required int complaintId,
  VoidCallback? onSuccess,
}) {
  // Capture the provider from the current context
  final reviewProvider = Provider.of<ReviewProvider>(context, listen: false);

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => ChangeNotifierProvider.value(
      value: reviewProvider,
      child: ReviewSubmissionModal(
        complaintId: complaintId,
        onSuccess: onSuccess,
      ),
    ),
  );
}

class _FuturisticDialogContent extends StatefulWidget {
  final String title;
  final String subtitle;
  final String message;
  final String messageBangla;
  final bool isError;

  const _FuturisticDialogContent({
    required this.title,
    required this.subtitle,
    required this.message,
    required this.messageBangla,
    required this.isError,
  });

  @override
  State<_FuturisticDialogContent> createState() => _FuturisticDialogContentState();
}

class _FuturisticDialogContentState extends State<_FuturisticDialogContent>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediaQuery.of(context).size.width * 0.85,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95), // Slight transparency
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          // Deep 3D Shadow
          BoxShadow(
            color: widget.isError 
                ? Colors.red.withOpacity(0.3) 
                : Colors.green.withOpacity(0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
            spreadRadius: -5,
          ),
          // White Glow
          BoxShadow(
            color: Colors.white.withOpacity(0.5),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
        border: Border.all(
          color: Colors.white,
          width: 2,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Animated Pulse Icon
          AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: widget.isError 
                        ? Colors.red.withOpacity(0.1) 
                        : const Color(0xFF4CAF50).withOpacity(0.1),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: widget.isError 
                            ? Colors.red.withOpacity(0.2) 
                            : const Color(0xFF4CAF50).withOpacity(0.2),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Icon(
                    widget.isError 
                        ? Icons.gpp_bad_rounded 
                        : Icons.verified_rounded,
                    color: widget.isError ? Colors.red : const Color(0xFF4CAF50),
                    size: 48,
                  ),
                ),
              );
            },
          ),
          
          const SizedBox(height: 24),
          
          Text(
            widget.title,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            widget.subtitle,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 20),
          
          Text(
            widget.message,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[800],
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          
          if (widget.messageBangla.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.messageBangla,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          
          const SizedBox(height: 32),
          
          // Futuristic Button
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: widget.isError 
                      ? Colors.red.withOpacity(0.4) 
                      : const Color(0xFF4CAF50).withOpacity(0.4),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.isError ? Colors.red : const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Okay, Got it',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
