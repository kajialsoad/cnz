import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/waste_post_model.dart';
import 'offline_cache_service.dart';
import 'connectivity_service.dart';

class WasteManagementService {
  final String baseUrl = '${ApiConfig.baseUrl}/api/waste-management';
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  // In-memory cache to persist data across page navigation
  static List<WastePost>? currentWastePostsMemory;
  static List<WastePost>? futureWastePostsMemory;
  static DateTime? lastFetchTimeCurrent;
  static DateTime? lastFetchTimeFuture;

  /// Initialize offline services
  Future<void> init() async {
    await _cacheService.init();
    await _connectivityService.init();
  }

  /// Get posts by category with offline-first support
  /// 
  /// This method implements cache-first loading:
  /// 1. Checks network connectivity
  /// 2. If offline, loads from cache
  /// 3. If online, fetches from API and updates cache
  /// 4. Falls back to cache on API failure
  /// 
  /// Cache key format: waste_posts_{category}
  /// TTL: 6 hours (handled by app logic - always tries fresh data when online)
  Future<List<WastePost>> getPostsByCategory(
    String token,
    String category, {
    bool useCache = true,
  }) async {
    final cacheKey = 'waste_posts_$category';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts/category/$category'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final posts = data.map((json) => WastePost.fromJson(json)).toList();
        
        // Cache the fresh data
        if (useCache) {
          await _saveToCache(cacheKey, posts);
        }
        
        return posts;
      } else {
        throw Exception('Failed to load posts: ${response.statusCode}');
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
      
      throw Exception('Error fetching posts: $e');
    }
  }

  /// Get all published posts with offline-first support
  /// 
  /// Cache key: waste_posts_all
  Future<List<WastePost>> getPublishedPosts(
    String token, {
    bool useCache = true,
  }) async {
    const cacheKey = 'waste_posts_all';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final posts = data.map((json) => WastePost.fromJson(json)).toList();
        
        // Cache the fresh data
        if (useCache) {
          await _saveToCache(cacheKey, posts);
        }
        
        return posts;
      } else {
        throw Exception('Failed to load posts: ${response.statusCode}');
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
      
      throw Exception('Error fetching posts: $e');
    }
  }

  /// Get post by ID with offline-first support
  /// 
  /// Cache key format: waste_post_detail_{postId}
  Future<WastePost> getPostById(
    String token,
    int postId, {
    bool useCache = true,
  }) async {
    final cacheKey = 'waste_post_detail_$postId';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      final cachedData = await _cacheService.getCache('waste_post', cacheKey);
      if (cachedData != null) {
        return WastePost.fromJson(cachedData);
      }
      throw Exception('No cached data available for post $postId');
    }
    
    // Try to fetch from API
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts/$postId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final post = WastePost.fromJson(json.decode(response.body));
        
        // Cache the fresh data
        if (useCache) {
          await _cacheService.saveCache('waste_post', cacheKey, post.toJson());
        }
        
        return post;
      } else {
        throw Exception('Failed to load post: ${response.statusCode}');
      }
    } catch (e) {
      print('API Error: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          final cachedData = await _cacheService.getCache('waste_post', cacheKey);
          if (cachedData != null) {
            return WastePost.fromJson(cachedData);
          }
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      throw Exception('Error fetching post: $e');
    }
  }

  /// Toggle reaction (like/love)
  /// 
  /// This is a write operation and requires internet connection.
  /// Returns updated reaction counts.
  Future<Map<String, dynamic>> toggleReaction(
    String token,
    int postId,
    String reactionType, // 'LIKE' or 'LOVE'
  ) async {
    // Check connectivity - write operations require internet
    final isOnline = await _connectivityService.checkConnectivity();
    if (!isOnline) {
      throw Exception('Internet connection required for this action');
    }
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/reaction'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'reactionType': reactionType}),
      ).timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to toggle reaction: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error toggling reaction: $e');
    }
  }

  /// Private helper: Load posts from cache
  Future<List<WastePost>> _loadFromCache(String cacheKey) async {
    try {
      final cachedData = await _cacheService.getCache('waste_post', cacheKey);
      if (cachedData != null && cachedData is List) {
        return cachedData.map((json) => WastePost.fromJson(json)).toList();
      }
      throw Exception('No cached data available');
    } catch (e) {
      print('Error loading from cache: $e');
      throw Exception('No cached data available');
    }
  }

  /// Private helper: Save posts to cache
  Future<void> _saveToCache(String cacheKey, List<WastePost> posts) async {
    try {
      final postsJson = posts.map((p) => p.toJson()).toList();
      await _cacheService.saveCache('waste_post', cacheKey, postsJson);
      print('✅ Cached waste posts: $cacheKey');
    } catch (e) {
      print('Error saving to cache: $e');
    }
  }

  /// Get last sync time for a specific cache key
  Future<DateTime?> getLastSyncTime(String cacheKey) async {
    return await _cacheService.getLastSyncTime('waste_post', cacheKey);
  }

  /// Check if offline
  bool get isOffline => !_connectivityService.isOnline;

  /// Get connectivity stream
  Stream<bool> get connectivityStream => _connectivityService.connectivityStream;

  /// Clear all waste post caches
  Future<void> clearCache() async {
    try {
      await _cacheService.clearCacheForEntity('waste_post', 'waste_posts_CURRENT_WASTE');
      await _cacheService.clearCacheForEntity('waste_post', 'waste_posts_FUTURE_WASTE');
      await _cacheService.clearCacheForEntity('waste_post', 'waste_posts_all');
      print('✅ Cleared waste post cache');
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
