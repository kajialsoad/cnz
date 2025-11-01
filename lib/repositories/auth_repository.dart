import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';

class AuthRepository {
  final ApiClient api;
  AuthRepository(this.api);

  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    String? email,
    required String password,
  }) async {
    final res = await api.post('/auth/register', {
      'name': name,
      'phone': phone,
      'email': email,
      'password': password,
    });
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      final sp = await SharedPreferences.getInstance();
      await sp.setString('accessToken', data['accessToken']);
      await sp.setString('refreshToken', data['refreshToken']);
      return data;
    } else {
      throw Exception(data['message'] ?? 'Registration failed');
    }
  }

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await api.post('/auth/login', {'phone': phone, 'password': password});
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      final sp = await SharedPreferences.getInstance();
      await sp.setString('accessToken', data['accessToken']);
      await sp.setString('refreshToken', data['refreshToken']);
      return data;
    } else {
      throw Exception(data['message'] ?? 'Login failed');
    }
  }

  Future<Map<String, dynamic>> me() async {
    final res = await api.get('/auth/me');
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      return data['user'];
    } else {
      throw Exception(data['message'] ?? 'Failed to load user');
    }
  }

  Future<String> refresh() async {
    final sp = await SharedPreferences.getInstance();
    final rt = sp.getString('refreshToken');
    if (rt == null) throw Exception('No refresh token');
    final res = await api.post('/auth/refresh', {'refreshToken': rt});
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await sp.setString('accessToken', data['accessToken']);
      return data['accessToken'];
    } else {
      throw Exception(data['message'] ?? 'Refresh failed');
    }
  }

  Future<void> logout() async {
    final sp = await SharedPreferences.getInstance();
    final rt = sp.getString('refreshToken');
    await api.post('/auth/logout', {'refreshToken': rt});
    await sp.remove('accessToken');
    await sp.remove('refreshToken');
  }
}