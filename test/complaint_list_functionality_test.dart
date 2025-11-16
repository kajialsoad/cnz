import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:clean_care_mobile_app/pages/complaint_list_page.dart';
import 'package:clean_care_mobile_app/pages/complaint_detail_view_page.dart';
import 'package:clean_care_mobile_app/providers/complaint_provider.dart';
import 'package:clean_care_mobile_app/models/complaint.dart';
import 'package:clean_care_mobile_app/repositories/complaint_repository.dart';
import 'package:clean_care_mobile_app/services/api_client.dart';

// Mock ApiClient for testing
class MockApiClient extends ApiClient {
  MockApiClient() : super('http://test.com');
}

// Mock ComplaintRepository for testing
class MockComplaintRepository extends ComplaintRepository {
  bool shouldFail = false;
  bool shouldReturnEmpty = false;
  List<Complaint> mockComplaints = [];

  MockComplaintRepository() : super(MockApiClient());

  @override
  Future<List<Complaint>> getMyComplaints({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    await Future.delayed(Duration(milliseconds: 100)); // Simulate network delay
    
    if (shouldFail) {
      throw Exception('Network error');
    }
    
    if (shouldReturnEmpty) {
      return [];
    }
    
    return mockComplaints;
  }

  @override
  Future<Complaint> getComplaint(String id) async {
    await Future.delayed(Duration(milliseconds: 100));
    
    if (shouldFail) {
      throw Exception('Network error');
    }
    
    final complaint = mockComplaints.firstWhere(
      (c) => c.id.toString() == id,
      orElse: () => throw Exception('Complaint not found'),
    );
    
    return complaint;
  }
}

// Helper function to create test complaints
List<Complaint> createTestComplaints() {
  return [
    Complaint(
      id: '1',
      userId: '1',
      title: 'Household Waste',
      description: 'Garbage not collected for 3 days',
      category: 'Household',
      urgencyLevel: 'High',
      location: 'Dhaka, Uttara, Ward 300',
      address: 'House 10, Road 5, Sector 7',
      imageUrls: ['uploads/test1.jpg'],
      audioUrls: ['uploads/test1.mp3'],
      status: 'PENDING',
      priority: 1,
      createdAt: DateTime.now().subtract(Duration(hours: 2)),
      updatedAt: DateTime.now().subtract(Duration(hours: 2)),
    ),
    Complaint(
      id: '2',
      userId: '1',
      title: 'Road Waste',
      description: 'Construction debris on road',
      category: 'Road',
      urgencyLevel: 'Medium',
      location: 'Dhaka, Mirpur, Ward 200',
      address: 'Road 12, Block C',
      imageUrls: ['uploads/test2.jpg', 'uploads/test3.jpg'],
      audioUrls: [],
      status: 'IN_PROGRESS',
      priority: 2,
      createdAt: DateTime.now().subtract(Duration(days: 1)),
      updatedAt: DateTime.now().subtract(Duration(hours: 5)),
    ),
    Complaint(
      id: '3',
      userId: '1',
      title: 'Hospital Waste',
      description: 'Medical waste disposal issue',
      category: 'Hospital',
      urgencyLevel: 'Critical',
      location: 'Dhaka, Dhanmondi, Ward 100',
      address: 'Road 27, Dhanmondi',
      imageUrls: [],
      audioUrls: ['uploads/test2.mp3'],
      status: 'RESOLVED',
      priority: 3,
      createdAt: DateTime.now().subtract(Duration(days: 7)),
      updatedAt: DateTime.now().subtract(Duration(days: 2)),
    ),
  ];
}

void main() {
  group('Complaint List Page Tests', () {
    late MockComplaintRepository mockRepository;
    late ComplaintProvider complaintProvider;

    setUp(() {
      mockRepository = MockComplaintRepository();
      complaintProvider = ComplaintProvider(mockRepository);
    });

    Widget createTestWidget(Widget child) {
      return MaterialApp(
        home: ChangeNotifierProvider<ComplaintProvider>.value(
          value: complaintProvider,
          child: child,
        ),
        routes: {
          '/complaint': (context) => Scaffold(body: Text('Complaint Form')),
          '/complaint-detail-view': (context) => ComplaintDetailViewPage(),
        },
      );
    }

    testWidgets('Test 1: Loading complaints from backend', (WidgetTester tester) async {
      // Setup mock data
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      
      // Should show loading indicator initially
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading complaints...'), findsOneWidget);
      
      // Wait for data to load
      await tester.pumpAndSettle();
      
      // Should display complaints
      expect(find.byType(CircularProgressIndicator), findsNothing);
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('#2'), findsOneWidget);
      expect(find.text('#3'), findsOneWidget);
      expect(find.text('Household Waste'), findsOneWidget);
      expect(find.text('Road Waste'), findsOneWidget);
      expect(find.text('Hospital Waste'), findsOneWidget);
    });

    testWidgets('Test 2: Pull-to-refresh functionality', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Verify initial complaints are loaded
      expect(find.text('#1'), findsOneWidget);
      
      // Perform pull-to-refresh gesture
      await tester.drag(
        find.byType(RefreshIndicator),
        Offset(0, 300),
      );
      await tester.pump();
      
      // Should show refresh indicator
      expect(find.byType(RefreshIndicator), findsOneWidget);
      
      await tester.pumpAndSettle();
      
      // Data should still be displayed after refresh
      expect(find.text('#1'), findsOneWidget);
    });

    testWidgets('Test 3: Navigation to complaint details', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Tap on first complaint card
      await tester.tap(find.text('Household Waste'));
      await tester.pumpAndSettle();
      
      // Should navigate to detail view
      expect(find.byType(ComplaintDetailViewPage), findsOneWidget);
    });

