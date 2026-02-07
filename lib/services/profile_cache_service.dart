import '../models/user_model.dart';
import 'offline_cache_service.dart';

class ProfileCacheService {
  final OfflineCacheService _offlineCache = OfflineCacheService();

  /// Cache user profile data
  Future<void> cacheProfile(UserModel user) async {
    // Cache with specific ID
    await _offlineCache.saveCache('profile', 'user_${user.id}', user.toJson());
    // Also cache as current user for easy retrieval without ID
    await _offlineCache.saveCache('profile', 'current_user', user.toJson());
  }

  /// Get cached user profile data
  Future<UserModel?> getCachedProfile(int userId) async {
    final json = await _offlineCache.getCache('profile', 'user_$userId');
    if (json != null) {
      try {
        return UserModel.fromJson(Map<String, dynamic>.from(json));
      } catch (e) {
        print('Error parsing cached profile: $e');
        return null;
      }
    }
    return null;
  }

  /// Get current user profile (without ID)
  Future<UserModel?> getCurrentUserProfile() async {
    final json = await _offlineCache.getCache('profile', 'current_user');
    if (json != null) {
      try {
        return UserModel.fromJson(Map<String, dynamic>.from(json));
      } catch (e) {
        print('Error parsing cached profile: $e');
        return null;
      }
    }
    return null;
  }
}
