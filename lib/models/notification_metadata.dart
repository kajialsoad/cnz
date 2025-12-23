import 'dart:convert';

/// Notification metadata containing additional information
/// Used for status change notifications with resolution details
class NotificationMetadata {
  final String? resolutionImages;
  final String? resolutionNote;
  final String? othersCategory;
  final String? othersSubcategory;
  final String? adminName;
  final Map<String, dynamic>? additionalData;

  NotificationMetadata({
    this.resolutionImages,
    this.resolutionNote,
    this.othersCategory,
    this.othersSubcategory,
    this.adminName,
    this.additionalData,
  });

  /// Create NotificationMetadata from JSON
  factory NotificationMetadata.fromJson(Map<String, dynamic> json) {
    return NotificationMetadata(
      resolutionImages: json['resolutionImages'] is List
          ? (json['resolutionImages'] as List).join(',')
          : json['resolutionImages'],
      resolutionNote: json['resolutionNote'],
      othersCategory: json['othersCategory'],
      othersSubcategory: json['othersSubcategory'],
      adminName: json['adminName'],
      additionalData: json['additionalData'] != null
          ? (json['additionalData'] is Map<String, dynamic>
              ? json['additionalData']
              : (json['additionalData'] is String
                  ? jsonDecode(json['additionalData'])
                  : null)) // Handle unexpected types like int by returning null
          : null,
    );
  }

  /// Convert NotificationMetadata to JSON
  Map<String, dynamic> toJson() {
    return {
      'resolutionImages': resolutionImages,
      'resolutionNote': resolutionNote,
      'othersCategory': othersCategory,
      'othersSubcategory': othersSubcategory,
      'adminName': adminName,
      'additionalData': additionalData,
    };
  }

  /// Create a copy with updated fields
  NotificationMetadata copyWith({
    String? resolutionImages,
    String? resolutionNote,
    String? othersCategory,
    String? othersSubcategory,
    String? adminName,
    Map<String, dynamic>? additionalData,
  }) {
    return NotificationMetadata(
      resolutionImages: resolutionImages ?? this.resolutionImages,
      resolutionNote: resolutionNote ?? this.resolutionNote,
      othersCategory: othersCategory ?? this.othersCategory,
      othersSubcategory: othersSubcategory ?? this.othersSubcategory,
      adminName: adminName ?? this.adminName,
      additionalData: additionalData ?? this.additionalData,
    );
  }

  /// Check if metadata has resolution images
  bool get hasResolutionImages =>
      resolutionImages != null && resolutionImages!.isNotEmpty;

  /// Check if metadata has resolution note
  bool get hasResolutionNote =>
      resolutionNote != null && resolutionNote!.isNotEmpty;

  /// Check if metadata is about Others status
  bool get isOthersStatus =>
      othersCategory != null || othersSubcategory != null;

  /// Get resolution image URLs as a list
  List<String> get resolutionImageUrls {
    if (resolutionImages == null || resolutionImages!.isEmpty) return [];
    return resolutionImages!
        .split(',')
        .map((url) => url.trim())
        .where((url) => url.isNotEmpty)
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

  /// Get formatted Others information
  String? get othersInfo {
    if (!isOthersStatus) return null;

    final parts = <String>[];
    if (othersCategoryDisplay != null) {
      parts.add(othersCategoryDisplay!);
    }
    if (othersSubcategory != null) {
      parts.add(othersSubcategory!);
    }

    return parts.isNotEmpty ? parts.join(' - ') : null;
  }

  /// Check if metadata has any content
  bool get hasContent =>
      hasResolutionImages ||
      hasResolutionNote ||
      isOthersStatus ||
      adminName != null ||
      (additionalData != null && additionalData!.isNotEmpty);

  @override
  String toString() {
    return 'NotificationMetadata(hasResolutionImages: $hasResolutionImages, hasResolutionNote: $hasResolutionNote, isOthersStatus: $isOthersStatus)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is NotificationMetadata &&
        other.resolutionImages == resolutionImages &&
        other.resolutionNote == resolutionNote &&
        other.othersCategory == othersCategory &&
        other.othersSubcategory == othersSubcategory &&
        other.adminName == adminName;
  }

  @override
  int get hashCode {
    return resolutionImages.hashCode ^
        resolutionNote.hashCode ^
        othersCategory.hashCode ^
        othersSubcategory.hashCode ^
        adminName.hashCode;
  }
}
