import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';
import 'package:clean_care_mobile_app/config/api_config.dart';

/// Automated tests for image loading functionality
/// These tests verify the image URL parsing and helper methods
void main() {
  group('Image URL Parsing Tests', () {
    test('Parse comma-separated image URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'image1.jpg,image2.jpg,image3.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 3);
      expect(complaint.imageUrls[0], 'image1.jpg');
      expect(complaint.imageUrls[1], 'image2.jpg');
      expect(complaint.imageUrls[2], 'image3.jpg');
    });

    test('Parse JSON array image URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrls': '["image1.jpg", "image2.jpg"]',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 2);
      expect(complaint.imageUrls[0], 'image1.jpg');
      expect(complaint.imageUrls[1], 'image2.jpg');
    });

    test('Parse single image URL', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'single-image.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 1);
      expect(complaint.imageUrls[0], 'single-image.jpg');
    });

    test('Handle null image URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': null,
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 0);
      expect(complaint.imageUrls, isEmpty);
    });

    test('Handle empty string image URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': '',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 0);
      expect(complaint.imageUrls, isEmpty);
    });

    test('Parse imageUrls field (array)', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrls': ['image1.jpg', 'image2.jpg'],
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 2);
      expect(complaint.imageUrls[0], 'image1.jpg');
      expect(complaint.imageUrls[1], 'image2.jpg');
    });

    test('Trim whitespace from comma-separated URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'image1.jpg , image2.jpg , image3.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.imageUrls.length, 3);
      expect(complaint.imageUrls[0], 'image1.jpg');
      expect(complaint.imageUrls[1], 'image2.jpg');
      expect(complaint.imageUrls[2], 'image3.jpg');
    });
  });

  group('Audio URL Parsing Tests', () {
    test('Parse voiceNoteUrl field', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'voiceNoteUrl': 'audio.mp3',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.audioUrls.length, 1);
      expect(complaint.audioUrls[0], 'audio.mp3');
    });

    test('Parse audioUrl field', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'audioUrl': 'audio.mp3',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.audioUrls.length, 1);
      expect(complaint.audioUrls[0], 'audio.mp3');
    });

    test('Parse audioUrls array', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'audioUrls': ['audio1.mp3', 'audio2.mp3'],
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.audioUrls.length, 2);
      expect(complaint.audioUrls[0], 'audio1.mp3');
      expect(complaint.audioUrls[1], 'audio2.mp3');
    });

    test('Handle null audio URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'voiceNoteUrl': null,
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.audioUrls.length, 0);
      expect(complaint.audioUrls, isEmpty);
    });

    test('Handle empty string audio URLs', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'voiceNoteUrl': '',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.audioUrls.length, 0);
      expect(complaint.audioUrls, isEmpty);
    });
  });

  group('Complaint Helper Methods Tests', () {
    test('thumbnailUrl returns first image', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'image1.jpg,image2.jpg,image3.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.thumbnailUrl, 'image1.jpg');
    });

    test('thumbnailUrl returns null when no images', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.thumbnailUrl, isNull);
    });

    test('hasMedia returns true when images exist', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'image1.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.hasMedia, isTrue);
    });

    test('hasMedia returns true when audio exists', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'voiceNoteUrl': 'audio.mp3',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.hasMedia, isTrue);
    });

    test('hasMedia returns false when no media', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.hasMedia, isFalse);
    });
  });

  group('API Configuration Tests', () {
    test('ApiConfig baseUrl is not empty', () {
      expect(ApiConfig.baseUrl, isNotEmpty);
    });

    test('ApiConfig baseUrl starts with http', () {
      expect(ApiConfig.baseUrl.startsWith('http'), isTrue);
    });

    test('ApiConfig timeout is reasonable', () {
      expect(ApiConfig.timeout.inSeconds, greaterThanOrEqualTo(10));
      expect(ApiConfig.timeout.inSeconds, lessThanOrEqualTo(60));
    });
  });

  group('Image URL Construction Tests', () {
    test('Relative URL should be converted to absolute', () {
      final relativeUrl = 'uploads/complaints/image.jpg';
      final expectedUrl = '${ApiConfig.baseUrl}$relativeUrl';
      
      // This simulates the _getFullImageUrl method
      String getFullImageUrl(String imageUrl) {
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        return '${ApiConfig.baseUrl}$imageUrl';
      }

      final result = getFullImageUrl(relativeUrl);
      expect(result, expectedUrl);
      expect(result.startsWith('http'), isTrue);
    });

    test('Absolute URL should remain unchanged', () {
      final absoluteUrl = 'http://example.com/image.jpg';
      
      String getFullImageUrl(String imageUrl) {
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        return '${ApiConfig.baseUrl}$imageUrl';
      }

      final result = getFullImageUrl(absoluteUrl);
      expect(result, absoluteUrl);
    });

    test('URL with leading slash should work', () {
      final urlWithSlash = '/uploads/complaints/image.jpg';
      
      String getFullImageUrl(String imageUrl) {
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        return '${ApiConfig.baseUrl}$imageUrl';
      }

      final result = getFullImageUrl(urlWithSlash);
      expect(result, '${ApiConfig.baseUrl}$urlWithSlash');
      expect(result.startsWith('http'), isTrue);
    });
  });

  group('Nested Response Parsing Tests', () {
    test('Parse complaint from nested response', () {
      final json = {
        'complaint': {
          'id': 1,
          'title': 'Test',
          'description': 'Test description',
          'category': 'test',
          'urgencyLevel': 'medium',
          'location': 'Test location',
          'status': 'PENDING',
          'userId': 1,
          'imageUrl': 'image1.jpg,image2.jpg',
          'priority': 1,
          'createdAt': DateTime.now().toIso8601String(),
          'updatedAt': DateTime.now().toIso8601String(),
        }
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.id, '1');
      expect(complaint.title, 'Test');
      expect(complaint.imageUrls.length, 2);
    });

    test('Parse complaint from direct response', () {
      final json = {
        'id': 1,
        'title': 'Test',
        'description': 'Test description',
        'category': 'test',
        'urgencyLevel': 'medium',
        'location': 'Test location',
        'status': 'PENDING',
        'userId': 1,
        'imageUrl': 'image1.jpg',
        'priority': 1,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final complaint = Complaint.fromJson(json);

      expect(complaint.id, '1');
      expect(complaint.title, 'Test');
      expect(complaint.imageUrls.length, 1);
    });
  });
}
