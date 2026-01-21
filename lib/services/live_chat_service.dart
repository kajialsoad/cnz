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

/// Service for Live Chat functionality
/// Handles direct communication between users and their ward/zone admin
/// Separate from complaint chat - uses different endpoints and data model
class LiveChatService {
  String get baseUrl => ApiConfig.baseUrl;

  /// Get authentication token from SharedPreferences
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  /// Get user's live chat messages
  /// Uses endpoint: GET /api/live-chat
  Future<List<ChatMessage>> getMessages({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/api/live-chat')
          .replace(queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      });

      print('📡 Live Chat API Request: GET $uri');
      print('   Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📥 Live Chat API Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final messagesData = data['data']['messages'] as List;
        
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
            'message': msg['content'], // Backend uses 'content', Flutter uses 'message'
            'imageUrl': msg['fileUrl'], // Backend uses 'fileUrl', Flutter uses 'imageUrl'
            'voiceUrl': msg['voiceUrl'],
            'read': msg['isRead'], // Backend uses 'isRead', Flutter uses 'read'
            'createdAt': msg['createdAt'],
          });
        }).toList();
        
        return messages;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('No admin found for your location');
      } else {
        throw Exception('Failed to load messages: ${response.statusCode}');
      }
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
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      print('📤 Sending live chat message...');
      print('   Message: ${message.substring(0, message.length > 50 ? 50 : message.length)}...');
      if (imageUrl != null) print('   Image: $imageUrl');
      if (voiceUrl != null) print('   Voice: $voiceUrl');

      final response = await http.post(
        Uri.parse('$baseUrl/api/live-chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'content': message, // Backend expects 'content'
          if (imageUrl != null) 'fileUrl': imageUrl, // Backend expects 'fileUrl'
          if (voiceUrl != null) 'voiceUrl': voiceUrl,
        }),
      );

      print('📥 Send message response: ${response.statusCode}');

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        final msg = data['data']['message'];
        
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
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('No admin found for your location');
      } else if (response.statusCode == 400) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Invalid request');
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error in sendMessage: $e');
      rethrow;
    }
  }

  /// Mark live chat messages as read
  /// Uses endpoint: PATCH /api/live-chat/read
  Future<void> markAsRead() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/api/live-chat/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        print('✅ Messages marked as read');
      } else {
        print('⚠️ Failed to mark messages as read: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error in markAsRead: $e');
      // Don't throw - marking as read is not critical
    }
  }

  /// Upload image for live chat
  /// Uses endpoint: POST /api/live-chat/upload
  Future<String> uploadImage(XFile xfile) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      print('📤 Uploading image for live chat...');

      final uri = Uri.parse('$baseUrl/api/live-chat/upload');
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
          filename = 'live_chat_${DateTime.now().millisecondsSinceEpoch}.$ext';
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
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
            'file',
            file.path,
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      
      print('📥 Upload image response: ${response.statusCode}');

      if (response.statusCode != 200) {
        throw Exception('Image upload failed: ${response.statusCode}');
      }

      final raw = response.body;
      print('🖼️ Upload image response body: $raw');
      final data = json.decode(raw);
      final payload = data['data'];
      
      if (payload == null) {
        throw Exception('No image returned');
      }

      // Handle different response formats
      // Format 1: { data: { url: "..." } }
      if (payload is Map && payload['url'] != null) {
        return payload['url'] as String;
      }

      // Format 2: { data: { fileUrl: "..." } }
      if (payload is Map && payload['fileUrl'] != null) {
        return payload['fileUrl'] as String;
      }

      // Format 3: { data: { fileUrls: ["url1"] } }
      if (payload is Map && payload['fileUrls'] is List && (payload['fileUrls'] as List).isNotEmpty) {
        return (payload['fileUrls'] as List).first as String;
      }

      throw Exception('No image URL returned. Response format: $raw');
    } catch (e) {
      print('❌ Error in uploadImage: $e');
      rethrow;
    }
  }

  /// Upload voice recording for live chat
  /// Uses endpoint: POST /api/live-chat/upload
  Future<String> uploadVoice(XFile xfile) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      print('📤 Uploading voice for live chat...');

      final uri = Uri.parse('$baseUrl/api/live-chat/upload');
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
          filename = 'live_chat_voice_${DateTime.now().millisecondsSinceEpoch}.$ext';
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
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
            'file',
            file.path,
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      
      print('📥 Upload voice response: ${response.statusCode}');

      if (response.statusCode != 200) {
        throw Exception('Voice upload failed: ${response.statusCode}');
      }

      final raw = response.body;
      print('🎙️ Upload voice response body: $raw');
      final data = json.decode(raw);
      final payload = data['data'];
      
      if (payload == null) {
        throw Exception('No voice file returned');
      }

      // Handle different response formats
      // Format 1: { data: { url: "..." } }
      if (payload is Map && payload['url'] != null) {
        return payload['url'] as String;
      }

      // Format 2: { data: { fileUrl: "..." } }
      if (payload is Map && payload['fileUrl'] != null) {
        return payload['fileUrl'] as String;
      }

      // Format 3: { data: { fileUrls: ["url1"] } }
      if (payload is Map && payload['fileUrls'] is List && (payload['fileUrls'] as List).isNotEmpty) {
        return (payload['fileUrls'] as List).first as String;
      }

      throw Exception('No voice URL returned. Response format: $raw');
    } catch (e) {
      print('❌ Error in uploadVoice: $e');
      rethrow;
    }
  }

  /// Get admin information for the user's ward/zone
  /// Returns admin details to display in the chat header
  Future<Map<String, dynamic>> getAdmin() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      print('📡 Fetching admin info...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/live-chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📥 Get admin response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final admin = data['data']['admin'];
        
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
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('No admin found for your location');
      } else {
        throw Exception('Failed to get admin info: ${response.statusCode}');
      }
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
      return messages.where((msg) => !msg.read && msg.senderType == 'ADMIN').length;
    } catch (e) {
      print('❌ Error in getUnreadMessageCount: $e');
      return 0;
    }
  }
}
