import 'dart:io';
import 'package:dio/dio.dart';
import 'api_client.dart';

/// Service to handle and format errors consistently across the app
class ErrorHandlerService {
  /// Convert exceptions to user-friendly error messages
  static String getErrorMessage(dynamic error) {
    if (error is ApiException) {
      return _handleApiException(error);
    } else if (error is DioException) {
      return _handleDioError(error);
    } else if (error is SocketException) {
      return 'No internet connection. Please check your network and try again.';
    } else if (error is FormatException) {
      return 'Invalid data format received. Please try again.';
    } else if (error is Exception) {
      final message = error.toString();
      // Remove "Exception: " prefix if present
      if (message.startsWith('Exception: ')) {
        return message.substring(11);
      }
      return message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Handle ApiException errors
  static String _handleApiException(ApiException error) {
    // Return the error message from the exception
    // The ApiException already contains user-friendly messages
    return error.message;
  }

  /// Handle Dio-specific errors
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timeout. Please check your internet connection.';
      
      case DioExceptionType.sendTimeout:
        return 'Request timeout. Please try again.';
      
      case DioExceptionType.receiveTimeout:
        return 'Server response timeout. Please try again.';
      
      case DioExceptionType.badResponse:
        return _handleBadResponse(error);
      
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      
      case DioExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      
      case DioExceptionType.badCertificate:
        return 'Security certificate error. Please contact support.';
      
      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return 'No internet connection. Please check your network.';
        }
        return 'Network error. Please try again.';
      
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /// Handle HTTP response errors
  static String _handleBadResponse(DioException error) {
    final statusCode = error.response?.statusCode;
    final responseData = error.response?.data;

    // Try to extract error message from response
    String? serverMessage;
    if (responseData is Map) {
      serverMessage = responseData['message'] as String?;
    }

    switch (statusCode) {
      case 400:
        return serverMessage ?? 'Invalid request. Please check your input.';
      
      case 401:
        return 'Session expired. Please login again.';
      
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      
      case 404:
        return serverMessage ?? 'Resource not found.';
      
      case 409:
        return serverMessage ?? 'Conflict. This action cannot be completed.';
      
      case 422:
        return serverMessage ?? 'Validation error. Please check your input.';
      
      case 429:
        return 'Too many requests. Please try again later.';
      
      case 500:
        return 'Server error. Please try again later.';
      
      case 502:
        return 'Bad gateway. Please try again later.';
      
      case 503:
        return 'Service unavailable. Please try again later.';
      
      case 504:
        return 'Gateway timeout. Please try again.';
      
      default:
        return serverMessage ?? 'An error occurred. Please try again.';
    }
  }

  /// Check if error is authentication related
  static bool isAuthError(dynamic error) {
    if (error is DioException) {
      return error.response?.statusCode == 401;
    }
    return false;
  }

  /// Check if error is network related
  static bool isNetworkError(dynamic error) {
    if (error is SocketException) {
      return true;
    }
    if (error is DioException) {
      return error.type == DioExceptionType.connectionError ||
             error.type == DioExceptionType.connectionTimeout ||
             error.error is SocketException;
    }
    return false;
  }

  /// Check if error is retryable
  static bool isRetryable(dynamic error) {
    if (isNetworkError(error)) {
      return true;
    }
    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      // Retry on server errors (5xx) and timeout errors
      return statusCode != null && statusCode >= 500 ||
             error.type == DioExceptionType.sendTimeout ||
             error.type == DioExceptionType.receiveTimeout;
    }
    return false;
  }
}
