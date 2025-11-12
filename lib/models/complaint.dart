import 'dart:convert';
import 'package:flutter/material.dart';

class Complaint {
  final String id;
  final String title;
  final String description;
  final String category;
  final String urgencyLevel;
  final String location;
  final String? address;
  final String status;
  final String userId;
  final List<String> imageUrls;
  final List<String> audioUrls;
  final DateTime createdAt;
  final DateTime updatedAt;

  Complaint({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.urgencyLevel,
    required this.location,
    this.address,
    required this.status,
    required this.userId,
    required this.imageUrls,
    required this.audioUrls,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      urgencyLevel: json['urgencyLevel'] ?? '',
      location: json['location'] ?? '',
      address: json['address'],
      status: json['status'] ?? '',
      userId: json['userId'].toString(),
      imageUrls: _parseUrlList(json['imageUrls']),
      audioUrls: _parseUrlList(json['audioUrls']),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
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
    String? urgencyLevel,
    String? location,
    String? address,
    String? status,
    String? userId,
    List<String>? imageUrls,
    List<String>? audioUrls,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Complaint(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      urgencyLevel: urgencyLevel ?? this.urgencyLevel,
      location: location ?? this.location,
      address: address ?? this.address,
      status: status ?? this.status,
      userId: userId ?? this.userId,
      imageUrls: imageUrls ?? this.imageUrls,
      audioUrls: audioUrls ?? this.audioUrls,
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
class ComplaintStatus {
  static const String pending = 'pending';
  static const String inProgress = 'in_progress';
  static const String resolved = 'resolved';
  static const String closed = 'closed';

  static List<String> get all => [pending, inProgress, resolved, closed];

  static String getDisplayName(String status) {
    switch (status) {
      case pending:
        return 'Pending';
      case inProgress:
        return 'In Progress';
      case resolved:
        return 'Resolved';
      case closed:
        return 'Closed';
      default:
        return status;
    }
  }

  static Color getColor(String status) {
    switch (status) {
      case pending:
        return Colors.orange;
      case inProgress:
        return Colors.blue;
      case resolved:
        return Colors.green;
      case closed:
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}