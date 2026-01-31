import '../config/api_config.dart';
import '../models/calendar_model.dart';
import '../services/api_client.dart';

class CalendarService {
  final ApiClient _apiClient = ApiClient(ApiConfig.baseUrl);

  // Get current month calendar
  Future<CalendarModel?> getCurrentCalendar() async {
    try {
      final response = await _apiClient.get('/api/calendars/current');

      if (response['success'] == true && response['data'] != null) {
        return CalendarModel.fromJson(response['data']);
      } else if (response['success'] == false) {
        // No calendar found for current month
        return null;
      } else {
        throw Exception('Failed to load calendar');
      }
    } catch (e) {
      print('Error fetching current calendar: $e');
      rethrow;
    }
  }

  // Get calendar by ID
  Future<CalendarModel> getCalendarById(int id) async {
    try {
      final response = await _apiClient.get('/api/calendars/$id');

      if (response['success'] == true && response['data'] != null) {
        return CalendarModel.fromJson(response['data']);
      } else {
        throw Exception('Failed to load calendar: ${response['message'] ?? 'Unknown error'}');
      }
    } catch (e) {
      print('Error fetching calendar: $e');
      rethrow;
    }
  }

  // Get upcoming events
  Future<List<CalendarEventModel>> getUpcomingEvents({int limit = 10}) async {
    try {
      final response = await _apiClient.get('/api/calendars/events/upcoming?limit=$limit');

      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> data = response['data'] as List<dynamic>;
        return data.map((json) => CalendarEventModel.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching upcoming events: $e');
      rethrow;
    }
  }

  // Get all calendars (for admin or filtering)
  Future<List<CalendarModel>> getCalendars({
    int? month,
    int? year,
    int? cityCorporationId,
    int? zoneId,
    int? wardId,
    bool? isActive,
  }) async {
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
        return data.map((json) => CalendarModel.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching calendars: $e');
      rethrow;
    }
  }
}
