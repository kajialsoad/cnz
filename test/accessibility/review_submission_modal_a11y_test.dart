import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/review_submission_modal.dart';

/// Accessibility Tests for ReviewSubmissionModal Widget
/// Tests Flutter Semantics and accessibility compliance
void main() {
  group('ReviewSubmissionModal - Accessibility Tests', () {
    testWidgets('should have proper semantic structure', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Verify modal has proper semantics
      expect(
        tester.getSemantics(find.byType(ReviewSubmissionModal)),
        matchesSemantics(
          children: [
            matchesSemantics(label: 'Submit Review'),
            matchesSemantics(label: 'How satisfied are you?'),
            matchesSemantics(label: 'Rating'),
            matchesSemantics(label: 'Comment'),
          ],
        ),
      );

      handle.dispose();
    });

    testWidgets('should have accessible star rating', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Find star rating buttons
      final starFinder = find.byIcon(Icons.star);
      expect(starFinder, findsNWidgets(5));

      // Each star should have semantic label
      for (int i = 0; i < 5; i++) {
        final starSemantics = tester.getSemantics(starFinder.at(i));
        expect(starSemantics.label, contains('star'));
        expect(starSemantics.hasAction(SemanticsAction.tap), isTrue);
      }

      handle.dispose();
    });

    testWidgets('should announce rating value changes', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Tap 4th star
      await tester.tap(find.byIcon(Icons.star).at(3));
      await tester.pump();

      // Rating value should be announced
      final ratingText = find.text('4 stars');
      expect(ratingText, findsOneWidget);

      handle.dispose();
    });

    testWidgets('should have labeled text field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Find text field
      final textFieldFinder = find.byType(TextField);
      final textFieldSemantics = tester.getSemantics(textFieldFinder);

      expect(textFieldSemantics.label, isNotEmpty);
      expect(textFieldSemantics.hasAction(SemanticsAction.setText), isTrue);

      handle.dispose();
    });

    testWidgets('should announce character count', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Enter text
      await tester.enterText(find.byType(TextField), 'Great service');
      await tester.pump();

      // Character counter should be visible
      final counterText = find.textContaining('/300');
      expect(counterText, findsOneWidget);

      handle.dispose();
    });

    testWidgets('should have accessible submit button', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Find submit button
      final submitButton = find.text('Submit Review');
      final buttonSemantics = tester.getSemantics(submitButton);

      expect(buttonSemantics.hasAction(SemanticsAction.tap), isTrue);
      expect(buttonSemantics.isButton, isTrue);

      handle.dispose();
    });

    testWidgets('should announce validation errors', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Try to submit without rating
      await tester.tap(find.text('Submit Review'));
      await tester.pump();

      // Error message should be announced
      final errorFinder = find.textContaining('Please select a rating');
      expect(errorFinder, findsOneWidget);

      // Error should have live region semantics
      final errorSemantics = tester.getSemantics(errorFinder);
      expect(errorSemantics.label, isNotEmpty);

      handle.dispose();
    });

    testWidgets('should support keyboard navigation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Verify focusable elements
      final focusableNodes = tester.nodeList(
        find.byWidgetPredicate((widget) => 
          widget is Semantics && widget.properties.isFocusable == true
        )
      );

      expect(focusableNodes.length, greaterThanOrEqualTo(6)); // 5 stars + text field + button

      handle.dispose();
    });

    testWidgets('should have minimum touch targets', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      // Check star button sizes
      final starFinder = find.byIcon(Icons.star).first;
      final starSize = tester.getSize(starFinder);

      expect(starSize.width, greaterThanOrEqualTo(48.0));
      expect(starSize.height, greaterThanOrEqualTo(48.0));

      // Check submit button size
      final submitButton = find.text('Submit Review');
      final buttonSize = tester.getSize(submitButton);

      expect(buttonSize.height, greaterThanOrEqualTo(48.0));
    });

    testWidgets('should work with large text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(textScaleFactor: 2.0),
            child: Scaffold(
              body: ReviewSubmissionModal(
                complaintId: 1,
                onSubmit: (rating, comment) {},
              ),
            ),
          ),
        ),
      );

      // Should render without overflow
      expect(tester.takeException(), isNull);
    });

    testWidgets('should support screen reader gestures', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReviewSubmissionModal(
              complaintId: 1,
              onSubmit: (rating, comment) {},
            ),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Modal should support dismiss gesture
      final modalSemantics = tester.getSemantics(find.byType(ReviewSubmissionModal));
      expect(modalSemantics.hasAction(SemanticsAction.dismiss), isTrue);

      handle.dispose();
    });
  });
}
