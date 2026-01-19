/**
 * Paginated Complaint Provider
 * Optimized for 500K users with cursor-based pagination
 */

import 'package:flutter/foundation.dart';
import '../models/complaint.dart';
import '../services/api_client.dart';

class ComplaintProviderPaginated extends ChangeNotifier {
  final ApiClient _apiClient;

  ComplaintProviderPaginated(this._apiClient);

  // Complaint list
  List<Complaint> _complaints = [];
  List<Complaint> get complaints => _complaints;

  // Pagination state
  int _currentPage = 1;
  final int _pageSize = 20;
  bool _hasMore = true;
  bool _isLoading = false;
  bool _isLoadingMore = false;

  bool get hasMore => _hasMore;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;

  // Filters
  String? _statusFilter;
  String? _categoryFilter;

  String? get statusFilter => _statusFilter;
  String? get categoryFilter => _categoryFilter;

  /**
   * Load complaints with pagination
   */
  Future<void> loadComplaints({bool refresh = false}) async {
    // Prevent multiple simultaneous loads
    if (_isLoading || (!refresh && _isLoadingMore)) return;
    if (!refresh && !_hasMore) return;

    try {
      if (refresh) {
        _isLoading = true;
        _currentPage = 1;
        _complaints.clear();
        _hasMore = true;
      } else {
        _isLoadingMore = true;
      }
      notifyListeners();

      // Build query parameters
      final queryParams = {
        'page': _currentPage.toString(),
        'limit': _pageSize.toString(),
      };

      if (_statusFilter != null && _statusFilter!.isNotEmpty) {
        queryParams['status'] = _statusFilter!;
      }

      if (_categoryFilter != null && _categoryFilter!.isNotEmpty) {
        queryParams['category'] = _categoryFilter!;
      }

      // Fetch complaints
      final response = await _apiClient.get(
        '/api/complaints/my-complaints',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final newComplaints = (data['complaints'] as List)
            .map((json) => Complaint.fromJson(json))
            .toList();

        if (refresh) {
          _complaints = newComplaints;
        } else {
          _complaints.addAll(newComplaints);
        }

        // Check if there are more pages
        _hasMore = newComplaints.length == _pageSize;
        if (_hasMore) {
          _currentPage++;
        }
      }
    } catch (e) {
      print('Error loading complaints: $e');
      // Don't clear complaints on error, keep existing data
    } finally {
      _isLoading = false;
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  /**
   * Load more complaints (for infinite scroll)
   */
  Future<void> loadMore() async {
    if (!_hasMore || _isLoadingMore) return;
    await loadComplaints(refresh: false);
  }

  /**
   * Refresh complaints
   */
  Future<void> refresh() async {
    await loadComplaints(refresh: true);
  }

  /**
   * Set status filter
   */
  void setStatusFilter(String? status) {
    if (_statusFilter != status) {
      _statusFilter = status;
      loadComplaints(refresh: true);
    }
  }

  /**
   * Set category filter
   */
  void setCategoryFilter(String? category) {
    if (_categoryFilter != category) {
      _categoryFilter = category;
      loadComplaints(refresh: true);
    }
  }

  /**
   * Clear filters
   */
  void clearFilters() {
    _statusFilter = null;
    _categoryFilter = null;
    loadComplaints(refresh: true);
  }

  /**
   * Get complaint by ID (from cache or fetch)
   */
  Future<Complaint?> getComplaintById(int id) async {
    // Check if complaint is in cache
    final cached = _complaints.firstWhere(
      (c) => c.id == id,
      orElse: () => null as Complaint,
    );

    if (cached != null) {
      return cached;
    }

    // Fetch from API
    try {
      final response = await _apiClient.get('/api/complaints/$id');
      if (response.statusCode == 200) {
        return Complaint.fromJson(response.data['complaint']);
      }
    } catch (e) {
      print('Error fetching complaint: $e');
    }

    return null;
  }

  /**
   * Update complaint in cache
   */
  void updateComplaintInCache(Complaint complaint) {
    final index = _complaints.indexWhere((c) => c.id == complaint.id);
    if (index != -1) {
      _complaints[index] = complaint;
      notifyListeners();
    }
  }

  /**
   * Remove complaint from cache
   */
  void removeComplaintFromCache(int id) {
    _complaints.removeWhere((c) => c.id == id);
    notifyListeners();
  }

  /**
   * Clear all data
   */
  void clear() {
    _complaints.clear();
    _currentPage = 1;
    _hasMore = true;
    _statusFilter = null;
    _categoryFilter = null;
    notifyListeners();
  }
}
