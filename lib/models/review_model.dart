/// Review model for user feedback on resolved complaints
/// Represents user ratings and comments for complaint resolutions
class ReviewModel {
  final int id;
  final int complaintId;
  final int userId;
  final int rating; // 1-5 stars
  final String? comment; // Optional comment (max 300 characters)
  final DateTime createdAt;
  final DateTime updatedAt;
  final ReviewUser? user; // User who submitted the review

  ReviewModel({
    required this.id,
    required this.complaintId,
    required this.userId,
    required this.rating,
    this.comment,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  /// Create ReviewModel from JSON
  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    // Safely parse int values with null checks
    int parseIntSafe(dynamic value, int defaultValue) {
      if (value == null) return defaultValue;
      if (value is int) return value;
      return int.tryParse(value.toString()) ?? defaultValue;
    }
    
    final createdAtStr = json['createdAt'] ?? DateTime.now().toIso8601String();
    
    return ReviewModel(
      id: parseIntSafe(json['id'], 0),
      complaintId: parseIntSafe(json['complaintId'], 0),
      userId: parseIntSafe(json['userId'], 0),
      rating: parseIntSafe(json['rating'], 0),
      comment: json['comment'],
      createdAt: DateTime.parse(createdAtStr),
      updatedAt: DateTime.parse(
        json['updatedAt'] ?? createdAtStr,  // Use createdAt as fallback for updatedAt
      ),
      user: json['user'] != null ? ReviewUser.fromJson(json['user']) : null,
    );
  }

  /// Convert ReviewModel to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'complaintId': complaintId,
      'userId': userId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'user': user?.toJson(),
    };
  }

  /// Create a copy with updated fields
  ReviewModel copyWith({
    int? id,
    int? complaintId,
    int? userId,
    int? rating,
    String? comment,
    DateTime? createdAt,
    DateTime? updatedAt,
    ReviewUser? user,
  }) {
    return ReviewModel(
      id: id ?? this.id,
      complaintId: complaintId ?? this.complaintId,
      userId: userId ?? this.userId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      user: user ?? this.user,
    );
  }

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

  /// Check if review has a comment
  bool get hasComment => comment != null && comment!.isNotEmpty;

  /// Get rating as percentage (0-100)
  double get ratingPercentage => (rating / 5.0) * 100;

  /// Get rating category
  String get ratingCategory {
    switch (rating) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Good';
      case 3:
        return 'Average';
      case 2:
        return 'Poor';
      case 1:
        return 'Very Poor';
      default:
        return 'Unknown';
    }
  }

  /// Validate rating is within valid range (1-5)
  bool get isValidRating => rating >= 1 && rating <= 5;

  /// Validate comment length (max 300 characters)
  bool get isValidCommentLength =>
      comment == null || comment!.length <= 300;

  /// Check if review is valid
  bool get isValid => isValidRating && isValidCommentLength;

  @override
  String toString() {
    return 'ReviewModel(id: $id, complaintId: $complaintId, rating: $rating, hasComment: $hasComment)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ReviewModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

/// Simplified user model for review display
/// Contains only the essential user information needed for showing reviews
class ReviewUser {
  final int id;
  final String firstName;
  final String lastName;
  final String? avatar;

  ReviewUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.avatar,
  });

  /// Create ReviewUser from JSON
  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      avatar: json['avatar'],
    );
  }

  /// Convert ReviewUser to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'avatar': avatar,
    };
  }

  /// Get full name
  String get fullName => '$firstName $lastName'.trim();

  /// Get initials (e.g., "JD" for "John Doe")
  String get initials {
    final first = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final last = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$first$last';
  }

  @override
  String toString() {
    return 'ReviewUser(id: $id, fullName: $fullName)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ReviewUser && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

/// Rating constants
class Rating {
  static const int min = 1;
  static const int max = 5;
  static const int excellent = 5;
  static const int good = 4;
  static const int average = 3;
  static const int poor = 2;
  static const int veryPoor = 1;

  /// Get all valid ratings
  static List<int> get all => [1, 2, 3, 4, 5];

  /// Validate rating
  static bool isValid(int rating) => rating >= min && rating <= max;

  /// Get rating category
  static String getCategory(int rating) {
    switch (rating) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Good';
      case 3:
        return 'Average';
      case 2:
        return 'Poor';
      case 1:
        return 'Very Poor';
      default:
        return 'Unknown';
    }
  }
}

/// Comment validation constants
class ReviewComment {
  static const int maxLength = 300;
  static const int minLength = 0; // Optional, so min is 0

  /// Validate comment length
  static bool isValidLength(String? comment) {
    if (comment == null) return true; // Optional
    return comment.length >= minLength && comment.length <= maxLength;
  }

  /// Get remaining characters
  static int getRemainingChars(String? comment) {
    if (comment == null) return maxLength;
    return maxLength - comment.length;
  }
}
