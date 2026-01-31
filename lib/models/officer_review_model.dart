class OfficerReview {
  final int id;
  final String name;
  final String nameBn;
  final String designation;
  final String designationBn;
  final String? imageUrl;
  final bool isActive;
  final int displayOrder;
  final List<OfficerReviewMessage> messages;

  OfficerReview({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.designation,
    required this.designationBn,
    this.imageUrl,
    required this.isActive,
    required this.displayOrder,
    required this.messages,
  });

  factory OfficerReview.fromJson(Map<String, dynamic> json) {
    return OfficerReview(
      id: json['id'] as int,
      name: json['name'] as String,
      nameBn: (json['nameBn'] ?? json['name_bn'] ?? json['name']) as String,
      designation: json['designation'] as String,
      designationBn: (json['designationBn'] ?? json['designation_bn'] ?? json['designation']) as String,
      imageUrl: json['imageUrl'] as String? ?? json['image_url'] as String?,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      displayOrder: json['displayOrder'] as int? ?? json['display_order'] as int? ?? 0,
      messages: (json['messages'] as List<dynamic>?)
              ?.map((m) => OfficerReviewMessage.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'nameBn': nameBn,
      'name_bn': nameBn,
      'designation': designation,
      'designationBn': designationBn,
      'designation_bn': designationBn,
      'imageUrl': imageUrl,
      'image_url': imageUrl,
      'isActive': isActive,
      'displayOrder': displayOrder,
      'messages': messages.map((m) => m.toJson()).toList(),
    };
  }
}

class OfficerReviewMessage {
  final int id;
  final String content;
  final String contentBn;
  final int displayOrder;

  OfficerReviewMessage({
    required this.id,
    required this.content,
    required this.contentBn,
    required this.displayOrder,
  });

  factory OfficerReviewMessage.fromJson(Map<String, dynamic> json) {
    return OfficerReviewMessage(
      id: json['id'] as int,
      content: json['content'] as String,
      contentBn: (json['contentBn'] ?? json['content_bn'] ?? json['content']) as String,
      displayOrder: json['displayOrder'] as int? ?? json['display_order'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'contentBn': contentBn,
      'content_bn': contentBn,
      'displayOrder': displayOrder,
    };
  }
}
