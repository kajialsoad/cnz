import 'package:flutter/foundation.dart';
import '../models/review_model.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

/// Provider for managing review state and operations
/// Handles review submission, retrieval, and state management
class ReviewProvider extends ChangeNotifier {
  final ApiClient _apiClient;

  ReviewProvider()
      : _apiClient = ApiClient(
          ApiConfig.baseUrl,
          timeout: const Duration(seconds: 30),
        );

  // State variables
  ReviewModel? _currentReview;
  List<ReviewModel> _reviews = [];
  bool _loading = false;
  String? _error;
  bool _submitting = false;

  // Getters
  ReviewModel? get currentReview => _currentReview;
  List<ReviewModel> get reviews => List.unmodifiable(_reviews);
  bool get loading => _loading;
  String? get error => _error;
  bool get submitting => _submitting;

  /// Submit a review for a complaint
  /// 
  /// Parameters:
  /// - [complaintId]: The ID of the complaint to review
  /// - [rating]: Rating from 1-5 stars
  /// - [comment]: Optional comment (max 300 characters)
  /// 
  /// Returns: The created ReviewModel on success
  /// Throws: ApiException on failure
  Future<ReviewModel> submitReview({
    required int complaintId,
    required int rating,
    String? comment,
  }) async {
    // Validate rating
    if (!Rating.isValid(rating)) {
      _error = 'Rating must be between 1 and 5';
      notifyListeners();
      throw ApiException(_error!);
    }

    // Validate comment length
    if (!ReviewComment.isValidLength(comment)) {
      _error = 'Comment must be 300 characters or less';
      notifyListeners();
      throw ApiException(_error!);
    }

    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/api/complaints/$complaintId/review',
        {
          'rating': rating,
          if (comment != null && comment.isNotEmpty) 'comment': comment,
        },
      );

      if (response['success'] == true && response['data'] != null) {
        // The API returns { data: { review: {...} } }
        final reviewData = response['data']['review'] ?? response['data'];
        final review = ReviewModel.fromJson(reviewData);
        _currentReview = review;
        
        // Add to reviews list if not already present
        final existingIndex = _reviews.indexWhere((r) => r.id == review.id);
        if (existingIndex >= 0) {
          _reviews[existingIndex] = review;
        } else {
          _reviews.insert(0, review);
        }

        _submitting = false;
        notifyListeners();
        return review;
      } else {
        throw ApiException(
          response['message'] ?? 'Failed to submit review',
        );
      }
    } catch (e) {
      _error = e.toString();
      _submitting = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Get review for a specific complaint
  /// 
  /// Parameters:
  /// - [complaintId]: The ID of the complaint
  /// 
  /// Returns: ReviewModel if found, null otherwise
  Future<ReviewModel?> getReview(int complaintId) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.get(
        '/api/complaints/$complaintId/reviews',
      );

      if (response['success'] == true && response['data'] != null) {
        final reviewsList = response['data'] as List;
        
        if (reviewsList.isNotEmpty) {
          // Get the first review (should be the user's review)
          final review = ReviewModel.fromJson(reviewsList[0]);
          _currentReview = review;
          _loading = false;
          notifyListeners();
          return review;
        } else {
          _currentReview = null;
          _loading = false;
          notifyListeners();
          return null;
        }
      } else {
        _currentReview = null;
        _loading = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = e.toString();
      _currentReview = null;
      _loading = false;
      notifyListeners();
      return null;
    }
  }

  /// Get all reviews for a specific complaint
  /// 
  /// Parameters:
  /// - [complaintId]: The ID of the complaint
  /// 
  /// Returns: List of ReviewModel
  Future<List<ReviewModel>> getReviews(int complaintId) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.get(
        '/api/complaints/$complaintId/reviews',
      );

      if (response['success'] == true && response['data'] != null) {
        final reviewsList = response['data'] as List;
        _reviews = reviewsList
            .map((json) => ReviewModel.fromJson(json))
            .toList();
        
        _loading = false;
        notifyListeners();
        return _reviews;
      } else {
        _reviews = [];
        _loading = false;
        notifyListeners();
        return [];
      }
    } catch (e) {
      _error = e.toString();
      _reviews = [];
      _loading = false;
      notifyListeners();
      return [];
    }
  }

  /// Check if user has already submitted a review for a complaint
  /// 
  /// Parameters:
  /// - [complaintId]: The ID of the complaint
  /// 
  /// Returns: true if review exists, false otherwise
  Future<bool> hasReview(int complaintId) async {
    final review = await getReview(complaintId);
    return review != null;
  }

  /// Clear current review
  void clearCurrentReview() {
    _currentReview = null;
    notifyListeners();
  }

  /// Clear all reviews
  void clearReviews() {
    _reviews = [];
    _currentReview = null;
    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Reset provider state
  void reset() {
    _currentReview = null;
    _reviews = [];
    _loading = false;
    _error = null;
    _submitting = false;
    notifyListeners();
  }

  @override
  void dispose() {
    reset();
    super.dispose();
  }
}
