import 'package:flutter/foundation.dart';
import '../models/notice_model.dart';
import '../services/notice_service.dart';
import '../services/offline_cache_service.dart';
import '../services/connectivity_service.dart';

class NoticeProvider with ChangeNotifier {
  final NoticeService _noticeService = NoticeService();
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  List<Notice> _notices = [];
  List<NoticeCategory> _categories = [];
  List<NoticeCategory> _categoryTree = [];
  bool _isLoading = false;
  String? _error;
  int? _selectedCategoryId;
  String? _selectedType;
  bool _isOffline = false;
  DateTime? _lastSyncTime;

  NoticeProvider() {
    _initializeServices();
  }

  /// Initialize offline services
  Future<void> _initializeServices() async {
    try {
      await _cacheService.init();
      await _connectivityService.init();

      // Listen to connectivity changes
      _connectivityService.connectivityStream.listen((isOnline) {
        _isOffline = !isOnline;
        notifyListeners();

        // Auto-refresh when coming back online
        if (isOnline && _notices.isEmpty) {
          loadNotices();
        }
      });

      // Set initial offline status
      _isOffline = !_connectivityService.isOnline;

      // Load last sync time
      _lastSyncTime = await _cacheService.getLastSyncTime('notice', 'list');

      notifyListeners();
    } catch (e) {
      print('Error initializing offline services: $e');
    }
  }

  List<Notice> get notices => _notices;
  List<NoticeCategory> get categories => _categories;
  List<NoticeCategory> get categoryTree => _categoryTree;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int? get selectedCategoryId => _selectedCategoryId;
  String? get selectedType => _selectedType;
  bool get isOffline => _isOffline;
  DateTime? get lastSyncTime => _lastSyncTime;

  // Get filtered notices
  List<Notice> get filteredNotices {
    if (_selectedCategoryId == null && _selectedType == null) {
      return _notices;
    }

    return _notices.where((notice) {
      bool matchesCategory =
          _selectedCategoryId == null ||
          notice.categoryId == _selectedCategoryId;
      bool matchesType = _selectedType == null || notice.type == _selectedType;
      return matchesCategory && matchesType;
    }).toList();
  }

  // Generate cache key based on filters
  String _getCacheKey() {
    String key = 'list';
    if (_selectedCategoryId != null) {
      key += '_cat${_selectedCategoryId}';
    }
    if (_selectedType != null) {
      key += '_type${_selectedType}';
    }
    return key;
  }

