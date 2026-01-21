import 'package:hive/hive.dart';

part 'cached_complaint_info.g.dart';

@HiveType(typeId: 1)
class CachedComplaintInfo extends HiveObject {
  @HiveField(0)
  int complaintId;

  @HiveField(1)
  String complaintTitle;

  @HiveField(2)
  String? userName;

  @HiveField(3)
  String? userPhone;

  @HiveField(4)
  String? userEmail;

  @HiveField(5)
  String? location;

  @HiveField(6)
  String status;

  @HiveField(7)
  DateTime? lastUpdated;

  CachedComplaintInfo({
    required this.complaintId,
    required this.complaintTitle,
    this.userName,
    this.userPhone,
    this.userEmail,
    this.location,
    required this.status,
    this.lastUpdated,
  });
}
