import '../utils/cloudinary_helper.dart';

class ChatMessage {
  final int id;
  final int complaintId;
  final int senderId;
  final String senderType; // 'ADMIN' or 'CITIZEN'
  final String senderName;
  final String message;
  final String? imageUrl;
  final String? voiceUrl;
  final bool read;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.complaintId,
    required this.senderId,
    required this.senderType,
    required this.senderName,
    required this.message,
    this.imageUrl,
    this.voiceUrl,
    required this.read,
    required this.createdAt,
  });

  /// Create ChatMessage from JSON
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as int,
      complaintId: json['complaintId'] as int,
      senderId: json['senderId'] as int,
      senderType: json['senderType'] as String,
      senderName: json['senderName'] ?? 'Unknown',
      message: json['message'] as String,
      imageUrl: json['imageUrl'] as String?,
      voiceUrl: json['voiceUrl'] as String?,
      read: json['read'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// Convert ChatMessage to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'complaintId': complaintId,
      'senderId': senderId,
      'senderType': senderType,
      'senderName': senderName,
      'message': message,
      'imageUrl': imageUrl,
      'voiceUrl': voiceUrl,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Check if message is from current user (citizen)
  bool get isUser => senderType == 'CITIZEN';

  /// Check if message is from admin
  bool get isAdmin => senderType == 'ADMIN';

  /// Get optimized thumbnail URL for the image (200x200)
  /// Perfect for chat message previews
  String? get thumbnailImageUrl {
    if (imageUrl == null) return null;
    return CloudinaryHelper.getThumbnailUrl(imageUrl!);
  }

  /// Get medium-sized URL for the image (800x600)
  /// Perfect for full-screen image view
  String? get mediumImageUrl {
    if (imageUrl == null) return null;
    return CloudinaryHelper.getMediumUrl(imageUrl!);
  }

  /// Get optimized URL for the image with automatic format and quality
  String? get optimizedImageUrl {
    if (imageUrl == null) return null;
    return CloudinaryHelper.getOptimizedUrl(imageUrl!);
  }

  /// Create a copy with updated fields
  ChatMessage copyWith({
    int? id,
    int? complaintId,
    int? senderId,
    String? senderType,
    String? senderName,
    String? message,
    String? imageUrl,
    String? voiceUrl,
    bool? read,
    DateTime? createdAt,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      complaintId: complaintId ?? this.complaintId,
      senderId: senderId ?? this.senderId,
      senderType: senderType ?? this.senderType,
      senderName: senderName ?? this.senderName,
      message: message ?? this.message,
      imageUrl: imageUrl ?? this.imageUrl,
      voiceUrl: voiceUrl ?? this.voiceUrl,
      read: read ?? this.read,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'ChatMessage(id: $id, senderType: $senderType, message: $message, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ChatMessage &&
        other.id == id &&
        other.complaintId == complaintId &&
        other.senderId == senderId &&
        other.senderType == senderType &&
        other.message == message;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        complaintId.hashCode ^
        senderId.hashCode ^
        senderType.hashCode ^
        message.hashCode;
  }
}
