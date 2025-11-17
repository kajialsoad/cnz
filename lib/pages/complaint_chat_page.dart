import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../services/chat_service.dart';
import '../models/chat_message.dart' as model;

/// Real-time chat page for complaint communication
/// Connects to backend API for actual admin-citizen chat
class ComplaintChatPage extends StatefulWidget {
  final String complaintId;
  final String complaintTitle;

  const ComplaintChatPage({
    super.key,
    required this.complaintId,
    required this.complaintTitle,
  });

  @override
  State<ComplaintChatPage> createState() => _ComplaintChatPageState();
}

class _ComplaintChatPageState extends State<ComplaintChatPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _typingController;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();

  List<model.ChatMessage> messages = [];
  bool isLoading = true;
  bool isSending = false;
  bool hasError = false;
  String errorMessage = '';
  Timer? _pollingTimer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _typingController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    // Load initial messages
    _loadMessages();

    // Start polling for new messages every 5 seconds
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _backgroundController.dispose();
    _typingController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Load messages from server
  Future<void> _loadMessages() async {
    try {
      setState(() {
        isLoading = true;
        hasError = false;
      });

      final complaintIdInt = int.parse(widget.complaintId);
      final fetchedMessages = await _chatService.getChatMessages(complaintIdInt);

      setState(() {
        messages = fetchedMessages;
        isLoading = false;
      });

      // Mark messages as read
      await _chatService.markMessagesAsRead(complaintIdInt);

      // Scroll to bottom
      _scrollToBottom();
    } catch (e) {
      setState(() {
        isLoading = false;
        hasError = true;
        errorMessage = e.toString();
      });
      print('Error loading messages: $e');
    }
  }

  /// Start polling for new messages
  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _loadMessagesQuietly();
    });
  }

  /// Load messages without showing loading indicator
  Future<void> _loadMessagesQuietly() async {
    try {
      final complaintIdInt = int.parse(widget.complaintId);
      final fetchedMessages = await _chatService.getChatMessages(complaintIdInt);

      // Only update if there are new messages
      if (fetchedMessages.length != messages.length) {
        setState(() {
          messages = fetchedMessages;
        });
        await _chatService.markMessagesAsRead(complaintIdInt);
        _scrollToBottom();
      }
    } catch (e) {
      print('Error polling messages: $e');
      // Don't show error for polling failures
    }
  }

  /// Send message to server
  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || isSending) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      isSending = true;
    });

    try {
      final complaintIdInt = int.parse(widget.complaintId);
      final sentMessage = await _chatService.sendMessage(
        complaintIdInt,
        messageText,
      );

      setState(() {
        messages.add(sentMessage);
        isSending = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        isSending = false;
      });

      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TranslatedText('মেসেজ পাঠাতে ব্যর্থ: ${e.toString()}'),
            backgroundColor: Colors.red,
            action: SnackBarAction(
              label: 'পুনরায় চেষ্টা করুন',
              textColor: Colors.white,
              onPressed: () {
                _messageController.text = messageText;
              },
            ),
          ),
        );
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      extendBody: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE9F6EE),
              Color(0xFFF7FCF9),
              Color(0xFFF3FAF5),
            ],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Expanded(
                child: _buildChatArea(),
              ),
              _buildMessageInput(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/emergency');
              break;
            case 2:
              Navigator.pushReplacementNamed(context, '/waste-management');
              break;
            case 3:
              Navigator.pushReplacementNamed(context, '/gallery');
              break;
            case 4:
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: TranslatedText('QR স্ক্যানার খোলা হচ্ছে...'),
                  backgroundColor: Color(0xFF2E8B57),
                ),
              );
              break;
          }
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF2E8B57),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          const SizedBox(width: 4),
          const CircleAvatar(
            radius: 16,
            backgroundColor: Color(0xFF2E8B57),
            child: Icon(
              Icons.support_agent,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const TranslatedText(
                  'DSCC Support',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.complaintTitle,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: _loadMessages,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildChatArea() {
    if (isLoading && messages.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
        ),
      );
    }

    if (hasError && messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const TranslatedText(
                'মেসেজ লোড করতে ব্যর্থ',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadMessages,
                icon: const Icon(Icons.refresh),
                label: const TranslatedText('পুনরায় চেষ্টা করুন'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E8B57),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(
                Icons.chat_bubble_outline,
                size: 64,
                color: Colors.grey,
              ),
              SizedBox(height: 16),
              TranslatedText(
                'এখনো কোনো মেসেজ নেই',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
              SizedBox(height: 8),
              TranslatedText(
                'প্রথম মেসেজ পাঠিয়ে কথোপকথন শুরু করুন',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        controller: _scrollController,
        itemCount: messages.length,
        itemBuilder: (context, index) {
          return _buildMessageBubble(messages[index], index);
        },
      ),
    );
  }

  Widget _buildMessageBubble(model.ChatMessage message, int index) {
    final isUser = message.isUser;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.support_agent,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser
                    ? const LinearGradient(
                        colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                      )
                    : null,
                color: isUser ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isUser
                        ? const Color(0xFF2E8B57).withOpacity(0.3)
                        : Colors.black.withOpacity(0.1),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sender name for admin messages
                  if (!isUser) ...[
                    Text(
                      message.senderName,
                      style: const TextStyle(
                        color: Color(0xFF2E8B57),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Message text
                  Text(
                    message.message,
                    style: TextStyle(
                      color: isUser ? Colors.white : Colors.black87,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                  // Image if present
                  if (message.imageUrl != null) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        message.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            padding: const EdgeInsets.all(8),
                            color: Colors.grey[300],
                            child: const Icon(Icons.broken_image),
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  // Timestamp
                  Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      color: isUser ? Colors.white70 : Colors.grey.shade600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFF6D66B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.person,
                color: Colors.white,
                size: 16,
              ),
            ),
          ],
        ],
      ),
    ).animate(delay: (index * 100).ms).fadeIn(duration: 400.ms).slideY(
          begin: 0.3,
          duration: 300.ms,
          curve: Curves.easeOut,
        );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, -2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                decoration: const InputDecoration(
                  hintText: 'মেসেজ লিখুন...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                onSubmitted: (_) => _sendMessage(),
                enabled: !isSending,
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: isSending ? null : _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isSending
                      ? [Colors.grey, Colors.grey]
                      : [const Color(0xFF2E8B57), const Color(0xFF3CB371)],
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2E8B57).withOpacity(0.3),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) {
      return 'এখনই';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} মিনিট আগে';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} ঘণ্টা আগে';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} দিন আগে';
    } else {
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');
      return '${time.day}/${time.month}/${time.year} $hour:$minute';
    }
  }
}
