import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/review_model.dart';

/// Service for managing complaint reviews
class ReviewService {
  final String baseUrl = ApiConfig.baseUrl;

  /// Submit a review for a complaint
  /// 
  /// [complaintId] - ID of the complaint to review
  /// [rating] - Rating from 1-5 stars
  /// [comment] - Optional comment (max 300 characters)
  /// 
  /// Returns the created ReviewModel object
  /// Throws Exception on error
  Future<ReviewModel> submitReview({
    required String complaintId,
    required int rating,
    String? comment,
  }) async {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw Exception('Rating must be between 1 and 5');
      }

      // Validate comment length
      if (comment != null && comment.length > 300) {
        throw Exception('Comment must be 300 characters or less');
      }

      final url = Uri.parse('$baseUrl/api/complaints/$complaintId/review');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: jsonEncode({
          'rating': rating,
          if (comment != null && comment.isNotEmpty) 'comment': comment,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return ReviewModel.fromJson(data['data']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to submit review');
      }
    } catch (e) {
      print('❌ ReviewService.submitReview error: $e');
      rethrow;
    }
  }

  /// Get all reviews for a complaint
  /// 
  /// [complaintId] - ID of the complaint
  /// 
  /// Returns list of ReviewModel objects
  /// Throws Exception on error
  Future<List<ReviewModel>> getReviews(String complaintId) async {
    try {
      final url = Uri.parse('$baseUrl/api/complaints/$complaintId/reviews');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final reviewsData = data['data'] as List;
        return reviewsData.map((json) => ReviewModel.fromJson(json)).toList();
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to fetch reviews');
      }
    } catch (e) {
      print('❌ ReviewService.getReviews error: $e');
      rethrow;
    }
  }

  /// Get the user's review for a specific complaint (if exists)
  /// 
  /// [complaintId] - ID of the complaint
  /// 
  /// Returns ReviewModel object or null if no review exists
  /// Throws Exception on error
  Future<ReviewModel?> getUserReview(String complaintId) async {
    try {
      final reviews = await getReviews(complaintId);
      
      // Get current user ID from auth token
      final userId = await _getCurrentUserId();
      
      // Find review by current user
      final review = reviews.firstWhere(
        (review) => review.userId.toString() == userId,
        orElse: () => throw Exception('No review found'),
      );
      return review;
    } catch (e) {
      // Return null if no review found
      if (e.toString().contains('No review found')) {
        return null;
      }
      print('❌ ReviewService.getUserReview error: $e');
      rethrow;
    }
  }

  /// Helper method to get auth token from storage
  Future<String> _getAuthToken() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final token = sp.getString('accessToken');
      
      if (token == null || token.isEmpty) {
        throw Exception('No authentication token found. Please log in.');
      }
      
      return token;
    } catch (e) {
      print('❌ ReviewService._getAuthToken error: $e');
      rethrow;
    }
  }

  /// Helper method to get current user ID from auth token
  /// 
  /// Note: This method fetches the user profile from the API to get the user ID.
  /// The user ID is stored in the UserModel returned by the /api/users/me endpoint.
  Future<String> _getCurrentUserId() async {
    try {
      final url = Uri.parse('$baseUrl/api/users/me');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = data['user'];
        
        if (user != null && user['id'] != null) {
          return user['id'].toString();
        } else {
          throw Exception('User ID not found in response');
        }
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to fetch user profile');
      }
    } catch (e) {
      print('❌ ReviewService._getCurrentUserId error: $e');
      rethrow;
    }
  }
}
