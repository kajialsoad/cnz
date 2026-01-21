import 'package:hive_flutter/hive_flutter.dart';
import '../models/cached_chat_message.dart';
import '../models/cached_complaint_info.dart';
import '../models/chat_message.dart' as model;

class ChatCacheService {
  static const String _boxName = 'chat_messages';
  static const String _complaintInfoBoxName = 'complaint_info';
  Box<CachedChatMessage>? _box;
  Box<CachedComplaintInfo>? _complaintBox;

  Future<void> init() async {
    if (!Hive.isBoxOpen(_boxName)) {
      _box = await Hive.openBox<CachedChatMessage>(_boxName);
    } else {
      _box = Hive.box<CachedChatMessage>(_boxName);
    }
    
    if (!Hive.isBoxOpen(_complaintInfoBoxName)) {
      _complaintBox = await Hive.openBox<CachedComplaintInfo>(_complaintInfoBoxName);
    } else {
      _complaintBox = Hive.box<CachedComplaintInfo>(_complaintInfoBoxName);
    }
  }

  /// Save messages to local cache
  Future<void> cacheMessages(int complaintId, List<model.ChatMessage> messages) async {
    await init();
    
    // Delete old messages for this complaint
    final keysToDelete = _box!.keys.where((key) {
      final msg = _box!.get(key);
      return msg?.complaintId == complaintId;
    }).toList();
    
    await _box!.deleteAll(keysToDelete);
    
    // Add new messages
    for (var msg in messages) {
      final cachedMsg = CachedChatMessage(
        complaintId: complaintId,
        messageId: msg.id,
        message: msg.message,
        imageUrl: msg.imageUrl,
        voiceUrl: msg.voiceUrl,
        isUser: msg.isUser,
        senderName: msg.senderName,
        createdAt: msg.createdAt,
        synced: true,
      );
      await _box!.add(cachedMsg);
    }
  }

  /// Get cached messages for a complaint
  Future<List<model.ChatMessage>> getCachedMessages(int complaintId) async {
    await init();
    
    final cachedMessages = _box!.values
        .where((msg) => msg.complaintId == complaintId)
        .toList();
    
    cachedMessages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    
    return cachedMessages.map((cached) {
      return model.ChatMessage(
        id: cached.messageId,
        complaintId: cached.complaintId,
        senderId: 0, // We don't store senderId in cache, using 0 as placeholder
        senderType: cached.isUser ? 'CITIZEN' : 'ADMIN',
        senderName: cached.senderName,
        message: cached.message,
        imageUrl: cached.imageUrl,
        voiceUrl: cached.voiceUrl,
        read: true, // Cached messages are assumed read
        createdAt: cached.createdAt,
      );
    }).toList();
  }

  /// Clear cache for a specific complaint
  Future<void> clearCache(int complaintId) async {
    await init();
    
    final keysToDelete = _box!.keys.where((key) {
      final msg = _box!.get(key);
      return msg?.complaintId == complaintId;
    }).toList();
    
    await _box!.deleteAll(keysToDelete);
  }

  /// Clear all cached messages
  Future<void> clearAllCache() async {
    await init();
    await _box!.clear();
  }

  /// Save complaint info to cache
  Future<void> cacheComplaintInfo(CachedComplaintInfo info) async {
    await init();
    await _complaintBox!.put(info.complaintId, info);
  }

  /// Get cached complaint info
  Future<CachedComplaintInfo?> getComplaintInfo(int complaintId) async {
    await init();
    return _complaintBox!.get(complaintId);
  }
}
