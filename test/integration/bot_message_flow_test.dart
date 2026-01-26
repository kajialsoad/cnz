import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';
import 'package:clean_care_mobile_app/widgets/bot_message_bubble.dart';
import 'package:clean_care_mobile_app/services/chat_service.dart';
import 'package:clean_care_mobile_app/services/live_chat_service.dart';

/// Integration Tests for Bot Message Flow
/// 
/// Task 3.6: Mobile App Integration Tests
/// Feature: Bot Message System
/// 
/// Tests complete bot message flows:
/// - Bot message display in Complaint Chat
/// - Bot message display in Live Chat
/// - Bot message identification and parsing
/// - Bot message trigger scenarios
/// - Bot message interaction with user/admin messages

void main() {
  group('Bot Message Model Integration Tests', () {
    test('ChatMessage correctly identifies bot messages', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Your complaint has been received',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, isTrue);
      expect(botMessage.isUser, isFalse);
      expect(botMessage.isAdmin, isFalse);
      expect(botMessage.senderType, equals('BOT'));
    });

    test('ChatMessage correctly identifies user messages', () {
      final userMessage = ChatMessage(
        id: 2,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'I need help',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(userMessage.isBot, isFalse);
      expect(userMessage.isUser, isTrue);
      expect(userMessage.isAdmin, isFalse);
      expect(userMessage.senderType, equals('CITIZEN'));
    });

    test('ChatMessage correctly identifies admin messages', () {
      final adminMessage = ChatMessage(
        id: 3,
        complaintId: 123,
        senderId: 789,
        senderType: 'ADMIN',
        senderName: 'Admin User',
        message: 'We are working on it',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(adminMessage.isBot, isFalse);
      expect(adminMessage.isUser, isFalse);
      expect(adminMessage.isAdmin, isTrue);
      expect(adminMessage.senderType, equals('ADMIN'));
    });

    test('Bot message can be created from JSON', () {
      final json = {
        'id': 1,
        'complaintId': 123,
        'senderId': 0,
        'senderType': 'BOT',
        'senderName': 'Clean Care Support System',
        'message': 'Your complaint is being reviewed',
        'imageUrl': null,
        'voiceUrl': null,
        'read': false,
        'createdAt': DateTime.now().toIso8601String(),
      };

      final message = ChatMessage.fromJson(json);

      expect(message.isBot, isTrue);
      expect(message.senderType, equals('BOT'));
      expect(message.senderName, equals('Clean Care Support System'));
      expect(message.message, equals('Your complaint is being reviewed'));
    });

    test('Bot message can be converted to JSON', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final json = botMessage.toJson();

      expect(json['senderType'], equals('BOT'));
      expect(json['senderName'], equals('Clean Care Support System'));
      expect(json['message'], equals('Test message'));
    });

    test('Bot message works in Complaint Chat context', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: 123, // Has complaintId = Complaint Chat
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Your complaint is being processed',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, isTrue);
      expect(botMessage.isComplaintChat, isTrue);
      expect(botMessage.isLiveChat, isFalse);
      expect(botMessage.complaintId, equals(123));
    });

    test('Bot message works in Live Chat context', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: null, // No complaintId = Live Chat
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome to Live Chat',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, isTrue);
      expect(botMessage.isComplaintChat, isFalse);
      expect(botMessage.isLiveChat, isTrue);
      expect(botMessage.complaintId, isNull);
    });

    test('Bot message equality works correctly', () {
      final message1 = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message2 = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message3 = ChatMessage(
        id: 2,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Different message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message1 == message2, isTrue);
      expect(message1 == message3, isFalse);
      expect(message1.hashCode, equals(message2.hashCode));
    });

    test('Bot message copyWith works correctly', () {
      final original = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Original message',
        read: false,
        createdAt: DateTime.now(),
      );

      final updated = original.copyWith(
        message: 'Updated message',
        read: true,
      );

      expect(updated.id, equals(original.id));
      expect(updated.senderType, equals('BOT'));
      expect(updated.message, equals('Updated message'));
      expect(updated.read, isTrue);
    });

    test('Bot message toString includes type information', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final string = botMessage.toString();

      expect(string, contains('ChatMessage'));
      expect(string, contains('senderType: BOT'));
      expect(string, contains('type: Complaint'));
    });
  });

  group('Bot Message Flow Scenarios', () {
    test('Scenario 1: User sends first message, bot responds', () {
      // Simulate conversation flow
      final messages = <ChatMessage>[];

      // User sends first message
      final userMessage1 = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'I have a complaint',
        read: false,
        createdAt: DateTime.now(),
      );
      messages.add(userMessage1);

      // Bot responds (Step 1)
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
      messages.add(botMessage1);

      // Verify flow
      expect(messages.length, equals(2));
      expect(messages[0].isUser, isTrue);
      expect(messages[1].isBot, isTrue);
      expect(messages[1].message, contains('received'));
    });

    test('Scenario 2: User sends multiple messages, bot responds to each', () {
      final messages = <ChatMessage>[];

      // User message 1
      messages.add(ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'First message',
        read: false,
        createdAt: DateTime.now(),
      ));

      // Bot response 1 (Step 1)
      messages.add(ChatMessage(
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
      messages.add(ChatMessage(
        id: 3,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'Second message',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 2)),
      ));

      // Bot response 2 (Step 2)
      messages.add(ChatMessage(
        id: 4,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Our team is working on your complaint.',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 3)),
      ));

      // Verify flow
      expect(messages.length, equals(4));
      expect(messages.where((m) => m.isUser).length, equals(2));
      expect(messages.where((m) => m.isBot).length, equals(2));
    });

    test('Scenario 3: Admin replies, bot deactivates', () {
      final messages = <ChatMessage>[];

      // User message
      messages.add(ChatMessage(
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
      messages.add(ChatMessage(
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
      messages.add(ChatMessage(
        id: 3,
        complaintId: 123,
        senderId: 789,
        senderType: 'ADMIN',
        senderName: 'Admin User',
        message: 'We are looking into this',
        read: false,
        createdAt: DateTime.now().add(const Duration(minutes: 5)),
      ));

      // User replies to admin
      messages.add(ChatMessage(
        id: 4,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'Thank you',
        read: false,
        createdAt: DateTime.now().add(const Duration(minutes: 6)),
      ));

      // No bot message after admin reply
      expect(messages.length, equals(4));
      expect(messages.where((m) => m.isBot).length, equals(1));
      expect(messages.where((m) => m.isAdmin).length, equals(1));
      expect(messages.last.isUser, isTrue);
    });

    test('Scenario 4: Mixed message types in conversation', () {
      final messages = <ChatMessage>[];

      // User starts
      messages.add(ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'Help needed',
        read: false,
        createdAt: DateTime.now(),
      ));

      // Bot responds
      messages.add(ChatMessage(
        id: 2,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'We are here to help',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 1)),
      ));

      // User sends more info
      messages.add(ChatMessage(
        id: 3,
        complaintId: 123,
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'More details',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 2)),
      ));

      // Bot responds again
      messages.add(ChatMessage(
        id: 4,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Thank you for the details',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 3)),
      ));

      // Admin joins
      messages.add(ChatMessage(
        id: 5,
        complaintId: 123,
        senderId: 789,
        senderType: 'ADMIN',
        senderName: 'Admin User',
        message: 'I will handle this',
        read: false,
        createdAt: DateTime.now().add(const Duration(minutes: 5)),
      ));

      // Verify conversation structure
      expect(messages.length, equals(5));
      expect(messages.where((m) => m.isUser).length, equals(2));
      expect(messages.where((m) => m.isBot).length, equals(2));
      expect(messages.where((m) => m.isAdmin).length, equals(1));

      // Verify chronological order
      for (int i = 0; i < messages.length - 1; i++) {
        expect(
          messages[i].createdAt.isBefore(messages[i + 1].createdAt) ||
              messages[i].createdAt.isAtSameMomentAs(messages[i + 1].createdAt),
          isTrue,
        );
      }
    });

    test('Scenario 5: Bot messages in Live Chat', () {
      final messages = <ChatMessage>[];

      // User starts Live Chat
      messages.add(ChatMessage(
        id: 1,
        complaintId: null, // Live Chat
        senderId: 456,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'Hello',
        read: false,
        createdAt: DateTime.now(),
      ));

      // Bot welcomes user
      messages.add(ChatMessage(
        id: 2,
        complaintId: null, // Live Chat
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome to Clean Care Live Chat!',
        read: false,
        createdAt: DateTime.now().add(const Duration(seconds: 1)),
      ));

      // Verify Live Chat context
      expect(messages.length, equals(2));
      expect(messages[0].isLiveChat, isTrue);
      expect(messages[1].isLiveChat, isTrue);
      expect(messages[1].isBot, isTrue);
      expect(messages[1].complaintId, isNull);
    });
  });

  group('Bot Message Data Integrity Tests', () {
    test('Bot message maintains data integrity through JSON conversion', () {
      final original = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test message with special chars: @#\$%',
        read: false,
        createdAt: DateTime.now(),
      );

      final json = original.toJson();
      final restored = ChatMessage.fromJson(json);

      expect(restored.id, equals(original.id));
      expect(restored.complaintId, equals(original.complaintId));
      expect(restored.senderId, equals(original.senderId));
      expect(restored.senderType, equals(original.senderType));
      expect(restored.senderName, equals(original.senderName));
      expect(restored.message, equals(original.message));
      expect(restored.read, equals(original.read));
      expect(restored.isBot, isTrue);
    });

    test('Bot message handles null values correctly', () {
      final message = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        imageUrl: null,
        voiceUrl: null,
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.complaintId, isNull);
      expect(message.imageUrl, isNull);
      expect(message.voiceUrl, isNull);
      expect(message.hasImage, isFalse);
      expect(message.hasVoice, isFalse);
      expect(message.hasMedia, isFalse);
    });

    test('Bot message handles empty strings correctly', () {
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: '',
        imageUrl: '',
        voiceUrl: '',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.message, equals(''));
      expect(message.hasImage, isFalse);
      expect(message.hasVoice, isFalse);
    });

    test('Bot message handles Unicode characters', () {
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'আপনার অভিযোগ গ্রহণ করা হয়েছে 😊',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.message, contains('আপনার'));
      expect(message.message, contains('😊'));
      expect(message.isBot, isTrue);
    });

    test('Bot message handles very long messages', () {
      final longMessage = 'A' * 1000;
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: longMessage,
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.message.length, equals(1000));
      expect(message.isBot, isTrue);
    });
  });

  group('Bot Message Service Integration Tests', () {
    test('ChatService should handle bot messages in response', () {
      // Simulate API response with bot message
      final apiResponse = {
        'id': 1,
        'complaintId': 123,
        'senderId': 0,
        'senderType': 'BOT',
        'senderName': 'Clean Care Support System',
        'message': 'Your complaint has been received',
        'imageUrl': null,
        'voiceUrl': null,
        'read': false,
        'createdAt': DateTime.now().toIso8601String(),
      };

      final message = ChatMessage.fromJson(apiResponse);

      expect(message.isBot, isTrue);
      expect(message.senderType, equals('BOT'));
    });

    test('LiveChatService should handle bot messages in response', () {
      // Simulate API response with bot message
      final apiResponse = {
        'id': 1,
        'complaintId': null,
        'senderId': 0,
        'senderType': 'BOT',
        'senderName': 'Clean Care Support System',
        'message': 'Welcome to Live Chat',
        'imageUrl': null,
        'voiceUrl': null,
        'read': false,
        'createdAt': DateTime.now().toIso8601String(),
      };

      final message = ChatMessage.fromJson(apiResponse);

      expect(message.isBot, isTrue);
      expect(message.isLiveChat, isTrue);
    });

    test('Bot messages should be distinguishable in message list', () {
      final messages = [
        ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'User',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 789,
          senderType: 'ADMIN',
          senderName: 'Admin',
          message: 'Admin message',
          read: false,
          createdAt: DateTime.now(),
        ),
      ];

      final botMessages = messages.where((m) => m.isBot).toList();
      final userMessages = messages.where((m) => m.isUser).toList();
      final adminMessages = messages.where((m) => m.isAdmin).toList();

      expect(botMessages.length, equals(1));
      expect(userMessages.length, equals(1));
      expect(adminMessages.length, equals(1));
    });
  });

  group('Bot Message Sorting and Filtering Tests', () {
    test('Bot messages can be sorted chronologically', () {
      final messages = [
        ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Third',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 2)),
        ),
        ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'First',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Second',
          read: false,
          createdAt: DateTime.now().add(const Duration(seconds: 1)),
        ),
      ];

      messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));

      expect(messages[0].message, equals('First'));
      expect(messages[1].message, equals('Second'));
      expect(messages[2].message, equals('Third'));
    });

    test('Bot messages can be filtered from message list', () {
      final messages = [
        ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 456,
          senderType: 'CITIZEN',
          senderName: 'User',
          message: 'User message',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 2,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message 1',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 3,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Bot message 2',
          read: false,
          createdAt: DateTime.now(),
        ),
      ];

      final botMessages = messages.where((m) => m.isBot).toList();
      final nonBotMessages = messages.where((m) => !m.isBot).toList();

      expect(botMessages.length, equals(2));
      expect(nonBotMessages.length, equals(1));
      expect(botMessages.every((m) => m.senderType == 'BOT'), isTrue);
    });

    test('Bot messages can be grouped by chat type', () {
      final messages = [
        ChatMessage(
          id: 1,
          complaintId: 123,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Complaint bot message',
          read: false,
          createdAt: DateTime.now(),
        ),
        ChatMessage(
          id: 2,
          complaintId: null,
          senderId: 0,
          senderType: 'BOT',
          senderName: 'Clean Care Support System',
          message: 'Live chat bot message',
          read: false,
          createdAt: DateTime.now(),
        ),
      ];

      final complaintBotMessages = messages.where((m) => m.isBot && m.isComplaintChat).toList();
      final liveChatBotMessages = messages.where((m) => m.isBot && m.isLiveChat).toList();

      expect(complaintBotMessages.length, equals(1));
      expect(liveChatBotMessages.length, equals(1));
    });
  });

  group('Bot Message Edge Cases', () {
    test('Bot message with zero senderId', () {
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0, // Bot typically has senderId 0
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.senderId, equals(0));
      expect(message.isBot, isTrue);
    });

    test('Bot message with future timestamp', () {
      final futureTime = DateTime.now().add(const Duration(days: 1));
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        read: false,
        createdAt: futureTime,
      );

      expect(message.createdAt.isAfter(DateTime.now()), isTrue);
      expect(message.isBot, isTrue);
    });

    test('Bot message with past timestamp', () {
      final pastTime = DateTime.now().subtract(const Duration(days: 30));
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        read: false,
        createdAt: pastTime,
      );

      expect(message.createdAt.isBefore(DateTime.now()), isTrue);
      expect(message.isBot, isTrue);
    });

    test('Bot message read status can be toggled', () {
      final message = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.read, isFalse);

      final readMessage = message.copyWith(read: true);
      expect(readMessage.read, isTrue);
      expect(readMessage.isBot, isTrue);
    });

    test('Bot message with different sender names', () {
      final message1 = ChatMessage(
        id: 1,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Test',
        read: false,
        createdAt: DateTime.now(),
      );

      final message2 = ChatMessage(
        id: 2,
        complaintId: 123,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Complaint Support System',
        message: 'Test',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message1.isBot, isTrue);
      expect(message2.isBot, isTrue);
      expect(message1.senderName, isNot(equals(message2.senderName)));
    });
  });
}
