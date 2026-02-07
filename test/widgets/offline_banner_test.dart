import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/offline_banner.dart';

void main() {
  group('OfflineBanner Widget Tests', () {
    testWidgets('displays offline message', (WidgetTester tester) async {
      // Build the widget
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: OfflineBanner(),
          ),
        ),
      );

      // Verify the offline message is displayed
      expect(find.text('অফলাইন মোড - Cached data দেখাচ্ছে'), findsOneWidget);
      
      // Verify the cloud_off icon is displayed
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
    });

    testWidgets('displays last sync time when provided', (WidgetTester tester) async {
      // Create a last sync time 5 minutes ago
      final lastSyncTime = DateTime.now().subtract(const Duration(minutes: 5));

      // Build the widget
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(lastSyncTime: lastSyncTime),
          ),
        ),
      );

      // Verify the last sync time is displayed
      expect(find.textContaining('শেষ আপডেট:'), findsOneWidget);
      expect(find.textContaining('5মি আগে'), findsOneWidget);
    });

    testWidgets('does not display last sync time when showLastSync is false', (WidgetTester tester) async {
      // Create a last sync time
      final lastSyncTime = DateTime.now().subtract(const Duration(minutes: 5));

      // Build the widget with showLastSync = false
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(
              lastSyncTime: lastSyncTime,
              showLastSync: false,
            ),
          ),
        ),
      );

      // Verify the last sync time is NOT displayed
      expect(find.textContaining('শেষ আপডেট:'), findsNothing);
    });

    testWidgets('formats time correctly for different durations', (WidgetTester tester) async {
      // Test "just now" (less than 1 minute)
      final justNow = DateTime.now();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(lastSyncTime: justNow),
          ),
        ),
      );
      expect(find.textContaining('এইমাত্র'), findsOneWidget);

      // Test minutes ago
      final fiveMinutesAgo = DateTime.now().subtract(const Duration(minutes: 5));
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(lastSyncTime: fiveMinutesAgo),
          ),
        ),
      );
      await tester.pump();
      expect(find.textContaining('5মি আগে'), findsOneWidget);

      // Test hours ago
      final threeHoursAgo = DateTime.now().subtract(const Duration(hours: 3));
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(lastSyncTime: threeHoursAgo),
          ),
        ),
      );
      await tester.pump();
      expect(find.textContaining('3ঘ আগে'), findsOneWidget);

      // Test days ago
      final twoDaysAgo = DateTime.now().subtract(const Duration(days: 2));
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineBanner(lastSyncTime: twoDaysAgo),
          ),
        ),
      );
      await tester.pump();
      expect(find.textContaining('2দি আগে'), findsOneWidget);
    });

    testWidgets('has correct styling', (WidgetTester tester) async {
      // Build the widget
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: OfflineBanner(),
          ),
        ),
      );

      // Find the container
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(OfflineBanner),
          matching: find.byType(Container).first,
        ),
      );

      // Verify the container has the correct decoration
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.orange[100]);
      expect(decoration.border, isNotNull);
    });

    testWidgets('takes full width', (WidgetTester tester) async {
      // Build the widget
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: OfflineBanner(),
          ),
        ),
      );

      // Find the container
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(OfflineBanner),
          matching: find.byType(Container).first,
        ),
      );

      // Verify the container takes full width
      expect(container.constraints?.maxWidth, double.infinity);
    });
  });
}
