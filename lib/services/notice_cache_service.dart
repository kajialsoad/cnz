import '../models/notice_model.dart';
import 'offline_cache_service.dart';

class NoticeCacheService {
  final OfflineCacheService _offlineCache = OfflineCacheService();

  /// Cache notice detail data
  Future<void> cacheNotice(Notice notice) async {
    await _offlineCache.saveCache('notice', 'detail_${notice.id}', notice.toJson());
  }

  /// Get cached notice detail data
  Future<Notice?> getCachedNotice(int noticeId) async {
    final json = await _offlineCache.getCache('notice', 'detail_$noticeId');
    if (json != null) {
      try {
        return Notice.fromJson(Map<String, dynamic>.from(json));
      } catch (e) {
        print('Error parsing cached notice: $e');
        return null;
      }
    }
    return null;
  }
}
