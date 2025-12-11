import '../services/smart_api_client.dart';
import '../models/city_corporation_model.dart';
import '../models/thana_model.dart';
import '../models/zone_model.dart';
import '../models/ward_model.dart';
import 'auth_repository.dart';

/// Smart Auth Repository with automatic server fallback
class SmartAuthRepository {
  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    String? email,
    required String password,
    String? ward,
    String? zone,
    String? address,
    String? CityCorporationCode,
    int? thanaId,
    int? zoneId,
    int? wardId,
  }) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.register(
        name: name,
        phone: phone,
        email: email,
        password: password,
        ward: ward,
        zone: zone,
        address: address,
        CityCorporationCode: CityCorporationCode,
        thanaId: thanaId,
        zoneId: zoneId,
        wardId: wardId,
      );
    });
  }

  Future<Map<String, dynamic>> login(
    String phoneOrEmail,
    String password,
  ) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.login(phoneOrEmail, password);
    });
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.me();
    });
  }

  Future<void> logout() async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.logout();
    });
  }

  Future<List<CityCorporation>> getCityCorporations() async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getActiveCityCorporations();
    });
  }

  Future<List<Thana>> getThanasByCityCorporation(String ccCode) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getThanasByCityCorporation(ccCode);
    });
  }

  Future<List<Zone>> getZonesByCityCorporation(String ccCode) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getZonesByCityCorporation(ccCode);
    });
  }

  Future<List<Ward>> getWardsByZone(int zoneId) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getWardsByZone(zoneId);
    });
  }

  /// Get current server being used
  String getCurrentServer() => SmartApiClient.getCurrentServer();

  /// Check if using production server
  bool isUsingProduction() => SmartApiClient.isUsingProduction();
}
