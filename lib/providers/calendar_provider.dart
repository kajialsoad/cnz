import 'package:flutter/foundation.dart';
import '../models/calendar_model.dart';
import '../services/calendar_service.dart';

class CalendarProvider with ChangeNotifier {
  final CalendarService _calendarService = CalendarService();
  
  CalendarModel? _calendar;
  List<CalendarEventModel> _upcomingEvents = [];
  bool _isLoading = false;
  String? _error;
  DateTime? _lastSyncTime;
  
  CalendarModel? get calendar => _calendar;
  List<CalendarEventModel> get upcomingEvents => _upcomingEvents;
  bool get isLoading => _isLoading;
  String? get error => _error;
  DateTime? get lastSyncTime => _lastSyncTime;

  Future<void> init() async {
    await _calendarService.init();
  }

  Future<void> loadCalendarData({bool forceRefresh = false}) async {
    if (_calendar != null && !forceRefresh) {
      return;
    }

    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // 1. Load from cache first
      if (_calendar == null) {
        final cachedCalendar = await _calendarService.getCachedCurrentCalendar();
        final cachedEvents = await _calendarService.getCachedUpcomingEvents();
        
        if (cachedCalendar != null) {
          _calendar = cachedCalendar;
          _upcomingEvents = cachedEvents;
          notifyListeners();
        }
      }

      // 2. Fetch fresh data
      // getCurrentCalendar calls API if online
      final freshCalendar = await _calendarService.getCurrentCalendar(useCache: true);
      final freshEvents = await _calendarService.getUpcomingEvents(useCache: true);

      if (freshCalendar != null) {
        _calendar = freshCalendar;
      }
      _upcomingEvents = freshEvents;
      _lastSyncTime = DateTime.now();
      _error = null;

    } catch (e) {
      if (_calendar != null) {
        print('Error refreshing calendar: $e');
      } else {
        _error = e.toString();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
