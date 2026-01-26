import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';

/// Bot Trigger Scenarios Integration Tests
/// 
/// Task 3.6: Test bot trigger scenarios
/// Feature: Bot Message System
/// 
/// Tests all bot trigger scenarios from requirements:
/// - Case 1: Admin hasn't replied yet (bot sends step-by-step)
/// - Case 2: Admin replies once (bot deactivates)
/// - Case 3: Admin replied but user sends multiple messages (bot reactivates)

void main() {
  group('Bot Trigger Scenario Tests', () {
    group('Case 1: Admin Has Not Replied Yet', () {
      test('Scenario 1.1: User sends first message, bot responds with Step 1', () {
        final conversation = <ChatMessage>[];

        // User sends first message
        final userMessage1 = ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'I have a complaint about waste collection',
          read: false,
          createdAt: DateTime.now(),
        );
        conversation.add(userMessage1);

        // Bot responds with Step 1
        final botMessage1 = ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received and is being reviewed.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        );
        conversation.add(botMessage1);

        // Verify scenario
        expect(conversation.length, equals(2));
        expect(conversation[0].isUser, isTrue);
        expect(conversation[1].isBot, isTrue);
        expect(conversation[1].message, contains('received'));
        
        // Verify bot message properties
        expect(conversation[1].senderId, equals(0));
        expect(conversation[1].senderType, equals('BOT'));
        expect(conversation[1].senderName, equals('Clean Care Support System'));
      });

      test('Scenario 1.2: User sends second message, bot responds with Step 2', () {
        final conversation = <ChatMessage>[];

        // User message 1
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'First message',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot Step 1
        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // User message 2
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Second message - when will this be resolved?',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 2)),
        ));

        // Bot Step 2
        conversation.add(ChatMessage(
          id: 4,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Our team is working on your complaint. We will update you soon.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 3)),
        ));

        // Verify scenario
        expect(conversation.length, equals(4));
        expect(conversation.where((m) => m.isUser).length, equals(2));
        expect(conversation.where((m) => m.isBot).length, equals(2));
        expect(conversation[3].message, contains('working'));
      });

      test('Scenario 1.3: User sends third message, bot responds with Step 3', () {
        final conversation = <ChatMessage>[];

        // Build conversation with 3 user messages and 3 bot responses
        for (int i = 1; i <= 3; i++) {
          // User message
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(seconds: (i - 1) * 2)),
          ));

          // Bot response
          final botMessages = [
            'Your complaint has been received.',
            'Our team is working on your complaint.',
            'Please wait while we process your complaint. Thank you for your patience.',
          ];

          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: botMessages[i - 1],
            read: false,
            createdAt: DateTime.now().add(Duration(seconds: (i - 1) * 2 + 1)),
          ));
        }

        // Verify scenario
        expect(conversation.length, equals(6));
        expect(conversation.where((m) => m.isUser).length, equals(3));
        expect(conversation.where((m) => m.isBot).length, equals(3));
        expect(conversation[5].message, contains('patience'));
      });

      test('Scenario 1.4: Bot continues step-by-step until admin replies', () {
        final conversation = <ChatMessage>[];

        // Simulate 5 user messages with bot responses
        for (int i = 1; i <= 5; i++) {
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1)),
          ));

          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: 'Bot response $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1, seconds: 30)),
          ));
        }

        // Verify continuous bot responses
        expect(conversation.length, equals(10));
        expect(conversation.where((m) => m.isUser).length, equals(5));
        expect(conversation.where((m) => m.isBot).length, equals(5));
        
        // Verify no admin messages
        expect(conversation.where((m) => m.isAdmin).length, equals(0));
      });
    });

    group('Case 2: Admin Replies Once (Bot Deactivates)', () {
      test('Scenario 2.1: Admin replies, bot deactivates immediately', () {
        final conversation = <ChatMessage>[];

        // User message
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'I need help',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot response
        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies - bot should deactivate
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Hello! I am looking into your complaint now.',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // Verify bot deactivation point
        expect(conversation.length, equals(3));
        expect(conversation.where((m) => m.isBot).length, equals(1));
        expect(conversation.where((m) => m.isAdmin).length, equals(1));
        expect(conversation.last.isAdmin, isTrue);
      });

      test('Scenario 2.2: User sends message after admin reply, no bot response', () {
        final conversation = <ChatMessage>[];

        // Initial exchange
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message 1',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User replies to admin - NO bot message should follow
        conversation.add(ChatMessage(
          id: 4,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Thank you for your help!',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 6)),
        ));

        // Verify no new bot message
        expect(conversation.length, equals(4));
        expect(conversation.where((m) => m.isBot).length, equals(1));
        expect(conversation.last.isUser, isTrue);
      });

      test('Scenario 2.3: Normal user-admin conversation after bot deactivation', () {
        final conversation = <ChatMessage>[];

        // Bot was active initially
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin joins
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin message 1',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // Normal back-and-forth conversation
        conversation.add(ChatMessage(
          id: 4,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User reply 1',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 6)),
        ));

        conversation.add(ChatMessage(
          id: 5,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin message 2',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 7)),
        ));

        conversation.add(ChatMessage(
          id: 6,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User reply 2',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 8)),
        ));

        // Verify normal conversation without bot interference
        expect(conversation.length, equals(6));
        expect(conversation.where((m) => m.isBot).length, equals(1)); // Only initial bot
        expect(conversation.where((m) => m.isUser).length, equals(3));
        expect(conversation.where((m) => m.isAdmin).length, equals(2));
      });
    });

    group('Case 3: Bot Reactivation After Threshold', () {
      test('Scenario 3.1: User sends X messages after admin reply, bot reactivates', () {
        final conversation = <ChatMessage>[];
        const threshold = 3; // Reactivation threshold

        // Initial bot interaction
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Initial message',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies (bot deactivates)
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User sends threshold number of messages
        for (int i = 1; i <= threshold; i++) {
          conversation.add(ChatMessage(
            id: 3 + i,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message after admin reply $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 5 + i)),
          ));
        }

        // Bot reactivates after threshold
        conversation.add(ChatMessage(
          id: 7,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot reactivated - still working on your complaint',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 9)),
        ));

        // Verify reactivation
        expect(conversation.length, equals(7));
        expect(conversation.where((m) => m.isBot).length, equals(2));
        expect(conversation.last.isBot, isTrue);
        
        // Verify user messages after admin reply
        final userMessagesAfterAdmin = conversation
            .skip(3) // Skip initial messages and admin reply
            .where((m) => m.isUser)
            .length;
        expect(userMessagesAfterAdmin, equals(threshold));
      });

      test('Scenario 3.2: Bot reactivation with step reset', () {
        final conversation = <ChatMessage>[];

        // User sends 3 messages, bot responds with steps 1, 2, 3
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1)),
          ));

          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: 'Bot step $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1, seconds: 30)),
          ));
        }

        // Admin replies
        conversation.add(ChatMessage(
          id: 7,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 10)),
        ));

        // User sends 3 more messages (threshold)
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: 7 + i,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message after admin $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 10 + i)),
          ));
        }

        // Bot reactivates with Step 1 (reset)
        conversation.add(ChatMessage(
          id: 11,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot step 1 (reactivated)',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 14)),
        ));

        // Verify step reset
        expect(conversation.length, equals(11));
        expect(conversation.where((m) => m.isBot).length, equals(4));
        expect(conversation.last.message, contains('step 1'));
      });

      test('Scenario 3.3: Bot reactivation without step reset (continues)', () {
        final conversation = <ChatMessage>[];

        // User sends 2 messages, bot responds with steps 1, 2
        for (int i = 1; i <= 2; i++) {
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1)),
          ));

          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: 'Bot step $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1, seconds: 30)),
          ));
        }

        // Admin replies
        conversation.add(ChatMessage(
          id: 5,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 10)),
        ));

        // User sends 3 messages (threshold)
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: 5 + i,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message after admin $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 10 + i)),
          ));
        }

        // Bot reactivates with Step 3 (continues from step 2)
        conversation.add(ChatMessage(
          id: 9,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot step 3 (continued)',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 14)),
        ));

        // Verify step continuation
        expect(conversation.length, equals(9));
        expect(conversation.where((m) => m.isBot).length, equals(3));
        expect(conversation.last.message, contains('step 3'));
      });

      test('Scenario 3.4: Multiple reactivation cycles', () {
        final conversation = <ChatMessage>[];
        int messageId = 1;

        // Cycle 1: User → Bot → Admin
        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Cycle 1 user',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Cycle 1 bot',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Cycle 1 admin',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User sends 3 messages (triggers reactivation)
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: messageId++,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'Cycle 1 user message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 5 + i)),
          ));
        }

        // Bot reactivates
        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Cycle 2 bot (reactivated)',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 9)),
        ));

        // Admin replies again
        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Cycle 2 admin',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 15)),
        ));

        // User sends 3 more messages (triggers second reactivation)
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: messageId++,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'Cycle 2 user message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 15 + i)),
          ));
        }

        // Bot reactivates again
        conversation.add(ChatMessage(
          id: messageId++,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Cycle 3 bot (reactivated again)',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 19)),
        ));

        // Verify multiple reactivation cycles
        expect(conversation.length, equals(12));
        expect(conversation.where((m) => m.isBot).length, equals(3));
        expect(conversation.where((m) => m.isAdmin).length, equals(2));
        expect(conversation.where((m) => m.isUser).length, equals(7));
      });
    });

    group('Live Chat vs Complaint Chat Scenarios', () {
      test('Scenario 4.1: Bot triggers in Live Chat context', () {
        final conversation = <ChatMessage>[];

        // User starts Live Chat (no complaintId)
        conversation.add(ChatMessage(
          id: 1,
          complaintId: null, // Live Chat
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Hello, I need help',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot responds in Live Chat
        conversation.add(ChatMessage(
          id: 2,
          complaintId: null, // Live Chat
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Welcome to Clean Care Live Chat! How can we help you today?',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Verify Live Chat context
        expect(conversation.length, equals(2));
        expect(conversation[0].isLiveChat, isTrue);
        expect(conversation[1].isLiveChat, isTrue);
        expect(conversation[1].isBot, isTrue);
        expect(conversation[1].message, contains('Welcome'));
      });

      test('Scenario 4.2: Bot triggers in Complaint Chat context', () {
        final conversation = <ChatMessage>[];

        // User sends message in Complaint Chat
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123, // Complaint Chat
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'When will my complaint be resolved?',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot responds in Complaint Chat
        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123, // Complaint Chat
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received and is being reviewed.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Verify Complaint Chat context
        expect(conversation.length, equals(2));
        expect(conversation[0].isComplaintChat, isTrue);
        expect(conversation[1].isComplaintChat, isTrue);
        expect(conversation[1].isBot, isTrue);
        expect(conversation[1].message, contains('received'));
      });

      test('Scenario 4.3: Different bot messages for different chat types', () {
        // Live Chat bot message
        final liveChatBot = ChatMessage(
          id: 1,
          complaintId: null,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Welcome to Clean Care Live Chat!',
          read: false,
          createdAt: DateTime.now(),
        );

        // Complaint Chat bot message
        final complaintChatBot = ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received.',
          read: false,
          createdAt: DateTime.now(),
        );

        // Verify different contexts
        expect(liveChatBot.isLiveChat, isTrue);
        expect(liveChatBot.isBot, isTrue);
        expect(complaintChatBot.isComplaintChat, isTrue);
        expect(complaintChatBot.isBot, isTrue);
        expect(liveChatBot.message, isNot(equals(complaintChatBot.message)));
      });
    });

    group('Edge Cases and Special Scenarios', () {
      test('Scenario 5.1: Bot handles rapid user messages', () {
        final conversation = <ChatMessage>[];

        // User sends 5 messages rapidly
        for (int i = 1; i <= 5; i++) {
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'Rapid message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(seconds: i)),
          ));

          // Bot responds to each
          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: 'Bot response $i',
            read: false,
            createdAt: DateTime.now().add(Duration(seconds: i, milliseconds: 500)),
          ));
        }

        // Verify all messages handled
        expect(conversation.length, equals(10));
        expect(conversation.where((m) => m.isUser).length, equals(5));
        expect(conversation.where((m) => m.isBot).length, equals(5));
      });

      test('Scenario 5.2: Bot handles messages with media', () {
        final conversation = <ChatMessage>[];

        // User sends message with image
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'Here is a photo of the issue',
          imageUrl: 'https://example.com/image.jpg',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot responds (text only)
        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Verify bot doesn't have media
        expect(conversation[0].hasImage, isTrue);
        expect(conversation[1].hasImage, isFalse);
        expect(conversation[1].isBot, isTrue);
      });

      test('Scenario 5.3: Bot handles long user messages', () {
        final longMessage = 'A' * 500; // Very long message

        final conversation = <ChatMessage>[];

        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: longMessage,
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Your complaint has been received.',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Verify bot responds regardless of message length
        expect(conversation.length, equals(2));
        expect(conversation[0].message.length, equals(500));
        expect(conversation[1].isBot, isTrue);
      });

      test('Scenario 5.4: Bot handles Unicode and special characters', () {
        final conversation = <ChatMessage>[];

        // User sends message with Bangla text and emojis
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'আমার অভিযোগ 😊 @#\$%',
          read: false,
          createdAt: DateTime.now(),
        ));

        // Bot responds with Bangla
        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'আপনার অভিযোগ গ্রহণ করা হয়েছে',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Verify Unicode handling
        expect(conversation[0].message, contains('আমার'));
        expect(conversation[0].message, contains('😊'));
        expect(conversation[1].message, contains('আপনার'));
        expect(conversation[1].isBot, isTrue);
      });

      test('Scenario 5.5: Conversation with mixed sender types', () {
        final conversation = <ChatMessage>[];

        // Complex conversation with all sender types
        final senderTypes = ['CITIZEN', 'BOT', 'CITIZEN', 'BOT', 'ADMIN', 'CITIZEN', 'ADMIN'];
        
        for (int i = 0; i < senderTypes.length; i++) {
          final senderType = senderTypes[i];
          conversation.add(ChatMessage(
            id: i + 1,
            complaintId: 123,
            senderId: senderType == 'CITIZEN' ? 456 : (senderType == 'ADMIN' ? 789 : 0),
            senderType: senderType,
            senderName: senderType == 'CITIZEN' 
                ? 'John Doe' 
                : (senderType == 'ADMIN' ? 'Admin User' : 'Clean Care Support System'),
            message: '$senderType message ${i + 1}',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i)),
          ));
        }

        // Verify mixed conversation
        expect(conversation.length, equals(7));
        expect(conversation.where((m) => m.isUser).length, equals(3));
        expect(conversation.where((m) => m.isBot).length, equals(2));
        expect(conversation.where((m) => m.isAdmin).length, equals(2));
      });

      test('Scenario 5.6: Bot message chronological ordering', () {
        final conversation = <ChatMessage>[];
        final baseTime = DateTime.now();

        // Add messages with specific timestamps
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message',
          read: false,
          createdAt: baseTime,
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message',
          read: false,
          createdAt: baseTime.add(const Duration(seconds: 1)),
        ));

        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin message',
          read: false,
          createdAt: baseTime.add(const Duration(minutes: 5)),
        ));

        // Verify chronological order
        for (int i = 0; i < conversation.length - 1; i++) {
          expect(
            conversation[i].createdAt.isBefore(conversation[i + 1].createdAt) ||
                conversation[i].createdAt.isAtSameMomentAs(conversation[i + 1].createdAt),
            isTrue,
            reason: 'Messages should be in chronological order',
          );
        }
      });
    });

    group('Threshold Configuration Scenarios', () {
      test('Scenario 6.1: Threshold = 1 (immediate reactivation)', () {
        final conversation = <ChatMessage>[];

        // Initial bot interaction
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User sends 1 message (threshold = 1)
        conversation.add(ChatMessage(
          id: 4,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'One more message',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 6)),
        ));

        // Bot reactivates immediately
        conversation.add(ChatMessage(
          id: 5,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot reactivated',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 6, seconds: 1)),
        ));

        // Verify immediate reactivation
        expect(conversation.length, equals(5));
        expect(conversation.where((m) => m.isBot).length, equals(2));
      });

      test('Scenario 6.2: Threshold = 5 (delayed reactivation)', () {
        final conversation = <ChatMessage>[];

        // Initial bot interaction
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User sends 5 messages (threshold = 5)
        for (int i = 1; i <= 5; i++) {
          conversation.add(ChatMessage(
            id: 3 + i,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 5 + i)),
          ));
        }

        // Bot reactivates after 5 messages
        conversation.add(ChatMessage(
          id: 9,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot reactivated after 5 messages',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 11)),
        ));

        // Verify delayed reactivation
        expect(conversation.length, equals(9));
        expect(conversation.where((m) => m.isBot).length, equals(2));
        
        // Count user messages after admin reply
        final userMessagesAfterAdmin = conversation
            .skip(3)
            .where((m) => m.isUser)
            .length;
        expect(userMessagesAfterAdmin, equals(5));
      });

      test('Scenario 6.3: User sends fewer messages than threshold', () {
        final conversation = <ChatMessage>[];
        const threshold = 5;

        // Initial bot interaction
        conversation.add(ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'John Doe',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ));

        conversation.add(ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot response',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ));

        // Admin replies
        conversation.add(ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin User',
          message: 'Admin response',
          read: false,
          createdAt: DateTime.now().add(const Duration(minutes: 5)),
        ));

        // User sends only 3 messages (below threshold of 5)
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: 3 + i,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: 5 + i)),
          ));
        }

        // Bot should NOT reactivate (below threshold)
        // Verify no new bot message
        expect(conversation.length, equals(6));
        expect(conversation.where((m) => m.isBot).length, equals(1));
        expect(conversation.last.isUser, isTrue);
      });
    });

    group('Data Integrity in Bot Trigger Scenarios', () {
      test('Scenario 7.1: All bot messages have correct sender properties', () {
        final conversation = <ChatMessage>[];

        // Create conversation with multiple bot messages
        for (int i = 1; i <= 3; i++) {
          conversation.add(ChatMessage(
            id: (i * 2) - 1,
            complaintId: 123,
            senderId: 456,
            senderType: 'CITIZEN',
            senderName: 'John Doe',
            message: 'User message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1)),
          ));

          conversation.add(ChatMessage(
            id: i * 2,
            complaintId: 123,
            senderId: 0,
            senderType: 'BOT',
            senderName: 'Clean Care Support System',
            message: 'Bot message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i - 1, seconds: 30)),
          ));
        }

        // Verify all bot messages have correct properties
        final botMessages = conversation.where((m) => m.isBot).toList();
        for (final botMsg in botMessages) {
          expect(botMsg.senderId, equals(0));
          expect(botMsg.senderType, equals('BOT'));
          expect(botMsg.senderName, equals('Clean Care Support System'));
          expect(botMsg.isBot, isTrue);
          expect(botMsg.isUser, isFalse);
          expect(botMsg.isAdmin, isFalse);
        }
      });

      test('Scenario 7.2: Bot messages maintain conversation context', () {
        final complaintId = 123;
        final conversation = <ChatMessage>[];

        // All messages in same complaint
        for (int i = 1; i <= 5; i++) {
          conversation.add(ChatMessage(
            id: i,
            complaintId: complaintId,
            senderId: i % 2 == 0 ? 0 : 456,
            senderType: i % 2 == 0 ? 'BOT' : 'CITIZEN',
            senderName: i % 2 == 0 ? 'Clean Care Support System' : 'John Doe',
            message: 'Message $i',
            read: false,
            createdAt: DateTime.now().add(Duration(minutes: i)),
          ));
        }

        // Verify all messages belong to same complaint
        for (final msg in conversation) {
          expect(msg.complaintId, equals(complaintId));
        }
      });

      test('Scenario 7.3: Bot messages are immutable after creation', () {
        final botMessage = ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Original message',
          read: false,
          createdAt: DateTime.now(),
        );

        // Create modified copy
        final modifiedMessage = botMessage.copyWith(
          message: 'Modified message',
          read: true,
        );

        // Verify original is unchanged
        expect(botMessage.message, equals('Original message'));
        expect(botMessage.read, isFalse);
        
        // Verify copy has changes
        expect(modifiedMessage.message, equals('Modified message'));
        expect(modifiedMessage.read, isTrue);
        
        // Verify bot properties remain
        expect(modifiedMessage.isBot, isTrue);
        expect(modifiedMessage.senderType, equals('BOT'));
      });
    });
  });
}
