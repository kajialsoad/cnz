import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/officer_review_model.dart';
import '../config/api_config.dart';
import 'offline_cache_service.dart';
import 'connectivity_service.dart';

class OfficerReviewService {
  final String baseUrl = '${ApiConfig.baseUrl}/api/officer-reviews';
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  /// Initialize offline services
  Future<void> init() async {
    await _cacheService.init();
    await _connectivityService.init();
  }

  /// Get active officer reviews with offline-first support
  /// 
  /// This method implements cache-first loading:
  /// 1. Checks network connectivity
  /// 2. If offline, loads from cache
  /// 3. If online, fetches from API and updates cache
  /// 4. Falls back to cache on API failure
  /// 
  /// Cache key: officer_reviews
  /// TTL: 24 hours (handled by app logic - always tries fresh data when online)
  Future<List<OfficerReview>> getActiveReviews({bool useCache = true}) async {
    const cacheKey = 'officer_reviews';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final url = Uri.parse('$baseUrl/active');
      
      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      ).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final reviews = data.map((json) => OfficerReview.fromJson(json)).toList();
        
        // Cache the fresh data
        if (useCache) {
          await _saveToCache(cacheKey, reviews);
        }
        
        return reviews;
      } else {
        throw Exception('Failed to load officer reviews: ${response.statusCode}');
      }
    } catch (e) {
      print('API Error: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          return await _loadFromCache(cacheKey);
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      throw Exception('Error fetching officer reviews: $e');
    }
  }

  /// Private helper: Load reviews from cache
  Future<List<OfficerReview>> _loadFromCache(String cacheKey) async {
    try {
      final cachedData = await _cacheService.getCache('officer_review', cacheKey);
      if (cachedData != null && cachedData is List) {
        return cachedData.map((json) => OfficerReview.fromJson(json)).toList();
      }
      throw Exception('No cached data available');
    } catch (e) {
      print('Error loading from cache: $e');
      throw Exception('No cached data available');
    }
  }

  /// Private helper: Save reviews to cache
  Future<void> _saveToCache(String cacheKey, List<OfficerReview> reviews) async {
    try {
      final reviewsJson = reviews.map((r) => r.toJson()).toList();
      await _cacheService.saveCache('officer_review', cacheKey, reviewsJson);
      print('✅ Cached officer reviews: $cacheKey');
    } catch (e) {
      print('Error saving to cache: $e');
    }
  }

  /// Get last sync time for officer reviews
  Future<DateTime?> getLastSyncTime() async {
    return await _cacheService.getLastSyncTime('officer_review', 'officer_reviews');
  }

  /// Check if offline
  bool get isOffline => !_connectivityService.isOnline;

  /// Get connectivity stream
  Stream<bool> get connectivityStream => _connectivityService.connectivityStream;

  /// Clear officer review cache
  Future<void> clearCache() async {
    try {
      await _cacheService.clearCacheForEntity('officer_review', 'officer_reviews');
      print('✅ Cleared officer review cache');
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    _connectivityService.dispose();
    _cacheService.dispose();
  }
}
