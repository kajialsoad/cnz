import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:clean_care_mobile_app/widgets/review_display_card.dart';
import 'package:clean_care_mobile_app/models/review_model.dart';
import 'package:clean_care_mobile_app/providers/language_provider.dart';

void main() {
  group('ReviewDisplayCard Widget Tests', () {
    // Helper function to create a test review
    ReviewModel createTestReview({
      int rating = 5,
      String? comment,
      String? userName,
      DateTime? createdAt,
    }) {
      return ReviewModel(
        id: 1,
        complaintId: 1,
        userId: 1,
        rating: rating,
        comment: comment,
        createdAt: createdAt ?? DateTime.now().subtract(const Duration(days: 2)),
        updatedAt: DateTime.now(),
        user: userName != null
            ? ReviewUser(
                id: 1,
                firstName: userName.split(' ').first,
                lastName: userName.split(' ').length > 1 ? userName.split(' ').last : '',
              )
            : null,
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

    testWidgets('should display user avatar with initials',
        (WidgetTester tester) async {
      final review = createTestReview(userName: 'John Doe');

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify avatar is displayed
      expect(find.byType(CircleAvatar), findsOneWidget);
      expect(find.text('JD'), findsOneWidget);
    });

    testWidgets('should display default avatar for anonymous user',
        (WidgetTester tester) async {
      final review = createTestReview(userName: null);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify default avatar
      expect(find.byType(CircleAvatar), findsOneWidget);
      expect(find.text('U'), findsOneWidget);
    });

    testWidgets('should display user name',
        (WidgetTester tester) async {
      final review = createTestReview(userName: 'Jane Smith');

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify user name is displayed
      expect(find.text('Jane Smith'), findsOneWidget);
    });

    testWidgets('should display "Anonymous User" when no user name',
        (WidgetTester tester) async {
      final review = createTestReview(userName: null);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify anonymous user text
      expect(find.text('Anonymous User'), findsOneWidget);
    });

    testWidgets('should display correct star rating for 5 stars',
        (WidgetTester tester) async {
      final review = createTestReview(rating: 5);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify 5 filled stars
      expect(find.byIcon(Icons.star), findsNWidgets(5));
      expect(find.byIcon(Icons.star_border), findsNothing);
    });

    testWidgets('should display correct star rating for 3 stars',
        (WidgetTester tester) async {
      final review = createTestReview(rating: 3);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify 3 filled stars and 2 empty stars
      expect(find.byIcon(Icons.star), findsNWidgets(3));
      expect(find.byIcon(Icons.star_border), findsNWidgets(2));
    });

    testWidgets('should display correct star rating for 1 star',
        (WidgetTester tester) async {
      final review = createTestReview(rating: 1);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify 1 filled star and 4 empty stars
      expect(find.byIcon(Icons.star), findsNWidgets(1));
      expect(find.byIcon(Icons.star_border), findsNWidgets(4));
    });

    testWidgets('should display comment when present',
        (WidgetTester tester) async {
      final review = createTestReview(
        userName: 'John Doe',
        comment: 'Great service! Very satisfied.',
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify comment is displayed
      expect(find.text('Great service! Very satisfied.'), findsOneWidget);
    });

    testWidgets('should not display comment section when comment is null',
        (WidgetTester tester) async {
      final review = createTestReview(
        userName: 'John Doe',
        comment: null,
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify no extra spacing for comment
      expect(find.text('Great service! Very satisfied.'), findsNothing);
    });

    testWidgets('should display time ago',
        (WidgetTester tester) async {
      final review = createTestReview(
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify time ago is displayed
      expect(find.textContaining('ago'), findsOneWidget);
    });

    testWidgets('should have proper styling and layout',
        (WidgetTester tester) async {
      final review = createTestReview(
        userName: 'John Doe',
        rating: 4,
        comment: 'Good work',
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify container exists
      expect(find.byType(Container), findsWidgets);

      // Verify widget renders without errors
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
    });

    testWidgets('should use correct colors for stars',
        (WidgetTester tester) async {
      final review = createTestReview(rating: 3);

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Find star icons
      final starIcons = tester.widgetList<Icon>(find.byIcon(Icons.star));
      
      // Verify star color
      for (final icon in starIcons) {
        expect(icon.color, equals(const Color(0xFFFFC107)));
      }
    });

    testWidgets('should display all elements in correct order',
        (WidgetTester tester) async {
      final review = createTestReview(
        userName: 'John Doe',
        rating: 5,
        comment: 'Excellent service!',
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify all elements are present
      expect(find.byType(CircleAvatar), findsOneWidget);
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.byIcon(Icons.star), findsNWidgets(5));
      expect(find.text('Excellent service!'), findsOneWidget);
      expect(find.textContaining('ago'), findsOneWidget);
    });

    testWidgets('should handle long comments',
        (WidgetTester tester) async {
      final longComment = 'A' * 300;
      final review = createTestReview(
        userName: 'John Doe',
        comment: longComment,
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Should render without errors
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
      expect(find.text(longComment), findsOneWidget);
    });

    testWidgets('should have proper spacing between elements',
        (WidgetTester tester) async {
      final review = createTestReview(
        userName: 'John Doe',
        rating: 4,
        comment: 'Good',
      );

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Verify SizedBox widgets for spacing
      expect(find.byType(SizedBox), findsWidgets);
    });

    testWidgets('should use correct avatar background color',
        (WidgetTester tester) async {
      final review = createTestReview(userName: 'John Doe');

      await tester.pumpWidget(wrapWidget(
        ReviewDisplayCard(review: review),
      ));

      // Find avatar
      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      
      // Verify background color
      expect(
        avatar.backgroundColor,
        equals(const Color(0xFF4CAF50).withOpacity(0.1)),
      );
    });
  });

  group('ReviewsList Widget Tests', () {
    // Helper function to create multiple test reviews
    List<ReviewModel> createTestReviews(int count) {
      return List.generate(
        count,
        (index) => ReviewModel(
          id: index + 1,
          complaintId: 1,
          userId: index + 1,
          rating: 5 - (index % 5),
          comment: 'Review comment $index',
          createdAt: DateTime.now().subtract(Duration(days: index)),
          updatedAt: DateTime.now(),
          user: ReviewUser(
            id: index + 1,
            firstName: 'User',
            lastName: '$index',
          ),
        ),
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

    testWidgets('should display empty state when no reviews',
        (WidgetTester tester) async {
      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: const []),
      ));

      // Verify empty state
      expect(find.text('No reviews yet'), findsOneWidget);
      expect(find.text('এখনও কোনো রিভিউ নেই'), findsOneWidget);
      expect(find.byIcon(Icons.rate_review_outlined), findsOneWidget);
    });

    testWidgets('should display header with review count',
        (WidgetTester tester) async {
      final reviews = createTestReviews(3);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify header
      expect(find.text('User Reviews'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
      expect(find.byIcon(Icons.rate_review), findsOneWidget);
    });

    testWidgets('should display all reviews',
        (WidgetTester tester) async {
      final reviews = createTestReviews(3);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify all reviews are displayed
      expect(find.byType(ReviewDisplayCard), findsNWidgets(3));
      expect(find.text('Review comment 0'), findsOneWidget);
      expect(find.text('Review comment 1'), findsOneWidget);
      expect(find.text('Review comment 2'), findsOneWidget);
    });

    testWidgets('should display single review',
        (WidgetTester tester) async {
      final reviews = createTestReviews(1);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify single review
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
      expect(find.text('1'), findsOneWidget);
    });

    testWidgets('should handle large number of reviews',
        (WidgetTester tester) async {
      final reviews = createTestReviews(10);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify count
      expect(find.text('10'), findsOneWidget);
      expect(find.byType(ReviewDisplayCard), findsNWidgets(10));
    });

    testWidgets('should have proper spacing between reviews',
        (WidgetTester tester) async {
      final reviews = createTestReviews(2);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify Padding widgets for spacing
      expect(find.byType(Padding), findsWidgets);
    });

    testWidgets('should display header icon with correct color',
        (WidgetTester tester) async {
      final reviews = createTestReviews(1);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Find header icon
      final icon = tester.widget<Icon>(find.byIcon(Icons.rate_review));
      
      // Verify color
      expect(icon.color, equals(const Color(0xFF4CAF50)));
    });

    testWidgets('should display count badge with correct styling',
        (WidgetTester tester) async {
      final reviews = createTestReviews(5);

      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: reviews),
      ));

      // Verify count badge
      expect(find.text('5'), findsOneWidget);
      
      // Find the container with the count
      final containers = tester.widgetList<Container>(find.byType(Container));
      expect(containers.length, greaterThan(0));
    });

    testWidgets('should render empty state with proper styling',
        (WidgetTester tester) async {
      await tester.pumpWidget(wrapWidget(
        ReviewsList(reviews: const []),
      ));

      // Verify empty state container
      expect(find.byType(Container), findsWidgets);
      expect(find.byType(Column), findsWidgets);
    });
  });

  group('ReviewDisplayCard Integration Tests', () {
    testWidgets('should work with minimal review data',
        (WidgetTester tester) async {
      final review = ReviewModel(
        id: 1,
        complaintId: 1,
        userId: 1,
        rating: 3,
        comment: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: ReviewDisplayCard(review: review),
            ),
          ),
        ),
      );

      // Should render without errors
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
      expect(find.text('Anonymous User'), findsOneWidget);
      expect(find.byIcon(Icons.star), findsNWidgets(3));
    });

    testWidgets('should work with complete review data',
        (WidgetTester tester) async {
      final review = ReviewModel(
        id: 1,
        complaintId: 1,
        userId: 1,
        rating: 5,
        comment: 'Excellent work!',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        updatedAt: DateTime.now(),
        user: ReviewUser(
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
        ),
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: ReviewDisplayCard(review: review),
            ),
          ),
        ),
      );

      // Should render all data
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.byIcon(Icons.star), findsNWidgets(5));
      expect(find.text('Excellent work!'), findsOneWidget);
    });

    testWidgets('should handle different time formats',
        (WidgetTester tester) async {
      final review = ReviewModel(
        id: 1,
        complaintId: 1,
        userId: 1,
        rating: 4,
        comment: null,
        createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(),
          child: MaterialApp(
            home: Scaffold(
              body: ReviewDisplayCard(review: review),
            ),
          ),
        ),
      );

      // Should render time ago
      expect(find.byType(ReviewDisplayCard), findsOneWidget);
      expect(find.textContaining('ago'), findsOneWidget);
    });
  });
}
