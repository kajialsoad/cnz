import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/officer_review_model.dart';
import '../config/api_config.dart';

class OfficerReviewService {
  static Future<List<OfficerReview>> getActiveReviews() async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/api/officer-reviews/active');
      
      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => OfficerReview.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load officer reviews: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching officer reviews: $e');
      rethrow;
    }
  }
}
