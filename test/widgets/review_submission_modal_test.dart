import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:clean_care_mobile_app/widgets/review_submission_modal.dart';
import 'package:clean_care_mobile_app/providers/review_provider.dart';
import 'package:clean_care_mobile_app/providers/language_provider.dart';
import 'package:clean_care_mobile_app/models/review_model.dart';

// Mock ReviewProvider for testing
class MockReviewProvider extends ChangeNotifier implements ReviewProvider {
  bool shouldFail = false;
  int? submittedRating;
  String? submittedComment;
  int? submittedComplaintId;

  @override
  ReviewModel? get currentReview => null;

  @override
  List<ReviewModel> get reviews => [];

  @override
  bool get loading => false;

  @override
  String? get error => null;

  @override
  bool get submitting => false;

  @override
  Future<ReviewModel> submitReview({
    required int complaintId,
    required int rating,
    String? comment,
  }) async {
    if (shouldFail) {
      throw Exception('Failed to submit review');
    }

    submittedComplaintId = complaintId;
    submittedRating = rating;
    submittedComment = comment;

    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 100));

    // Return a mock ReviewModel
    return ReviewModel(
      id: 1,
      complaintId: complaintId,
      userId: 1,
      rating: rating,
      comment: comment,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<ReviewModel?> getReview(int complaintId) async {
    return null;
  }

  @override
  Future<List<ReviewModel>> getReviews(int complaintId) async {
    return [];
  }

  @override
  Future<bool> hasReview(int complaintId) async {
    return false;
  }

  @override
  void clearCurrentReview() {}

  @override
  void clearReviews() {}

  @override
  void clearError() {}

  @override
  void reset() {}
}

