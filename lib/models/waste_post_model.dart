class WastePost {
  final int id;
  final String title;
  final String content;
  final String? imageUrl;
  final String category; // 'CURRENT_WASTE' or 'FUTURE_WASTE'
  final String status; // 'DRAFT' or 'PUBLISHED'
  final int createdBy;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int likeCount;
  final int loveCount;
  final String? userReaction; // 'LIKE', 'LOVE', or null

  WastePost({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    required this.category,
    required this.status,
    required this.createdBy,
    this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.likeCount,
    required this.loveCount,
    this.userReaction,
  });

  factory WastePost.fromJson(Map<String, dynamic> json) {
    return WastePost(
      id: json['id'] as int,
      title: json['title'] as String,
      content: json['content'] as String,
      imageUrl: json['imageUrl'] as String?,
      category: json['category'] as String,
      status: json['status'] as String,
      createdBy: json['createdBy'] as int,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      likeCount: json['likeCount'] as int? ?? 0,
      loveCount: json['loveCount'] as int? ?? json['dislikeCount'] as int? ?? 0,
      userReaction: json['userReaction'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'imageUrl': imageUrl,
      'category': category,
      'status': status,
      'createdBy': createdBy,
      'publishedAt': publishedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'likeCount': likeCount,
      'loveCount': loveCount,
      'userReaction': userReaction,
    };
  }

  WastePost copyWith({
    int? id,
    String? title,
    String? content,
    String? imageUrl,
    String? category,
    String? status,
    int? createdBy,
    DateTime? publishedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? likeCount,
    int? loveCount,
    String? userReaction,
  }) {
    return WastePost(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      imageUrl: imageUrl ?? this.imageUrl,
      category: category ?? this.category,
      status: status ?? this.status,
      createdBy: createdBy ?? this.createdBy,
      publishedAt: publishedAt ?? this.publishedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      likeCount: likeCount ?? this.likeCount,
      loveCount: loveCount ?? this.loveCount,
      userReaction: userReaction ?? this.userReaction,
    );
  }
}
