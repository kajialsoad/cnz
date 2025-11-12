import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;
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
  bool _isRefreshing = false;
  List<Function> _refreshQueue = [];

  ApiClient(this.baseUrl, {this.timeout = const Duration(seconds: 30)});

  Future<String?> _getAccessToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('accessToken');
  }

  Future<String?> _getRefreshToken() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('refreshToken');
  }

  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString('accessToken', accessToken);
    await sp.setString('refreshToken', refreshToken);
  }

  Future<void> _clearTokens() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove('accessToken');
    await sp.remove('refreshToken');
  }

  Future<bool> _refreshAccessToken() async {
    if (_isRefreshing) {
      // Wait for the ongoing refresh
      final completer = Completer<bool>();
      _refreshQueue.add(() => completer.complete(true));
      return completer.future;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _getRefreshToken();
      if (refreshToken == null) {
        await _clearTokens();
        return false;
      }

      final res = await http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      ).timeout(timeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          final newAccessToken = data['data']['accessToken'];
          final newRefreshToken = data['data']['refreshToken'];
          await _saveTokens(newAccessToken, newRefreshToken);
          
          // Process queued requests
          for (var callback in _refreshQueue) {
            callback();
          }
          _refreshQueue.clear();
          
          return true;
        }
      }

      await _clearTokens();
      return false;
    } catch (e) {
      await _clearTokens();
      return false;
    } finally {
      _isRefreshing = false;
    }
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

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) async {
    try {
      final token = await _getAccessToken();
      final res = await http
          .put(
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

  Future<Map<String, dynamic>> delete(String path, {Map<String, dynamic>? data}) async {
    try {
      final token = await _getAccessToken();
      final res = await http
          .delete(
            Uri.parse('$baseUrl$path'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: data != null ? jsonEncode(data) : null,
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

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    Map<String, dynamic>? data,
    List<MapEntry<String, File>>? files,
  }) async {
    try {
      final token = await _getAccessToken();
      final uri = Uri.parse('$baseUrl$path');
      final request = http.MultipartRequest('POST', uri);

      // Add authorization header
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add form fields
      if (data != null) {
        data.forEach((key, value) {
          request.fields[key] = value.toString();
        });
      }

      // Add files
      if (files != null) {
        for (final entry in files) {
          final file = entry.value;
          String fileName;
          String mimeType;
          
          if (kIsWeb) {
            // For web, extract filename from path carefully to avoid _Namespace error
            final pathParts = file.path.split('/');
            fileName = pathParts.isNotEmpty ? pathParts.last : 'upload';
            // If it's a blob URL, use a default name
            if (fileName.startsWith('blob:') || fileName.contains('blob')) {
              fileName = 'image_${DateTime.now().millisecondsSinceEpoch}.jpg';
            }
            mimeType = lookupMimeType(fileName) ?? 'application/octet-stream';
            
            // For web, read file as bytes
            try {
              final bytes = await file.readAsBytes();
              request.files.add(
                http.MultipartFile.fromBytes(
                  entry.key,
                  bytes,
                  filename: fileName,
                  contentType: MediaType.parse(mimeType),
                ),
              );
            } catch (e) {
              print('Error reading file bytes on web: $e');
              throw ApiException('Failed to read file on web platform');
            }
          } else {
            // For mobile, use fromPath
            fileName = p.basename(file.path);
            mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
            
            request.files.add(
              await http.MultipartFile.fromPath(
                entry.key,
                file.path,
                filename: fileName,
                contentType: MediaType.parse(mimeType),
              ),
            );
          }
        }
      }

      final streamedResponse = await request.send().timeout(timeout);
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException('Request timeout. Please check your connection.');
    } on http.ClientException {
      throw ApiException('Network error. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> putMultipart(
    String path, {
    Map<String, dynamic>? data,
    List<MapEntry<String, File>>? files,
  }) async {
    try {
      final token = await _getAccessToken();
      final uri = Uri.parse('$baseUrl$path');
      final request = http.MultipartRequest('PUT', uri);

      // Add authorization header
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add form fields
      if (data != null) {
        data.forEach((key, value) {
          request.fields[key] = value.toString();
        });
      }

      // Add files
      if (files != null) {
        for (final entry in files) {
          final file = entry.value;
          String fileName;
          String mimeType;
          
          if (kIsWeb) {
            // For web, extract filename from path carefully to avoid _Namespace error
            final pathParts = file.path.split('/');
            fileName = pathParts.isNotEmpty ? pathParts.last : 'upload';
            // If it's a blob URL, use a default name
            if (fileName.startsWith('blob:') || fileName.contains('blob')) {
              fileName = 'image_${DateTime.now().millisecondsSinceEpoch}.jpg';
            }
            mimeType = lookupMimeType(fileName) ?? 'application/octet-stream';
            
            // For web, read file as bytes
            try {
              final bytes = await file.readAsBytes();
              request.files.add(
                http.MultipartFile.fromBytes(
                  entry.key,
                  bytes,
                  filename: fileName,
                  contentType: MediaType.parse(mimeType),
                ),
              );
            } catch (e) {
              print('Error reading file bytes on web: $e');
              throw ApiException('Failed to read file on web platform');
            }
          } else {
            // For mobile, use fromPath
            fileName = p.basename(file.path);
            mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
            
            request.files.add(
              await http.MultipartFile.fromPath(
                entry.key,
                file.path,
                filename: fileName,
                contentType: MediaType.parse(mimeType),
              ),
            );
          }
        }
      }

      final streamedResponse = await request.send().timeout(timeout);
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
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