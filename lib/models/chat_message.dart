import '../utils/cloudinary_helper.dart';

class ChatMessage {
  final int id;
  final int? complaintId; // Optional - only for Complaint Chat
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
    this.complaintId, // Optional - null for Live Chat, present for Complaint Chat
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
      complaintId: json['complaintId'] as int?, // Optional - can be null for Live Chat
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

  /// Check if this is a Complaint Chat message (has complaintId)
  bool get isComplaintChat => complaintId != null && complaintId! > 0;

  /// Check if this is a Live Chat message (no complaintId)
  bool get isLiveChat => complaintId == null || complaintId == 0;

  /// Check if message has an image attachment
  bool get hasImage => imageUrl != null && imageUrl!.isNotEmpty;

  /// Check if message has a voice attachment
  bool get hasVoice => voiceUrl != null && voiceUrl!.isNotEmpty;

  /// Check if message has any media attachment
  bool get hasMedia => hasImage || hasVoice;

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
      complaintId: complaintId ?? this.complaintId, // Preserves null if not provided
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
    final chatType = isComplaintChat ? 'Complaint' : 'Live';
    return 'ChatMessage(id: $id, type: $chatType, senderType: $senderType, message: $message, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ChatMessage &&
        other.id == id &&
        other.complaintId == complaintId && // Handles null comparison correctly
        other.senderId == senderId &&
        other.senderType == senderType &&
        other.message == message;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        (complaintId?.hashCode ?? 0) ^ // Handle null complaintId
        senderId.hashCode ^
        senderType.hashCode ^
        message.hashCode;
  }
}
