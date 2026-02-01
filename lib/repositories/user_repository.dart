import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';

import '../config/api_config.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class UserRepository {
  final ApiClient api;
  UserRepository(this.api);

  Future<UserModel> getProfile() async {
    try {
      final data = await api.get('/api/users/me');
      
      if (data['user'] != null) {
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        throw Exception('Failed to load user profile');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load user: ${e.toString()}');
    }
  }

  Future<UserModel> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? email,
    String? avatar,
    String? zone, // Deprecated - kept for backward compatibility
    String? ward, // Deprecated - kept for backward compatibility
    int? zoneId,
    int? wardId,
    String? cityCorporationCode,
    String? address,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (firstName != null && firstName.isNotEmpty) body['firstName'] = firstName;
      if (lastName != null && lastName.isNotEmpty) body['lastName'] = lastName;
      if (phone != null && phone.isNotEmpty) body['phone'] = phone;
      
      // Only include email if it's not empty, otherwise omit it
      if (email != null && email.isNotEmpty) {
        body['email'] = email;
      }
      
      if (avatar != null && avatar.isNotEmpty) body['avatar'] = avatar;
      
      // Use new zoneId/wardId if provided, otherwise fall back to old zone/ward
      if (zoneId != null) {
        body['zoneId'] = zoneId;
      } else if (zone != null && zone.isNotEmpty) {
        body['zone'] = zone;
      }
      
      if (wardId != null) {
        body['wardId'] = wardId;
      } else if (ward != null && ward.isNotEmpty) {
        body['ward'] = ward;
      }
      
      if (cityCorporationCode != null && cityCorporationCode.isNotEmpty) {
        body['cityCorporationCode'] = cityCorporationCode;
      }
      
      // Only include address if it's not empty, otherwise omit it
      if (address != null && address.isNotEmpty) {
        body['address'] = address;
      }

      final data = await api.put('/api/users/profile', body);
      
      if (data['user'] != null) {
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        throw Exception('Failed to update profile');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }

  /// Upload profile avatar image (cross-platform: mobile and web)
  Future<String> uploadAvatar({
    required Uint8List imageBytes,
    required String fileName,
    String? mimeType,
  }) async {
    try {
      final token = await AuthService.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/uploads/avatar');
      final request = http.MultipartRequest('POST', uri);
      
      // Add authorization header
      request.headers['Authorization'] = 'Bearer $token';
      
      // Determine mime type
      final detectedMimeType = mimeType ?? lookupMimeType(fileName) ?? 'image/jpeg';
      final mimeTypeParts = detectedMimeType.split('/');
      
      // Add image file from bytes (works on both mobile and web)
      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          imageBytes,
          filename: fileName,
          contentType: MediaType(mimeTypeParts[0], mimeTypeParts[1]),
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null && data['data']['url'] != null) {
          return data['data']['url'] as String;
        } else {
          throw Exception('Invalid response format');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to upload avatar');
      }
    } catch (e) {
      throw Exception('Failed to upload avatar: ${e.toString()}');
    }
  }
}
