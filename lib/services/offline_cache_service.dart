import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/complaint.dart';

/// Generic service to handle offline caching for all entity types using Hive
/// Supports: complaints, notices, waste_posts, calendar, gallery, officer_reviews
class OfflineCacheService {
  static const String _cacheBoxName = 'app_cache';
  
  Box<String>? _cacheBox;

  /// Initialize Hive and open the cache box
  Future<void> init() async {
    try {
      if (!Hive.isBoxOpen(_cacheBoxName)) {
        await Hive.initFlutter();
        _cacheBox = await Hive.openBox<String>(_cacheBoxName);
      } else {
        _cacheBox = Hive.box<String>(_cacheBoxName);
      }
    } catch (e) {
      print('Error initializing Hive: $e');
      // If initialization fails, try to open the box anyway
      try {
        _cacheBox = await Hive.openBox<String>(_cacheBoxName);
      } catch (e) {
        print('Error opening box: $e');
      }
    }
  }
  
  /// Ensure box is open before operations
  Future<Box<String>?> _ensureBoxOpen() async {
    try {
      if (_cacheBox == null || !_cacheBox!.isOpen) {
        if (Hive.isBoxOpen(_cacheBoxName)) {
          _cacheBox = Hive.box<String>(_cacheBoxName);
        } else {
          _cacheBox = await Hive.openBox<String>(_cacheBoxName);
        }
      }
      return _cacheBox;
    } catch (e) {
      print('Error ensuring box is open: $e');
      return null;
    }
  }

  /// Generate cache key for entity
  String _getCacheKey(String entityType, String cacheKey) {
    return '${entityType}_$cacheKey';
  }

  /// Generate last sync key for entity
  String _getLastSyncKey(String entityType, String cacheKey) {
    return '${entityType}_${cacheKey}_last_sync';
  }

  // ==================== GENERIC CACHE METHODS ====================

  /// Save generic data to cache
  Future<void> saveCache(String entityType, String cacheKey, dynamic data) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return;

      final key = _getCacheKey(entityType, cacheKey);
      final syncKey = _getLastSyncKey(entityType, cacheKey);
      
      // Convert data to JSON string
      String jsonString;
      if (data is List) {
        jsonString = jsonEncode(data);
      } else if (data is Map) {
        jsonString = jsonEncode(data);
      } else {
        jsonString = jsonEncode(data);
      }
      
      await box.put(key, jsonString);
      await box.put(syncKey, DateTime.now().toIso8601String());
      
      print('✅ Cached $entityType/$cacheKey');
    } catch (e) {
      print('Error saving cache for $entityType/$cacheKey: $e');
    }
  }

  /// Get generic data from cache
  Future<dynamic> getCache(String entityType, String cacheKey) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return null;

      final key = _getCacheKey(entityType, cacheKey);
      final jsonString = box.get(key);
      
      if (jsonString == null) return null;

      return jsonDecode(jsonString);
    } catch (e) {
      print('Error retrieving cache for $entityType/$cacheKey: $e');
      return null;
    }
  }

  /// Get last sync time for entity
  Future<DateTime?> getLastSyncTime(String entityType, String cacheKey) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return null;

      final syncKey = _getLastSyncKey(entityType, cacheKey);
      final timeString = box.get(syncKey);
      
      if (timeString == null) return null;
      return DateTime.parse(timeString);
    } catch (e) {
      print('Error retrieving last sync time for $entityType/$cacheKey: $e');
      return null;
    }
  }

  /// Check if cache exists for entity
  Future<bool> hasCachedData(String entityType, String cacheKey) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return false;

      final key = _getCacheKey(entityType, cacheKey);
      return box.containsKey(key);
    } catch (e) {
      print('Error checking cached data for $entityType/$cacheKey: $e');
      return false;
    }
  }

  /// Clear cache for specific entity
  Future<void> clearCacheForEntity(String entityType, String cacheKey) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return;

      final key = _getCacheKey(entityType, cacheKey);
      final syncKey = _getLastSyncKey(entityType, cacheKey);
      
      await box.delete(key);
      await box.delete(syncKey);
      
      print('🗑️ Cleared cache for $entityType/$cacheKey');
    } catch (e) {
      print('Error clearing cache for $entityType/$cacheKey: $e');
    }
  }

  // ==================== LEGACY COMPLAINT METHODS (for backward compatibility) ====================

  // ==================== LEGACY COMPLAINT METHODS (for backward compatibility) ====================

  /// Cache the list of complaints (legacy method)
  Future<void> cacheComplaints(List<Complaint> complaints) async {
    final complaintsJson = complaints.map((c) => c.toJson()).toList();
    await saveCache('complaint', 'list', complaintsJson);
  }

  /// Get cached complaints (legacy method)
  Future<List<Complaint>?> getCachedComplaints() async {
    try {
      final data = await getCache('complaint', 'list');
      if (data == null) return null;

      final List<dynamic> complaintsJson = data as List<dynamic>;
      return complaintsJson.map((json) => Complaint.fromJson(json)).toList();
    } catch (e) {
      print('Error retrieving cached complaints: $e');
      return null;
    }
  }

  /// Get the last sync time for complaints (legacy method - no parameters)
  Future<DateTime?> getComplaintLastSyncTime() async {
    final box = await _ensureBoxOpen();
    if (box == null) return null;

    final syncKey = 'complaint_list_last_sync';
    final timeString = box.get(syncKey);
    
    if (timeString == null) return null;
    return DateTime.parse(timeString);
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return;

      await box.clear();
      print('🗑️ Cleared all cache');
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  /// Check if complaint cache exists (legacy method - no parameters)
  Future<bool> hasComplaintCachedData() async {
    final box = await _ensureBoxOpen();
    if (box == null) return false;

    final key = 'complaint_list';
    return box.containsKey(key);
  }

  /// Close the box
  Future<void> dispose() async {
    await _cacheBox?.close();
  }
}
