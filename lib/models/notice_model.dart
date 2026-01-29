class NoticeCategory {
  final int id;
  final String name;
  final String? nameBn;
  final String color;
  final String? icon;
  final int? parentId;
  final bool isActive;

  NoticeCategory({
    required this.id,
    required this.name,
    this.nameBn,
    required this.color,
    this.icon,
    this.parentId,
    required this.isActive,
  });

  factory NoticeCategory.fromJson(Map<String, dynamic> json) {
    return NoticeCategory(
      id: json['id'],
      name: json['name'],
      nameBn: json['nameBn'],
      color: json['color'],
      icon: json['icon'],
      parentId: json['parentId'],
      isActive: json['isActive'] ?? true,
    );
  }
}

class Notice {
  final int id;
  final String title;
  final String? titleBn;
  final String description;
  final String? descriptionBn;
  final String content;
  final String? contentBn;
  final int categoryId;
  final NoticeCategory? category;
  final String type;
  final String priority;
  final bool isActive;
  final DateTime publishDate;
  final DateTime? expiryDate;
  final String? imageUrl;
  final int viewCount;
  final int readCount;
  final DateTime createdAt;
  final Map<String, int>? interactionCounts;
  final List<String>? userInteractions;

  Notice({
    required this.id,
    required this.title,
    this.titleBn,
    required this.description,
    this.descriptionBn,
    required this.content,
    this.contentBn,
    required this.categoryId,
    this.category,
    required this.type,
    required this.priority,
    required this.isActive,
    required this.publishDate,
    this.expiryDate,
    this.imageUrl,
    required this.viewCount,
    required this.readCount,
    required this.createdAt,
    this.interactionCounts,
    this.userInteractions,
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'],
      title: json['title'],
      titleBn: json['titleBn'],
      description: json['description'],
      descriptionBn: json['descriptionBn'],
      content: json['content'],
      contentBn: json['contentBn'],
      categoryId: json['categoryId'],
      category: json['category'] != null
          ? NoticeCategory.fromJson(json['category'])
          : null,
      type: json['type'],
      priority: json['priority'],
      isActive: json['isActive'] ?? true,
      publishDate: DateTime.parse(json['publishDate']),
      expiryDate:
          json['expiryDate'] != null ? DateTime.parse(json['expiryDate']) : null,
      imageUrl: json['imageUrl'],
      viewCount: json['viewCount'] ?? 0,
      readCount: json['readCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      interactionCounts: json['interactions'] != null && json['interactions']['counts'] != null
          ? Map<String, int>.from(json['interactions']['counts'])
          : null,
      userInteractions: json['interactions'] != null && json['interactions']['userInteractions'] != null
          ? List<String>.from(json['interactions']['userInteractions'])
          : null,
    );
  }

  // Get localized title based on language
  String getLocalizedTitle(String language) {
    return language == 'bn' && titleBn != null ? titleBn! : title;
  }

  // Get localized description based on language
  String getLocalizedDescription(String language) {
    return language == 'bn' && descriptionBn != null
        ? descriptionBn!
        : description;
  }

  // Get localized content based on language
  String getLocalizedContent(String language) {
    return language == 'bn' && contentBn != null ? contentBn! : content;
  }

  // Check if notice is expired
  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  // Check if notice is urgent
  bool get isUrgent {
    return type == 'URGENT' || priority == 'URGENT';
  }
}
