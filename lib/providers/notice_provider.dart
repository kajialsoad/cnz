import 'package:flutter/foundation.dart';
import '../models/notice_model.dart';
import '../services/notice_service.dart';

class NoticeProvider with ChangeNotifier {
  final NoticeService _noticeService = NoticeService();

  List<Notice> _notices = [];
  List<NoticeCategory> _categories = [];
  bool _isLoading = false;
  String? _error;
  int? _selectedCategoryId;
  String? _selectedType;

  List<Notice> get notices => _notices;
  List<NoticeCategory> get categories => _categories;
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
      bool matchesCategory = _selectedCategoryId == null ||
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
    try {
      await _noticeService.toggleInteraction(noticeId, type);
      // Reload notices to update counts and user interactions
      await loadNotices(refresh: true);
    } catch (e) {
      print('Error toggling interaction: $e');
    }
  }
}
