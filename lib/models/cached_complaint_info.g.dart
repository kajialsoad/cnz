// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cached_complaint_info.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CachedComplaintInfoAdapter extends TypeAdapter<CachedComplaintInfo> {
  @override
  final int typeId = 1;

  @override
  CachedComplaintInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CachedComplaintInfo(
      complaintId: fields[0] as int,
      complaintTitle: fields[1] as String,
      userName: fields[2] as String?,
      userPhone: fields[3] as String?,
      userEmail: fields[4] as String?,
      location: fields[5] as String?,
      status: fields[6] as String,
      lastUpdated: fields[7] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, CachedComplaintInfo obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.complaintId)
      ..writeByte(1)
      ..write(obj.complaintTitle)
      ..writeByte(2)
      ..write(obj.userName)
      ..writeByte(3)
      ..write(obj.userPhone)
      ..writeByte(4)
      ..write(obj.userEmail)
      ..writeByte(5)
      ..write(obj.location)
      ..writeByte(6)
      ..write(obj.status)
      ..writeByte(7)
      ..write(obj.lastUpdated);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CachedComplaintInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
