import 'package:flutter_test/flutter_test.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';
import 'package:clean_care_mobile_app/services/live_chat_service.dart';

/// Quick unit tests for Live Chat functionality
/// Run with: flutter test test/live_chat_quick_test.dart
void main() {
  group('ChatMessage Model Tests', () {
    test('Live Chat message should have null complaintId', () {
      final message = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.isLiveChat, true);
      expect(message.isComplaintChat, false);
      expect(message.complaintId, null);
    });

    test('Complaint Chat message should have complaintId', () {
      final message = ChatMessage(
        id: 1,
        complaintId: 456,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.isLiveChat, false);
      expect(message.isComplaintChat, true);
      expect(message.complaintId, 456);
    });

    test('User message should be identified correctly', () {
      final message = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.isUser, true);
      expect(message.isAdmin, false);
      expect(message.senderType, 'CITIZEN');
    });

    test('Admin message should be identified correctly', () {
      final message = ChatMessage(
        id: 1,
        senderId: 456,
        senderType: 'ADMIN',
        senderName: 'Test Admin',
        message: 'Admin response',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.isUser, false);
      expect(message.isAdmin, true);
      expect(message.senderType, 'ADMIN');
    });

    test('Message with image should be detected', () {
      final message = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.hasImage, true);
      expect(message.hasVoice, false);
      expect(message.hasMedia, true);
    });

    test('Message with voice should be detected', () {
      final message = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        voiceUrl: 'https://example.com/voice.m4a',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.hasImage, false);
      expect(message.hasVoice, true);
      expect(message.hasMedia, true);
    });

    test('Message without media should be detected', () {
      final message = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message.hasImage, false);
      expect(message.hasVoice, false);
      expect(message.hasMedia, false);
    });

    test('ChatMessage should serialize to JSON correctly', () {
      final message = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
        voiceUrl: null,
        read: false,
        createdAt: DateTime.parse('2026-01-20T10:00:00.000Z'),
      );

      final json = message.toJson();

      expect(json['id'], 1);
      expect(json['complaintId'], null);
      expect(json['senderId'], 123);
      expect(json['senderType'], 'CITIZEN');
      expect(json['senderName'], 'Test User');
      expect(json['message'], 'Test message');
      expect(json['imageUrl'], 'https://example.com/image.jpg');
      expect(json['voiceUrl'], null);
      expect(json['read'], false);
      expect(json['createdAt'], '2026-01-20T10:00:00.000Z');
    });

    test('ChatMessage should deserialize from JSON correctly', () {
      final json = {
        'id': 1,
        'complaintId': null,
        'senderId': 123,
        'senderType': 'CITIZEN',
        'senderName': 'Test User',
        'message': 'Test message',
        'imageUrl': 'https://example.com/image.jpg',
        'voiceUrl': null,
        'read': false,
        'createdAt': '2026-01-20T10:00:00.000Z',
      };

      final message = ChatMessage.fromJson(json);

      expect(message.id, 1);
      expect(message.complaintId, null);
      expect(message.senderId, 123);
      expect(message.senderType, 'CITIZEN');
      expect(message.senderName, 'Test User');
      expect(message.message, 'Test message');
      expect(message.imageUrl, 'https://example.com/image.jpg');
      expect(message.voiceUrl, null);
      expect(message.read, false);
      expect(message.isLiveChat, true);
    });

    test('ChatMessage copyWith should preserve null complaintId', () {
      final original = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Original message',
        read: false,
        createdAt: DateTime.now(),
      );

      final updated = original.copyWith(message: 'Updated message');

      expect(updated.complaintId, null);
      expect(updated.isLiveChat, true);
      expect(updated.message, 'Updated message');
    });

    test('ChatMessage equality should handle null complaintId', () {
      final message1 = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message2 = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message1 == message2, true);
      expect(message1.hashCode == message2.hashCode, true);
    });

    test('ChatMessage toString should show chat type', () {
      final liveChatMessage = ChatMessage(
        id: 1,
        complaintId: null,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final complaintChatMessage = ChatMessage(
        id: 2,
        complaintId: 456,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(liveChatMessage.toString(), contains('Live'));
      expect(complaintChatMessage.toString(), contains('Complaint'));
    });
  });

  group('LiveChatService Tests', () {
    late LiveChatService service;

    setUp(() {
      service = LiveChatService();
    });

    test('Service should be instantiated', () {
      expect(service, isNotNull);
    });

    test('Service should have baseUrl', () {
      expect(service.baseUrl, isNotEmpty);
    });

    test('getMessages should throw without auth token', () async {
      // This should fail without a valid auth token
      expect(
        () => service.getMessages(),
        throwsA(isA<Exception>()),
      );
    });

    test('sendMessage should throw without auth token', () async {
      // This should fail without a valid auth token
      expect(
        () => service.sendMessage('Test message'),
        throwsA(isA<Exception>()),
      );
    });

    test('markAsRead should not throw (non-critical operation)', () async {
      // markAsRead should not throw even without auth token
      // It just logs the error
      await service.markAsRead();
      // If we get here, the test passes
      expect(true, true);
    });

    test('getAdmin should throw without auth token', () async {
      // This should fail without a valid auth token
      expect(
        () => service.getAdmin(),
        throwsA(isA<Exception>()),
      );
    });

    test('getUnreadMessageCount should return 0 on error', () async {
      // Should return 0 instead of throwing
      final count = await service.getUnreadMessageCount();
      expect(count, 0);
    });
  });
}
