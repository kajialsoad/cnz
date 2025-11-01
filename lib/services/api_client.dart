import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  final String baseUrl;
  ApiClient(this.baseUrl);

  Future<String?> _getAccessToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('accessToken');
  }

  Future<http.Response> post(String path, Map<String, dynamic> body) async {
    final token = await _getAccessToken();
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    return res;
  }

  Future<http.Response> get(String path) async {
    final token = await _getAccessToken();
    return http.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
  }
}