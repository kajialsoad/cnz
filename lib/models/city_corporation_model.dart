class CityCorporation {
  final int? id;
  final String code;
  final String name;
  final int minWard;
  final int maxWard;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  CityCorporation({
    this.id,
    required this.code,
    required this.name,
    required this.minWard,
    required this.maxWard,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  factory CityCorporation.fromJson(Map<String, dynamic> json) {
    return CityCorporation(
      id: json['id'] as int?,
      code: json['code'] as String,
      name: json['name'] as String,
      minWard: json['minWard'] as int,
      maxWard: json['maxWard'] as int,
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
      if (id != null) 'id': id,
      'code': code,
      'name': name,
      'minWard': minWard,
      'maxWard': maxWard,
      'status': status,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';

  List<int> get wardRange {
    return List.generate(maxWard - minWard + 1, (i) => minWard + i);
  }
}