  // Load notices
  Future<void> loadNotices({bool refresh = false}) async {
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    _isOffline = !isOnline;

    // If offline, load from cache
    if (!isOnline && !refresh) {
      await _loadFromCache();
      return;
    }

    // Check freshness (5 minutes cache validity)
    if (!refresh && _notices.isNotEmpty && _lastSyncTime != null) {
      final difference = DateTime.now().difference(_lastSyncTime!);
      if (difference.inMinutes < 5) {
        // Data is fresh enough, no need to reload
        return;
      }
    }

    // Show cached data immediately while loading fresh data
    if (!refresh && _notices.isEmpty) {
      await _loadFromCache();
      // If cache loaded successfully and is fresh enough, we might skip fetch
      if (_notices.isNotEmpty && _lastSyncTime != null) {
        final difference = DateTime.now().difference(_lastSyncTime!);
        if (difference.inMinutes < 5) {
          return;
        }
      }
    }

    if (_isLoading && !refresh) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fetch fresh data from API
      _notices = await _noticeService.getActiveNotices(
        categoryId: _selectedCategoryId,
        type: _selectedType,
      );

      // Cache the fresh data with filter-specific key
      final cacheKey = _getCacheKey();
      final noticesJson = _notices.map((n) => n.toJson()).toList();
      await _cacheService.saveCache('notice', cacheKey, noticesJson);
      _lastSyncTime = await _cacheService.getLastSyncTime('notice', cacheKey);

      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading notices: $e');

      // If fetch fails and we have no data, try loading from cache
      if (_notices.isEmpty) {
        await _loadFromCache();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load notices from local cache
  Future<void> _loadFromCache() async {
    try {
      final cacheKey = _getCacheKey();
      final cachedData = await _cacheService.getCache('notice', cacheKey);
      if (cachedData != null && cachedData is List) {
        _notices = cachedData.map((json) => Notice.fromJson(json)).toList();
        _lastSyncTime = await _cacheService.getLastSyncTime('notice', cacheKey);
        notifyListeners();
      }
    } catch (e) {
      print('Error loading from cache: $e');
    }
  }

  // Load categories
  Future<void> loadCategories() async {
    // If categories are already loaded, don't reload unless necessary
    if (_categories.isNotEmpty) return;

    try {
      _categories = await _noticeService.getCategories();
      notifyListeners();
    } catch (e) {
      print('Error loading categories: $e');
    }
  }

  // Load category tree (hierarchical)
  Future<void> loadCategoryTree() async {
    try {
      _categoryTree = await _noticeService.getCategoryTree();
      notifyListeners();
    } catch (e) {
      print('Error loading category tree: $e');
    }
  }

  // Set category filter
  void setCategoryFilter(int? categoryId) {
    if (_selectedCategoryId == categoryId) return;
    _selectedCategoryId = categoryId;
    _notices = [];
    _lastSyncTime = null;
    notifyListeners();
    loadNotices(refresh: false);
  }

  // Set type filter
  void setTypeFilter(String? type) {
    if (_selectedType == type) return;
    _selectedType = type;
    _notices = [];
    _lastSyncTime = null;
    notifyListeners();
    loadNotices(refresh: false);
  }

  // Clear filters
  void clearFilters() {
    if (_selectedCategoryId == null && _selectedType == null) return;
    _selectedCategoryId = null;
    _selectedType = null;
    _notices = [];
    _lastSyncTime = null;
    notifyListeners();
    loadNotices(refresh: false);
  }

  // Get notice by ID
  Future<Notice> getNoticeById(int id) async {
    return await _noticeService.getNoticeById(id);
  }

  // Increment view count
  Future<void> incrementViewCount(int id) async {
    await _noticeService.incrementViewCount(id);
  }

  // Mark as read
  Future<void> markAsRead(int id) async {
    await _noticeService.markAsRead(id);
  }

  // Toggle interaction (Like, Love, RSVP)
  Future<void> toggleInteraction(int noticeId, String type) async {
    // Disable interactions when offline
    if (_isOffline) {
      print('Cannot toggle interaction while offline');
      return;
    }

    // Optimistic UI Update
    final noticeIndex = _notices.indexWhere((n) => n.id == noticeId);
    Notice? previousNotice;
    if (noticeIndex != -1) {
      final notice = _notices[noticeIndex];
      previousNotice = notice;
      final currentInteractions = List<String>.from(
        notice.userInteractions ?? [],
      );
      final currentCounts = Map<String, int>.from(
        notice.interactionCounts ?? {},
      );

      bool isAdding = !currentInteractions.contains(type);

      // Handle mutual exclusivity for LIKE/LOVE
      if (type == 'LIKE' || type == 'LOVE') {
        if (currentInteractions.contains('LIKE') && type == 'LOVE') {
          currentInteractions.remove('LIKE');
          currentCounts['LIKE'] = (currentCounts['LIKE'] ?? 1) - 1;
          if ((currentCounts['LIKE'] ?? 0) < 0) currentCounts['LIKE'] = 0;
        } else if (currentInteractions.contains('LOVE') && type == 'LIKE') {
          currentInteractions.remove('LOVE');
          currentCounts['LOVE'] = (currentCounts['LOVE'] ?? 1) - 1;
          if ((currentCounts['LOVE'] ?? 0) < 0) currentCounts['LOVE'] = 0;
        }
      }

      if (isAdding) {
        currentInteractions.add(type);
        currentCounts[type] = (currentCounts[type] ?? 0) + 1;
      } else {
        currentInteractions.remove(type);
        currentCounts[type] = (currentCounts[type] ?? 1) - 1;
        if ((currentCounts[type] ?? 0) < 0) currentCounts[type] = 0;
      }

      _notices[noticeIndex] = notice.copyWith(
        interactionCounts: currentCounts,
        userInteractions: currentInteractions,
      );
      notifyListeners();
    }

    try {
      await _noticeService.toggleInteraction(noticeId, type);
      // Reload notices to update counts and user interactions from server
      // We do this in background to keep UI snappy
      loadNotices(refresh: true);
    } catch (e) {
      print('Error toggling interaction: $e');
      if (noticeIndex != -1 && previousNotice != null) {
        _notices[noticeIndex] = previousNotice;
        notifyListeners();
      }
    }
  }

  /// Clear offline cache
  Future<void> clearOfflineCache() async {
    try {
      // Clear all notice caches (all filter combinations)
      await _cacheService.clearCacheForEntity('notice', 'list');
      _lastSyncTime = null;
      notifyListeners();
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  @override
  void dispose() {
    _connectivityService.dispose();
    _cacheService.dispose();
    super.dispose();
  }
}
