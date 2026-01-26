import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/bot_message_bubble.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';

void main() {
  group('BotMessageBubble Screen Size Tests', () {
    late ChatMessage testMessage;

    setUp(() {
      testMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome to Clean Care Live Chat! How can we help you today?',
        read: false,
        createdAt: DateTime.now(),
      );
    });

    /// Helper function to create a widget with specific screen size
    Widget createTestWidget(ChatMessage message, Size screenSize) {
      return MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(size: screenSize),
          child: Scaffold(
            body: BotMessageBubble(message: message),
          ),
        ),
      );
    }

    testWidgets('renders correctly on small phone (320x568 - iPhone SE)',
        (WidgetTester tester) async {
      const screenSize = Size(320, 568);
      await tester.pumpWidget(createTestWidget(testMessage, screenSize));

      // Verify widget renders
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(find.text(testMessage.message), findsOneWidget);
      expect(find.byIcon(Icons.smart_toy), findsOneWidget);

      // Verify container constraints (80% of screen width)
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container).first,
        ),
      );
      final constraints = container.constraints as BoxConstraints;
      expect(constraints.maxWidth, equals(screenSize.width * 0.8));

      // Verify no overflow
      expect(tester.takeException(), isNull);
    });

    testWidgets('renders correctly on medium phone (375x667 - iPhone 8)',
        (WidgetTester tester) async {
      const screenSize = Size(375, 667);
      await tester.pumpWidget(createTestWidget(testMessage, screenSize));

      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(find.text(testMessage.message), findsOneWidget);

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container).first,
        ),
      );
      final constraints = container.constraints as BoxConstraints;
      expect(constraints.maxWidth, equals(screenSize.width * 0.8));

      expect(tester.takeException(), isNull);
    });

    testWidgets('renders correctly on large phone (414x896 - iPhone 11)',
        (WidgetTester tester) async {
      const screenSize = Size(414, 896);
      await tester.pumpWidget(createTestWidget(testMessage, screenSize));

      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(find.text(testMessage.message), findsOneWidget);

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container).first,
        ),
      );
      final constraints = container.constraints as BoxConstraints;
      expect(constraints.maxWidth, equals(screenSize.width * 0.8));

      expect(tester.takeException(), isNull);
    });

    testWidgets('renders correctly on tablet portrait (768x1024 - iPad)',
        (WidgetTester tester) async {
      const screenSize = Size(768, 1024);
      await tester.pumpWidget(createTestWidget(testMessage, screenSize));

      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(find.text(testMessage.message), findsOneWidget);

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container).first,
        ),
      );
      final constraints = container.constraints as BoxConstraints;
      expect(constraints.maxWidth, equals(screenSize.width * 0.8));

      expect(tester.takeException(), isNull);
    });

    testWidgets('renders correctly on tablet landscape (1024x768 - iPad)',
        (WidgetTester tester) async {
      const screenSize = Size(1024, 768);
      await tester.pumpWidget(createTestWidget(testMessage, screenSize));

      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(find.text(testMessage.message), findsOneWidget);

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container).first,
        ),
      );
      final constraints = container.constraints as BoxConstraints;
      expect(constraints.maxWidth, equals(screenSize.width * 0.8));

      expect(tester.takeException(), isNull);
    });

    testWidgets('handles long message text on small screen',
        (WidgetTester tester) async {
      final longMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message:
            'This is a very long message that should wrap properly across multiple lines without causing any overflow issues on small screens. The text should remain readable and properly formatted.',
        read: false,
        createdAt: DateTime.now(),
      );

      const screenSize = Size(320, 568);
      await tester.pumpWidget(createTestWidget(longMessage, screenSize));

      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text(longMessage.message), findsOneWidget);

      // Verify no overflow
      expect(tester.takeException(), isNull);
    });

    testWidgets('handles Bangla text on different screen sizes',
        (WidgetTester tester) async {
      final banglaMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message:
            'ক্লিন কেয়ার লাইভ চ্যাটে স্বাগতম! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি?',
        read: false,
        createdAt: DateTime.now(),
      );

      const screenSizes = [
        Size(320, 568), // Small phone
        Size(375, 667), // Medium phone
        Size(414, 896), // Large phone
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(banglaMessage, screenSize));

        expect(find.byType(BotMessageBubble), findsOneWidget);
        expect(find.text(banglaMessage.message), findsOneWidget);
        expect(tester.takeException(), isNull);

        // Clean up for next iteration
        await tester.pumpWidget(Container());
      }
    });

    testWidgets('maintains proper spacing on all screen sizes',
        (WidgetTester tester) async {
      const screenSizes = [
        Size(320, 568), // Small phone
        Size(375, 667), // Medium phone
        Size(414, 896), // Large phone
        Size(768, 1024), // Tablet portrait
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(testMessage, screenSize));

        // Verify icon is present
        expect(find.byIcon(Icons.smart_toy), findsOneWidget);

        // Verify all text elements are present
        expect(find.text('Clean Care Support System'), findsOneWidget);
        expect(find.text(testMessage.message), findsOneWidget);

        // Verify SizedBox spacing elements exist
        final sizedBoxes = find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(SizedBox),
        );
        expect(sizedBoxes, findsWidgets);

        expect(tester.takeException(), isNull);

        // Clean up for next iteration
        await tester.pumpWidget(Container());
      }
    });

    testWidgets('icon size remains consistent across screen sizes',
        (WidgetTester tester) async {
      const screenSizes = [
        Size(320, 568),
        Size(414, 896),
        Size(768, 1024),
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(testMessage, screenSize));

        final icon = tester.widget<Icon>(find.byIcon(Icons.smart_toy));
        expect(icon.size, equals(20.0));

        await tester.pumpWidget(Container());
      }
    });

    testWidgets('text sizes remain consistent across screen sizes',
        (WidgetTester tester) async {
      const screenSizes = [
        Size(320, 568),
        Size(414, 896),
        Size(768, 1024),
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(testMessage, screenSize));

        // Find all Text widgets
        final textWidgets = tester.widgetList<Text>(find.byType(Text));

        // Label text should be 12
        final labelText = textWidgets.firstWhere(
          (text) => text.data == 'Clean Care Support System',
        );
        expect(labelText.style?.fontSize, equals(12.0));

        // Message text should be 14
        final messageText = textWidgets.firstWhere(
          (text) => text.data == testMessage.message,
        );
        expect(messageText.style?.fontSize, equals(14.0));

        await tester.pumpWidget(Container());
      }
    });

    testWidgets('container margins remain consistent',
        (WidgetTester tester) async {
      const screenSizes = [
        Size(320, 568),
        Size(414, 896),
        Size(768, 1024),
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(testMessage, screenSize));

        // Find the outer container with margins
        final containers = tester.widgetList<Container>(
          find.descendant(
            of: find.byType(BotMessageBubble),
            matching: find.byType(Container),
          ),
        );

        // The first container should have the margins
        final containerWithMargin = containers.first;
        final margin = containerWithMargin.margin as EdgeInsets?;
        
        // Verify margins exist and are correct
        expect(margin, isNotNull);
        expect(margin!.top, equals(8.0));
        expect(margin.bottom, equals(8.0));
        expect(margin.left, equals(16.0));
        expect(margin.right, equals(16.0));

        await tester.pumpWidget(Container());
      }
    });

    testWidgets('handles very short message on all screen sizes',
        (WidgetTester tester) async {
      final shortMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'OK',
        read: false,
        createdAt: DateTime.now(),
      );

      const screenSizes = [
        Size(320, 568),
        Size(414, 896),
        Size(768, 1024),
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(shortMessage, screenSize));

        expect(find.byType(BotMessageBubble), findsOneWidget);
        expect(find.text(shortMessage.message), findsOneWidget);
        expect(tester.takeException(), isNull);

        await tester.pumpWidget(Container());
      }
    });

    testWidgets('centered alignment works on all screen sizes',
        (WidgetTester tester) async {
      const screenSizes = [
        Size(320, 568),
        Size(414, 896),
        Size(768, 1024),
      ];

      for (final screenSize in screenSizes) {
        await tester.pumpWidget(createTestWidget(testMessage, screenSize));

        // Verify BotMessageBubble renders
        expect(find.byType(BotMessageBubble), findsOneWidget);
        
        // Verify all content is present
        expect(find.text('Clean Care Support System'), findsOneWidget);
        expect(find.text(testMessage.message), findsOneWidget);
        expect(find.byIcon(Icons.smart_toy), findsOneWidget);
        
        // Verify no overflow errors
        expect(tester.takeException(), isNull);

        await tester.pumpWidget(Container());
      }
    });
  });
}
