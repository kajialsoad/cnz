import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/notice_model.dart';
import 'auth_service.dart';

class NoticeService {
  // Get active notices
  Future<List<Notice>> getActiveNotices({
    int? categoryId,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (categoryId != null) {
        queryParams['categoryId'] = categoryId.toString();
      }
      if (type != null) {
        queryParams['type'] = type;
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/notices/active')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> noticesJson = data['notices'];
        return noticesJson.map((json) => Notice.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load notices: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching notices: $e');
      throw Exception('Failed to load notices: $e');
    }
  }

  // Get notice by ID
  Future<Notice> getNoticeById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/notices/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Notice.fromJson(data);
      } else {
        throw Exception('Failed to load notice: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching notice: $e');
      throw Exception('Failed to load notice: $e');
    }
  }

  // Get all categories
  Future<List<NoticeCategory>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/notice-categories'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        
        // Handle both formats: direct array or wrapped in {success, data}
        final List<dynamic> data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded['data'] is List) {
          data = decoded['data'];
        } else {
          throw Exception('Unexpected response format');
        }
        
        return data.map((json) => NoticeCategory.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load categories: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching categories: $e');
      throw Exception('Failed to load categories: $e');
    }
  }

  // Increment view count
  Future<void> incrementViewCount(int id) async {
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/notices/$id/view'),
        headers: {'Content-Type': 'application/json'},
      );
    } catch (e) {
      print('Error incrementing view count: $e');
    }
  }

  // Mark as read
  Future<void> markAsRead(int id) async {
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/notices/$id/read'),
        headers: {'Content-Type': 'application/json'},
      );
    } catch (e) {
      print('Error marking as read: $e');
    }
  }

  // Toggle interaction (Like, Love, RSVP)
  Future<void> toggleInteraction(int id, String type) async {
    try {
      final token = await AuthService.getAccessToken();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/notices/$id/interact'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({'type': type}),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to toggle interaction: ${response.statusCode}');
      }
    } catch (e) {
      print('Error toggling interaction: $e');
      throw e;
    }
  }
}
