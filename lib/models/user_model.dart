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
      zone: json['zone'] as String?,
      ward: json['ward'] as String?,
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
}