void main() {
  group('ReviewSubmissionModal Widget Tests', () {
    late MockReviewProvider mockReviewProvider;

    setUp(() {
      mockReviewProvider = MockReviewProvider();
    });

    Widget createTestWidget({VoidCallback? onSuccess}) {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<ReviewProvider>.value(
            value: mockReviewProvider,
          ),
          ChangeNotifierProvider(
            create: (_) => LanguageProvider(),
          ),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  showReviewSubmissionModal(
                    context,
                    complaintId: 123,
                    onSuccess: onSuccess,
                  );
                },
                child: const Text('Open Modal'),
              ),
            ),
          ),
        ),
      );
    }

    testWidgets('Modal opens and displays correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Verify modal is displayed
      expect(find.text('Submit Review'), findsOneWidget);
      expect(find.text('রিভিউ জমা দিন'), findsOneWidget);
      expect(find.text('How satisfied are you?'), findsOneWidget);
      expect(find.text('আপনি কতটা সন্তুষ্ট?'), findsOneWidget);
      expect(find.text('Comments (Optional)'), findsOneWidget);
      expect(find.text('মন্তব্য (ঐচ্ছিক)'), findsOneWidget);
    });

    testWidgets('Modal closes when close button is tapped', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Verify modal is open
      expect(find.text('Submit Review'), findsOneWidget);

      // Tap close button
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      // Verify modal is closed
      expect(find.text('Submit Review'), findsNothing);
    });

    testWidgets('Star rating selector works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Initially no stars should be filled
      expect(find.byIcon(Icons.star), findsNothing);
      expect(find.byIcon(Icons.star_border), findsNWidgets(5));

      // Tap on the 3rd star
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.at(2));
      await tester.pumpAndSettle();

      // Verify 3 stars are filled
      expect(find.byIcon(Icons.star), findsNWidgets(3));
      expect(find.byIcon(Icons.star_border), findsNWidgets(2));

      // Tap on the 5th star
      await tester.tap(starBorders.at(4));
      await tester.pumpAndSettle();

      // Verify all 5 stars are filled
      expect(find.byIcon(Icons.star), findsNWidgets(5));
      expect(find.byIcon(Icons.star_border), findsNothing);
    });

    testWidgets('Character counter updates correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Initially should show 0/300
      expect(find.text('0/300'), findsOneWidget);

      // Enter some text
      await tester.enterText(find.byType(TextField), 'Great service!');
      await tester.pumpAndSettle();

      // Should show 14/300
      expect(find.text('14/300'), findsOneWidget);

      // Enter more text
      await tester.enterText(
        find.byType(TextField),
        'A' * 250,
      );
      await tester.pumpAndSettle();

      // Should show 250/300
      expect(find.text('250/300'), findsOneWidget);
    });

    testWidgets('Validation prevents submission without rating', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Try to submit without selecting rating
      await tester.tap(find.text('Submit Review').last);
      await tester.pumpAndSettle();

      // Should show error message
      expect(find.text('Please select a rating'), findsOneWidget);

      // Modal should still be open
      expect(find.text('How satisfied are you?'), findsOneWidget);
    });

    testWidgets('Validation prevents submission with comment over 300 chars', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select a rating
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.first);
      await tester.pumpAndSettle();

      // Enter text over 300 characters
      await tester.enterText(find.byType(TextField), 'A' * 301);
      await tester.pumpAndSettle();

      // Try to submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pumpAndSettle();

      // Should show error message
      expect(find.text('Comment must be 300 characters or less'), findsOneWidget);
    });

    testWidgets('Successfully submits review with rating only', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select 4 stars
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.at(3));
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pump(); // Start submission
      await tester.pump(const Duration(milliseconds: 100)); // Wait for async operation
      await tester.pumpAndSettle();

      // Verify submission
      expect(mockReviewProvider.submittedComplaintId, 123);
      expect(mockReviewProvider.submittedRating, 4);
      expect(mockReviewProvider.submittedComment, null);

      // Should show success message
      expect(
        find.text('Review submitted successfully! / রিভিউ সফলভাবে জমা হয়েছে!'),
        findsOneWidget,
      );

      // Modal should be closed
      await tester.pumpAndSettle();
      expect(find.text('How satisfied are you?'), findsNothing);
    });

    testWidgets('Successfully submits review with rating and comment', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select 5 stars
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.at(4));
      await tester.pumpAndSettle();

      // Enter comment
      await tester.enterText(find.byType(TextField), 'Excellent work!');
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Verify submission
      expect(mockReviewProvider.submittedComplaintId, 123);
      expect(mockReviewProvider.submittedRating, 5);
      expect(mockReviewProvider.submittedComment, 'Excellent work!');
    });

    testWidgets('Shows loading state during submission', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select rating
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.first);
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pump();

      // Should show loading indicator
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Button should be disabled
      final submitButton = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Submit Review').last,
      );
      expect(submitButton.onPressed, null);
    });

    testWidgets('Handles submission error correctly', (WidgetTester tester) async {
      mockReviewProvider.shouldFail = true;

      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select rating
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.first);
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Should show error message
      expect(find.textContaining('Exception: Failed to submit review'), findsOneWidget);

      // Modal should still be open
      expect(find.text('How satisfied are you?'), findsOneWidget);
    });

    testWidgets('Calls onSuccess callback after successful submission', (WidgetTester tester) async {
      bool callbackCalled = false;

      await tester.pumpWidget(createTestWidget(
        onSuccess: () {
          callbackCalled = true;
        },
      ));

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select rating
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.first);
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.text('Submit Review').last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Verify callback was called
      expect(callbackCalled, true);
    });

    testWidgets('Star animation works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Find AnimatedScale widgets
      final animatedScales = find.byType(AnimatedScale);
      expect(animatedScales, findsNWidgets(5));

      // Tap on a star
      final starBorders = find.byIcon(Icons.star_border);
      await tester.tap(starBorders.at(2));
      await tester.pump();

      // Animation should be in progress
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Verify stars are updated
      expect(find.byIcon(Icons.star), findsNWidgets(3));
    });

    testWidgets('TextField respects max length', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Find TextField
      final textField = tester.widget<TextField>(find.byType(TextField));

      // Verify max length is set
      expect(textField.maxLength, 300);
      expect(textField.maxLines, 4);
    });

    testWidgets('Modal handles keyboard correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Tap on text field to show keyboard
      await tester.tap(find.byType(TextField));
      await tester.pumpAndSettle();

      // Modal should adjust for keyboard
      final container = tester.widget<Container>(
        find.ancestor(
          of: find.text('Submit Review'),
          matching: find.byType(Container),
        ).first,
      );

      // Verify padding is applied for keyboard
      expect(container.padding, isNotNull);
    });
  });
}
