class NoticeCategory {
  final int id;
  final String name;
  final String? nameBn;
  final String color;
  final String? icon;
  final int? parentId;
  final bool isActive;
  final List<NoticeCategory>? children;
  final int? noticeCount;

  NoticeCategory({
    required this.id,
    required this.name,
    this.nameBn,
    required this.color,
    this.icon,
    this.parentId,
    required this.isActive,
    this.children,
    this.noticeCount,
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
      children: json['children'] != null
          ? (json['children'] as List)
              .map((child) => NoticeCategory.fromJson(child))
              .toList()
          : null,
      noticeCount: json['_count']?['notices'],
    );
  }

  // Get localized name based on language
  String getLocalizedName(String language) {
    return language == 'bn' && nameBn != null ? nameBn! : name;
  }

  // Convert NoticeCategory to JSON for caching
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'nameBn': nameBn,
      'color': color,
      'icon': icon,
      'parentId': parentId,
      'isActive': isActive,
      'children': children?.map((c) => c.toJson()).toList(),
      '_count': noticeCount != null ? {'notices': noticeCount} : null,
    };
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

  Notice copyWith({
    int? id,
    String? title,
    String? titleBn,
    String? description,
    String? descriptionBn,
    String? content,
    String? contentBn,
    int? categoryId,
    NoticeCategory? category,
    String? type,
    String? priority,
    bool? isActive,
    DateTime? publishDate,
    DateTime? expiryDate,
    String? imageUrl,
    int? viewCount,
    int? readCount,
    DateTime? createdAt,
    Map<String, int>? interactionCounts,
    List<String>? userInteractions,
  }) {
    return Notice(
      id: id ?? this.id,
      title: title ?? this.title,
      titleBn: titleBn ?? this.titleBn,
      description: description ?? this.description,
      descriptionBn: descriptionBn ?? this.descriptionBn,
      content: content ?? this.content,
      contentBn: contentBn ?? this.contentBn,
      categoryId: categoryId ?? this.categoryId,
      category: category ?? this.category,
      type: type ?? this.type,
      priority: priority ?? this.priority,
      isActive: isActive ?? this.isActive,
      publishDate: publishDate ?? this.publishDate,
      expiryDate: expiryDate ?? this.expiryDate,
      imageUrl: imageUrl ?? this.imageUrl,
      viewCount: viewCount ?? this.viewCount,
      readCount: readCount ?? this.readCount,
      createdAt: createdAt ?? this.createdAt,
      interactionCounts: interactionCounts ?? this.interactionCounts,
      userInteractions: userInteractions ?? this.userInteractions,
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

  // Convert Notice to JSON for caching
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleBn': titleBn,
      'description': description,
      'descriptionBn': descriptionBn,
      'content': content,
      'contentBn': contentBn,
      'categoryId': categoryId,
      'category': category?.toJson(),
      'type': type,
      'priority': priority,
      'isActive': isActive,
      'publishDate': publishDate.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'imageUrl': imageUrl,
      'viewCount': viewCount,
      'readCount': readCount,
      'createdAt': createdAt.toIso8601String(),
      'interactions': {
        'counts': interactionCounts,
        'userInteractions': userInteractions,
      },
    };
  }
}
