import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../components/custom_bottom_nav.dart';

class LiveChatPage extends StatefulWidget {
  const LiveChatPage({super.key});

  @override
  State<LiveChatPage> createState() => _LiveChatPageState();
}

class _LiveChatPageState extends State<LiveChatPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _typingController;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  int _currentIndex = 0;

  List<ChatMessage> messages = [
    ChatMessage(
      text: 'স্বাগতম! আমি আপনার সহায়তার জন্য এখানে আছি। কিভাবে সাহায্য করতে পারি?',
      isUser: false,
      timestamp: DateTime.now().subtract(const Duration(minutes: 2)),
    ),
  ];

  bool isTyping = false;

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
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _typingController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
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
                  content: Text('QR স্ক্যানার খোলা হচ্ছে...'),
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
          // Avatar with initials like image 1
          CircleAvatar(
            radius: 16,
            backgroundColor: const Color(0xFF2E8B57),
            child: const Text(
              'DO',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text(
                'DSCC Officer',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Online',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.call, color: Colors.white),
          onPressed: () => _makePhoneCall('16263'),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildChatArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        controller: _scrollController,
        itemCount: messages.length + (isTyping ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == messages.length && isTyping) {
            return _buildTypingIndicator();
          }
          return _buildMessageBubble(messages[index], index);
        },
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('কল করতে পারছি না: $phoneNumber'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildMessageBubble(ChatMessage message, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!message.isUser) ...[
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
                gradient: message.isUser
                    ? const LinearGradient(
                        colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                      )
                    : null,
                color: message.isUser ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(message.isUser ? 16 : 4),
                  bottomRight: Radius.circular(message.isUser ? 4 : 16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: message.isUser
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
                  Text(
                    message.text,
                    style: TextStyle(
                      color: message.isUser ? Colors.white : Colors.black87,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.timestamp),
                    style: TextStyle(
                      color: message.isUser
                          ? Colors.white70
                          : Colors.grey.shade600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (message.isUser) ...[
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

  Widget _buildTypingIndicator() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  offset: const Offset(0, 2),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedBuilder(
                  animation: _typingController,
                  builder: (context, child) {
                    return Row(
                      children: List.generate(3, (index) {
                        final delay = index * 0.3;
                        final value = (_typingController.value + delay) % 1.0;
                        return Container(
                          margin: const EdgeInsets.only(right: 4),
                          child: Transform.scale(
                            scale: 0.5 + (0.5 * (1 - (value - 0.5).abs() * 2)),
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2E8B57),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        );
                      }),
                    );
                  },
                ),
                const SizedBox(width: 8),
                const Text(
                  'টাইপ করছে...',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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
          // Location Share Button
          GestureDetector(
            onTap: _shareLocation,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF2E8B57).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.location_on,
                color: Color(0xFF2E8B57),
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Photo Share Button
          GestureDetector(
            onTap: _sharePhoto,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF2E8B57).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.photo_camera,
                color: Color(0xFF2E8B57),
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
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
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
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
              child: const Icon(
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

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final message = ChatMessage(
      text: _messageController.text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      messages.add(message);
      isTyping = true;
    });

    _messageController.clear();
    _scrollToBottom();

    // Simulate bot response
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isTyping = false;
          messages.add(ChatMessage(
            text: _getBotResponse(message.text),
            isUser: false,
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  void _shareLocation() {
    // Show location sharing confirmation dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('লোকেশন শেয়ার করুন'),
          content: const Text('আপনি কি আপনার বর্তমান লোকেশন শেয়ার করতে চান?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('বাতিল'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _sendLocationMessage();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E8B57),
              ),
              child: const Text('শেয়ার করুন', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  void _sendLocationMessage() {
    final locationMessage = ChatMessage(
      text: '📍 আমার বর্তমান লোকেশন: ঢাকা, বাংলাদেশ\n(অক্ষাংশ: 23.8103, দ্রাঘিমাংশ: 90.4125)',
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      messages.add(locationMessage);
      isTyping = true;
    });

    _scrollToBottom();

    // Simulate bot response for location
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isTyping = false;
          messages.add(ChatMessage(
            text: 'ধন্যবাদ আপনার লোকেশন শেয়ার করার জন্য। আমরা আপনার এলাকার সেবা সম্পর্কে তথ্য দিতে পারব।',
            isUser: false,
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  void _sharePhoto() {
    // Show photo sharing options dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('ছবি শেয়ার করুন'),
          content: const Text('আপনি কোন উপায়ে ছবি শেয়ার করতে চান?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('বাতিল'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _selectPhotoFromGallery();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E8B57),
              ),
              child: const Text('গ্যালারি থেকে', style: TextStyle(color: Colors.white)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _takePhoto();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3CB371),
              ),
              child: const Text('ক্যামেরা', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  void _selectPhotoFromGallery() {
    // Simulate photo selection from gallery
    final photoMessage = ChatMessage(
      text: '📷 ছবি শেয়ার করা হয়েছে\n(গ্যালারি থেকে নির্বাচিত)',
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      messages.add(photoMessage);
      isTyping = true;
    });

    _scrollToBottom();

    // Simulate bot response for photo
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isTyping = false;
          messages.add(ChatMessage(
            text: 'ছবিটি পেয়েছি। আমরা এটি পর্যালোচনা করে আপনাকে সাহায্য করার চেষ্টা করব।',
            isUser: false,
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  void _takePhoto() {
    // Simulate taking photo with camera
    final photoMessage = ChatMessage(
      text: '📸 ছবি তোলা হয়েছে\n(ক্যামেরা ব্যবহার করে)',
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      messages.add(photoMessage);
      isTyping = true;
    });

    _scrollToBottom();

    // Simulate bot response for photo
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isTyping = false;
          messages.add(ChatMessage(
            text: 'নতুন ছবিটি পেয়েছি। আমরা এটি বিশ্লেষণ করে আপনাকে উপযুক্ত সাহায্য প্রদান করব।',
            isUser: false,
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  String _getBotResponse(String userMessage) {
    final responses = [
      'ধন্যবাদ আপনার মেসেজের জন্য। আমি আপনার সমস্যা বুঝতে পেরেছি।',
      'আপনার অনুরোধটি আমাদের টিমের কাছে পাঠানো হয়েছে। শীঘ্রই উত্তর পাবেন।',
      'এই বিষয়ে আরো তথ্যের জন্য আমাদের হটলাইন ১৬২৬৩ এ যোগাযোগ করতে পারেন।',
      'আপনার সমস্যার সমাধানের জন্য আমরা কাজ করছি। ধৈর্য ধরুন।',
    ];
    return responses[DateTime.now().millisecond % responses.length];
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

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}