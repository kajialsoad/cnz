import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../models/complaint.dart';
import '../services/api_client.dart';

class ComplaintRepository {
  final ApiClient _apiClient;

  ComplaintRepository(this._apiClient);

  /// Create a new complaint with optional file uploads
  Future<Complaint> createComplaint({
    required String description,
    String? category,  // NEW: Category parameter
    String? subcategory,  // NEW: Subcategory parameter
    String? address,
    String? district,
    String? thana,
    String? ward,
    List<XFile>? images, // Changed to XFile for web compatibility
    List<File>? audioFiles,
  }) async {
    try {
      // Debug logging
      print('Creating complaint with:');
      print('- description: $description');
      print('- category: $category');  // NEW: Log category
      print('- subcategory: $subcategory');  // NEW: Log subcategory
      print('- address: $address (length: ${address?.length ?? 0})');
      print('- district: $district');
      print('- thana: $thana');
      print('- ward: $ward');
      
      // Construct location object from address components
      final locationData = {
        'address': address ?? '',
        'district': district ?? '',
        'thana': thana ?? '',
        'ward': ward ?? '',
      };

      // Build data map
      final data = <String, dynamic>{
        'description': description,
        // Send location as nested object using bracket notation for multipart form
        'location[address]': locationData['address'],
        'location[district]': locationData['district'],
        'location[thana]': locationData['thana'],
        'location[ward]': locationData['ward'],
      };

      // NEW: Add category and subcategory if provided
      if (category != null && category.isNotEmpty) {
        data['category'] = category;
      }
      if (subcategory != null && subcategory.isNotEmpty) {
        data['subcategory'] = subcategory;
      }

      final response = await _apiClient.postMultipart(
        '/api/complaints',
        data: data,
        files: [
          ...?images?.map((file) => MapEntry('images', file)),
          ...?audioFiles?.map((file) => MapEntry('audioFiles', file)),
        ],
      );

      if (response['success'] == true) {
        return Complaint.fromJson(response['data']);
      } else {
        // NEW: Better error message handling
        final errorMessage = response['message'] ?? 'Failed to create complaint';
        throw Exception(errorMessage);
      }
    } catch (e) {
      // Check error type and provide user-friendly messages
      final errorString = e.toString();
      
      // Ward image limit error
      if (errorString.contains('WARD_IMAGE_LIMIT_EXCEEDED') || 
          errorString.contains('Image upload limit reached')) {
        throw Exception('আপনার ওয়ার্ডের জন্য ছবি আপলোডের সীমা পৌঁছে গেছে। প্রতি ওয়ার্ডে শুধুমাত্র ১টি ছবি আপলোড করা যায়।\n\nImage upload limit reached for your ward. Only 1 image allowed per ward.');
      }
      
      // Category validation errors
      if (errorString.contains('Invalid category') || 
          errorString.contains('category') && errorString.contains('invalid')) {
        throw Exception('Invalid category selected. Please select a valid category.');
      } else if (errorString.contains('Invalid subcategory') || 
                 errorString.contains('subcategory') && errorString.contains('invalid')) {
        throw Exception('Invalid subcategory selected. Please select a valid subcategory.');
      } else if (errorString.contains('category') && errorString.contains('required')) {
        throw Exception('Please select a category before submitting your complaint.');
      }
      
      // Re-throw the original exception if not handled above
      rethrow;
    }
  }

  /// Get all complaints for the current user
  /// Endpoint: GET /api/complaints
  /// Returns list of complaints with pagination
  Future<List<Complaint>> getMyComplaints({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      
      // Build URL with query parameters
      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final url = '/api/complaints?$queryString';
      
      final response = await _apiClient.get(url);
      
      if (response['success'] == true) {
        // Backend returns complaints in data.complaints array
        final data = response['data'];
        final List<dynamic> complaintsJson = data['complaints'] ?? [];
        
        // Log pagination info for debugging
        if (data['pagination'] != null) {
          print('Pagination: ${data['pagination']}');
        }
        
        return complaintsJson.map((json) => Complaint.fromJson(json)).toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch complaints');
      }
    } catch (e) {
      throw Exception('Error fetching complaints: ${e.toString()}');
    }
  }

