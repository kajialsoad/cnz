class UserModel {
  final int id;
  final String? email;
  final String phone;
  final String firstName;
  final String lastName;
  final String? avatar;
  final String role;
  final String status;
  final bool emailVerified;
  final bool phoneVerified;
  final String? zone; // Deprecated - kept for backward compatibility
  final String? ward; // Deprecated - kept for backward compatibility
  final int? zoneId;
  final int? wardId;
  final int wardImageCount; // Track images uploaded per ward
  final String? address;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastLoginAt;
  
  // Geographical relationships
  final Map<String, dynamic>? cityCorporation;
  final Map<String, dynamic>? zoneData;
  final Map<String, dynamic>? wardData;

  UserModel({
    required this.id,
    this.email,
    required this.phone,
    required this.firstName,
    required this.lastName,
    this.avatar,
    required this.role,
    required this.status,
    required this.emailVerified,
    required this.phoneVerified,
    this.zone,
    this.ward,
    this.zoneId,
    this.wardId,
    this.wardImageCount = 0,
    this.address,
    required this.createdAt,
    required this.updatedAt,
    this.lastLoginAt,
    this.cityCorporation,
    this.zoneData,
    this.wardData,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      email: json['email'] as String?,
      phone: json['phone'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      avatar: json['avatar'] as String?,
      role: json['role'] as String? ?? 'CUSTOMER',
      status: json['status'] as String? ?? 'ACTIVE',
      emailVerified: (json['emailVerified'] as bool?) ?? false,
      phoneVerified: (json['phoneVerified'] as bool?) ?? false,
      zone: json['zone'] is String ? json['zone'] : null,
      ward: json['ward'] is String ? json['ward'] : null,
      zoneId: json['zoneId'] as int?,
      wardId: json['wardId'] as int?,
      wardImageCount: (json['wardImageCount'] as int?) ?? 0,
      address: json['address'] as String?,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'] as String)
          : null,
      cityCorporation: json['cityCorporation'] is Map<String, dynamic> ? json['cityCorporation'] : null,
      zoneData: json['zone'] is Map<String, dynamic> ? json['zone'] : null,
      wardData: json['ward'] is Map<String, dynamic> ? json['ward'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'firstName': firstName,
      'lastName': lastName,
      'avatar': avatar,
      'role': role,
      'status': status,
      'emailVerified': emailVerified,
      'phoneVerified': phoneVerified,
      'zone': zone,
      'ward': ward,
      'zoneId': zoneId,
      'wardId': wardId,
      'wardImageCount': wardImageCount,
      'address': address,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'cityCorporation': cityCorporation,
      'zoneData': zoneData,
      'wardData': wardData,
    };
  }

  String get fullName => '$firstName $lastName';

  String get initials {
    final first = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final last = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$first$last';
  }

  String get formattedPhone {
    // Format: +880 1712-345678
    if (phone.length == 11 && phone.startsWith('01')) {
      return '+880 ${phone.substring(0, 4)}-${phone.substring(4)}';
    }
    return phone;
  }
  
  /// Get geographical display text
  String get geographicalInfo {
    final parts = <String>[];
    
    if (cityCorporation != null) {
      parts.add(cityCorporation!['name'] ?? cityCorporation!['nameBangla'] ?? '');
    }
    if (zoneData != null) {
      final zoneName = zoneData!['name'] ?? zoneData!['displayName'] ?? 'Zone ${zoneData!['zoneNumber'] ?? ''}';
      parts.add(zoneName);
    }
    if (wardData != null) {
      final wardName = wardData!['displayName'] ?? 'Ward ${wardData!['wardNumber'] ?? ''}';
      parts.add(wardName);
    }
    
    return parts.isNotEmpty ? parts.join(' • ') : '';
  }
  
  /// Get City Corporation name
  String get cityCorporationName {
    if (cityCorporation != null) {
      return cityCorporation!['name'] ?? cityCorporation!['nameBangla'] ?? 'N/A';
    }
    // Fallback to old zone field
    return zone ?? 'Not provided';
  }
  
  /// Get Zone name
  String get zoneName {
    if (zoneData != null) {
      return zoneData!['name'] ?? zoneData!['displayName'] ?? 'Zone ${zoneData!['zoneNumber'] ?? 'N/A'}';
    }
    return 'Not provided';
  }
  
  /// Get Ward name
  String get wardName {
    if (wardData != null) {
      return wardData!['displayName'] ?? 'Ward ${wardData!['wardNumber'] ?? 'N/A'}';
    }
    // Fallback to old ward field
    return ward != null ? 'Ward $ward' : 'Not provided';
  }
}
