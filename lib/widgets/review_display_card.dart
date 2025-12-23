import 'package:flutter/material.dart';
import '../models/review_model.dart';
import '../widgets/translated_text.dart';

// Type alias for convenience
typedef Review = ReviewModel;

/// Widget to display a single review
class ReviewDisplayCard extends StatelessWidget {
  final Review review;

  const ReviewDisplayCard({
    super.key,
    required this.review,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info and rating
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF4CAF50).withOpacity(0.1),
                child: Text(
                  review.user?.initials ?? 'U',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF4CAF50),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Name and rating
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.user?.fullName ?? 'Anonymous User',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 4),
                    _buildStarRating(review.rating),
                  ],
                ),
              ),

              // Time ago
              Text(
                review.timeAgo,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),

          // Comment
          if (review.hasComment) ...[
            const SizedBox(height: 12),
            Text(
              review.comment!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStarRating(int rating) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return Icon(
          index < rating ? Icons.star : Icons.star_border,
          size: 16,
          color: const Color(0xFFFFC107),
        );
      }),
    );
  }
}

/// Widget to display a list of reviews
class ReviewsList extends StatelessWidget {
  final List<Review> reviews;

  const ReviewsList({
    super.key,
    required this.reviews,
  });

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              offset: const Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(
              Icons.rate_review_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 12),
            TranslatedText(
              'No reviews yet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'এখনও কোনো রিভিউ নেই',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          children: [
            const Icon(
              Icons.rate_review,
              size: 20,
              color: Color(0xFF4CAF50),
            ),
            const SizedBox(width: 8),
            TranslatedText(
              'User Reviews',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${reviews.length}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4CAF50),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Reviews
        ...reviews.map((review) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ReviewDisplayCard(review: review),
            )),
      ],
    );
  }
}
