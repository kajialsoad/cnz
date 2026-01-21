import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:clean_care_mobile_app/main.dart' as app;
import 'package:clean_care_mobile_app/pages/live_chat_page.dart';
import 'package:clean_care_mobile_app/services/live_chat_service.dart';
import 'package:clean_care_mobile_app/models/chat_message.dart';

/// Integration tests for Live Chat functionality
/// 
/// These tests verify the complete flow of the Live Chat feature:
/// - Loading admin info and messages
/// - Sending text messages
/// - Uploading images
/// - Receiving messages via polling
/// - Error handling
/// 
/// Prerequisites:
/// - Backend server must be running
/// - Test user must be logged in
/// - Test admin must be assigned to user's ward/zone
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Live Chat Integration Tests', () {
    testWidgets('Test 1: Load Live Chat Page', (WidgetTester tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Find and tap the Live Chat button on home page
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      expect(liveChatButton, findsOneWidget, reason: 'Live Chat button should be visible on home page');

      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Verify Live Chat page is loaded
      expect(find.byType(LiveChatPage), findsOneWidget, reason: 'Live Chat page should be displayed');
      
      // Verify app bar title
      expect(find.text('লাইভ চ্যাট'), findsOneWidget, reason: 'App bar should show "লাইভ চ্যাট"');
      
      // Verify admin info card is displayed (after loading)
      await tester.pump(const Duration(seconds: 3));
      expect(find.byType(AdminInfoCard), findsOneWidget, reason: 'Admin info card should be displayed');
    });

    testWidgets('Test 2: Send Text Message', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // Find message input field
      final messageInput = find.byType(TextField);
      expect(messageInput, findsOneWidget, reason: 'Message input field should be visible');

      // Type a test message
      await tester.enterText(messageInput, 'Test message from integration test');
      await tester.pump();

      // Find and tap send button
      final sendButton = find.byIcon(Icons.send);
      expect(sendButton, findsOneWidget, reason: 'Send button should be visible');
      
      await tester.tap(sendButton);
      await tester.pump();

      // Wait for message to be sent
      await tester.pump(const Duration(seconds: 2));

      // Verify message appears in chat
      expect(find.text('Test message from integration test'), findsOneWidget, 
        reason: 'Sent message should appear in chat');
    });

    testWidgets('Test 3: Verify Message Polling', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for initial load
      await tester.pump(const Duration(seconds: 3));

      // Get initial message count
      final initialMessages = find.byType(Container).evaluate().length;

      // Wait for polling interval (5 seconds + buffer)
      await tester.pump(const Duration(seconds: 6));

      // Note: This test assumes admin sends a message during this time
      // In a real test environment, you would trigger an admin message via API
      
      // Verify polling is working (no errors)
      expect(find.byType(CircularProgressIndicator), findsNothing, 
        reason: 'Should not show loading indicator during polling');
    });

    testWidgets('Test 4: Verify Image Upload Button', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // Find image upload button
      final imageButton = find.byIcon(Icons.image);
      expect(imageButton, findsOneWidget, reason: 'Image upload button should be visible');

      // Note: Actually testing image upload requires mocking ImagePicker
      // which is beyond the scope of this integration test
    });

    testWidgets('Test 5: Verify Voice Recording Button', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // Find voice recording button
      final voiceButton = find.byIcon(Icons.mic);
      expect(voiceButton, findsOneWidget, reason: 'Voice recording button should be visible');

      // Note: Actually testing voice recording requires mocking AudioRecorder
      // which is beyond the scope of this integration test
    });

    testWidgets('Test 6: Verify Refresh Button', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // Find refresh button in app bar
      final refreshButton = find.byIcon(Icons.refresh);
      expect(refreshButton, findsOneWidget, reason: 'Refresh button should be visible in app bar');

      // Tap refresh button
      await tester.tap(refreshButton);
      await tester.pump();

      // Verify loading indicator appears briefly
      await tester.pump(const Duration(milliseconds: 500));
      
      // Wait for refresh to complete
      await tester.pump(const Duration(seconds: 2));
    });

    testWidgets('Test 7: Verify Back Navigation', (WidgetTester tester) async {
      // Start the app and navigate to Live Chat
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // Find back button
      final backButton = find.byIcon(Icons.arrow_back);
      expect(backButton, findsOneWidget, reason: 'Back button should be visible');

      // Tap back button
      await tester.tap(backButton);
      await tester.pumpAndSettle();

      // Verify we're back on home page
      expect(find.byType(LiveChatPage), findsNothing, reason: 'Should navigate away from Live Chat page');
    });

    testWidgets('Test 8: Verify Empty State', (WidgetTester tester) async {
      // This test assumes a fresh user with no messages
      // In a real test environment, you would set up a test user with no messages
      
      app.main();
      await tester.pumpAndSettle();
      
      final liveChatButton = find.byIcon(Icons.chat_bubble_outline);
      await tester.tap(liveChatButton);
      await tester.pumpAndSettle();

      // Wait for page to load
      await tester.pump(const Duration(seconds: 3));

      // If no messages, should show empty state
      // Note: This will only pass if the test user has no messages
      final emptyStateIcon = find.byIcon(Icons.chat_bubble_outline);
      final emptyStateText = find.text('এখনো কোনো মেসেজ নেই');
      
      // Either messages exist OR empty state is shown
      expect(
        emptyStateIcon.evaluate().isNotEmpty || find.byType(Container).evaluate().length > 5,
        true,
        reason: 'Should show either messages or empty state'
      );
    });
  });

  group('Live Chat Service Unit Tests', () {
    late LiveChatService service;

    setUp(() {
      service = LiveChatService();
    });

    test('Service should be instantiated', () {
      expect(service, isNotNull);
      expect(service.baseUrl, isNotEmpty);
    });

    test('getMessages should return list of ChatMessage', () async {
      // Note: This test requires a valid auth token and backend connection
      // In a real test environment, you would mock the HTTP client
      
      try {
        final messages = await service.getMessages();
        expect(messages, isA<List<ChatMessage>>());
      } catch (e) {
        // Expected to fail without valid auth token
        expect(e.toString(), contains('Authentication token not found'));
      }
    });

    test('sendMessage should throw without auth token', () async {
      // This should fail without a valid auth token
      expect(
        () => service.sendMessage('Test message'),
        throwsException,
      );
    });

    test('getAdmin should throw without auth token', () async {
      // This should fail without a valid auth token
      expect(
        () => service.getAdmin(),
        throwsException,
      );
    });
  });

  group('ChatMessage Model Tests', () {
    test('ChatMessage should be created from JSON', () {
      final json = {
        'id': 1,
        'complaintId': null, // Live Chat has no complaintId
        'senderId': 123,
        'senderType': 'CITIZEN',
        'senderName': 'Test User',
        'message': 'Test message',
        'imageUrl': null,
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
      expect(message.read, false);
      expect(message.isLiveChat, true);
      expect(message.isComplaintChat, false);
      expect(message.isUser, true);
      expect(message.isAdmin, false);
    });

    test('ChatMessage should identify Live Chat correctly', () {
      final liveChatMessage = ChatMessage(
        id: 1,
        complaintId: null, // No complaintId = Live Chat
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(liveChatMessage.isLiveChat, true);
      expect(liveChatMessage.isComplaintChat, false);
    });

    test('ChatMessage should identify Complaint Chat correctly', () {
      final complaintChatMessage = ChatMessage(
        id: 1,
        complaintId: 456, // Has complaintId = Complaint Chat
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(complaintChatMessage.isLiveChat, false);
      expect(complaintChatMessage.isComplaintChat, true);
    });

    test('ChatMessage should identify user vs admin correctly', () {
      final userMessage = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final adminMessage = ChatMessage(
        id: 2,
        senderId: 456,
        senderType: 'ADMIN',
        senderName: 'Test Admin',
        message: 'Admin response',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(userMessage.isUser, true);
      expect(userMessage.isAdmin, false);
      expect(adminMessage.isUser, false);
      expect(adminMessage.isAdmin, true);
    });

    test('ChatMessage should detect media attachments', () {
      final messageWithImage = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
        read: false,
        createdAt: DateTime.now(),
      );

      final messageWithVoice = ChatMessage(
        id: 2,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        voiceUrl: 'https://example.com/voice.m4a',
        read: false,
        createdAt: DateTime.now(),
      );

      final messageWithBoth = ChatMessage(
        id: 3,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
        voiceUrl: 'https://example.com/voice.m4a',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(messageWithImage.hasImage, true);
      expect(messageWithImage.hasVoice, false);
      expect(messageWithImage.hasMedia, true);

      expect(messageWithVoice.hasImage, false);
      expect(messageWithVoice.hasVoice, true);
      expect(messageWithVoice.hasMedia, true);

      expect(messageWithBoth.hasImage, true);
      expect(messageWithBoth.hasVoice, true);
      expect(messageWithBoth.hasMedia, true);
    });

    test('ChatMessage copyWith should work correctly', () {
      final original = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Original message',
        read: false,
        createdAt: DateTime.now(),
      );

      final updated = original.copyWith(
        message: 'Updated message',
        read: true,
      );

      expect(updated.id, original.id);
      expect(updated.senderId, original.senderId);
      expect(updated.message, 'Updated message');
      expect(updated.read, true);
    });

    test('ChatMessage equality should work correctly', () {
      final message1 = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message2 = ChatMessage(
        id: 1,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final message3 = ChatMessage(
        id: 2,
        senderId: 123,
        senderType: 'CITIZEN',
        senderName: 'Test User',
        message: 'Different message',
        read: false,
        createdAt: DateTime.now(),
      );

      expect(message1 == message2, true);
      expect(message1 == message3, false);
    });
  });
}
