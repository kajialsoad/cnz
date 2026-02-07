import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

/// SQLite Database Helper for Persistent Caching
///
/// This service provides persistent local storage for all app data,
/// improving performance by eliminating network wait times on app start.
///
/// Benefits:
/// - Instant loading from local database
/// - Data persists across app restarts
/// - No network required for initial display
/// - Background sync updates data
class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  /// Get database instance
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('clean_care.db');
    return _database!;
  }

  /// Initialize database
  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 3,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  /// Create database tables
  Future<void> _createDB(Database db, int version) async {
    // Notices table
    await db.execute('''
      CREATE TABLE notices (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category_id INTEGER,
        category_name TEXT,
        type TEXT,
        priority TEXT,
        image_url TEXT,
        published_at TEXT,
        expires_at TEXT,
        city_corporation_id INTEGER,
        zone_id INTEGER,
        ward_id INTEGER,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        love_count INTEGER DEFAULT 0,
        rsvp_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Gallery images table
    await db.execute('''
      CREATE TABLE gallery_images (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Calendar events table
    await db.execute('''
      CREATE TABLE calendar_events (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT,
        location TEXT,
        category TEXT,
        image_url TEXT,
        city_corporation_id INTEGER,
        zone_id INTEGER,
        ward_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Officer reviews table
    await db.execute('''
      CREATE TABLE officer_reviews (
        id INTEGER PRIMARY KEY,
        officer_name TEXT NOT NULL,
        officer_designation TEXT NOT NULL,
        officer_image_url TEXT,
        review_text TEXT NOT NULL,
        rating REAL,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Waste management posts table
    await db.execute('''
      CREATE TABLE waste_posts (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        location TEXT,
        scheduled_date TEXT,
        status TEXT,
        like_count INTEGER DEFAULT 0,
        love_count INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Complaints cache table (list data only)
    await db.execute('''
      CREATE TABLE complaints_cache (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        subcategory TEXT,
        status TEXT,
        priority TEXT,
        image_url TEXT,
        location TEXT,
        city_corporation_id INTEGER,
        zone_id INTEGER,
        ward_id INTEGER,
        user_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // User profile table
    await db.execute('''
      CREATE TABLE user_profile (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        avatar_url TEXT,
        city_corporation_id INTEGER,
        zone_id INTEGER,
        ward_id INTEGER,
        role TEXT,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');

    // Notifications table
    await db.execute('''
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        complaint_id INTEGER,
        status_change TEXT,
        metadata TEXT,
        created_at TEXT,
        updated_at TEXT,
        cached_at TEXT NOT NULL
      )
    ''');
    await db.execute(
      'CREATE INDEX idx_notifications_read ON notifications(is_read)',
    );

    // Cache metadata table
    await db.execute('''
      CREATE TABLE cache_metadata (
        cache_key TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        last_sync TEXT NOT NULL,
        expires_at TEXT,
        record_count INTEGER DEFAULT 0
      )
    ''');

    // Create indexes for better query performance
    await db.execute(
      'CREATE INDEX idx_notices_category ON notices(category_id)',
    );
    await db.execute('CREATE INDEX idx_notices_type ON notices(type)');
    await db.execute('CREATE INDEX idx_notices_active ON notices(is_active)');
    await db.execute(
      'CREATE INDEX idx_gallery_active ON gallery_images(is_active)',
    );
    await db.execute(
      'CREATE INDEX idx_calendar_date ON calendar_events(event_date)',
    );
    await db.execute(
      'CREATE INDEX idx_calendar_active ON calendar_events(is_active)',
    );
    await db.execute(
      'CREATE INDEX idx_waste_category ON waste_posts(category)',
    );
    await db.execute(
      'CREATE INDEX idx_complaints_status ON complaints_cache(status)',
    );
  }

  /// Handle database upgrades
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Notifications table
      await db.execute('''
        CREATE TABLE notifications (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          complaint_id INTEGER,
          status_change TEXT,
          metadata TEXT,
          created_at TEXT,
          updated_at TEXT,
          cached_at TEXT NOT NULL
        )
      ''');
      await db.execute(
        'CREATE INDEX idx_notifications_read ON notifications(is_read)',
      );
    } else if (oldVersion < 3) {
      // Add missing columns to notifications table
      try {
        await db.execute(
          'ALTER TABLE notifications ADD COLUMN complaint_id INTEGER',
        );
      } catch (e) {
        print('Column complaint_id might already exist: $e');
      }
      try {
        await db.execute(
          'ALTER TABLE notifications ADD COLUMN status_change TEXT',
        );
      } catch (e) {
        print('Column status_change might already exist: $e');
      }
      try {
        await db.execute('ALTER TABLE notifications ADD COLUMN metadata TEXT');
      } catch (e) {
        print('Column metadata might already exist: $e');
      }

      // Remove unused columns if possible, but SQLite doesn't support DROP COLUMN easily in older versions
      // We'll just ignore reference_id and reference_type
    }
  }

  // ==================== NOTICES ====================

  /// Save notices to database
  Future<void> saveNotices(List<Map<String, dynamic>> notices) async {
    final db = await database;
    final batch = db.batch();

    for (var notice in notices) {
      notice['cached_at'] = DateTime.now().toIso8601String();
      batch.insert(
        'notices',
        notice,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata('notices', 'notice', notices.length);
  }

  /// Get notices from database
  Future<List<Map<String, dynamic>>> getNotices({
    int? categoryId,
    String? type,
    int? limit,
  }) async {
    final db = await database;
    String where = 'is_active = 1';
    List<dynamic> whereArgs = [];

    if (categoryId != null) {
      where += ' AND category_id = ?';
      whereArgs.add(categoryId);
    }

    if (type != null) {
      where += ' AND type = ?';
      whereArgs.add(type);
    }

    return await db.query(
      'notices',
      where: where,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'published_at DESC',
      limit: limit,
    );
  }

  /// Get single notice by ID
  Future<Map<String, dynamic>?> getNoticeById(int id) async {
    final db = await database;
    final results = await db.query(
      'notices',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // ==================== GALLERY ====================

  /// Save gallery images to database
  Future<void> saveGalleryImages(List<Map<String, dynamic>> images) async {
    final db = await database;
    final batch = db.batch();

    for (var image in images) {
      image['cached_at'] = DateTime.now().toIso8601String();
      batch.insert(
        'gallery_images',
        image,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata('gallery_images', 'gallery', images.length);
  }

  /// Get gallery images from database
  Future<List<Map<String, dynamic>>> getGalleryImages() async {
    final db = await database;
    return await db.query(
      'gallery_images',
      where: 'is_active = 1',
      orderBy: 'display_order ASC, created_at DESC',
    );
  }

  /// Get single gallery image by ID
  Future<Map<String, dynamic>?> getGalleryImageById(int id) async {
    final db = await database;
    final results = await db.query(
      'gallery_images',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // ==================== CALENDAR ====================

  /// Save calendar events to database
  Future<void> saveCalendarEvents(List<Map<String, dynamic>> events) async {
    final db = await database;
    final batch = db.batch();

    for (var event in events) {
      event['cached_at'] = DateTime.now().toIso8601String();
      batch.insert(
        'calendar_events',
        event,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata('calendar_events', 'calendar', events.length);
  }

  /// Get calendar events from database
  Future<List<Map<String, dynamic>>> getCalendarEvents({
    String? startDate,
    String? endDate,
    String? category,
  }) async {
    final db = await database;
    String where = 'is_active = 1';
    List<dynamic> whereArgs = [];

    if (startDate != null) {
      where += ' AND event_date >= ?';
      whereArgs.add(startDate);
    }

    if (endDate != null) {
      where += ' AND event_date <= ?';
      whereArgs.add(endDate);
    }

    if (category != null) {
      where += ' AND category = ?';
      whereArgs.add(category);
    }

    return await db.query(
      'calendar_events',
      where: where,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'event_date ASC',
    );
  }

  // ==================== OFFICER REVIEWS ====================

  /// Save officer reviews to database
  Future<void> saveOfficerReviews(List<Map<String, dynamic>> reviews) async {
    final db = await database;
    final batch = db.batch();

    for (var review in reviews) {
      review['cached_at'] = DateTime.now().toIso8601String();
      batch.insert(
        'officer_reviews',
        review,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata(
      'officer_reviews',
      'officer_review',
      reviews.length,
    );
  }

  /// Get officer reviews from database
  Future<List<Map<String, dynamic>>> getOfficerReviews() async {
    final db = await database;
    return await db.query(
      'officer_reviews',
      where: 'is_active = 1',
      orderBy: 'display_order ASC, created_at DESC',
    );
  }

  // ==================== WASTE MANAGEMENT ====================

  /// Save waste posts to database
  Future<void> saveWastePosts(List<Map<String, dynamic>> posts) async {
    final db = await database;
    final batch = db.batch();

    for (var post in posts) {
      post['cached_at'] = DateTime.now().toIso8601String();
      batch.insert(
        'waste_posts',
        post,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata('waste_posts', 'waste_post', posts.length);
  }

  /// Get waste posts from database
  Future<List<Map<String, dynamic>>> getWastePosts({String? category}) async {
    final db = await database;

    if (category != null) {
      return await db.query(
        'waste_posts',
        where: 'category = ? AND is_published = 1',
        whereArgs: [category],
        orderBy: 'scheduled_date DESC',
      );
    }

    return await db.query(
      'waste_posts',
      where: 'is_published = 1',
      orderBy: 'scheduled_date DESC',
    );
  }

  /// Get single waste post by ID
  Future<Map<String, dynamic>?> getWastePostById(int id) async {
    final db = await database;
    final results = await db.query(
      'waste_posts',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // ==================== USER PROFILE ====================

  /// Save user profile to database
  Future<void> saveUserProfile(Map<String, dynamic> profile) async {
    final db = await database;
    profile['cached_at'] = DateTime.now().toIso8601String();

    await db.insert(
      'user_profile',
      profile,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    await _updateCacheMetadata('user_profile', 'user', 1);
  }

  /// Get user profile from database
  Future<Map<String, dynamic>?> getUserProfile(int userId) async {
    final db = await database;
    final results = await db.query(
      'user_profile',
      where: 'id = ?',
      whereArgs: [userId],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // ==================== NOTIFICATIONS ====================

  /// Save notifications to database
  Future<void> saveNotifications(
    List<Map<String, dynamic>> notifications,
  ) async {
    final db = await database;
    final batch = db.batch();
    final now = DateTime.now().toIso8601String();

    for (var notification in notifications) {
      // Create a clean map for SQLite
      final Map<String, dynamic> dbNotification = {};

      dbNotification['id'] = notification['id'];
      dbNotification['title'] = notification['title'];
      dbNotification['message'] = notification['message'];
      dbNotification['type'] = notification['type'];
      dbNotification['cached_at'] = now;

      // Handle isRead -> is_read
      if (notification.containsKey('isRead')) {
        dbNotification['is_read'] = (notification['isRead'] == true) ? 1 : 0;
      } else if (notification.containsKey('is_read')) {
        dbNotification['is_read'] =
            (notification['is_read'] == true || notification['is_read'] == 1)
            ? 1
            : 0;
      } else {
        dbNotification['is_read'] = 0;
      }

      // Handle createdAt -> created_at
      if (notification.containsKey('createdAt')) {
        dbNotification['created_at'] = notification['createdAt'];
      } else if (notification.containsKey('created_at')) {
        dbNotification['created_at'] = notification['created_at'];
      }

      // Handle complaintId -> complaint_id
      if (notification.containsKey('complaintId')) {
        dbNotification['complaint_id'] = notification['complaintId'];
      } else if (notification.containsKey('complaint_id')) {
        dbNotification['complaint_id'] = notification['complaint_id'];
      }

      // Handle statusChange -> status_change
      if (notification.containsKey('statusChange')) {
        dbNotification['status_change'] = notification['statusChange'];
      } else if (notification.containsKey('status_change')) {
        dbNotification['status_change'] = notification['status_change'];
      }

      // Handle metadata (complex object -> JSON string)
      if (notification.containsKey('metadata') &&
          notification['metadata'] != null) {
        if (notification['metadata'] is String) {
          dbNotification['metadata'] = notification['metadata'];
        } else {
          try {
            dbNotification['metadata'] = jsonEncode(notification['metadata']);
          } catch (e) {
            print('Error encoding metadata: $e');
            dbNotification['metadata'] = null;
          }
        }
      }

      batch.insert(
        'notifications',
        dbNotification,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
    await _updateCacheMetadata(
      'notifications',
      'notification',
      notifications.length,
    );
  }

  /// Get notifications from database
  Future<List<Map<String, dynamic>>> getNotifications({
    int? limit,
    int? offset,
  }) async {
    final db = await database;
    return await db.query(
      'notifications',
      orderBy: 'created_at DESC',
      limit: limit,
      offset: offset,
    );
  }

  /// Mark notification as read
  Future<void> markNotificationAsRead(int id) async {
    final db = await database;
    await db.update(
      'notifications',
      {'is_read': 1, 'updated_at': DateTime.now().toIso8601String()},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsAsRead() async {
    final db = await database;
    await db.update('notifications', {
      'is_read': 1,
      'updated_at': DateTime.now().toIso8601String(),
    }, where: 'is_read = 0');
  }

  /// Get unread notification count
  Future<int> getUnreadNotificationCount() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // ==================== CACHE METADATA ====================

  /// Update cache metadata
  Future<void> _updateCacheMetadata(
    String cacheKey,
    String entityType,
    int recordCount,
  ) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    await db.insert('cache_metadata', {
      'cache_key': cacheKey,
      'entity_type': entityType,
      'last_sync': now,
      'record_count': recordCount,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  /// Get last sync time for a cache key
  Future<DateTime?> getLastSyncTime(String cacheKey) async {
    final db = await database;
    final results = await db.query(
      'cache_metadata',
      where: 'cache_key = ?',
      whereArgs: [cacheKey],
      limit: 1,
    );

    if (results.isNotEmpty) {
      final lastSync = results.first['last_sync'] as String?;
      if (lastSync != null) {
        return DateTime.parse(lastSync);
      }
    }
    return null;
  }

  /// Check if cache exists and is fresh
  Future<bool> isCacheFresh(String cacheKey, Duration maxAge) async {
    final lastSync = await getLastSyncTime(cacheKey);
    if (lastSync == null) return false;

    final age = DateTime.now().difference(lastSync);
    return age < maxAge;
  }

  // ==================== UTILITY METHODS ====================

  /// Clear all cached data
  Future<void> clearAllCache() async {
    final db = await database;
    await db.delete('notices');
    await db.delete('gallery_images');
    await db.delete('calendar_events');
    await db.delete('officer_reviews');
    await db.delete('waste_posts');
    await db.delete('complaints_cache');
    await db.delete('cache_metadata');
    print('✅ All cache cleared from SQLite database');
  }

  /// Clear specific entity cache
  Future<void> clearEntityCache(String tableName) async {
    final db = await database;
    await db.delete(tableName);
    await db.delete(
      'cache_metadata',
      where: 'cache_key = ?',
      whereArgs: [tableName],
    );
    print('✅ Cleared $tableName cache from SQLite database');
  }

  /// Get database statistics
  Future<Map<String, int>> getDatabaseStats() async {
    final db = await database;
    final stats = <String, int>{};

    final tables = [
      'notices',
      'gallery_images',
      'calendar_events',
      'officer_reviews',
      'waste_posts',
      'complaints_cache',
      'user_profile',
    ];

    for (var table in tables) {
      final result = await db.rawQuery('SELECT COUNT(*) as count FROM $table');
      stats[table] = Sqflite.firstIntValue(result) ?? 0;
    }

    return stats;
  }

  /// Close database
  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
