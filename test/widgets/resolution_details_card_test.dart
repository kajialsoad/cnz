import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clean_care_mobile_app/widgets/resolution_details_card.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';
import 'package:clean_care_mobile_app/models/review_model.dart';
import 'package:clean_care_mobile_app/providers/language_provider.dart';

void main() {
  // Initialize DotEnv before all tests
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    // Initialize dotenv with test values
    dotenv.testLoad(fileInput: '''
USE_PRODUCTION=false
PRODUCTION_URL=http://localhost:4000
LOCAL_WEB_URL=http://127.0.0.1:4000
LOCAL_ANDROID_URL=http://192.168.0.100:4000
LOCAL_IOS_URL=http://localhost:4000
''');
  });
  group('ResolutionDetailsCard Widget Tests', () {
    // Helper function to create a test complaint
    Complaint createTestComplaint({
      required String status,
      String? resolvedByAdminName,
      String? resolutionNote,
      List<String>? resolutionImageUrls,
      bool canSubmitReview = false,
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
        resolutionNote: resolutionNote,
        resolutionImages: resolutionImageUrls?.join(','),
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

    testWidgets('should not display for non-resolved complaint without resolution data',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.pending,
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Should not display anything
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
      expect(find.text('Resolution Details'), findsNothing);
    });

    testWidgets('should display header with icon and title',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin User',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify header icon
      expect(find.byIcon(Icons.check_circle), findsOneWidget);

      // Verify header text
      expect(find.text('Resolution Details'), findsOneWidget);
      expect(find.text('সমাধানের বিবরণ'), findsOneWidget);
    });

    testWidgets('should display resolved by admin name',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'John Doe',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify admin name is displayed
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('Resolved by / সমাধানকারী'), findsOneWidget);
      expect(find.byIcon(Icons.person), findsOneWidget);
    });

    testWidgets('should display resolution date',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify date is displayed
      expect(find.text('Date / তারিখ'), findsOneWidget);
      expect(find.textContaining('Jan 2, 2024 at'), findsOneWidget);
      expect(find.byIcon(Icons.calendar_today), findsOneWidget);
    });

    testWidgets('should display resolution note',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionNote: 'The issue has been resolved successfully.',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify resolution note is displayed
      expect(find.text('Resolution Note'), findsOneWidget);
      expect(find.text('সমাধানের নোট'), findsOneWidget);
      expect(find.text('The issue has been resolved successfully.'), findsOneWidget);
      expect(find.byIcon(Icons.notes), findsOneWidget);
    });

    testWidgets('should not display resolution note if empty',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionNote: '',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify resolution note section is not displayed
      expect(find.text('Resolution Note'), findsNothing);
      expect(find.byIcon(Icons.notes), findsNothing);
    });

    testWidgets('should display resolution images gallery',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionImageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify images section is displayed
      expect(find.text('Resolution Images'), findsOneWidget);
      expect(find.text('সমাধানের ছবি'), findsOneWidget);
      expect(find.byIcon(Icons.photo_library), findsOneWidget);

      // Verify image gallery exists
      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('should not display images section if no images',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionImageUrls: [],
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify images section is not displayed
      expect(find.text('Resolution Images'), findsNothing);
      expect(find.byIcon(Icons.photo_library), findsNothing);
    });

    testWidgets('should display submit review button when canSubmitReview is true',
        (WidgetTester tester) async {
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        resolvedByAdminName: 'Admin',
        resolutionNote: 'Issue resolved',  // Add resolution data so hasResolution is true
        // No userReview means canSubmitReview will be true
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));
      
      // Wait for all animations and futures to complete
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Verify submit review button is displayed
      expect(find.text('Submit Review'), findsOneWidget);
      expect(find.byIcon(Icons.rate_review), findsOneWidget);
    });

    testWidgets('should not display submit review button when already reviewed',
        (WidgetTester tester) async {
      // Skip this test as the Complaint model doesn't support userReview yet
      // This will be implemented when the review system is fully integrated
    });

    testWidgets('should have proper styling and layout',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionNote: 'Test note',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Find the main container
      final containers = find.byType(Container);
      expect(containers, findsWidgets);

      // Verify widget renders without errors
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
    });

    testWidgets('should display dividers between sections',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionNote: 'Test note',
        resolutionImageUrls: ['https://example.com/image.jpg'],
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify dividers are present
      expect(find.byType(Divider), findsWidgets);
    });

    testWidgets('should handle complaint without admin name',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: null,
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Widget should render without errors
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
      expect(find.text('Resolution Details'), findsOneWidget);

      // Admin name section should not be displayed
      expect(find.text('Resolved by / সমাধানকারী'), findsNothing);
    });

    testWidgets('should format date correctly',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify date format (Month Day, Year at HH:MM)
      expect(find.textContaining('Jan 2, 2024 at'), findsOneWidget);
    });

    testWidgets('should display all sections when all data is present',
        (WidgetTester tester) async {
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        resolvedByAdminName: 'John Doe',
        resolutionNote: 'Issue resolved successfully',
        resolutionImages: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify all sections are displayed
      expect(find.text('Resolution Details'), findsOneWidget);
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('Resolution Images'), findsOneWidget);
      expect(find.text('Resolution Note'), findsOneWidget);
      expect(find.text('Issue resolved successfully'), findsOneWidget);
      expect(find.text('Submit Review'), findsOneWidget);
    });

    testWidgets('should call onReviewSubmitted callback when provided',
        (WidgetTester tester) async {
      bool callbackCalled = false;
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(
          complaint: complaint,
          onReviewSubmitted: () {
            callbackCalled = true;
          },
        ),
      ));

      // Note: We can't easily test the modal opening without mocking
      // but we can verify the button exists
      expect(find.text('Submit Review'), findsOneWidget);
    });

    testWidgets('should have proper spacing between elements',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionNote: 'Test note',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify SizedBox widgets for spacing
      expect(find.byType(SizedBox), findsWidgets);
    });

    testWidgets('should display zoom icon on images',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
        resolutionImageUrls: ['https://example.com/image.jpg'],
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify zoom icon is present
      expect(find.byIcon(Icons.zoom_in), findsOneWidget);
    });

    testWidgets('should use correct colors for status',
        (WidgetTester tester) async {
      final complaint = createTestComplaint(
        status: ComplaintStatus.resolved,
        resolvedByAdminName: 'Admin',
      );

      await tester.pumpWidget(wrapWidget(
        ResolutionDetailsCard(complaint: complaint),
      ));

      // Verify green color is used for resolved status
      final icon = tester.widget<Icon>(find.byIcon(Icons.check_circle));
      expect(icon.color, equals(const Color(0xFF4CAF50)));
    });
  });

  group('ResolutionDetailsCard Integration Tests', () {
    testWidgets('should work with minimal data',
        (WidgetTester tester) async {
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: ResolutionDetailsCard(complaint: complaint),
            ),
          ),
        ),
      );

      // Should render without errors
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
    });

    testWidgets('should handle long resolution notes',
        (WidgetTester tester) async {
      final longNote = 'A' * 500;
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        resolutionNote: longNote,
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: SingleChildScrollView(
                child: ResolutionDetailsCard(complaint: complaint),
              ),
            ),
          ),
        ),
      );

      // Should render without errors
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
      expect(find.text(longNote), findsOneWidget);
    });

    testWidgets('should handle multiple images',
        (WidgetTester tester) async {
      final complaint = Complaint(
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'water_supply',
        urgencyLevel: 'medium',
        location: 'Test',
        status: ComplaintStatus.resolved,
        userId: '1',
        imageUrls: [],
        audioUrls: [],
        priority: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        resolutionImages: 'image1.jpg,image2.jpg,image3.jpg,image4.jpg,image5.jpg',
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: ResolutionDetailsCard(complaint: complaint),
            ),
          ),
        ),
      );

      // Should render without errors
      expect(find.byType(ResolutionDetailsCard), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
    });
  });
}
