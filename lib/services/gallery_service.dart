import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/gallery_image_model.dart';
import 'offline_cache_service.dart';
import 'connectivity_service.dart';

class GalleryService {
  final String baseUrl = '${ApiConfig.baseUrl}/api/gallery';
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  // Cache configuration
  static const String _entityType = 'gallery';
  static const String _listCacheKey = 'images_list';
  static const Duration _cacheTTL = Duration(hours: 24);

  // Get cached images without API call
  Future<List<GalleryImage>> getCachedImages() async {
    return await _loadFromCache() ?? [];
  }

  // Get all active gallery images with offline-first logic
  Future<List<GalleryImage>> getActiveImages(String token, {bool forceRefresh = false}) async {
    try {
      // 1. Check connectivity
      final isOnline = await _connectivityService.checkConnectivity();
      
      // 2. If offline, load from cache only
      if (!isOnline && !forceRefresh) {
        print('🔴 OFFLINE - Loading gallery images from cache');
        return await _loadFromCache() ?? [];
      }

      // 3. If online, try to load from cache first (instant display)
      List<GalleryImage>? cachedImages;
      if (!forceRefresh) {
        cachedImages = await _loadFromCache();
      }

      // 4. Fetch fresh data from API
      print('🌐 Fetching gallery images from API...');
      final response = await http.get(
        Uri.parse('$baseUrl/images'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final images = data.map((json) => GalleryImage.fromJson(json)).toList();
        
        // 5. Cache the fresh data
        await _saveToCache(images);
        print('✅ Gallery images fetched and cached successfully');
        
        return images;
      } else {
        throw Exception('Failed to load gallery images: ${response.statusCode}');
      }
    } catch (e) {
      print('⚠️ Error fetching gallery images: $e');
      
      // 6. Fallback to cache on error
      final cachedImages = await _loadFromCache();
      if (cachedImages != null && cachedImages.isNotEmpty) {
        print('📦 Using cached gallery images (${cachedImages.length} items)');
        return cachedImages;
      }
      
      throw Exception('Error fetching gallery images: $e');
    }
  }

  // Get image by ID with offline-first logic
  Future<GalleryImage> getImageById(String token, int imageId, {bool forceRefresh = false}) async {
    try {
      final detailCacheKey = 'image_$imageId';
      
      // 1. Check connectivity
      final isOnline = await _connectivityService.checkConnectivity();
      
      // 2. If offline, load from cache only
      if (!isOnline && !forceRefresh) {
        print('🔴 OFFLINE - Loading gallery image $imageId from cache');
        final cachedImage = await _loadImageFromCache(imageId);
        if (cachedImage != null) {
          return cachedImage;
        }
        throw Exception('No cached data available for image $imageId');
      }

      // 3. If online, try to load from cache first (instant display)
      if (!forceRefresh) {
        final cachedImage = await _loadImageFromCache(imageId);
        if (cachedImage != null) {
          print('📦 Showing cached image $imageId while fetching fresh data');
        }
      }

      // 4. Fetch fresh data from API
      print('🌐 Fetching gallery image $imageId from API...');
      final response = await http.get(
        Uri.parse('$baseUrl/images/$imageId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout');
        },
      );

      if (response.statusCode == 200) {
        final image = GalleryImage.fromJson(json.decode(response.body));
        
        // 5. Cache the fresh data
        await _saveImageToCache(image);
        print('✅ Gallery image $imageId fetched and cached successfully');
        
        return image;
      } else {
        throw Exception('Failed to load image: ${response.statusCode}');
      }
    } catch (e) {
      print('⚠️ Error fetching gallery image $imageId: $e');
      
      // 6. Fallback to cache on error
      final cachedImage = await _loadImageFromCache(imageId);
      if (cachedImage != null) {
        print('📦 Using cached gallery image $imageId');
        return cachedImage;
      }
      
      throw Exception('Error fetching image: $e');
    }
  }

  // ==================== CACHE HELPER METHODS ====================

  /// Save gallery images list to cache
  Future<void> _saveToCache(List<GalleryImage> images) async {
    try {
      final imagesJson = images.map((img) => img.toJson()).toList();
      await _cacheService.saveCache(_entityType, _listCacheKey, imagesJson);
    } catch (e) {
      print('Error saving gallery images to cache: $e');
    }
  }

  /// Load gallery images list from cache
  Future<List<GalleryImage>?> _loadFromCache() async {
    try {
      final data = await _cacheService.getCache(_entityType, _listCacheKey);
      if (data == null) return null;

      final List<dynamic> imagesJson = data as List<dynamic>;
      return imagesJson.map((json) => GalleryImage.fromJson(json)).toList();
    } catch (e) {
      print('Error loading gallery images from cache: $e');
      return null;
    }
  }

  /// Save individual gallery image to cache
  Future<void> _saveImageToCache(GalleryImage image) async {
    try {
      final cacheKey = 'image_${image.id}';
      await _cacheService.saveCache(_entityType, cacheKey, image.toJson());
    } catch (e) {
      print('Error saving gallery image ${image.id} to cache: $e');
    }
  }

  /// Load individual gallery image from cache
  Future<GalleryImage?> _loadImageFromCache(int imageId) async {
    try {
      final cacheKey = 'image_$imageId';
      final data = await _cacheService.getCache(_entityType, cacheKey);
      if (data == null) return null;

      return GalleryImage.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      print('Error loading gallery image $imageId from cache: $e');
      return null;
    }
  }

  /// Get last sync time for gallery images
  Future<DateTime?> getLastSyncTime() async {
    try {
      return await _cacheService.getLastSyncTime(_entityType, _listCacheKey);
    } catch (e) {
      print('Error getting last sync time: $e');
      return null;
    }
  }

  /// Check if cached data exists
  Future<bool> hasCachedData() async {
    try {
      return await _cacheService.hasCachedData(_entityType, _listCacheKey);
    } catch (e) {
      print('Error checking cached data: $e');
      return false;
    }
  }

  /// Clear gallery cache
  Future<void> clearCache() async {
    try {
      await _cacheService.clearCacheForEntity(_entityType, _listCacheKey);
      print('🗑️ Gallery cache cleared');
    } catch (e) {
      print('Error clearing gallery cache: $e');
    }
  }
}
