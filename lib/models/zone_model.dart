class Zone {
  final int id;
  final int zoneNumber;
  final String? name;
  final int cityCorporationId;
  final String? officerName;
  final String? officerDesignation;
  final String? officerSerialNumber;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Zone({
    required this.id,
    required this.zoneNumber,
    this.name,
    required this.cityCorporationId,
    this.officerName,
    this.officerDesignation,
    this.officerSerialNumber,
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  factory Zone.fromJson(Map<String, dynamic> json) {
    return Zone(
      id: json['id'] as int,
      zoneNumber: json['zoneNumber'] as int,
      name: json['name'] as String?,
      cityCorporationId: json['cityCorporationId'] as int,
      officerName: json['officerName'] as String?,
      officerDesignation: json['officerDesignation'] as String?,
      officerSerialNumber: json['officerSerialNumber'] as String?,
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
      'zoneNumber': zoneNumber,
      if (name != null) 'name': name,
      'cityCorporationId': cityCorporationId,
      if (officerName != null) 'officerName': officerName,
      if (officerDesignation != null) 'officerDesignation': officerDesignation,
      if (officerSerialNumber != null) 'officerSerialNumber': officerSerialNumber,
      'status': status,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';

  String get displayName => name ?? 'Zone $zoneNumber';
}