  /// Get a specific complaint by ID
  /// Endpoint: GET /api/complaints/:id
  /// Returns single complaint with full details
  Future<Complaint> getComplaint(String id) async {
    try {
      final response = await _apiClient.get('/api/complaints/$id');
      
      if (response['success'] == true) {
        // Backend returns complaint in data.complaint object
        final data = response['data'];
        final complaintData = data['complaint'] ?? data;
        return Complaint.fromJson(complaintData);
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch complaint');
      }
    } catch (e) {
      throw Exception('Error fetching complaint: ${e.toString()}');
    }
  }

  /// Update an existing complaint
  Future<Complaint> updateComplaint({
    required String id,
    String? title,
    String? description,
    String? category,
    String? urgencyLevel,
    String? location,
    String? address,
    String? status,
    List<XFile>? newImages, // Changed to XFile for web compatibility
    List<File>? newAudioFiles,
    List<String>? removeImageUrls,
    List<String>? removeAudioUrls,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (description != null) data['description'] = description;
      if (category != null) data['category'] = category;
      if (urgencyLevel != null) data['urgencyLevel'] = urgencyLevel;
      if (location != null) data['location'] = location;
      if (address != null) data['address'] = address;
      if (status != null) data['status'] = status;
      if (removeImageUrls != null && removeImageUrls.isNotEmpty) {
        data['removeImageUrls'] = removeImageUrls.join(',');
      }
      if (removeAudioUrls != null && removeAudioUrls.isNotEmpty) {
        data['removeAudioUrls'] = removeAudioUrls.join(',');
      }

      final response = await _apiClient.putMultipart(
        '/api/complaints/$id',
        data: data,
        files: [
          ...?newImages?.map((file) => MapEntry('images', file)),
          ...?newAudioFiles?.map((file) => MapEntry('audioFiles', file)),
        ],
      );

      if (response['success'] == true) {
        return Complaint.fromJson(response['data']);
      } else {
        throw Exception(response['message'] ?? 'Failed to update complaint');
      }
    } catch (e) {
      throw Exception('Error updating complaint: ${e.toString()}');
    }
  }

  /// Delete a complaint
  Future<void> deleteComplaint(String id) async {
    try {
      final response = await _apiClient.delete('/api/complaints/$id');
      
      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to delete complaint');
      }
    } catch (e) {
      throw Exception('Error deleting complaint: ${e.toString()}');
    }
  }

  /// Upload additional files to existing complaint
  Future<List<String>> uploadFiles({
    required String complaintId,
    List<File>? images,
    List<File>? audioFiles,
  }) async {
    try {
      final response = await _apiClient.postMultipart(
        '/api/complaints/$complaintId/upload',
        files: [
          ...?images?.map((file) => MapEntry('images', file)),
          ...?audioFiles?.map((file) => MapEntry('audioFiles', file)),
        ],
      );

      if (response['success'] == true) {
        final List<dynamic> fileUrls = response['data']['fileUrls'];
        return fileUrls.cast<String>();
      } else {
        throw Exception(response['message'] ?? 'Failed to upload files');
      }
    } catch (e) {
      throw Exception('Error uploading files: ${e.toString()}');
    }
  }

  /// Delete specific files from complaint
  Future<void> deleteFiles({
    required String complaintId,
    List<String>? imageUrls,
    List<String>? audioUrls,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (imageUrls != null && imageUrls.isNotEmpty) {
        data['imageUrls'] = imageUrls.join(',');
      }
      if (audioUrls != null && audioUrls.isNotEmpty) {
        data['audioUrls'] = audioUrls.join(',');
      }

      if (data.isEmpty) {
        throw Exception('No files specified for deletion');
      }

      final response = await _apiClient.delete(
        '/api/complaints/$complaintId/files',
        data: data,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to delete files');
      }
    } catch (e) {
      throw Exception('Error deleting files: ${e.toString()}');
    }
  }
}