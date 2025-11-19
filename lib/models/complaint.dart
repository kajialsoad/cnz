import 'dart:convert';
import 'package:flutter/material.dart';

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
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    // Handle nested complaint object (from backend response)
    final complaintData = json['complaint'] ?? json;
    
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
      default:
        return status.toLowerCase();
    }
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

  /// Check if complaint has media attachments
  bool get hasMedia => imageUrls.isNotEmpty || audioUrls.isNotEmpty;

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
/// Matches backend enum: PENDING, IN_PROGRESS, RESOLVED, REJECTED
class ComplaintStatus {
  static const String pending = 'pending';
  static const String inProgress = 'in_progress';
  static const String resolved = 'resolved';
  static const String closed = 'closed';

  static List<String> get all => [pending, inProgress, resolved, closed];

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
      default:
        return status.toUpperCase();
    }
  }
}