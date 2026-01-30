import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import 'live_chat_page.dart';

class CustomerCarePage extends StatefulWidget {
  const CustomerCarePage({super.key});

  @override
  State<CustomerCarePage> createState() => _CustomerCarePageState();
}

class _CustomerCarePageState extends State<CustomerCarePage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildCallButton(),
                  const SizedBox(height: 16),
                  _buildLiveChatButton(),
                  const SizedBox(height: 16),
                  _buildFAQSection(),
                  const SizedBox(height: 16),
                  _buildContactInfo(),
                  const SizedBox(height: 80), // Space for bottom nav
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _handleNavigation(index);
        },
      ),
    );
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        // Home - Navigate to home page and clear all previous routes
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/home',
          (route) => false,
        );
        break;
      case 1:
        // Complaint List
        Navigator.pushNamed(context, '/complaint-list');
        break;
      case 4:
        // Camera
        _openCamera();
        break;
    }
  }

  void _openCamera() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              const Icon(Icons.camera_alt, color: Color(0xFF2E8B57)),
              const SizedBox(width: 8),
              const Expanded(
                child: TranslatedText(
                  'Camera',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          content: const TranslatedText(
            'Do you want to use the camera to take a photo and submit a waste complaint?',
            bn: 'আপনি একটি ছবি তুলতে এবং একটি ময়লা সংক্রান্ত অভিযোগ করতে ক্যামেরা ব্যবহার করতে চান?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const TranslatedText(
                'Cancel',
                bn: 'বাতিল',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/category-selection');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E8B57),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const TranslatedText(
                'Open Camera',
                bn: 'ক্যামেরা খুলুন',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 35, 16, 16),
      decoration: const BoxDecoration(color: Color(0xFF4CAF50)),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.home, color: Colors.white, size: 24),
            onPressed: () {
              // Navigate to home and clear all previous routes
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/home',
                (route) => false,
              );
            },
          ),
          const SizedBox(width: 8),
          const TranslatedText(
            'Customer Care',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallButton() {
    return GestureDetector(
      onTap: () async {
        final Uri phoneUri = Uri(scheme: 'tel', path: '01577262723');
        if (await canLaunchUrl(phoneUri)) {
          await launchUrl(phoneUri);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Could not open phone dialer'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF4CAF50), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.phone, color: Color(0xFF4CAF50), size: 24),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TranslatedText(
                    'Clean Care Customer Care Number',
                    bn: 'ক্লিন কেয়ার কাস্টমার কেয়ার নাম্বার',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '01577262723',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4CAF50),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: Color(0xFF4CAF50),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveChatButton() {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const LiveChatPage()),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFFC107), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.chat_bubble_outline,
                color: Color(0xFFFFC107),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TranslatedText(
                    'Live Chat Support',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  TranslatedText(
                    'Available 24/7',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQSection() {
    final faqs = [
      'How do I report a waste collection issue?',
      'When is the waste collection in my area?',
      'How can I track my complaint?',
      'What payment methods are accepted?',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.help_outline,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
            const TranslatedText(
              'Frequently Asked Questions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...faqs.map((faq) {
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 4),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  offset: const Offset(0, 1),
                  blurRadius: 3,
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TranslatedText(
                    faq,
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Colors.grey,
                  size: 20,
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildContactInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TranslatedText(
            'Contact Information',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF4CAF50),
            ),
          ),
          const SizedBox(height: 16),
          _buildContactItem('📧', 'Email: info@dscc.gov.bd'),
          const SizedBox(height: 12),
          _buildContactItem('📍', 'Address: Nagar Bhaban, Fulbaria, Dhaka'),
          const SizedBox(height: 12),
          _buildContactItem('🕒', 'Office Hours: 9:00 AM - 5:00 PM'),
        ],
      ),
    );
  }

  Widget _buildContactItem(String emoji, String text) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 12),
        Expanded(
          child: TranslatedText(
            text,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
        ),
      ],
    );
  }
}
