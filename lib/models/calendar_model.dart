class CalendarModel {
  final int id;
  final String title;
  final String? titleBn;
  final String imageUrl;
  final int month;
  final int year;
  final bool isActive;
  final int? cityCorporationId;
  final int? zoneId;
  final int? wardId;
  final List<CalendarEventModel> events;
  final DateTime createdAt;
  final DateTime updatedAt;

  CalendarModel({
    required this.id,
    required this.title,
    this.titleBn,
    required this.imageUrl,
    required this.month,
    required this.year,
    required this.isActive,
    this.cityCorporationId,
    this.zoneId,
    this.wardId,
    required this.events,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CalendarModel.fromJson(Map<String, dynamic> json) {
    return CalendarModel(
      id: json['id'] as int,
      title: json['title'] as String,
      titleBn: json['titleBn'] as String?,
      imageUrl: json['imageUrl'] as String,
      month: json['month'] as int,
      year: json['year'] as int,
      isActive: json['isActive'] as bool? ?? true,
      cityCorporationId: json['cityCorporationId'] as int?,
      zoneId: json['zoneId'] as int?,
      wardId: json['wardId'] as int?,
      events: (json['events'] as List<dynamic>?)
              ?.map((e) => CalendarEventModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleBn': titleBn,
      'imageUrl': imageUrl,
      'month': month,
      'year': year,
      'isActive': isActive,
      'cityCorporationId': cityCorporationId,
      'zoneId': zoneId,
      'wardId': wardId,
      'events': events.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class CalendarEventModel {
  final int id;
  final int calendarId;
  final String title;
  final String? titleBn;
  final String? description;
  final String? descriptionBn;
  final DateTime eventDate;
  final String eventType;
  final EventCategory category;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  CalendarEventModel({
    required this.id,
    required this.calendarId,
    required this.title,
    this.titleBn,
    this.description,
    this.descriptionBn,
    required this.eventDate,
    required this.eventType,
    required this.category,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CalendarEventModel.fromJson(Map<String, dynamic> json) {
    return CalendarEventModel(
      id: json['id'] as int,
      calendarId: json['calendarId'] as int,
      title: json['title'] as String,
      titleBn: json['titleBn'] as String?,
      description: json['description'] as String?,
      descriptionBn: json['descriptionBn'] as String?,
      eventDate: _parseEventDate(json['eventDate'] as String),
      eventType: json['eventType'] as String? ?? 'general',
      category: _parseCategory(json['category'] as String?),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  // Parse event date and convert to local date (ignoring time)
  static DateTime _parseEventDate(String dateString) {
    final utcDate = DateTime.parse(dateString);
    // Return date only in local timezone
    return DateTime(utcDate.year, utcDate.month, utcDate.day);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'calendarId': calendarId,
      'title': title,
      'titleBn': titleBn,
      'description': description,
      'descriptionBn': descriptionBn,
      'eventDate': eventDate.toIso8601String(),
      'eventType': eventType,
      'category': category.toString().split('.').last,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  static EventCategory _parseCategory(String? category) {
    switch (category) {
      case 'wasteCollection':
        return EventCategory.wasteCollection;
      case 'publicHoliday':
        return EventCategory.publicHoliday;
      case 'communityEvent':
        return EventCategory.communityEvent;
      default:
        return EventCategory.communityEvent;
    }
  }
}

enum EventCategory {
  wasteCollection,
  publicHoliday,
  communityEvent,
}
