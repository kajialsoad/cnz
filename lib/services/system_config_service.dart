import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class SystemConfigService {
  final ApiClient _apiClient;

  // Cache keys
  static const String _dailyComplaintLimitKey = 'daily_complaint_limit';
  static const String _wardImageLimitKey = 'ward_image_limit';
  static const String _verificationSmsEnabledKey = 'verification_sms_enabled';
  static const String _verificationWhatsappEnabledKey =
      'verification_whatsapp_enabled';
  static const String _verificationTruecallerEnabledKey =
      'verification_truecaller_enabled';
  static const String _forgotPasswordSystemKey = 'forgot_password_system';

  SystemConfigService(this._apiClient);

  /// Fetch all relevant system configurations
  Future<Map<String, String>> getConfigs() async {
    try {
      final response = await _apiClient.get('/api/config');

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>;
        final configs = <String, String>{};

        data.forEach((key, value) {
          configs[key] = value.toString();
        });

        // Cache these values
        await _cacheConfigs(configs);

        return configs;
      }
      return await _getCachedConfigs();
    } catch (e) {
      print('Error fetching configs: $e');
      return await _getCachedConfigs();
    }
  }

  /// Get specific config value, falling back to cache then default
  Future<String> getConfig(String key, String defaultValue) async {
    try {
      final response = await _apiClient.get('/api/config/$key');

      if (response['success'] == true) {
        final value = response['data']['value'].toString();
        // Update cache
        final sp = await SharedPreferences.getInstance();
        await sp.setString('config_$key', value);
        return value;
      }
    } catch (e) {
      print('Error fetching config $key: $e');
    }

    // Try cache
    final sp = await SharedPreferences.getInstance();
    return sp.getString('config_$key') ?? defaultValue;
  }

  Future<void> _cacheConfigs(Map<String, String> configs) async {
    final sp = await SharedPreferences.getInstance();
    for (var entry in configs.entries) {
      await sp.setString('config_${entry.key}', entry.value);
    }
  }

  Future<Map<String, String>> _getCachedConfigs() async {
    final sp = await SharedPreferences.getInstance();
    return {
      _dailyComplaintLimitKey:
          sp.getString('config_$_dailyComplaintLimitKey') ?? '20',
      _wardImageLimitKey: sp.getString('config_$_wardImageLimitKey') ?? '10',
      _verificationSmsEnabledKey:
          sp.getString('config_$_verificationSmsEnabledKey') ?? 'true',
      _verificationWhatsappEnabledKey:
          sp.getString('config_$_verificationWhatsappEnabledKey') ?? 'true',
      _verificationTruecallerEnabledKey:
          sp.getString('config_$_verificationTruecallerEnabledKey') ?? 'false',
      _forgotPasswordSystemKey:
          sp.getString('config_$_forgotPasswordSystemKey') ?? 'true',
    };
  }
}