    testWidgets('Test 4: Different complaint statuses display correctly', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Check status badges are displayed
      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('In Progress'), findsOneWidget);
      expect(find.text('Resolved'), findsOneWidget);
    });

    testWidgets('Test 5: Complaints with images show image indicator', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Check for image icons (complaints 1 and 2 have images)
      expect(find.byIcon(Icons.image_outlined), findsWidgets);
    });

    testWidgets('Test 6: Complaints with audio show audio indicator', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Check for audio icons (complaints 1 and 3 have audio)
      expect(find.byIcon(Icons.mic_outlined), findsWidgets);
    });

    testWidgets('Test 7: Empty complaint list shows empty state', (WidgetTester tester) async {
      mockRepository.shouldReturnEmpty = true;
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Should show empty state
      expect(find.text('No complaints yet'), findsOneWidget);
      expect(find.text('Your submitted complaints will appear here'), findsOneWidget);
      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
      expect(find.text('Submit Complaint'), findsOneWidget);
    });

    testWidgets('Test 8: Network error shows error state with retry', (WidgetTester tester) async {
      mockRepository.shouldFail = true;
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Should show error state
      expect(find.text('Failed to load complaints'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
      
      // Test retry button
      mockRepository.shouldFail = false;
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();
      
      // Should now show complaints
      expect(find.text('#1'), findsOneWidget);
    });

    testWidgets('Test 9: Time ago displays correctly', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(createTestWidget(ComplaintListPage()));
      await tester.pumpAndSettle();
      
      // Check for time ago text
      expect(find.textContaining('hour'), findsOneWidget); // 2 hours ago
      expect(find.textContaining('day'), findsWidgets); // 1 day ago, 7 days ago
    });

    testWidgets('Test 10: Back button navigation works', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChangeNotifierProvider<ComplaintProvider>.value(
                        value: complaintProvider,
                        child: ComplaintListPage(),
                      ),
                    ),
                  );
                },
                child: Text('Go to Complaints'),
              ),
            ),
          ),
        ),
      );
      
      // Navigate to complaint list
      await tester.tap(find.text('Go to Complaints'));
      await tester.pumpAndSettle();
      
      // Verify we're on complaint list page
      expect(find.text('My Complaints'), findsOneWidget);
      
      // Tap back button
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();
      
      // Should be back to previous screen
      expect(find.text('Go to Complaints'), findsOneWidget);
    });
  });

  group('Complaint Detail View Tests', () {
    late MockComplaintRepository mockRepository;
    late ComplaintProvider complaintProvider;

    setUp(() {
      mockRepository = MockComplaintRepository();
      complaintProvider = ComplaintProvider(mockRepository);
    });

    Widget createTestWidget(String complaintId) {
      return MaterialApp(
        home: ChangeNotifierProvider<ComplaintProvider>.value(
          value: complaintProvider,
          child: ComplaintDetailViewPage(),
        ),
        onGenerateRoute: (settings) {
          if (settings.name == '/complaint-detail-view') {
            return MaterialPageRoute(
              builder: (context) => ChangeNotifierProvider<ComplaintProvider>.value(
                value: complaintProvider,
                child: ComplaintDetailViewPage(),
              ),
              settings: RouteSettings(arguments: complaintId),
            );
          }
          return null;
        },
      );
    }

    testWidgets('Test 11: Detail view loads complaint data', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      
      // Pre-load the complaint
      await complaintProvider.loadComplaint('1');
      
      await tester.pumpWidget(createTestWidget('1'));
      await tester.pumpAndSettle();
      
      // Should display complaint details
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('Household Waste'), findsOneWidget);
      expect(find.text('Garbage not collected for 3 days'), findsOneWidget);
      expect(find.text('Dhaka, Uttara, Ward 300'), findsOneWidget);
    });

    testWidgets('Test 12: Detail view shows status badge', (WidgetTester tester) async {
      mockRepository.mockComplaints = createTestComplaints();
      await complaintProvider.loadComplaint('1');
      
      await tester.pumpWidget(createTestWidget('1'));
      await tester.pumpAndSettle();
      
      // Should show status badge
      expect(find.text('Pending'), findsOneWidget);
    });

    testWidgets('Test 13: Detail view error state with retry', (WidgetTester tester) async {
      mockRepository.shouldFail = true;
      
      await tester.pumpWidget(createTestWidget('1'));
      
      // Trigger load
      await tester.pump();
      await tester.pumpAndSettle();
      
      // Should show error state
      expect(find.text('Failed to load complaint'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });

  group('Responsive Layout Tests', () {
    late MockComplaintRepository mockRepository;
    late ComplaintProvider complaintProvider;

    setUp(() {
      mockRepository = MockComplaintRepository();
      mockRepository.mockComplaints = createTestComplaints();
      complaintProvider = ComplaintProvider(mockRepository);
    });

    testWidgets('Test 14: Phone screen size (360x640)', (WidgetTester tester) async {
      tester.view.physicalSize = Size(360, 640);
      tester.view.devicePixelRatio = 1.0;
      
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ComplaintProvider>.value(
            value: complaintProvider,
            child: ComplaintListPage(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      
      // Should display complaints
      expect(find.text('#1'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
      
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });

    testWidgets('Test 15: Tablet screen size (768x1024)', (WidgetTester tester) async {
      tester.view.physicalSize = Size(768, 1024);
      tester.view.devicePixelRatio = 1.0;
      
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ComplaintProvider>.value(
            value: complaintProvider,
            child: ComplaintListPage(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      
      // Should display complaints
      expect(find.text('#1'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
      
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });
  });
}
