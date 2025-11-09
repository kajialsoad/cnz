import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  ApiException(this.message, {this.statusCode, this.errors});

  @override
  String toString() => message;
}

class ApiClient {
  final String baseUrl;
  final Duration timeout;

  ApiClient(this.baseUrl, {this.timeout = const Duration(seconds: 30)});

  Future<String?> _getAccessToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('accessToken');
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final token = await _getAccessToken();
      final res = await http
          .post(
            Uri.parse('$baseUrl$path'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode(body),
          )
          .timeout(timeout);

      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Request timeout. Please check your connection.');
    } on http.ClientException {
      throw ApiException('Network error. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> get(String path) async {
    try {
      final token = await _getAccessToken();
      final res = await http
          .get(
            Uri.parse('$baseUrl$path'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
          )
          .timeout(timeout);

      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Request timeout. Please check your connection.');
    } on http.ClientException {
      throw ApiException('Network error. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (statusCode >= 200 && statusCode < 300) {
        // Success response
        return data;
      } else if (statusCode == 400) {
        // Validation error
        throw ApiException(
          data['message'] ?? 'Validation error',
          statusCode: statusCode,
          errors: data['errors'] as Map<String, dynamic>?,
        );
      } else if (statusCode == 401) {
        // Authentication error
        throw ApiException(
          data['message'] ?? 'Invalid credentials',
          statusCode: statusCode,
        );
      } else if (statusCode == 500) {
        // Server error
        throw ApiException(
          'Server error. Please try again later.',
          statusCode: statusCode,
        );
      } else {
        // Other errors
        throw ApiException(
          data['message'] ?? 'An error occurred',
          statusCode: statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Failed to parse server response',
        statusCode: statusCode,
      );
    }
  }
}