import 'package:hive/hive.dart';

part 'cached_chat_message.g.dart';

@HiveType(typeId: 0)
class CachedChatMessage extends HiveObject {
  @HiveField(0)
  int complaintId;

  @HiveField(1)
  int messageId;

  @HiveField(2)
  String message;

  @HiveField(3)
  String? imageUrl;

  @HiveField(4)
  String? voiceUrl;

  @HiveField(5)
  bool isUser;

  @HiveField(6)
  String senderName;

  @HiveField(7)
  DateTime createdAt;

  @HiveField(8)
  bool synced;

  CachedChatMessage({
    required this.complaintId,
    required this.messageId,
    required this.message,
    this.imageUrl,
    this.voiceUrl,
    required this.isUser,
    required this.senderName,
    required this.createdAt,
    this.synced = true,
  });
}
