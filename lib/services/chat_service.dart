import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import '../models/chat_message.dart';
import 'api_client.dart';
import 'smart_api_client.dart';
import 'chat_cache_service.dart';

class ChatService {
  final ApiClient _apiClient = SmartApiClient.instance;
  final ChatCacheService _cacheService = ChatCacheService();

  /// Get chat messages for a complaint
  Future<List<ChatMessage>> getChatMessages(
    int complaintId, {
    int page = 1,
    int limit = 50,
    bool cacheFirst =
        false, // CHANGED: Default to false to prevent stale cache issues
  }) async {
    try {
      // CRITICAL FIX: For polling, always fetch fresh data (don't use cache)
      // Cache is only used for initial load or offline support
      if (cacheFirst) {
        final cachedMessages = await _cacheService.getCachedMessages(
          complaintId,
        );
        if (cachedMessages.isNotEmpty) {
          print('📦 Loaded ${cachedMessages.length} messages from cache');
          // Return cached messages immediately, then fetch fresh data in background
          _fetchAndCacheMessages(complaintId, page, limit);
          return cachedMessages;
        }
      }

      // No cache or cache disabled, fetch from API
      return await _fetchAndCacheMessages(complaintId, page, limit);
    } catch (e) {
      print('Error in getChatMessages: $e');
      // If API fails, try to return cached messages
      final cachedMessages = await _cacheService.getCachedMessages(complaintId);
      if (cachedMessages.isNotEmpty) {
        print('📦 Returning cached messages due to API error');
        return cachedMessages;
      }
      rethrow;
    }
  }

  /// Fetch messages from API and cache them
  Future<List<ChatMessage>> _fetchAndCacheMessages(
    int complaintId,
    int page,
    int limit,
  ) async {
    try {
      final response = await _apiClient.get(
        '/api/complaints/$complaintId/chat?page=$page&limit=$limit',
      );

      final messages = (response['data']['messages'] as List)
          .map((msg) => ChatMessage.fromJson(msg))
          .toList();

      // Cache the messages
      await _cacheService.cacheMessages(complaintId, messages);
      // Removed debug log for production
      // print('💾 Cached ${messages.length} messages');

      return messages;
    } catch (e) {
      print('Error in _fetchAndCacheMessages: $e');
      rethrow;
    }
  }

  /// Send a chat message - returns list of messages (user message + optional bot message)
  Future<List<ChatMessage>> sendMessage(
    int complaintId,
    String message, {
    String? imageUrl,
    String? voiceUrl,
  }) async {
    try {
      final response = await _apiClient
          .post('/api/complaints/$complaintId/chat', {
            'message': message,
            if (imageUrl != null) 'imageUrl': imageUrl,
            if (voiceUrl != null) 'voiceUrl': voiceUrl,
          });

      final messages = <ChatMessage>[];

      // Add user message
      messages.add(ChatMessage.fromJson(response['data']['message']));

      // Add bot message if present
      if (response['data']['botMessage'] != null) {
        messages.add(ChatMessage.fromJson(response['data']['botMessage']));
      }

      return messages;
    } catch (e) {
      print('Error in sendMessage: $e');
      rethrow;
    }
  }

  /// Upload image and return URL
  Future<String> uploadImage(XFile xfile) async {
    try {
      final response = await _apiClient.postMultipart(
        '/api/complaints/upload',
        files: [MapEntry('images', xfile)],
      );

      final payload = response['data'];
      if (payload == null) {
        throw Exception('No image returned');
      }
      // Standard: images: [ { url: ... } ]
      if (payload is Map &&
          payload['images'] is List &&
          (payload['images'] as List).isNotEmpty) {
        final first = (payload['images'] as List).first;
        return first['url'] as String;
      }
      // Fallback: single image object
      if (payload is Map &&
          payload['image'] is Map &&
          payload['image']['url'] != null) {
        return payload['image']['url'] as String;
      }
      // Fallback: fileUrls array
      if (payload is Map &&
          payload['fileUrls'] is List &&
          (payload['fileUrls'] as List).isNotEmpty) {
        return (payload['fileUrls'] as List).first as String;
      }
      throw Exception('No image returned');
    } catch (e) {
      print('Error in uploadImage: $e');
      rethrow;
    }
  }

  /// Upload image for a specific complaint and return URL
  Future<String> uploadImageForComplaint(int complaintId, XFile xfile) async {
    try {
      final response = await _apiClient.postMultipart(
        '/api/complaints/$complaintId/upload',
        files: [MapEntry('images', xfile)],
      );

      final payload = response['data'];
      if (payload == null) {
        throw Exception('No image returned');
      }

      // Handle different response formats
      // Format 1: { data: { fileUrls: ["url1", "url2"] } }
      if (payload is Map &&
          payload['fileUrls'] is List &&
          (payload['fileUrls'] as List).isNotEmpty) {
        return (payload['fileUrls'] as List).first as String;
      }

      // Format 2: { data: { images: [{ url: "...", filename: "..." }] } }
      if (payload is Map &&
          payload['images'] is List &&
          (payload['images'] as List).isNotEmpty) {
        final first = (payload['images'] as List).first;
        if (first is Map && first['url'] != null) {
          return first['url'] as String;
        }
      }

      // Format 3: { data: { images: ["url1", "url2"] } } - simple string array
      if (payload is Map &&
          payload['images'] is List &&
          (payload['images'] as List).isNotEmpty) {
        final first = (payload['images'] as List).first;
        if (first is String) {
          return first;
        }
      }

      throw Exception('No image returned. Response: $response');
    } catch (e) {
      print('Error in uploadImageForComplaint: $e');
      rethrow;
    }
  }

  /// Upload voice for a specific complaint and return URL
  Future<String> uploadVoiceForComplaint(int complaintId, XFile xfile) async {
    try {
      final response = await _apiClient.postMultipart(
        '/api/complaints/$complaintId/upload',
        files: [MapEntry('voice', xfile)],
      );

      final payload = response['data'];
      if (payload == null) {
        throw Exception('No voice file returned');
      }

      // Handle different response formats
      // Format 1: { data: { voice: { url: "...", filename: "..." } } }
      if (payload is Map &&
          payload['voice'] is Map &&
          payload['voice']['url'] != null) {
        return payload['voice']['url'] as String;
      }

      // Format 2: { data: { fileUrls: ["url1", "url2"] } }
      if (payload is Map &&
          payload['fileUrls'] is List &&
          (payload['fileUrls'] as List).isNotEmpty) {
        return (payload['fileUrls'] as List).first as String;
      }

      throw Exception('No voice file returned. Response: $response');
    } catch (e) {
      print('Error in uploadVoiceForComplaint: $e');
      rethrow;
    }
  }

  /// Mark messages as read for a complaint
  Future<void> markMessagesAsRead(int complaintId) async {
    try {
      await _apiClient.patch('/api/complaints/$complaintId/chat/read', {});
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
      return messages
          .where((msg) => !msg.read && msg.senderType == 'ADMIN')
          .length;
    } catch (e) {
      print('Error in getUnreadMessageCount: $e');
      return 0;
    }
  }
}
