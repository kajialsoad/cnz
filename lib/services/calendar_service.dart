import '../config/api_config.dart';
import '../models/calendar_model.dart';
import '../services/api_client.dart';
import 'offline_cache_service.dart';
import 'connectivity_service.dart';

class CalendarService {
  final ApiClient _apiClient = ApiClient(ApiConfig.baseUrl);
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  /// Initialize offline services
  Future<void> init() async {
    await _cacheService.init();
    await _connectivityService.init();
  }

  /// Get cached current calendar without API call
  Future<CalendarModel?> getCachedCurrentCalendar() async {
    return await _loadCalendarFromCache('calendar_current');
  }

  /// Get cached upcoming events without API call
  Future<List<CalendarEventModel>> getCachedUpcomingEvents({int limit = 10}) async {
    return await _loadEventsFromCache('calendar_upcoming_$limit');
  }

  /// Get current month calendar with offline-first support
  /// 
  /// This method implements cache-first loading:
  /// 1. Checks network connectivity
  /// 2. If offline, loads from cache
  /// 3. If online, fetches from API and updates cache
  /// 4. Falls back to cache on API failure
  /// 
  /// Cache key: calendar_current
  /// TTL: 24 hours (handled by app logic - always tries fresh data when online)
  Future<CalendarModel?> getCurrentCalendar({bool useCache = true}) async {
    const cacheKey = 'calendar_current';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadCalendarFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final response = await _apiClient.get('/api/calendars/current');

      if (response['success'] == true && response['data'] != null) {
        final calendar = CalendarModel.fromJson(response['data']);
        
        // Cache the fresh data
        if (useCache) {
          await _saveCalendarToCache(cacheKey, calendar);
        }
        
        return calendar;
      } else if (response['success'] == false) {
        // No calendar found for current month
        return null;
      } else {
        throw Exception('Failed to load calendar');
      }
    } catch (e) {
      print('Error fetching current calendar: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          return await _loadCalendarFromCache(cacheKey);
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      rethrow;
    }
  }

  /// Get calendar by ID with offline-first support
  /// 
  /// Cache key format: calendar_detail_{id}
  Future<CalendarModel> getCalendarById(int id, {bool useCache = true}) async {
    final cacheKey = 'calendar_detail_$id';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      final cached = await _loadCalendarFromCache(cacheKey);
      if (cached != null) {
        return cached;
      }
      throw Exception('No cached data available for calendar $id');
    }
    
    // Try to fetch from API
    try {
      final response = await _apiClient.get('/api/calendars/$id');

      if (response['success'] == true && response['data'] != null) {
        final calendar = CalendarModel.fromJson(response['data']);
        
        // Cache the fresh data
        if (useCache) {
          await _saveCalendarToCache(cacheKey, calendar);
        }
        
        return calendar;
      } else {
        throw Exception('Failed to load calendar: ${response['message'] ?? 'Unknown error'}');
      }
    } catch (e) {
      print('Error fetching calendar: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          final cached = await _loadCalendarFromCache(cacheKey);
          if (cached != null) {
            return cached;
          }
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      rethrow;
    }
  }

