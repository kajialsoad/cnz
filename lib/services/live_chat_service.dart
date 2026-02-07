import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../models/chat_message.dart';
import 'api_client.dart';
import 'smart_api_client.dart';

/// Service for Live Chat functionality
/// Handles direct communication between users and their ward/zone admin
/// Separate from complaint chat - uses different endpoints and data model
class LiveChatService {
  final ApiClient _apiClient = SmartApiClient.instance;

  /// Get user's live chat messages
  /// Uses endpoint: GET /api/live-chat
  Future<List<ChatMessage>> getMessages({int page = 1, int limit = 120}) async {
    try {
    int limit = 1000,
        '/api/live-chat?page=$page&limit=$limit',
      );

      final messagesData = response['data']['messages'] as List;

      // Transform backend ChatMessage format to Flutter ChatMessage format
      final messages = messagesData.map((msg) {
        return ChatMessage.fromJson({
          'id': msg['id'],
          // No complaintId for Live Chat - it's optional now
          'senderId': msg['senderId'],
          'senderType': msg['senderType'],
          'senderName': msg['sender'] != null
              ? '${msg['sender']['firstName']} ${msg['sender']['lastName']}'
              : 'Unknown',
          'message':
              msg['content'], // Backend uses 'content', Flutter uses 'message'
          'imageUrl':
              msg['fileUrl'], // Backend uses 'fileUrl', Flutter uses 'imageUrl'
          'voiceUrl': msg['voiceUrl'],
          'read': msg['isRead'], // Backend uses 'isRead', Flutter uses 'read'
          'createdAt': msg['createdAt'],
        });
      }).toList();

      return messages;
    } catch (e) {
      print('❌ Error in getMessages: $e');
      rethrow;
    }
  }

  /// Send a live chat message
  /// Uses endpoint: POST /api/live-chat
  Future<ChatMessage> sendMessage(
    String message, {
    String? imageUrl,
    String? voiceUrl,
  }) async {
    try {
      print('📤 Sending live chat message...');

      final response = await _apiClient.post('/api/live-chat', {
        'message': message, // Backend expects 'message' field
        if (imageUrl != null)
          'imageUrl': imageUrl, // Backend expects 'imageUrl' field
        if (voiceUrl != null) 'voiceUrl': voiceUrl,
      });

      final msg = response['data']['message'];

      // Transform backend response to Flutter format
      return ChatMessage.fromJson({
        'id': msg['id'],
        // No complaintId for Live Chat - it's optional now
        'senderId': msg['senderId'],
        'senderType': msg['senderType'],
        'senderName': msg['sender'] != null
            ? '${msg['sender']['firstName']} ${msg['sender']['lastName']}'
            : 'Unknown',
        'message': msg['content'], // Backend uses 'content'
        'imageUrl': msg['fileUrl'], // Backend uses 'fileUrl'
        'voiceUrl': msg['voiceUrl'],
        'read': msg['isRead'], // Backend uses 'isRead'
        'createdAt': msg['createdAt'],
      });
    } catch (e) {
      print('❌ Error in sendMessage: $e');
      rethrow;
    }
  }

  /// Mark live chat messages as read
  /// Uses endpoint: PATCH /api/live-chat/read
  Future<void> markAsRead() async {
    try {
      await _apiClient.patch('/api/live-chat/read', {});
      print('✅ Messages marked as read');
    } catch (e) {
      print('❌ Error in markAsRead: $e');
      // Don't throw - marking as read is not critical
    }
  }

  /// Upload image for live chat
  /// Uses endpoint: POST /api/live-chat/upload
  Future<String> uploadImage(XFile xfile) async {
    try {
      print('📤 Uploading image for live chat...');

      final response = await _apiClient.postMultipart(
        '/api/live-chat/upload',
        files: [MapEntry('file', xfile)], // ✅ 'file' is correct for live-chat
      );

      final payload = response['data'];

      if (payload == null) {
        throw Exception('No image returned');
      }

      // Handle response format: { data: { url: "..." } }
      if (payload is Map && payload['url'] != null) {
        return payload['url'] as String;
      }

      throw Exception('No image URL returned. Response: $response');
    } catch (e) {
      print('❌ Error in uploadImage: $e');
      rethrow;
    }
  }

  /// Upload voice recording for live chat
  /// Uses endpoint: POST /api/live-chat/upload
  Future<String> uploadVoice(XFile xfile) async {
    try {
      print('📤 Uploading voice for live chat...');

      final response = await _apiClient.postMultipart(
        '/api/live-chat/upload',
        files: [MapEntry('file', xfile)], // ✅ 'file' is correct for live-chat
      );

      final payload = response['data'];

      if (payload == null) {
        throw Exception('No voice file returned');
      }

      // Handle response format: { data: { url: "..." } }
      if (payload is Map && payload['url'] != null) {
        return payload['url'] as String;
      }

      throw Exception('No voice URL returned. Response: $response');
    } catch (e) {
      print('❌ Error in uploadVoice: $e');
      rethrow;
    }
  }

  /// Get admin information for the user's ward/zone
  /// Returns admin details to display in the chat header
  Future<Map<String, dynamic>> getAdmin() async {
    try {
      print('📡 Fetching admin info...');

      final response = await _apiClient.get('/api/live-chat');

      final admin = response['data']['admin'];

      if (admin == null) {
        throw Exception('No admin found for your location');
      }

      return {
        'id': admin['id'],
        'name': admin['name'] ?? 'Admin',
        'role': admin['role'] ?? 'WARD_ADMIN',
        'ward': admin['ward'],
        'zone': admin['zone'],
        'profilePicture': admin['profilePicture'],
      };
    } catch (e) {
      print('❌ Error in getAdmin: $e');
      rethrow;
    }
  }

  /// Get unread message count for live chat
  Future<int> getUnreadMessageCount() async {
    try {
      final messages = await getMessages(limit: 100);
      // Count unread messages from admin (not from current user)
      return messages
          .where((msg) => !msg.read && msg.senderType == 'ADMIN')
          .length;
    } catch (e) {
      print('❌ Error in getUnreadMessageCount: $e');
      return 0;
    }
  }
}
