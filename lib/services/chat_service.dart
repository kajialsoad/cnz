import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chat_message.dart';
import '../config/api_config.dart';
import 'chat_cache_service.dart';

class ChatService {
  String get baseUrl => ApiConfig.baseUrl;
  final ChatCacheService _cacheService = ChatCacheService();

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
    bool cacheFirst = true,
  }) async {
    try {
      // Try to load from cache first (for offline support)
      if (cacheFirst) {
        final cachedMessages = await _cacheService.getCachedMessages(complaintId);
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
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Use user endpoint: /api/complaints/:id/chat
      final uri = Uri.parse('$baseUrl/api/complaints/$complaintId/chat')
          .replace(queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      });

      print('📡 API Request: GET $uri');
      print('   Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📥 API Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final messages = (data['data']['messages'] as List)
            .map((msg) => ChatMessage.fromJson(msg))
            .toList();
        
        // Cache the messages
        await _cacheService.cacheMessages(complaintId, messages);
        print('💾 Cached ${messages.length} messages');
        
        return messages;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('Complaint not found');
      } else {
        throw Exception('Failed to load messages: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in _fetchAndCacheMessages: $e');
      rethrow;
    }
  }

  /// Send a chat message
  Future<ChatMessage> sendMessage(
    int complaintId,
    String message, {
    String? imageUrl,
    String? voiceUrl,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Use user endpoint: /api/complaints/:id/chat
      final response = await http.post(
        Uri.parse('$baseUrl/api/complaints/$complaintId/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'message': message,
          if (imageUrl != null) 'imageUrl': imageUrl,
          if (voiceUrl != null) 'voiceUrl': voiceUrl,
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

  /// Upload image and return URL
  Future<String> uploadImage(XFile xfile) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Authentication token not found');
    }

    final uri = Uri.parse('$baseUrl/api/complaints/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    if (kIsWeb) {
      final bytes = await xfile.readAsBytes();
      // Detect MIME from header bytes for web blobs
      final detectedMime = lookupMimeType('', headerBytes: bytes) ?? 'image/jpeg';
      final ext = detectedMime.contains('png')
          ? 'png'
          : detectedMime.contains('webp')
              ? 'webp'
              : 'jpg';
      var filename = xfile.name;
      if (filename.isEmpty || filename.startsWith('blob:')) {
        filename = 'upload_${DateTime.now().millisecondsSinceEpoch}.$ext';
      }
      request.files.add(
        http.MultipartFile.fromBytes(
          'images',
          bytes,
          filename: filename,
          contentType: MediaType.parse(detectedMime),
        ),
      );
    } else {
      final file = File(xfile.path);
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
      request.files.add(
        await http.MultipartFile.fromPath(
          'images',
          file.path,
          contentType: MediaType.parse(mimeType),
        ),
      );
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) {
      throw Exception('Image upload failed: ${response.statusCode}');
   }
    final raw = response.body;
    print('🖼️ Upload image response: $raw');
    final data = json.decode(raw);
    final payload = data['data'];
    if (payload == null) {
      throw Exception('No image returned');
    }
    // Standard: images: [ { url: ... } ]
    if (payload is Map && payload['images'] is List && (payload['images'] as List).isNotEmpty) {
      final first = (payload['images'] as List).first;
      return first['url'] as String;
    }
    // Fallback: single image object
    if (payload is Map && payload['image'] is Map && payload['image']['url'] != null) {
      return payload['image']['url'] as String;
    }
    // Fallback: fileUrls array
    if (payload is Map && payload['fileUrls'] is List && (payload['fileUrls'] as List).isNotEmpty) {
      return (payload['fileUrls'] as List).first as String;
    }
    throw Exception('No image returned');
  }

  /// Upload image for a specific complaint and return URL
  Future<String> uploadImageForComplaint(int complaintId, XFile xfile) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Authentication token not found');
    }

    final uri = Uri.parse('$baseUrl/api/complaints/$complaintId/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    if (kIsWeb) {
      final bytes = await xfile.readAsBytes();
      final detectedMime = lookupMimeType('', headerBytes: bytes) ?? 'image/jpeg';
      final ext = detectedMime.contains('png')
          ? 'png'
          : detectedMime.contains('webp')
              ? 'webp'
              : 'jpg';
      var filename = xfile.name;
      if (filename.isEmpty || filename.startsWith('blob:')) {
        filename = 'upload_${DateTime.now().millisecondsSinceEpoch}.$ext';
      }
      request.files.add(
        http.MultipartFile.fromBytes(
          'images',
          bytes,
          filename: filename,
          contentType: MediaType.parse(detectedMime),
        ),
      );
    } else {
      final file = File(xfile.path);
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
      request.files.add(
        await http.MultipartFile.fromPath(
          'images',
          file.path,
          contentType: MediaType.parse(mimeType),
        ),
      );
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) {
      throw Exception('Image upload failed: ${response.statusCode}');
    }
    final raw = response.body;
    print('🖼️ Upload image (complaint) response: $raw');
    final data = json.decode(raw);
    final payload = data['data'];
    if (payload == null) {
      throw Exception('No image returned');
    }
    
    // Handle different response formats
    // Format 1: { data: { fileUrls: ["url1", "url2"] } }
    if (payload is Map && payload['fileUrls'] is List && (payload['fileUrls'] as List).isNotEmpty) {
      return (payload['fileUrls'] as List).first as String;
    }
    
    // Format 2: { data: { images: [{ url: "...", filename: "..." }] } }
    if (payload is Map && payload['images'] is List && (payload['images'] as List).isNotEmpty) {
      final first = (payload['images'] as List).first;
      if (first is Map && first['url'] != null) {
        return first['url'] as String;
      }
    }
    
    // Format 3: { data: { images: ["url1", "url2"] } } - simple string array
    if (payload is Map && payload['images'] is List && (payload['images'] as List).isNotEmpty) {
      final first = (payload['images'] as List).first;
      if (first is String) {
        return first;
      }
    }
    
    throw Exception('No image returned. Response format: $raw');
  }

  /// Upload voice and return URL
  Future<String> uploadVoice(XFile xfile) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Authentication token not found');
    }

    final uri = Uri.parse('$baseUrl/api/complaints/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    if (kIsWeb) {
      final bytes = await xfile.readAsBytes();
      final detectedMime = lookupMimeType('', headerBytes: bytes) ?? 'audio/m4a';
      final ext = detectedMime.contains('mpeg') || detectedMime.contains('mp3')
          ? 'mp3'
          : detectedMime.contains('wav')
              ? 'wav'
              : detectedMime.contains('ogg')
                  ? 'ogg'
                  : 'm4a';
      var filename = xfile.name;
      if (filename.isEmpty || filename.startsWith('blob:')) {
        filename = 'voice_${DateTime.now().millisecondsSinceEpoch}.$ext';
      }
      request.files.add(
        http.MultipartFile.fromBytes(
          'voice',
          bytes,
          filename: filename,
          contentType: MediaType.parse(detectedMime),
        ),
      );
    } else {
      final file = File(xfile.path);
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
      request.files.add(
        await http.MultipartFile.fromPath(
          'voice',
          file.path,
          contentType: MediaType.parse(mimeType),
        ),
      );
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) {
      throw Exception('Voice upload failed: ${response.statusCode}');
    }
    final raw = response.body;
    print('🎙️ Upload voice response: $raw');
    final data = json.decode(raw);
    final payload = data['data'];
    if (payload == null) {
      throw Exception('No voice file returned');
    }
    // Standard: voice: { url: ... }
    if (payload is Map && payload['voice'] is Map && payload['voice']['url'] != null) {
      return payload['voice']['url'] as String;
    }
    // Fallback: fileUrls array
    if (payload is Map && payload['fileUrls'] is List && (payload['fileUrls'] as List).isNotEmpty) {
      return (payload['fileUrls'] as List).first as String;
    }
    throw Exception('No voice file returned');
  }

  /// Mark messages as read for a complaint
  Future<void> markMessagesAsRead(int complaintId) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Use user endpoint: /api/complaints/:id/chat/read
      final response = await http.patch(
        Uri.parse('$baseUrl/api/complaints/$complaintId/chat/read'),
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
