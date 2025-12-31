import 'zone_model.dart';

class Ward {
  final int id;
  final int wardNumber;
  final int zoneId;
  final Zone? zone; // Added for auto-selection
  final String? inspectorName;
  final String? inspectorSerialNumber;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Ward({
    required this.id,
    required this.wardNumber,
    required this.zoneId,
    this.zone,
    this.inspectorName,
    this.inspectorSerialNumber,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  factory Ward.fromJson(Map<String, dynamic> json) {
    return Ward(
      id: json['id'] as int,
      wardNumber: json['wardNumber'] as int,
      zoneId: json['zoneId'] as int,
      zone: json['zone'] != null ? Zone.fromJson(json['zone'] as Map<String, dynamic>) : null,
      inspectorName: json['inspectorName'] as String?,
      inspectorSerialNumber: json['inspectorSerialNumber'] as String?,
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
      'wardNumber': wardNumber,
      'zoneId': zoneId,
      if (inspectorName != null) 'inspectorName': inspectorName,
      if (inspectorSerialNumber != null) 'inspectorSerialNumber': inspectorSerialNumber,
      'status': status,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';

  String get displayName => 'Ward $wardNumber';
}
