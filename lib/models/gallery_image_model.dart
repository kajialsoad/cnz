class GalleryImage {
  final int id;
  final String title;
  final String? description;
  final String imageUrl;
  final int displayOrder;
  final DateTime createdAt;

  GalleryImage({
    required this.id,
    required this.title,
    this.description,
    required this.imageUrl,
    required this.displayOrder,
    required this.createdAt,
  });

  factory GalleryImage.fromJson(Map<String, dynamic> json) {
    return GalleryImage(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String,
      displayOrder: json['displayOrder'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'imageUrl': imageUrl,
      'displayOrder': displayOrder,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
