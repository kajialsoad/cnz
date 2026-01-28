import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/waste_post_model.dart';

class WasteManagementService {
  final String baseUrl = '${ApiConfig.baseUrl}/api/waste-management';

  // Get posts by category (CURRENT_WASTE or FUTURE_WASTE)
  Future<List<WastePost>> getPostsByCategory(
    String token,
    String category,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts/category/$category'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => WastePost.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load posts: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching posts: $e');
    }
  }

  // Get all published posts
  Future<List<WastePost>> getPublishedPosts(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => WastePost.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load posts: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching posts: $e');
    }
  }

  // Get post by ID
  Future<WastePost> getPostById(String token, int postId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts/$postId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return WastePost.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load post: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching post: $e');
    }
  }

  // Toggle reaction (like/love)
  Future<Map<String, dynamic>> toggleReaction(
    String token,
    int postId,
    String reactionType, // 'LIKE' or 'LOVE'
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/reaction'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'reactionType': reactionType}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to toggle reaction: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error toggling reaction: $e');
    }
  }
}
