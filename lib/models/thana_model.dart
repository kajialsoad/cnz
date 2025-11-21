class Thana {
  final int id;
  final String name;
  final int? cityCorporationId;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Thana({
    required this.id,
    required this.name,
    this.cityCorporationId,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  factory Thana.fromJson(Map<String, dynamic> json) {
    return Thana(
      id: json['id'] as int,
      name: json['name'] as String,
      cityCorporationId: json['cityCorporationId'] as int?,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (cityCorporationId != null) 'cityCorporationId': cityCorporationId,
      'status': status,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';
}
