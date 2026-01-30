import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/gallery_image_model.dart';

class GalleryService {
  final String baseUrl = '${ApiConfig.baseUrl}/api/gallery';

  // Get all active gallery images
  Future<List<GalleryImage>> getActiveImages(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/images'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => GalleryImage.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load gallery images: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching gallery images: $e');
    }
  }

  // Get image by ID
  Future<GalleryImage> getImageById(String token, int imageId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/images/$imageId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return GalleryImage.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load image: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching image: $e');
    }
  }
}
