import '../services/smart_api_client.dart';
import '../models/city_corporation_model.dart';
import '../models/thana_model.dart';
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
      );
    });
  }

  Future<Map<String, dynamic>> login({
    required String phone,
    required String password,
  }) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.login(phone: phone, password: password);
    });
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getCurrentUser();
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
      return await repo.getCityCorporations();
    });
  }

  Future<List<Thana>> getThanasByCityCorporation(String ccCode) async {
    return await SmartApiClient.executeWithFallback((client) async {
      final repo = AuthRepository(client);
      return await repo.getThanasByCityCorporation(ccCode);
    });
  }

  /// Get current server being used
  String getCurrentServer() => SmartApiClient.getCurrentServer();

  /// Check if using production server
  bool isUsingProduction() => SmartApiClient.isUsingProduction();
}
