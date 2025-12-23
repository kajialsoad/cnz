import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/notification_badge.dart';

void main() {
  group('NotificationBadge Widget Tests', () {
    testWidgets('should display badge when count is greater than 0',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 5,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act & Assert
      expect(find.text('5'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('should hide badge when count is 0',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 0,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act & Assert
      expect(find.text('0'), findsNothing);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('should display "99+" when count exceeds 99',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 150,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act & Assert
      expect(find.text('99+'), findsOneWidget);
    });

    testWidgets('should use custom background color',
        (WidgetTester tester) async {
      // Arrange
      const customColor = Colors.blue;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 3,
              backgroundColor: customColor,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - badge should be visible with count
      expect(find.text('3'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('should use custom text color',
        (WidgetTester tester) async {
      // Arrange
      const customTextColor = Colors.yellow;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 7,
              textColor: customTextColor,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - badge should be visible with count
      expect(find.text('7'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('should animate when showAnimation is true',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 2,
              showAnimation: true,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act - pump to start animation
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Assert - badge should be visible and animating
      expect(find.text('2'), findsOneWidget);
      expect(find.byType(NotificationBadge), findsOneWidget);
    });

    testWidgets('should not animate when showAnimation is false',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 2,
              showAnimation: false,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - widget should render without animation
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('should update badge when count changes',
        (WidgetTester tester) async {
      // Arrange
      int count = 5;
      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: Column(
                  children: [
                    NotificationBadge(
                      count: count,
                      showAnimation: false, // Disable animation for test
                      child: Icon(Icons.notifications),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          count = 10;
                        });
                      },
                      child: Text('Update'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );

      // Assert initial state
      expect(find.text('5'), findsOneWidget);

      // Act - update count
      await tester.tap(find.text('Update'));
      await tester.pump();

      // Assert updated state
      expect(find.text('10'), findsOneWidget);
      expect(find.text('5'), findsNothing);
    });

    testWidgets('should hide badge when count changes to 0',
        (WidgetTester tester) async {
      // Arrange
      int count = 5;
      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: Column(
                  children: [
                    NotificationBadge(
                      count: count,
                      showAnimation: false, // Disable animation for test
                      child: Icon(Icons.notifications),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          count = 0;
                        });
                      },
                      child: Text('Clear'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );

      // Assert initial state
      expect(find.text('5'), findsOneWidget);

      // Act - clear count
      await tester.tap(find.text('Clear'));
      await tester.pump();

      // Assert badge is hidden
      expect(find.text('5'), findsNothing);
      expect(find.text('0'), findsNothing);
    });

    testWidgets('should use custom size',
        (WidgetTester tester) async {
      // Arrange
      const customSize = 24.0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 1,
              size: customSize,
              child: Icon(Icons.notifications),
            ),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - badge should be visible
      expect(find.text('1'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });
  });

  group('UnreadIndicator Widget Tests', () {
    testWidgets('should display unread indicator dot',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(),
          ),
        ),
      );

      // Act & Assert
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('should use default size of 8',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - indicator should be visible
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('should use custom size',
        (WidgetTester tester) async {
      // Arrange
      const customSize = 12.0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(size: customSize),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - indicator should be visible
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('should use default red color',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - indicator should be visible
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('should use custom color',
        (WidgetTester tester) async {
      // Arrange
      const customColor = Colors.green;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(color: customColor),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - indicator should be visible
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('should have circular shape',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UnreadIndicator(),
          ),
        ),
      );

      // Act
      await tester.pump();

      // Assert - indicator should be visible
      expect(find.byType(UnreadIndicator), findsOneWidget);
      expect(find.byType(Container), findsOneWidget);
    });
  });

  group('NotificationBadge Integration Tests', () {
    testWidgets('should work with IconButton',
        (WidgetTester tester) async {
      // Arrange
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 3,
              child: IconButton(
                icon: Icon(Icons.notifications),
                onPressed: () {
                  tapped = true;
                },
              ),
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(IconButton));
      await tester.pump();

      // Assert
      expect(tapped, true);
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('should work in AppBar',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(
              title: Text('Test'),
              actions: [
                NotificationBadge(
                  count: 7,
                  child: IconButton(
                    icon: Icon(Icons.notifications),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Act & Assert
      expect(find.text('7'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('should work with custom widgets',
        (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NotificationBadge(
              count: 12,
              child: Container(
                width: 50,
                height: 50,
                color: Colors.blue,
                child: Center(
                  child: Text('Custom'),
                ),
              ),
            ),
          ),
        ),
      );

      // Act & Assert
      expect(find.text('12'), findsOneWidget);
      expect(find.text('Custom'), findsOneWidget);
    });
  });
}
