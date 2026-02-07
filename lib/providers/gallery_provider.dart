import 'package:flutter/foundation.dart';
import '../models/gallery_image_model.dart';
import '../services/gallery_service.dart';
import '../services/auth_service.dart';

class GalleryProvider with ChangeNotifier {
  final GalleryService _galleryService = GalleryService();
  List<GalleryImage> _images = [];
  bool _isLoading = false;
  String? _error;
  DateTime? _lastSyncTime;
  
  List<GalleryImage> get images => _images;
  bool get isLoading => _isLoading;
  String? get error => _error;
  DateTime? get lastSyncTime => _lastSyncTime;

  Future<void> loadImages({bool forceRefresh = false}) async {
    // If we already have data and not forcing refresh, check if we need to load at all
    // But user might want to refresh. 
    // If _images is empty, we definitely need to load.
    
    if (_images.isNotEmpty && !forceRefresh) {
      // Data is present, maybe check if it's stale? 
      // For now, let's just return to avoid flickering/reloading.
      return;
    }

    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await AuthService.getAccessToken();
      if (token == null) {
        _error = 'Please login first';
        _isLoading = false;
        notifyListeners();
        return;
      }

      // 1. Load from cache first if we don't have data
      if (_images.isEmpty) {
        final cachedImages = await _galleryService.getCachedImages();
        if (cachedImages.isNotEmpty) {
           _images = cachedImages;
           _lastSyncTime = await _galleryService.getLastSyncTime();
           // Notify listeners to show cached data
           notifyListeners();
        }
      }

      // 2. Fetch fresh data
      // We pass forceRefresh=true because we want to actually hit the API now.
      // If we passed false, getActiveImages might just return cache again (depending on logic).
      // But getActiveImages logic says: if online, fetch API. 
      // So forceRefresh=false is fine IF it means "fetch if online".
      // Let's check getActiveImages logic again:
      // "If online, try to load from cache first... then Fetch fresh data from API"
      // So calling getActiveImages(token) will fetch API if online.
      
      final freshImages = await _galleryService.getActiveImages(token, forceRefresh: forceRefresh);
      _images = freshImages;
      _lastSyncTime = await _galleryService.getLastSyncTime();
      _error = null;

    } catch (e) {
      // If we have images (from cache), keep them and just log error
      if (_images.isNotEmpty) {
        print('Error refreshing gallery: $e');
      } else {
        _error = e.toString();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
