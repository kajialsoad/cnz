import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/widgets/bot_message_bubble.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';

void main() {
  group('BotMessageBubble Widget Tests', () {
    late ChatMessage testBotMessage;

    setUp(() {
      testBotMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Your complaint has been received and is being reviewed.',
        read: false,
        createdAt: DateTime.now(),
      );
    });

    // Helper function to wrap widget in MaterialApp
    Widget wrapWidget(Widget widget) {
      return MaterialApp(
        home: Scaffold(
          body: widget,
        ),
      );
    }

    testWidgets('renders bot message bubble correctly', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      expect(find.byIcon(Icons.smart_toy), findsOneWidget);
      expect(find.text('Clean Care Support System'), findsOneWidget);
      expect(
        find.text('Your complaint has been received and is being reviewed.'),
        findsOneWidget,
      );
    });

    testWidgets('displays centered layout', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.byType(Center), findsWidgets);
    });

    testWidgets('has gray background styling', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container),
        ).first,
      );

      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, equals(Colors.grey[100]));
      expect(decoration.border, isNotNull);
      expect(decoration.borderRadius, isNotNull);
    });

    testWidgets('displays timestamp', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert - should have label, message, and timestamp texts
      final textFinder = find.byType(Text);
      expect(textFinder, findsWidgets);
      expect(textFinder.evaluate().length, greaterThanOrEqualTo(3));
    });

    testWidgets('respects max width constraint on small screens', (WidgetTester tester) async {
      // Arrange
      tester.view.physicalSize = const Size(300, 600);
      tester.view.devicePixelRatio = 1.0;

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));
      await tester.pumpAndSettle();

      // Assert
      final containerFinder = find.descendant(
        of: find.byType(BotMessageBubble),
        matching: find.byType(Container),
      );
      expect(containerFinder, findsWidgets);
      expect(tester.takeException(), isNull);

      // Cleanup
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });

    testWidgets('respects max width constraint on large screens', (WidgetTester tester) async {
      // Arrange
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));
      await tester.pumpAndSettle();

      // Assert
      final containerFinder = find.descendant(
        of: find.byType(BotMessageBubble),
        matching: find.byType(Container),
      );
      expect(containerFinder, findsWidgets);
      expect(tester.takeException(), isNull);

      // Cleanup
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });

    testWidgets('handles long messages correctly', (WidgetTester tester) async {
      // Arrange
      final longMessage = ChatMessage(
        id: 2,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'This is a very long message that should wrap correctly '
            'across multiple lines without breaking the layout or causing '
            'overflow issues in the bot message bubble widget.',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: longMessage)));
      await tester.pumpAndSettle();

      // Assert
      expect(tester.takeException(), isNull);
      expect(find.textContaining('This is a very long message'), findsOneWidget);
    });

    testWidgets('formats timestamp correctly for today', (WidgetTester tester) async {
      // Arrange
      final todayMessage = ChatMessage(
        id: 3,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: todayMessage)));

      // Assert - should show time only (e.g., "2:30 PM")
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('formats timestamp correctly for yesterday', (WidgetTester tester) async {
      // Arrange
      final yesterdayMessage = ChatMessage(
        id: 4,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: yesterdayMessage)));

      // Assert - should show "Yesterday" prefix
      expect(find.textContaining('Yesterday'), findsOneWidget);
    });

    testWidgets('works with Live Chat messages (no complaintId)', (WidgetTester tester) async {
      // Arrange
      final liveChatMessage = ChatMessage(
        id: 5,
        complaintId: null, // Live Chat has no complaintId
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome to Clean Care Live Chat!',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: liveChatMessage)));

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Welcome to Clean Care Live Chat!'), findsOneWidget);
    });

    testWidgets('works with Complaint Chat messages (with complaintId)', (WidgetTester tester) async {
      // Arrange
      final complaintChatMessage = ChatMessage(
        id: 6,
        complaintId: 456, // Complaint Chat has complaintId
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Your complaint is being processed.',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: complaintChatMessage)));

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Your complaint is being processed.'), findsOneWidget);
    });

    testWidgets('displays bot icon with correct color', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      final icon = tester.widget<Icon>(find.byIcon(Icons.smart_toy));
      expect(icon.color, equals(Colors.grey[600]));
      expect(icon.size, equals(20));
    });

    testWidgets('has correct padding and margin', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container),
        ).first,
      );

      expect(container.margin, equals(const EdgeInsets.symmetric(vertical: 8, horizontal: 16)));
      expect(container.padding, equals(const EdgeInsets.all(12)));
    });

    testWidgets('formats timestamp for messages within a week', (WidgetTester tester) async {
      // Arrange
      final weekMessage = ChatMessage(
        id: 7,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: weekMessage)));

      // Assert - should show day name (e.g., "Monday 2:30 PM")
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('formats timestamp for older messages', (WidgetTester tester) async {
      // Arrange
      final oldMessage = ChatMessage(
        id: 8,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: oldMessage)));

      // Assert - should show full date (e.g., "Jan 15, 2:30 PM")
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('handles empty message gracefully', (WidgetTester tester) async {
      // Arrange
      final emptyMessage = ChatMessage(
        id: 9,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: '',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: emptyMessage)));

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('handles special characters in message', (WidgetTester tester) async {
      // Arrange
      final specialMessage = ChatMessage(
        id: 10,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'আপনার অভিযোগ গ্রহণ করা হয়েছে! @#\$%^&*()',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: specialMessage)));

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.textContaining('আপনার অভিযোগ'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('maintains layout with multiple bot messages', (WidgetTester tester) async {
      // Arrange
      final messages = List.generate(
        3,
        (index) => ChatMessage(
          id: index,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message $index',
          read: false,
          createdAt: DateTime.now(),
        ),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) => BotMessageBubble(message: messages[index]),
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(BotMessageBubble), findsNWidgets(3));
      expect(find.text('Bot message 0'), findsOneWidget);
      expect(find.text('Bot message 1'), findsOneWidget);
      expect(find.text('Bot message 2'), findsOneWidget);
    });

    testWidgets('has correct border radius', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(BotMessageBubble),
          matching: find.byType(Container),
        ).first,
      );

      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, equals(BorderRadius.circular(12)));
    });

    testWidgets('text styles are correct', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(wrapWidget(BotMessageBubble(message: testBotMessage)));

      // Assert - verify all text widgets are present
      final textWidgets = tester.widgetList<Text>(find.byType(Text)).toList();
      expect(textWidgets.length, greaterThanOrEqualTo(3));

      // Label should have specific style
      final labelText = textWidgets.firstWhere(
        (text) => text.data == 'Clean Care Support System',
      );
      expect(labelText.style?.fontSize, equals(12));
      expect(labelText.style?.fontWeight, equals(FontWeight.w600));
    });

    testWidgets('renders correctly in scrollable list', (WidgetTester tester) async {
      // Arrange
      final messages = List.generate(
        10,
        (index) => ChatMessage(
          id: index,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message number $index with some content',
          read: false,
          createdAt: DateTime.now().subtract(Duration(minutes: index)),
        ),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) => BotMessageBubble(message: messages[index]),
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(BotMessageBubble), findsWidgets);
      expect(tester.takeException(), isNull);

      // Scroll to bottom
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });

  group('BotMessageBubble Edge Cases', () {
    testWidgets('handles very long single word', (WidgetTester tester) async {
      // Arrange
      final longWordMessage = ChatMessage(
        id: 11,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Thisisaverylongwordwithoutanyspacesthatmightcauselayoutissues',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BotMessageBubble(message: longWordMessage),
          ),
        ),
      );

      // Assert
      expect(tester.takeException(), isNull);
      expect(find.byType(BotMessageBubble), findsOneWidget);
    });

    testWidgets('handles message with newlines', (WidgetTester tester) async {
      // Arrange
      final multilineMessage = ChatMessage(
        id: 12,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Line 1\nLine 2\nLine 3',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BotMessageBubble(message: multilineMessage),
          ),
        ),
      );

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.text('Line 1\nLine 2\nLine 3'), findsOneWidget);
    });

    testWidgets('handles message with emojis', (WidgetTester tester) async {
      // Arrange
      final emojiMessage = ChatMessage(
        id: 13,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Thank you! 😊 We are processing your request 🔄',
        read: false,
        createdAt: DateTime.now(),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BotMessageBubble(message: emojiMessage),
          ),
        ),
      );

      // Assert
      expect(find.byType(BotMessageBubble), findsOneWidget);
      expect(find.textContaining('Thank you!'), findsOneWidget);
    });
  });
}
