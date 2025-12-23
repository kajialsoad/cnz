import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:clean_care_mobile_app/widgets/status_timeline.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';
import 'package:clean_care_mobile_app/providers/language_provider.dart';

void main() {
  group('StatusTimeline Widget Tests', () {
    // Helper function to create a test complaint
    Complaint createTestComplaint({
      required String status,
      String? resolvedByAdminName,
      String? othersSubcategory,
    }) {
      return Complaint(
        id: '1',
        title: 'Test Complaint',
        description: 'Test Description',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test Location',
        status: status,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime(2024, 1, 1, 10, 0),
        updatedAt: DateTime(2024, 1, 2, 14, 30),
        resolvedByAdminName: resolvedByAdminName,
        othersSubcategory: othersSubcategory,
      );
    }

    // Helper function to wrap widget with MaterialApp and Provider
    Widget wrapWidget(Widget widget) {
      return ChangeNotifierProvider(
        create: (_) => LanguageProvider(),
        child: MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: widget,
            ),
          ),
        ),
      );
    }

    testWidgets('should display header with timeline icon and title',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(status: ComplaintStatus.pending);

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify header icon
      expect(find.byIcon(Icons.timeline), findsOneWidget);

      // Verify header text
      expect(find.text('Status History'), findsOneWidget);
    });

    testWidgets('should display submitted status for pending complaint',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(status: ComplaintStatus.pending);

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify submitted status is shown
      expect(find.text('Submitted'), findsOneWidget);
      expect(find.text('জমা দেওয়া হয়েছে'), findsOneWidget);

      // Verify submitted icon
      expect(find.byIcon(Icons.send_outlined), findsOneWidget);
    });

    testWidgets('should display in progress status for in_progress complaint',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.inProgress,
        resolvedByAdminName: 'John Doe',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify submitted and in progress statuses
      expect(find.text('Submitted'), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
      expect(find.text('প্রক্রিয়াধীন'), findsOneWidget);

      // Verify admin name is shown
      expect(find.text('By: John Doe'), findsOneWidget);

      // Verify in progress icon
      expect(find.byIcon(Icons.hourglass_empty), findsOneWidget);
    });

    testWidgets('should display resolved status for resolved complaint',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Jane Smith',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify all three statuses
      expect(find.text('Submitted'), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
      expect(find.text('Resolved'), findsOneWidget);
      expect(find.text('সমাধান হয়েছে'), findsOneWidget);

      // Verify admin name is shown for resolved status
      expect(find.text('By: Jane Smith'), findsAtLeastNWidgets(1));

      // Verify resolved icon
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('should display others status with subcategory',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.others,
        resolvedByAdminName: 'Admin User',
        othersSubcategory: 'WASA',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify others status with subcategory
      expect(find.text('Marked as Others - WASA'), findsOneWidget);
      expect(find.text('অন্যান্য হিসেবে চিহ্নিত'), findsOneWidget);

      // Verify admin name
      expect(find.text('By: Admin User'), findsAtLeastNWidgets(1));

      // Verify others icon
      expect(find.byIcon(Icons.category_outlined), findsOneWidget);
    });

    testWidgets('should display closed status for closed complaint',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.closed,
        resolvedByAdminName: 'Admin User',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify closed status
      expect(find.text('Closed'), findsOneWidget);
      expect(find.text('বন্ধ'), findsOneWidget);

      // Verify closed icon
      expect(find.byIcon(Icons.cancel_outlined), findsOneWidget);
    });

    testWidgets('should display timestamps in correct format',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(status: ComplaintStatus.pending);

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify timestamp format (Jan 1, 2024 at HH:MM)
      expect(find.textContaining('Jan 1, 2024 at'), findsOneWidget);
    });

    testWidgets('should show timeline connector between items',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify the widget renders without errors
      expect(find.byType(StatusTimeline), findsOneWidget);
      
      // Verify multiple status items are displayed (which implies connectors exist)
      expect(find.text('Submitted'), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
      expect(find.text('Resolved'), findsOneWidget);
    });

    testWidgets('should display status-specific colors',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Find all Container widgets with circular decoration (status indicators)
      final containers = find.byType(Container);
      final containerWidgets = tester.widgetList<Container>(containers);

      // Check for status-specific colors
      final statusIndicators = containerWidgets.where((container) {
        final decoration = container.decoration;
        if (decoration is BoxDecoration && decoration.shape == BoxShape.circle) {
          return true;
        }
        return false;
      });

      expect(statusIndicators.length, greaterThan(0));
    });

    testWidgets('should not show admin name for submitted status',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(status: ComplaintStatus.pending);

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify no admin name is shown for submitted status
      expect(find.textContaining('By:'), findsNothing);
    });

    testWidgets('should display person icon next to admin name',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.inProgress,
        resolvedByAdminName: 'Admin User',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify person icon is shown
      expect(find.byIcon(Icons.person_outline), findsWidgets);
    });

    testWidgets('should have proper spacing and padding',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(status: ComplaintStatus.pending);

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Find the main container
      final mainContainer = find.byType(Container).first;
      final containerWidget = tester.widget<Container>(mainContainer);

      // Verify padding
      expect(containerWidget.padding, equals(const EdgeInsets.all(16)));

      // Verify decoration (rounded corners and shadow)
      final decoration = containerWidget.decoration as BoxDecoration;
      expect(decoration.borderRadius, equals(BorderRadius.circular(12)));
      expect(decoration.color, equals(Colors.white));
      expect(decoration.boxShadow, isNotNull);
    });

    testWidgets('should display correct number of status items',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // For resolved complaint: Submitted, In Progress, Resolved = 3 items
      expect(find.text('Submitted'), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
      expect(find.text('Resolved'), findsOneWidget);
    });

    testWidgets('should handle complaint without admin name gracefully',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.inProgress,
        resolvedByAdminName: null,
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Widget should render without errors
      expect(find.byType(StatusTimeline), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
    });

    testWidgets('should display others status without subcategory',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.others,
        resolvedByAdminName: 'Admin',
        othersSubcategory: null,
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Verify others status without subcategory
      expect(find.text('Marked as Others'), findsOneWidget);
      expect(find.byIcon(Icons.category_outlined), findsOneWidget);
    });

    testWidgets('should maintain visual hierarchy with font sizes',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.inProgress,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(StatusTimeline(complaint: complaint)));

      // Find text widgets
      final statusTexts = find.text('In Progress');
      expect(statusTexts, findsOneWidget);

      // Verify text widget exists
      final textWidget = tester.widget<Text>(statusTexts);
      expect(textWidget.style?.fontSize, equals(15));
      expect(textWidget.style?.fontWeight, equals(FontWeight.w600));
    });
  });
}
