import 'dart:convert';
import 'package:flutter/material.dart';
import '../utils/cloudinary_helper.dart';
import 'review_model.dart';

class Complaint {
  final String id;
  final String title;
  final String description;
  final String category;
  final String? subcategory;  // NEW: Subcategory field
  final String urgencyLevel;
  final String location;
  final String? address;
  final String status;
  final String userId;
  final List<String> imageUrls;
  final List<String> audioUrls;
  final int priority;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Geographical information from user
  final Map<String, dynamic>? cityCorporation;
  final Map<String, dynamic>? zone;
  final Map<String, dynamic>? ward;
  final Map<String, dynamic>? assignedAdmin;
  
  // NEW FIELDS for Others Status and Resolution Documentation
  final String? othersCategory;  // "CORPORATION_INTERNAL" or "CORPORATION_EXTERNAL"
  final String? othersSubcategory;  // Specific department/agency
  final String? resolutionImages;  // Comma-separated image URLs
  final String? resolutionNote;  // Admin's resolution notes
  final String? resolvedByAdminName;  // Name of admin who resolved
  final ReviewModel? userReview;  // User's review for resolved complaint

  Complaint({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.subcategory,  // NEW: Subcategory parameter
    required this.urgencyLevel,
    required this.location,
    this.address,
    required this.status,
    required this.userId,
    required this.imageUrls,
    required this.audioUrls,
    required this.priority,
    required this.createdAt,
    required this.updatedAt,
    this.cityCorporation,
    this.zone,
    this.ward,
    this.assignedAdmin,
    // NEW: Others and Resolution parameters
    this.othersCategory,
    this.othersSubcategory,
    this.resolutionImages,
    this.resolutionNote,
    this.resolvedByAdminName,
    this.userReview,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    // Handle nested complaint object (from backend response)
    final complaintData = json['complaint'] ?? json;
    
    // Parse geographical information from user relationship
    Map<String, dynamic>? cityCorporation;
    Map<String, dynamic>? zone;
    Map<String, dynamic>? ward;
    
    if (complaintData['user'] != null) {
      final userData = complaintData['user'] as Map<String, dynamic>;
      cityCorporation = userData['cityCorporation'] as Map<String, dynamic>?;
      zone = userData['zone'] as Map<String, dynamic>?;
      ward = userData['ward'] as Map<String, dynamic>?;
    }
    
    // Also check for direct geographical fields (from backend response)
    cityCorporation ??= complaintData['cityCorporation'] as Map<String, dynamic>?;
    zone ??= complaintData['zone'] as Map<String, dynamic>?;
    // Check for both 'wards' (Prisma relation name) and 'ward' (legacy)
    ward ??= complaintData['wards'] as Map<String, dynamic>?;
    ward ??= complaintData['ward'] as Map<String, dynamic>?;
    
    return Complaint(
      id: complaintData['id'].toString(),
      title: complaintData['title'] ?? '',
      description: complaintData['description'] ?? '',
      category: complaintData['category'] ?? '',
      subcategory: complaintData['subcategory'],  // NEW: Parse subcategory
      urgencyLevel: complaintData['urgencyLevel'] ?? '',
      location: complaintData['location'] ?? '',
      address: complaintData['address'],
      status: _normalizeStatus(complaintData['status'] ?? ''),
      userId: (complaintData['userId'] ?? '').toString(),
      imageUrls: _parseUrlList(complaintData['imageUrls'] ?? complaintData['imageUrl']),
      audioUrls: _parseAudioUrls(complaintData),
      priority: complaintData['priority'] ?? 1,
      createdAt: DateTime.parse(complaintData['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(complaintData['updatedAt'] ?? DateTime.now().toIso8601String()),
      cityCorporation: cityCorporation,
      zone: zone,
      ward: ward,
      assignedAdmin: complaintData['assignedAdmin'] as Map<String, dynamic>?,
      // NEW: Parse Others and Resolution fields
      othersCategory: complaintData['othersCategory'],
      othersSubcategory: complaintData['othersSubcategory'],
      resolutionImages: complaintData['resolutionImages'],
      resolutionNote: complaintData['resolutionNote'],
      resolvedByAdminName: _parseResolvedByAdminName(complaintData),
      userReview: complaintData['userReview'] != null
          ? ReviewModel.fromJson(complaintData['userReview'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Normalize backend status enum to match Flutter constants
  static String _normalizeStatus(String status) {
    final normalized = status.toUpperCase();
    switch (normalized) {
      case 'PENDING':
        return ComplaintStatus.pending;
      case 'IN_PROGRESS':
        return ComplaintStatus.inProgress;
      case 'RESOLVED':
        return ComplaintStatus.resolved;
      case 'REJECTED':
      case 'CANCELLED':
        return ComplaintStatus.closed;
      case 'OTHERS':
        return ComplaintStatus.others;
      default:
        return status.toLowerCase();
    }
  }

  /// Parse resolved by admin name from assignedAdmin or other fields
  static String? _parseResolvedByAdminName(Map<String, dynamic> json) {
    // Check for direct resolvedByAdminName field
    if (json['resolvedByAdminName'] != null) {
      return json['resolvedByAdminName'].toString();
    }
    
    // Check assignedAdmin object
    if (json['assignedAdmin'] != null) {
      final admin = json['assignedAdmin'] as Map<String, dynamic>;
      final firstName = admin['firstName'] ?? '';
      final lastName = admin['lastName'] ?? '';
      if (firstName.isNotEmpty || lastName.isNotEmpty) {
        return '$firstName $lastName'.trim();
      }
    }
    
    return null;
  }

  /// Parse audio URLs from backend response
  static List<String> _parseAudioUrls(Map<String, dynamic> json) {
    // Check for voiceNoteUrl (single audio)
    if (json['voiceNoteUrl'] != null && json['voiceNoteUrl'].toString().isNotEmpty) {
      return [json['voiceNoteUrl'].toString()];
    }
    
    // Check for audioUrls array
    if (json['audioUrls'] != null) {
      return _parseUrlList(json['audioUrls']);
    }
    
    // Check for audioUrl field
    if (json['audioUrl'] != null) {
      return _parseUrlList(json['audioUrl']);
    }
    
    return [];
  }

  static List<String> _parseUrlList(dynamic urls) {
    if (urls == null) return [];
    if (urls is List) {
      return urls.map((url) => url.toString()).toList();
    }
    if (urls is String) {
      if (urls.isEmpty) return [];
      try {
        final List<dynamic> parsed = jsonDecode(urls);
        return parsed.map((url) => url.toString()).toList();
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        return urls.split(',').map((url) => url.trim()).where((url) => url.isNotEmpty).toList();
      }
    }
    return [];
  }

  /// Get status display text
  String get statusText => ComplaintStatus.getDisplayName(status);

  /// Get status color
  Color get statusColor => ComplaintStatus.getColor(status);

  /// Get time ago string (e.g., "2 hours ago")
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else {
      return 'Just now';
    }
  }

  /// Get thumbnail image URL (first image or null)
  String? get thumbnailUrl => imageUrls.isNotEmpty ? imageUrls.first : null;

  /// Get optimized thumbnail URL for the first image (200x200)
  /// Perfect for list views
  String? get optimizedThumbnailUrl {
    if (imageUrls.isEmpty) return null;
    return CloudinaryHelper.getThumbnailUrl(imageUrls.first);
  }

  /// Get all image URLs optimized for thumbnails (200x200)
  List<String> get thumbnailImageUrls {
    return imageUrls.map((url) => CloudinaryHelper.getThumbnailUrl(url)).toList();
  }

  /// Get all image URLs optimized for medium size (800x600)
  /// Perfect for detail views
  List<String> get mediumImageUrls {
    return imageUrls.map((url) => CloudinaryHelper.getMediumUrl(url)).toList();
  }

  /// Get all image URLs with automatic format and quality optimization
  List<String> get optimizedImageUrls {
    return imageUrls.map((url) => CloudinaryHelper.getOptimizedUrl(url)).toList();
  }

  /// Check if complaint has media attachments
  bool get hasMedia => imageUrls.isNotEmpty || audioUrls.isNotEmpty;
  
  /// Get geographical display text
  String get geographicalInfo {
    final parts = <String>[];
    
    if (cityCorporation != null) {
      parts.add(cityCorporation!['name'] ?? cityCorporation!['nameBangla'] ?? '');
    }
    if (zone != null) {
      final zoneName = zone!['name'] ?? zone!['displayName'] ?? 'Zone ${zone!['zoneNumber'] ?? ''}';
      parts.add(zoneName);
    }
    if (ward != null) {
      final wardName = ward!['displayName'] ?? 'Ward ${ward!['wardNumber'] ?? ''}';
      parts.add(wardName);
    }
    
    return parts.isNotEmpty ? parts.join(' • ') : '';
  }

  // NEW HELPER METHODS for Others Status and Resolution

  /// Check if complaint is marked as Others
  bool get isOthers => status.toLowerCase() == ComplaintStatus.others;

  /// Check if complaint has resolution documentation
  bool get hasResolution => resolutionImages != null || resolutionNote != null;

  /// Check if user can submit a review (complaint is resolved and no review yet)
  bool get canSubmitReview => 
      status.toLowerCase() == ComplaintStatus.resolved && userReview == null;

  /// Check if user has already submitted a review
  bool get hasUserReview => userReview != null;

  /// Get resolution image URLs as a list
  List<String> get resolutionImageUrls {
    if (resolutionImages == null || resolutionImages!.isEmpty) return [];
    return resolutionImages!
        .split(',')
        .map((url) => url.trim())
        .where((url) => url.isNotEmpty)
        .toList();
  }

  /// Get optimized resolution image URLs for thumbnails (200x200)
  List<String> get resolutionThumbnailUrls {
    return resolutionImageUrls
        .map((url) => CloudinaryHelper.getThumbnailUrl(url))
        .toList();
  }

  /// Get optimized resolution image URLs for medium size (800x600)
  List<String> get resolutionMediumUrls {
    return resolutionImageUrls
        .map((url) => CloudinaryHelper.getMediumUrl(url))
        .toList();
  }

  /// Get Others category display name
  String? get othersCategoryDisplay {
    if (othersCategory == null) return null;
    switch (othersCategory!.toUpperCase()) {
      case 'CORPORATION_INTERNAL':
        return 'Corporation Internal';
      case 'CORPORATION_EXTERNAL':
        return 'Corporation External';
      default:
        return othersCategory;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'subcategory': subcategory,  // NEW: Include subcategory
      'urgencyLevel': urgencyLevel,
      'location': location,
      'address': address,
      'status': status,
      'userId': userId,
      'imageUrls': imageUrls,
      'audioUrls': audioUrls,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'cityCorporation': cityCorporation,
      'zone': zone,
      'ward': ward,
      'assignedAdmin': assignedAdmin,
      // NEW: Include Others and Resolution fields
      'othersCategory': othersCategory,
      'othersSubcategory': othersSubcategory,
      'resolutionImages': resolutionImages,
      'resolutionNote': resolutionNote,
      'resolvedByAdminName': resolvedByAdminName,
    };
  }

  Complaint copyWith({
    String? id,
    String? title,
    String? description,
    String? category,
    String? subcategory,  // NEW: Subcategory parameter
    String? urgencyLevel,
    String? location,
    String? address,
    String? status,
    String? userId,
    List<String>? imageUrls,
    List<String>? audioUrls,
    int? priority,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? cityCorporation,
    Map<String, dynamic>? zone,
    Map<String, dynamic>? ward,
    Map<String, dynamic>? assignedAdmin,
    // NEW: Others and Resolution parameters
    String? othersCategory,
    String? othersSubcategory,
    String? resolutionImages,
    String? resolutionNote,
    String? resolvedByAdminName,
  }) {
    return Complaint(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      subcategory: subcategory ?? this.subcategory,  // NEW: Copy subcategory
      urgencyLevel: urgencyLevel ?? this.urgencyLevel,
      location: location ?? this.location,
      address: address ?? this.address,
      status: status ?? this.status,
      userId: userId ?? this.userId,
      imageUrls: imageUrls ?? this.imageUrls,
      audioUrls: audioUrls ?? this.audioUrls,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      cityCorporation: cityCorporation ?? this.cityCorporation,
      zone: zone ?? this.zone,
      ward: ward ?? this.ward,
      assignedAdmin: assignedAdmin ?? this.assignedAdmin,
      // NEW: Copy Others and Resolution fields
      othersCategory: othersCategory ?? this.othersCategory,
      othersSubcategory: othersSubcategory ?? this.othersSubcategory,
      resolutionImages: resolutionImages ?? this.resolutionImages,
      resolutionNote: resolutionNote ?? this.resolutionNote,
      resolvedByAdminName: resolvedByAdminName ?? this.resolvedByAdminName,
    );
  }

  @override
  String toString() {
    return 'Complaint(id: $id, title: $title, category: $category, status: $status)';
  }
}

/// Utility class for complaint categories
class ComplaintCategory {
  static const String waterSupply = 'water_supply';
  static const String wasteManagement = 'waste_management';
  static const String roadMaintenance = 'road_maintenance';
  static const String streetLighting = 'street_lighting';
  static const String drainageIssues = 'drainage_issues';
  static const String publicToilets = 'public_toilets';
  static const String animalControl = 'animal_control';
  static const String noiseComplaint = 'noise_complaint';
  static const String other = 'other';

  static List<String> get all => [
    waterSupply,
    wasteManagement,
    roadMaintenance,
    streetLighting,
    drainageIssues,
    publicToilets,
    animalControl,
    noiseComplaint,
    other,
  ];

  static String getDisplayName(String category) {
    switch (category) {
      case waterSupply:
        return 'Water Supply';
      case wasteManagement:
        return 'Waste Management';
      case roadMaintenance:
        return 'Road Maintenance';
      case streetLighting:
        return 'Street Lighting';
      case drainageIssues:
        return 'Drainage Issues';
      case publicToilets:
        return 'Public Toilets';
      case animalControl:
        return 'Animal Control';
      case noiseComplaint:
        return 'Noise Complaint';
      case other:
        return 'Other';
      default:
        return category;
    }
  }
}

/// Utility class for urgency levels
class UrgencyLevel {
  static const String low = 'low';
  static const String medium = 'medium';
  static const String high = 'high';
  static const String urgent = 'urgent';

  static List<String> get all => [low, medium, high, urgent];

  static String getDisplayName(String level) {
    switch (level) {
      case low:
        return 'Low';
      case medium:
        return 'Medium';
      case high:
        return 'High';
      case urgent:
        return 'Urgent';
      default:
        return level;
    }
  }

  static Color getColor(String level) {
    switch (level) {
      case low:
        return Colors.green;
      case medium:
        return Colors.orange;
      case high:
        return Colors.red;
      case urgent:
        return Colors.red.shade800;
      default:
        return Colors.grey;
    }
  }
}

/// Utility class for complaint status
/// Matches backend enum: PENDING, IN_PROGRESS, RESOLVED, REJECTED, OTHERS
class ComplaintStatus {
  static const String pending = 'pending';
  static const String inProgress = 'in_progress';
  static const String resolved = 'resolved';
  static const String closed = 'closed';
  static const String others = 'others';  // NEW: Others status

  static List<String> get all => [pending, inProgress, resolved, closed, others];

  static String getDisplayName(String status) {
    switch (status.toLowerCase()) {
      case pending:
        return 'Pending';
      case inProgress:
      case 'in progress':
        return 'In Progress';
      case resolved:
        return 'Resolved';
      case closed:
      case 'rejected':
      case 'cancelled':
        return 'Closed';
      case others:
        return 'Others';
      default:
        // Capitalize first letter of each word
        return status.split('_').map((word) => 
          word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1).toLowerCase()
        ).join(' ');
    }
  }

  static Color getColor(String status) {
    switch (status.toLowerCase()) {
      case pending:
        return const Color(0xFFFFC107); // Yellow/Amber
      case inProgress:
      case 'in progress':
        return const Color(0xFF2196F3); // Blue
      case resolved:
        return const Color(0xFF4CAF50); // Green
      case closed:
      case 'rejected':
      case 'cancelled':
        return const Color(0xFF9E9E9E); // Grey
      case others:
        return const Color(0xFF9C27B0); // Purple
      default:
        return Colors.grey;
    }
  }

  /// Convert Flutter status to backend enum format
  static String toBackendFormat(String status) {
    switch (status.toLowerCase()) {
      case pending:
        return 'PENDING';
      case inProgress:
      case 'in progress':
        return 'IN_PROGRESS';
      case resolved:
        return 'RESOLVED';
      case closed:
      case 'rejected':
      case 'cancelled':
        return 'REJECTED';
      case others:
        return 'OTHERS';
      default:
        return status.toUpperCase();
    }
  }
}