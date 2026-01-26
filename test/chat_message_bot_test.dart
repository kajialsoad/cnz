import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';

/// Test file for ChatMessage BOT sender type support
/// Run with: flutter test test/chat_message_bot_test.dart
void main() {
  group('ChatMessage BOT Sender Type Tests', () {
    test('Bot message should be identified correctly', () {
      final botMessage = ChatMessage(
        id: 1,
        senderId: 0, // Bot has no specific sender ID
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome to Clean Care Live Chat!',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, true);
      expect(botMessage.isAdmin, false);
      expect(botMessage.isUser, false);
      expect(botMessage.senderType, 'BOT');
    });

    test('Bot message should serialize to JSON correctly', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Your complaint has been received',
        read: false,
        createdAt: DateTime(2024, 1, 1, 12, 0),
      );

      final json = botMessage.toJson();

      expect(json['id'], 1);
      expect(json['senderType'], 'BOT');
      expect(json['senderName'], 'Clean Care Support System');
      expect(json['message'], 'Your complaint has been received');
    });

    test('Bot message should deserialize from JSON correctly', () {
      final json = {
        'id': 1,
        'complaintId': null,
        'senderId': 0,
        'senderType': 'BOT',
        'senderName': 'Clean Care Support System',
        'message': 'Welcome to Clean Care Live Chat!',
        'imageUrl': null,
        'voiceUrl': null,
        'read': false,
        'createdAt': '2024-01-01T12:00:00.000Z',
      };

      final message = ChatMessage.fromJson(json);

      expect(message.id, 1);
      expect(message.senderType, 'BOT');
      expect(message.senderName, 'Clean Care Support System');
      expect(message.isBot, true);
      expect(message.isAdmin, false);
      expect(message.isUser, false);
    });

    test('Bot message in Live Chat should be identified correctly', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: null, // Live Chat
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'How can we help you today?',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, true);
      expect(botMessage.isLiveChat, true);
      expect(botMessage.isComplaintChat, false);
    });

    test('Bot message in Complaint Chat should be identified correctly', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: 456, // Complaint Chat
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Complaint Support System',
        message: 'Your complaint is being reviewed',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.isBot, true);
      expect(botMessage.isLiveChat, false);
      expect(botMessage.isComplaintChat, true);
    });

    test('Bot message copyWith should work correctly', () {
      final original = ChatMessage(
        id: 1,
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

      expect(updated.senderType, 'BOT');
      expect(updated.isBot, true);
      expect(updated.message, 'Updated message');
      expect(updated.read, true);
    });

    test('Bot message equality should work correctly', () {
      final message1 = ChatMessage(
        id: 1,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message2 = ChatMessage(
        id: 1,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message1, equals(message2));
    });

    test('Bot message toString should show BOT sender type', () {
      final botMessage = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Welcome message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(botMessage.toString(), contains('BOT'));
      expect(botMessage.toString(), contains('Live'));
    });

    test('Different sender types should be distinguished', () {
      final userMessage = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'John Doe',
        message: 'User message',
        read: false,
        createdAt: DateTime.now(),
      );

      final adminMessage = ChatMessage(
        id: 2,
        senderId: 456,
        senderType: 'ADMIN',
        senderName: 'Admin User',
        message: 'Admin message',
        read: false,
        createdAt: DateTime.now(),
      );

      final botMessage = ChatMessage(
        id: 3,
        senderId: 0,
        senderType: 'BOT',
        senderName: 'Clean Care Support System',
        message: 'Bot message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(userMessage.isUser, true);
      expect(userMessage.isAdmin, false);
      expect(userMessage.isBot, false);

      expect(adminMessage.isUser, false);
      expect(adminMessage.isAdmin, true);
      expect(adminMessage.isBot, false);

      expect(botMessage.isUser, false);
      expect(botMessage.isAdmin, false);
      expect(botMessage.isBot, true);
    });
  });
}