  /// Get upcoming events with offline-first support
  /// 
  /// Cache key format: calendar_upcoming_{limit}
  Future<List<CalendarEventModel>> getUpcomingEvents({
    int limit = 10,
    bool useCache = true,
  }) async {
    final cacheKey = 'calendar_upcoming_$limit';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadEventsFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final response = await _apiClient.get('/api/calendars/events/upcoming?limit=$limit');

      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> data = response['data'] as List<dynamic>;
        final events = data.map((json) => CalendarEventModel.fromJson(json as Map<String, dynamic>)).toList();
        
        // Cache the fresh data
        if (useCache) {
          await _saveEventsToCache(cacheKey, events);
        }
        
        return events;
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching upcoming events: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          return await _loadEventsFromCache(cacheKey);
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      rethrow;
    }
  }

  /// Get all calendars with filters and offline-first support
  /// 
  /// Cache key format: calendar_{month}_{year}_{category}_{status}
  /// Handles filters: month, year, cityCorporationId, zoneId, wardId, isActive
  Future<List<CalendarModel>> getCalendars({
    int? month,
    int? year,
    int? cityCorporationId,
    int? zoneId,
    int? wardId,
    bool? isActive,
    bool useCache = true,
  }) async {
    // Generate cache key based on filters
    String cacheKey = 'calendar_list';
    if (month != null) cacheKey += '_m$month';
    if (year != null) cacheKey += '_y$year';
    if (cityCorporationId != null) cacheKey += '_cc$cityCorporationId';
    if (zoneId != null) cacheKey += '_z$zoneId';
    if (wardId != null) cacheKey += '_w$wardId';
    if (isActive != null) cacheKey += '_a${isActive ? '1' : '0'}';
    
    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    
    // If offline and cache is enabled, load from cache
    if (!isOnline && useCache) {
      return await _loadCalendarsFromCache(cacheKey);
    }
    
    // Try to fetch from API
    try {
      final queryParams = <String, String>{};
      if (month != null) queryParams['month'] = month.toString();
      if (year != null) queryParams['year'] = year.toString();
      if (cityCorporationId != null) {
        queryParams['cityCorporationId'] = cityCorporationId.toString();
      }
      if (zoneId != null) queryParams['zoneId'] = zoneId.toString();
      if (wardId != null) queryParams['wardId'] = wardId.toString();
      if (isActive != null) queryParams['isActive'] = isActive.toString();

      final queryString = queryParams.entries
          .map((e) => '${e.key}=${e.value}')
          .join('&');
      
      final path = queryString.isEmpty 
          ? '/api/calendars' 
          : '/api/calendars?$queryString';

      final response = await _apiClient.get(path);

      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> data = response['data'] as List<dynamic>;
        final calendars = data.map((json) => CalendarModel.fromJson(json as Map<String, dynamic>)).toList();
        
        // Cache the fresh data
        if (useCache) {
          await _saveCalendarsToCache(cacheKey, calendars);
        }
        
        return calendars;
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching calendars: $e');
      
      // Fallback to cache on API failure
      if (useCache) {
        try {
          return await _loadCalendarsFromCache(cacheKey);
        } catch (cacheError) {
          print('Cache Error: $cacheError');
        }
      }
      
      rethrow;
    }
  }

  // ============================================================================
  // PRIVATE CACHE HELPER METHODS
  // ============================================================================

  /// Save calendar to cache
  Future<void> _saveCalendarToCache(String cacheKey, CalendarModel calendar) async {
    try {
      await _cacheService.saveCache('calendar', cacheKey, calendar.toJson());
      print('✅ Cached calendar: $cacheKey');
    } catch (e) {
      print('❌ Error caching calendar: $e');
    }
  }

  /// Load calendar from cache
  Future<CalendarModel?> _loadCalendarFromCache(String cacheKey) async {
    try {
      final cachedData = await _cacheService.getCache('calendar', cacheKey);
      if (cachedData != null) {
        print('📦 Cache hit: $cacheKey');
        return CalendarModel.fromJson(cachedData);
      }
      print('❌ Cache miss: $cacheKey');
      return null;
    } catch (e) {
      print('❌ Error loading from cache: $e');
      return null;
    }
  }

  /// Save calendars list to cache
  Future<void> _saveCalendarsToCache(String cacheKey, List<CalendarModel> calendars) async {
    try {
      final calendarsJson = calendars.map((c) => c.toJson()).toList();
      await _cacheService.saveCache('calendar', cacheKey, calendarsJson);
      print('✅ Cached ${calendars.length} calendars: $cacheKey');
    } catch (e) {
      print('❌ Error caching calendars: $e');
    }
  }

  /// Load calendars list from cache
  Future<List<CalendarModel>> _loadCalendarsFromCache(String cacheKey) async {
    try {
      final cachedData = await _cacheService.getCache('calendar', cacheKey);
      if (cachedData != null && cachedData is List) {
        print('📦 Cache hit: $cacheKey (${cachedData.length} items)');
        return cachedData.map((json) => CalendarModel.fromJson(json)).toList();
      }
      print('❌ Cache miss: $cacheKey');
      return [];
    } catch (e) {
      print('❌ Error loading calendars from cache: $e');
      return [];
    }
  }

  /// Save events list to cache
  Future<void> _saveEventsToCache(String cacheKey, List<CalendarEventModel> events) async {
    try {
      final eventsJson = events.map((e) => e.toJson()).toList();
      await _cacheService.saveCache('calendar', cacheKey, eventsJson);
      print('✅ Cached ${events.length} events: $cacheKey');
    } catch (e) {
      print('❌ Error caching events: $e');
    }
  }

  /// Load events list from cache
  Future<List<CalendarEventModel>> _loadEventsFromCache(String cacheKey) async {
    try {
      final cachedData = await _cacheService.getCache('calendar', cacheKey);
      if (cachedData != null && cachedData is List) {
        print('📦 Cache hit: $cacheKey (${cachedData.length} items)');
        return cachedData.map((json) => CalendarEventModel.fromJson(json)).toList();
      }
      print('❌ Cache miss: $cacheKey');
      return [];
    } catch (e) {
      print('❌ Error loading events from cache: $e');
      return [];
    }
  }

  /// Get last sync time for calendar data
  Future<DateTime?> getLastSyncTime(String cacheKey) async {
    try {
      return await _cacheService.getLastSyncTime('calendar', cacheKey);
    } catch (e) {
      print('❌ Error getting last sync time: $e');
      return null;
    }
  }

  /// Clear all calendar cache
  Future<void> clearCache() async {
    try {
      await _cacheService.clearCacheForEntity('calendar', 'current');
      await _cacheService.clearCacheForEntity('calendar', 'list');
      print('✅ Calendar cache cleared');
    } catch (e) {
      print('❌ Error clearing cache: $e');
    }
  }

  /// Check if offline
  Future<bool> isOffline() async {
    return !await _connectivityService.checkConnectivity();
  }
}
