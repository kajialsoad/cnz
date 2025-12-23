import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/notification_model.dart';
import 'package:clean_care_mobile_app/models/notification_metadata.dart';
import 'package:clean_care_mobile_app/models/review_model.dart';
import 'package:clean_care_mobile_app/services/notification_service.dart';

/// Integration Tests for Admin Complaint Status Enhancement
/// 
/// Task 4.2: Mobile App Integration Tests
/// Feature: Enhanced Complaint Status Management
/// 
/// Tests complete user flows without UI dependencies

void main() {
  group('Notification Service Integration Tests', () {
    test('NotificationModel can be created from JSON', () {
      final json = {
        'id': 1,
        'title': 'Test Notification',
        'message': 'Test message',
        'type': 'STATUS_CHANGE',
        'isRead': false,
        'complaintId': 123,
        'statusChange': 'PENDING_TO_IN_PROGRESS',
        'metadata': {
          'resolutionImages': 'https://example.com/image.jpg',
          'resolutionNote': 'Fixed',
        },
        'createdAt': DateTime.now().toIso8601String(),
      };

      final notification = NotificationModel.fromJson(json);

      expect(notification.id, equals(1));
      expect(notification.title, equals('Test Notification'));
      expect(notification.type, equals('STATUS_CHANGE'));
      expect(notification.isRead, equals(false));
      expect(notification.complaintId, equals(123));
      expect(notification.metadata, isNotNull);
      expect(notification.metadata!.resolutionImages, contains('image.jpg'));
    });

    test('NotificationModel can be converted to JSON', () {
      final notification = NotificationModel(
        id: 1,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: DateTime.now(),
      );

      final json = notification.toJson();

      expect(json['id'], equals(1));
      expect(json['title'], equals('Test'));
      expect(json['type'], equals('INFO'));
      expect(json['isRead'], equals(false));
    });

    test('NotificationMetadata parses resolution images correctly', () {
      final metadata = NotificationMetadata(
        resolutionImages: 'https://example.com/img1.jpg,https://example.com/img2.jpg',
        resolutionNote: 'Fixed successfully',
      );

      expect(metadata.hasResolutionImages, isTrue);
      expect(metadata.resolutionImageUrls.length, equals(2));
      expect(metadata.resolutionImageUrls[0], contains('img1.jpg'));
      expect(metadata.resolutionImageUrls[1], contains('img2.jpg'));
    });

    test('NotificationResponse can be parsed from API response', () {
      final json = {
        'notifications': [
          {
            'id': 1,
            'title': 'Test',
            'message': 'Message',
            'type': 'INFO',
            'isRead': false,
            'createdAt': DateTime.now().toIso8601String(),
          }
        ],
        'pagination': {
          'page': 1,
          'limit': 20,
          'total': 1,
          'totalPages': 1,
        },
        'unreadCount': 1,
      };

      final response = NotificationResponse.fromJson(json);

      expect(response.notifications.length, equals(1));
      expect(response.unreadCount, equals(1));
      expect(response.pagination.page, equals(1));
      expect(response.pagination.hasNextPage, isFalse);
    });

    test('PaginationInfo calculates hasNextPage correctly', () {
      final pagination1 = PaginationInfo(
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      );

      expect(pagination1.hasNextPage, isTrue);
      expect(pagination1.hasPreviousPage, isFalse);

      final pagination2 = PaginationInfo(
        page: 3,
        limit: 20,
        total: 50,
        totalPages: 3,
      );

      expect(pagination2.hasNextPage, isFalse);
      expect(pagination2.hasPreviousPage, isTrue);
    });
  });

  group('Review Model Integration Tests', () {
    test('ReviewModel can be created from JSON', () {
      final json = {
        'id': 1,
        'complaintId': 123,
        'userId': 456,
        'rating': 5,
        'comment': 'Excellent service',
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final review = ReviewModel.fromJson(json);

      expect(review.id, equals(1));
      expect(review.complaintId, equals(123));
      expect(review.userId, equals(456));
      expect(review.rating, equals(5));
      expect(review.comment, equals('Excellent service'));
    });

    test('ReviewModel validates rating correctly', () {
      final validReview = ReviewModel(
        id: 1,
        complaintId: 123,
        userId: 456,
        rating: 5,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(validReview.isValidRating, isTrue);
      expect(validReview.ratingCategory, equals('Excellent'));

      final invalidReview = ReviewModel(
        id: 2,
        complaintId: 123,
        userId: 456,
        rating: 6,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(invalidReview.isValidRating, isFalse);
    });

    test('ReviewModel validates comment length correctly', () {
      final shortComment = ReviewModel(
        id: 1,
        complaintId: 123,
        userId: 456,
        rating: 5,
        comment: 'Good',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(shortComment.isValidCommentLength, isTrue);

      final longComment = 'A' * 301;
      final invalidReview = ReviewModel(
        id: 2,
        complaintId: 123,
        userId: 456,
        rating: 5,
        comment: longComment,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(invalidReview.isValidCommentLength, isFalse);
    });

    test('Rating utility class validates ratings correctly', () {
      expect(Rating.isValid(1), isTrue);
      expect(Rating.isValid(5), isTrue);
      expect(Rating.isValid(0), isFalse);
      expect(Rating.isValid(6), isFalse);

      expect(Rating.getCategory(5), equals('Excellent'));
      expect(Rating.getCategory(4), equals('Good'));
      expect(Rating.getCategory(3), equals('Average'));
      expect(Rating.getCategory(2), equals('Poor'));
      expect(Rating.getCategory(1), equals('Very Poor'));
    });

    test('ReviewComment utility validates comment length', () {
      expect(ReviewComment.isValidLength(null), isTrue);
      expect(ReviewComment.isValidLength(''), isTrue);
      expect(ReviewComment.isValidLength('Good service'), isTrue);
      expect(ReviewComment.isValidLength('A' * 300), isTrue);
      expect(ReviewComment.isValidLength('A' * 301), isFalse);

      expect(ReviewComment.getRemainingChars(null), equals(300));
      expect(ReviewComment.getRemainingChars('Hello'), equals(295));
      expect(ReviewComment.getRemainingChars('A' * 300), equals(0));
    });

    test('ReviewUser model works correctly', () {
      final json = {
        'id': 1,
        'firstName': 'John',
        'lastName': 'Doe',
        'avatar': 'https://example.com/avatar.jpg',
      };

      final user = ReviewUser.fromJson(json);

      expect(user.id, equals(1));
      expect(user.fullName, equals('John Doe'));
      expect(user.initials, equals('JD'));
      expect(user.avatar, contains('avatar.jpg'));
    });
  });

  group('Notification Type and Status Change Constants', () {
    test('NotificationType constants are defined', () {
      expect(NotificationType.info, equals('INFO'));
      expect(NotificationType.success, equals('SUCCESS'));
      expect(NotificationType.warning, equals('WARNING'));
      expect(NotificationType.error, equals('ERROR'));
      expect(NotificationType.statusChange, equals('STATUS_CHANGE'));

      expect(NotificationType.all.length, equals(5));
      expect(NotificationType.all, contains('INFO'));
      expect(NotificationType.all, contains('STATUS_CHANGE'));
    });

    test('StatusChange constants are defined', () {
      expect(StatusChange.pendingToInProgress, equals('PENDING_TO_IN_PROGRESS'));
      expect(StatusChange.inProgressToResolved, equals('IN_PROGRESS_TO_RESOLVED'));
      expect(StatusChange.pendingToOthers, equals('PENDING_TO_OTHERS'));

      expect(StatusChange.all.length, equals(8));
      expect(StatusChange.all, contains('PENDING_TO_IN_PROGRESS'));
      expect(StatusChange.all, contains('IN_PROGRESS_TO_RESOLVED'));
    });

    test('NotificationModel formats status change display correctly', () {
      final notification = NotificationModel(
        id: 1,
        title: 'Status Updated',
        message: 'Your complaint status changed',
        type: 'STATUS_CHANGE',
        isRead: false,
        statusChange: 'PENDING_TO_IN_PROGRESS',
        createdAt: DateTime.now(),
      );

      expect(notification.isStatusChange, isTrue);
      expect(notification.statusChangeDisplay, equals('Pending → In Progress'));
    });
  });

  group('Model Equality and Hashing', () {
    test('NotificationModel equality works correctly', () {
      final notification1 = NotificationModel(
        id: 1,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: DateTime.now(),
      );

      final notification2 = NotificationModel(
        id: 1,
        title: 'Different Title',
        message: 'Different Message',
        type: 'WARNING',
        isRead: true,
        createdAt: DateTime.now(),
      );

      final notification3 = NotificationModel(
        id: 2,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: DateTime.now(),
      );

      expect(notification1 == notification2, isTrue); // Same ID
      expect(notification1 == notification3, isFalse); // Different ID
      expect(notification1.hashCode, equals(notification2.hashCode));
      expect(notification1.hashCode, isNot(equals(notification3.hashCode)));
    });

    test('ReviewModel equality works correctly', () {
      final review1 = ReviewModel(
        id: 1,
        complaintId: 123,
        userId: 456,
        rating: 5,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final review2 = ReviewModel(
        id: 1,
        complaintId: 999,
        userId: 999,
        rating: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final review3 = ReviewModel(
        id: 2,
        complaintId: 123,
        userId: 456,
        rating: 5,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(review1 == review2, isTrue); // Same ID
      expect(review1 == review3, isFalse); // Different ID
      expect(review1.hashCode, equals(review2.hashCode));
      expect(review1.hashCode, isNot(equals(review3.hashCode)));
    });
  });

  group('Model CopyWith Methods', () {
    test('NotificationModel copyWith works correctly', () {
      final original = NotificationModel(
        id: 1,
        title: 'Original',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: DateTime.now(),
      );

      final updated = original.copyWith(
        title: 'Updated',
        isRead: true,
      );

      expect(updated.id, equals(original.id));
      expect(updated.title, equals('Updated'));
      expect(updated.message, equals(original.message));
      expect(updated.isRead, isTrue);
    });

    test('ReviewModel copyWith works correctly', () {
      final original = ReviewModel(
        id: 1,
        complaintId: 123,
        userId: 456,
        rating: 3,
        comment: 'Original comment',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updated = original.copyWith(
        rating: 5,
        comment: 'Updated comment',
      );

      expect(updated.id, equals(original.id));
      expect(updated.complaintId, equals(original.complaintId));
      expect(updated.rating, equals(5));
      expect(updated.comment, equals('Updated comment'));
    });

    test('NotificationMetadata copyWith works correctly', () {
      final original = NotificationMetadata(
        resolutionImages: 'image1.jpg',
        resolutionNote: 'Original note',
      );

      final updated = original.copyWith(
        resolutionNote: 'Updated note',
        adminName: 'Admin John',
      );

      expect(updated.resolutionImages, equals(original.resolutionImages));
      expect(updated.resolutionNote, equals('Updated note'));
      expect(updated.adminName, equals('Admin John'));
    });
  });

  group('Time Ago Formatting', () {
    test('NotificationModel formats time ago correctly', () {
      final now = DateTime.now();

      final justNow = NotificationModel(
        id: 1,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: now,
      );
      expect(justNow.timeAgo, equals('Just now'));

      final minutesAgo = NotificationModel(
        id: 2,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: now.subtract(const Duration(minutes: 5)),
      );
      expect(minutesAgo.timeAgo, equals('5 minutes ago'));

      final hoursAgo = NotificationModel(
        id: 3,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 2)),
      );
      expect(hoursAgo.timeAgo, equals('2 hours ago'));

      final daysAgo = NotificationModel(
        id: 4,
        title: 'Test',
        message: 'Message',
        type: 'INFO',
        isRead: false,
        createdAt: now.subtract(const Duration(days: 3)),
      );
      expect(daysAgo.timeAgo, equals('3 days ago'));
    });

    test('ReviewModel formats time ago correctly', () {
      final now = DateTime.now();

      final justNow = ReviewModel(
        id: 1,
        complaintId: 123,
        userId: 456,
        rating: 5,
        createdAt: now,
        updatedAt: now,
      );
      expect(justNow.timeAgo, equals('Just now'));

      final hoursAgo = ReviewModel(
        id: 2,
        complaintId: 123,
        userId: 456,
        rating: 5,
        createdAt: now.subtract(const Duration(hours: 3)),
        updatedAt: now,
      );
      expect(hoursAgo.timeAgo, equals('3 hours ago'));
    });
  });
}
