import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/services/offline_cache_service.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';

void main() {
  group('OfflineCacheService', () {
    late OfflineCacheService cacheService;

    setUp(() async {
      cacheService = OfflineCacheService();
      await cacheService.init();
      await cacheService.clearCache();
    });

    tearDown(() async {
      await cacheService.clearCache();
      await cacheService.dispose();
    });

    test('should cache and retrieve complaints', () async {
      // Create test complaints
      final complaints = [
        Complaint(
          id: '1',
          title: 'Test Complaint 1',
          description: 'Test description 1',
          category: 'waste_management',
          urgencyLevel: 'high',
          location: 'Test Location 1',
          status: 'pending',
          userId: 'user1',
          imageUrls: [],
          audioUrls: [],
          priority: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        Complaint(
          id: '2',
          title: 'Test Complaint 2',
          description: 'Test description 2',
          category: 'road_maintenance',
          urgencyLevel: 'medium',
          location: 'Test Location 2',
          status: 'in_progress',
          userId: 'user1',
          imageUrls: [],
          audioUrls: [],
          priority: 2,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      // Cache complaints
      await cacheService.cacheComplaints(complaints);

      // Verify cache exists
      final hasCachedData = await cacheService.hasCachedData();
      expect(hasCachedData, true);

      // Retrieve cached complaints
      final cachedComplaints = await cacheService.getCachedComplaints();
      expect(cachedComplaints, isNotNull);
      expect(cachedComplaints!.length, 2);
      expect(cachedComplaints[0].id, '1');
      expect(cachedComplaints[0].title, 'Test Complaint 1');
      expect(cachedComplaints[1].id, '2');
      expect(cachedComplaints[1].title, 'Test Complaint 2');
    });

    test('should return null when no cached data exists', () async {
      final cachedComplaints = await cacheService.getCachedComplaints();
      expect(cachedComplaints, isNull);
    });

    test('should store and retrieve last sync time', () async {
      final complaints = [
        Complaint(
          id: '1',
          title: 'Test',
          description: 'Test',
          category: 'test',
          urgencyLevel: 'low',
          location: 'Test',
          status: 'pending',
          userId: 'user1',
          imageUrls: [],
          audioUrls: [],
          priority: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      await cacheService.cacheComplaints(complaints);

      final lastSyncTime = await cacheService.getLastSyncTime();
      expect(lastSyncTime, isNotNull);
      expect(lastSyncTime!.isBefore(DateTime.now()), true);
    });

    test('should clear cache', () async {
      final complaints = [
        Complaint(
          id: '1',
          title: 'Test',
          description: 'Test',
          category: 'test',
          urgencyLevel: 'low',
          location: 'Test',
          status: 'pending',
          userId: 'user1',
          imageUrls: [],
          audioUrls: [],
          priority: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      await cacheService.cacheComplaints(complaints);
      expect(await cacheService.hasCachedData(), true);

      await cacheService.clearCache();
      expect(await cacheService.hasCachedData(), false);
    });
  });
}
