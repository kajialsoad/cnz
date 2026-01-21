// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cached_chat_message.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CachedChatMessageAdapter extends TypeAdapter<CachedChatMessage> {
  @override
  final int typeId = 0;

  @override
  CachedChatMessage read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CachedChatMessage(
      complaintId: fields[0] as int,
      messageId: fields[1] as int,
      message: fields[2] as String,
      imageUrl: fields[3] as String?,
      voiceUrl: fields[4] as String?,
      isUser: fields[5] as bool,
      senderName: fields[6] as String,
      createdAt: fields[7] as DateTime,
      synced: fields[8] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, CachedChatMessage obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.complaintId)
      ..writeByte(1)
      ..write(obj.messageId)
      ..writeByte(2)
      ..write(obj.message)
      ..writeByte(3)
      ..write(obj.imageUrl)
      ..writeByte(4)
      ..write(obj.voiceUrl)
      ..writeByte(5)
      ..write(obj.isUser)
      ..writeByte(6)
      ..write(obj.senderName)
      ..writeByte(7)
      ..write(obj.createdAt)
      ..writeByte(8)
      ..write(obj.synced);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CachedChatMessageAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
