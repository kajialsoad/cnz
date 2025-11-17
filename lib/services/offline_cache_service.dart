import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/complaint.dart';

/// Service to handle offline caching of complaints using Hive
class OfflineCacheService {
  static const String _complaintsBoxName = 'complaints_cache';
  static const String _lastSyncKey = 'last_sync_time';
  
  Box<String>? _complaintsBox;

  /// Initialize Hive and open the complaints box
  Future<void> init() async {
    try {
      if (!Hive.isBoxOpen(_complaintsBoxName)) {
        await Hive.initFlutter();
        _complaintsBox = await Hive.openBox<String>(_complaintsBoxName);
      } else {
        _complaintsBox = Hive.box<String>(_complaintsBoxName);
      }
    } catch (e) {
      print('Error initializing Hive: $e');
      // If initialization fails, try to open the box anyway
      try {
        _complaintsBox = await Hive.openBox<String>(_complaintsBoxName);
      } catch (e) {
        print('Error opening box: $e');
      }
    }
  }
  
  /// Ensure box is open before operations
  Future<Box<String>?> _ensureBoxOpen() async {
    try {
      if (_complaintsBox == null || !_complaintsBox!.isOpen) {
        if (Hive.isBoxOpen(_complaintsBoxName)) {
          _complaintsBox = Hive.box<String>(_complaintsBoxName);
        } else {
          _complaintsBox = await Hive.openBox<String>(_complaintsBoxName);
        }
      }
      return _complaintsBox;
    } catch (e) {
      print('Error ensuring box is open: $e');
      return null;
    }
  }

  /// Cache the list of complaints
  Future<void> cacheComplaints(List<Complaint> complaints) async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return;

      // Convert complaints to JSON and store
      final complaintsJson = complaints.map((c) => c.toJson()).toList();
      final jsonString = jsonEncode(complaintsJson);
      
      await box.put('complaints_list', jsonString);
      await box.put(_lastSyncKey, DateTime.now().toIso8601String());
    } catch (e) {
      print('Error caching complaints: $e');
    }
  }

  /// Get cached complaints
  Future<List<Complaint>?> getCachedComplaints() async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return null;

      final jsonString = box.get('complaints_list');
      if (jsonString == null) return null;

      final List<dynamic> complaintsJson = jsonDecode(jsonString);
      return complaintsJson.map((json) => Complaint.fromJson(json)).toList();
    } catch (e) {
      print('Error retrieving cached complaints: $e');
      return null;
    }
  }

  /// Get the last sync time
  Future<DateTime?> getLastSyncTime() async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return null;

      final timeString = box.get(_lastSyncKey);
      if (timeString == null) return null;
      return DateTime.parse(timeString);
    } catch (e) {
      print('Error retrieving last sync time: $e');
      return null;
    }
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return;

      await box.clear();
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  /// Check if cache exists
  Future<bool> hasCachedData() async {
    try {
      final box = await _ensureBoxOpen();
      if (box == null) return false;

      return box.containsKey('complaints_list');
    } catch (e) {
      print('Error checking cached data: $e');
      return false;
    }
  }

  /// Close the box
  Future<void> dispose() async {
    await _complaintsBox?.close();
  }
}
