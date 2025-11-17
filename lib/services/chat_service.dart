import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chat_message.dart';
import '../config/api_config.dart';

class ChatService {
  final String baseUrl = ApiConfig.baseUrl;

  /// Get authentication token from SharedPreferences
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  /// Get chat messages for a complaint
  Future<List<ChatMessage>> getChatMessages(
    int complaintId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/admin/chat/$complaintId')
          .replace(queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      });

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final messages = (data['data']['messages'] as List)
            .map((msg) => ChatMessage.fromJson(msg))
            .toList();
        return messages;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('Complaint not found');
      } else {
        throw Exception('Failed to load messages: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in getChatMessages: $e');
      rethrow;
    }
  }

  /// Send a chat message
  Future<ChatMessage> sendMessage(
    int complaintId,
    String message, {
    String? imageUrl,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/admin/chat/$complaintId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'message': message,
          if (imageUrl != null) 'imageUrl': imageUrl,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return ChatMessage.fromJson(data['data']['message']);
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('Complaint not found');
      } else if (response.statusCode == 400) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Invalid request');
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in sendMessage: $e');
      rethrow;
    }
  }

  /// Mark messages as read for a complaint
  Future<void> markMessagesAsRead(int complaintId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/admin/chat/$complaintId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        print('Failed to mark messages as read: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in markMessagesAsRead: $e');
      // Don't throw - marking as read is not critical
    }
  }

  /// Get unread message count for a complaint
  Future<int> getUnreadMessageCount(int complaintId) async {
    try {
      final messages = await getChatMessages(complaintId);
      // Count unread messages from admin (not from current user)
      return messages.where((msg) => !msg.read && msg.senderType == 'ADMIN').length;
    } catch (e) {
      print('Error in getUnreadMessageCount: $e');
      return 0;
    }
  }
}
