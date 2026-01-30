import 'package:flutter/foundation.dart';
import '../models/notice_model.dart';
import '../services/notice_service.dart';

class NoticeProvider with ChangeNotifier {
  final NoticeService _noticeService = NoticeService();

  List<Notice> _notices = [];
  List<NoticeCategory> _categories = [];
  List<NoticeCategory> _categoryTree = [];
  bool _isLoading = false;
  String? _error;
  int? _selectedCategoryId;
  String? _selectedType;

  List<Notice> get notices => _notices;
  List<NoticeCategory> get categories => _categories;
  List<NoticeCategory> get categoryTree => _categoryTree;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int? get selectedCategoryId => _selectedCategoryId;
  String? get selectedType => _selectedType;

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

  // Load notices
  Future<void> loadNotices({bool refresh = false}) async {
    if (_isLoading && !refresh) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _notices = await _noticeService.getActiveNotices(
        categoryId: _selectedCategoryId,
        type: _selectedType,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading notices: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load categories
  Future<void> loadCategories() async {
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
    _selectedCategoryId = categoryId;
    notifyListeners();
    loadNotices(refresh: true);
  }

  // Set type filter
  void setTypeFilter(String? type) {
    _selectedType = type;
    notifyListeners();
    loadNotices(refresh: true);
  }

  // Clear filters
  void clearFilters() {
    _selectedCategoryId = null;
    _selectedType = null;
    notifyListeners();
    loadNotices(refresh: true);
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
}
