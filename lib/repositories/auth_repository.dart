import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../models/city_corporation_model.dart';
import '../models/thana_model.dart';
import '../models/zone_model.dart';
import '../models/ward_model.dart';

class AuthRepository {
  final ApiClient api;
  AuthRepository(this.api);

  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    String? email,
    required String password,
    String? ward, // Deprecated - kept for backward compatibility
    String? zone,
    String? address,
    String? CityCorporationCode,
    int? thanaId, // Deprecated - kept for backward compatibility
    int? zoneId,
    int? wardId,
  }) async {
    // Split name into firstName and lastName
    final nameParts = name.trim().split(' ');
    final firstName = nameParts.first;
    // If no last name provided, use a placeholder or same as first name
    final lastName = nameParts.length > 1
        ? nameParts.sublist(1).join(' ')
        : nameParts.first;

    try {
      final data = await api.post('/api/auth/register', {
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'email': email,
        'password': password,
        if (ward != null) 'ward': ward,
        if (zone != null) 'zone': zone,
        if (address != null) 'address': address,
        if (CityCorporationCode != null)
          'cityCorporationCode': CityCorporationCode,
        if (thanaId != null) 'thanaId': thanaId,
        if (zoneId != null) 'zoneId': zoneId,
        if (wardId != null) 'wardId': wardId,
      });

      // Backend returns: { success: true, message: "...", user: {...} }
      // No tokens on registration - user needs to verify email first
      return data;
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Registration failed: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> login(
    String phoneOrEmail,
    String password,
  ) async {
    try {
      // Detect if input is email or phone
      final isEmail = RegExp(r'^.+@.+\..+$').hasMatch(phoneOrEmail);

      final data = await api.post('/api/auth/login', {
        if (isEmail) 'email': phoneOrEmail else 'phone': phoneOrEmail,
        'password': password,
        'portal': 'APP',
      });

      // Backend returns: { success: true, message: "...", data: { accessToken, refreshToken, ... } }
      if (data['success'] == true && data['data'] != null) {
        final tokens = data['data'] as Map<String, dynamic>;
        final sp = await SharedPreferences.getInstance();
        await sp.setString('accessToken', tokens['accessToken']);
        await sp.setString('refreshToken', tokens['refreshToken']);
        return tokens;
      } else {
        throw Exception(data['message'] ?? 'Login failed');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> me() async {
    try {
      final data = await api.get('/api/auth/me');

      if (data['user'] != null) {
        return data['user'] as Map<String, dynamic>;
      } else {
        throw Exception('Failed to load user profile');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load user: ${e.toString()}');
    }
  }

  Future<String> refresh() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final rt = sp.getString('refreshToken');
      if (rt == null) throw Exception('No refresh token');

      final data = await api.post('/api/auth/refresh', {'refreshToken': rt});

      if (data['success'] == true && data['data'] != null) {
        final tokens = data['data'] as Map<String, dynamic>;
        await sp.setString('accessToken', tokens['accessToken']);
        await sp.setString('refreshToken', tokens['refreshToken']);
        return tokens['accessToken'];
      } else {
        throw Exception(data['message'] ?? 'Refresh failed');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Token refresh failed: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final rt = sp.getString('refreshToken');

      if (rt != null) {
        await api.post('/api/auth/logout', {'refreshToken': rt});
      }

      await sp.remove('accessToken');
      await sp.remove('refreshToken');
    } on ApiException catch (e) {
      // Still clear local tokens even if API call fails
      final sp = await SharedPreferences.getInstance();
      await sp.remove('accessToken');
      await sp.remove('refreshToken');
      throw Exception(e.message);
    } catch (e) {
      // Still clear local tokens even if API call fails
      final sp = await SharedPreferences.getInstance();
      await sp.remove('accessToken');
      await sp.remove('refreshToken');
      throw Exception('Logout failed: ${e.toString()}');
    }
  }

  Future<void> verifyEmail(String email, String code) async {
    try {
      final data = await api.post('/api/auth/verify-email-code', {
        'email': email,
        'code': code,
      });

      if (data['success'] != true) {
        throw Exception(data['message'] ?? 'Verification failed');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Email verification failed: ${e.toString()}');
    }
  }

  Future<void> resendVerificationCode(String email) async {
    try {
      final data = await api.post('/api/auth/resend-verification-code', {
        'email': email,
      });

      if (data['success'] != true) {
        throw Exception(data['message'] ?? 'Failed to resend code');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to resend verification code: ${e.toString()}');
    }
  }

  Future<void> verifyPhone(String phone, String code) async {
    try {
      final data = await api.post('/api/auth/verify-phone-code', {
        'phone': phone,
        'code': code,
      });

      if (data['success'] != true) {
        throw Exception(data['message'] ?? 'Verification failed');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Phone verification failed: ${e.toString()}');
    }
  }

  Future<void> resendPhoneVerificationCode(
    String phone, {
    String method = 'sms',
  }) async {
    try {
      final data = await api.post('/api/auth/resend-phone-code', {
        'phone': phone,
        'method': method,
      });

      if (data['success'] != true) {
        throw Exception(data['message'] ?? 'Failed to resend code');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to resend verification code: ${e.toString()}');
    }
  }

  Future<List<CityCorporation>> getActiveCityCorporations() async {
    try {
      final data = await api.get('/api/city-corporations/active');

      if (data['cityCorporations'] != null) {
        final cityCorps = data['cityCorporations'] as List;
        return cityCorps
            .map((cc) => CityCorporation.fromJson(cc as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to load city corporations');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load city corporations: ${e.toString()}');
    }
  }

  Future<List<Thana>> getThanasByCityCorporation(
    String CityCorporationCode,
  ) async {
    try {
      final data = await api.get(
        '/api/city-corporations/$CityCorporationCode/thanas',
      );

      if (data['thanas'] != null) {
        final thanas = data['thanas'] as List;
        return thanas
            .map((t) => Thana.fromJson(t as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to load thanas');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load thanas: ${e.toString()}');
    }
  }

  Future<List<Zone>> getZonesByCityCorporation(int cityCorporationId) async {
    try {
      final data = await api.get(
        '/api/zones?cityCorporationId=$cityCorporationId',
      );

      if (data['data'] != null) {
        final zones = data['data'] as List;
        return zones
            .map((z) => Zone.fromJson(z as Map<String, dynamic>))
            .toList();
      } else if (data['zones'] != null) {
        // Fallback for older API response structure
        final zones = data['zones'] as List;
        return zones
            .map((z) => Zone.fromJson(z as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to load zones');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load zones: ${e.toString()}');
    }
  }

  Future<List<Ward>> getWardsByZone(int zoneId) async {
    try {
      final data = await api.get('/api/wards?zoneId=$zoneId');

      if (data['data'] != null) {
        final wards = data['data'] as List;
        return wards
            .map((w) => Ward.fromJson(w as Map<String, dynamic>))
            .toList();
      } else if (data['wards'] != null) {
        // Fallback for older API response structure
        final wards = data['wards'] as List;
        return wards
            .map((w) => Ward.fromJson(w as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to load wards');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load wards: ${e.toString()}');
    }
  }

  Future<List<Ward>> getWardsByCityCorporation(
    String cityCorporationCode,
  ) async {
    try {
      final data = await api.get(
        '/api/city-corporations/$cityCorporationCode/wards',
      );

      if (data['data'] != null) {
        final wards = data['data'] as List;
        return wards
            .map((w) => Ward.fromJson(w as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to load wards');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load wards: ${e.toString()}');
    }
  }
}
