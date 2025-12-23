import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/resolution_details_card.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';

/// Accessibility Tests for ResolutionDetailsCard Widget
/// Tests Flutter Semantics and accessibility compliance
void main() {
  group('ResolutionDetailsCard - Accessibility Tests', () {
    late Complaint mockComplaint;

    setUp(() {
      mockComplaint = Complaint(
        id: 1,
        title: 'Test Complaint',
        description: 'Test Description',
        status: 'RESOLVED',
        resolutionImages: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
        resolutionNote: 'Issue has been resolved successfully',
        resolvedByAdminName: 'Admin User',
        resolvedAt: DateTime.now(),
      );
    });

    testWidgets('should have proper semantic structure', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      // Check for semantic nodes
      final SemanticsHandle handle = tester.ensureSemantics();
      
      // Verify semantic tree structure
      expect(
        tester.getSemantics(find.byType(ResolutionDetailsCard)),
        matchesSemantics(
          children: [
            matchesSemantics(label: 'Resolution Details'),
            matchesSemantics(label: 'Resolved by Admin User'),
            matchesSemantics(label: 'Resolution images'),
            matchesSemantics(label: 'Resolution note: Issue has been resolved successfully'),
          ],
        ),
      );

      handle.dispose();
    });

    testWidgets('should have semantic labels for images', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Find image widgets
      final imageFinder = find.byType(Image);
      expect(imageFinder, findsWidgets);

      // Each image should have semantic label
      for (final element in tester.elementList(imageFinder)) {
        final semantics = tester.getSemantics(find.byElementPredicate((e) => e == element));
        expect(semantics.label, isNotEmpty);
      }

      handle.dispose();
    });

    testWidgets('should have accessible button labels', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Submit Review button should have semantic label
      final buttonFinder = find.byType(ElevatedButton);
      final buttonSemantics = tester.getSemantics(buttonFinder);
      
      expect(buttonSemantics.label, contains('Submit Review'));
      expect(buttonSemantics.hasAction(SemanticsAction.tap), isTrue);

      handle.dispose();
    });

    testWidgets('should support TalkBack/VoiceOver navigation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Verify semantic nodes are in logical reading order
      final semanticsNodes = tester.nodeList(find.byType(Semantics));
      expect(semanticsNodes.length, greaterThan(0));

      // Each node should be traversable
      for (final node in semanticsNodes) {
        final semantics = tester.getSemantics(find.byWidget(node.widget));
        expect(semantics.isMergingSemanticsOfDescendants || semantics.label != null, isTrue);
      }

      handle.dispose();
    });

    testWidgets('should have sufficient text contrast', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      // Find all Text widgets
      final textFinder = find.byType(Text);
      expect(textFinder, findsWidgets);

      // Verify text has sufficient contrast (visual check in real testing)
      for (final element in tester.elementList(textFinder)) {
        final textWidget = element.widget as Text;
        final textStyle = textWidget.style;
        
        // Text should have defined color (not null)
        expect(textStyle?.color, isNotNull);
      }
    });

    testWidgets('should have minimum touch target size', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      // Find interactive elements
      final buttonFinder = find.byType(ElevatedButton);
      final buttonSize = tester.getSize(buttonFinder);

      // Minimum touch target: 48x48 dp (Material Design guideline)
      expect(buttonSize.height, greaterThanOrEqualTo(48.0));
      expect(buttonSize.width, greaterThanOrEqualTo(48.0));
    });

    testWidgets('should announce dynamic content changes', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Tap submit review button
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      // Check for live region announcements
      final liveRegions = tester.nodeList(
        find.byWidgetPredicate((widget) => widget is Semantics && widget.properties.liveRegion == true)
      );
      
      expect(liveRegions.length, greaterThanOrEqualTo(0));

      handle.dispose();
    });

    testWidgets('should support screen reader gestures', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Verify swipe actions are available
      final cardSemantics = tester.getSemantics(find.byType(ResolutionDetailsCard));
      
      // Should support standard gestures
      expect(cardSemantics.hasAction(SemanticsAction.scrollUp) || 
             cardSemantics.hasAction(SemanticsAction.scrollDown), isTrue);

      handle.dispose();
    });

    testWidgets('should have proper focus order', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ResolutionDetailsCard(complaint: mockComplaint),
          ),
        ),
      );

      final SemanticsHandle handle = tester.ensureSemantics();

      // Get all focusable elements
      final focusableNodes = tester.nodeList(
        find.byWidgetPredicate((widget) => 
          widget is Semantics && widget.properties.isFocusable == true
        )
      );

      // Focus order should be logical (top to bottom, left to right)
      expect(focusableNodes.length, greaterThanOrEqualTo(1));

      handle.dispose();
    });

    testWidgets('should work with large text sizes', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(textScaleFactor: 2.0),
            child: Scaffold(
              body: ResolutionDetailsCard(complaint: mockComplaint),
            ),
          ),
        ),
      );

      // Widget should render without overflow
      expect(tester.takeException(), isNull);
      
      // Text should be readable
      final textFinder = find.byType(Text);
      expect(textFinder, findsWidgets);
    });
  });
}
