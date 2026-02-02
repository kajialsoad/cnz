import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
                  const SizedBox(height: 16),
                  _buildDsccInfoBox(),
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
      {
        'question': 'How can I report a waste-related problem or file a complaint?',
        'questionBn': 'আমি কিভাবে বর্জ্য সংক্রান্ত কোনো সমস্যার রিপোর্ট বা অভিযোগ জানাতে পারি?',
        'answer':
            'Reporting an issue on the Clean Care app is very simple. You can register your complaint in three different ways:\n\nApp\'s Complaint Option: Directly submit your issue through the \'Report\' or \'Complaint\' section within the app.\n\nCustomer Care Call: Call our hotline to speak directly with a representative and register your complaint.\n\nLive Chat: Connect with our support team instantly through the app\'s Live Chat feature for immediate assistance.',
        'answerBn':
            'Clean Care অ্যাপে অভিযোগ জানানো অত্যন্ত সহজ। আপনি তিনটি ভিন্ন উপায়ে আপনার অভিযোগটি নথিভুক্ত করতে পারেন:\n\nঅ্যাপের অভিযোগ অপশন: সরাসরি অ্যাপের ভেতরে \'Report\' বা \'অভিযোগ\' সেকশনে গিয়ে আপনার সমস্যাটি জমা দিতে পারেন।\n\nকাস্টমার কেয়ার কল: আমাদের হটলাইন নম্বরে কল করে সরাসরি প্রতিনিধির সাথে কথা বলে অভিযোগ করতে পারেন।\n\nলাইভ চ্যাট: তাৎক্ষণিক সাহায্যের জন্য অ্যাপের লাইভ চ্যাট ফিচারের মাধ্যমে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন।'
      },
      {
        'question': 'How do I check the current status of my submitted complaint?',
        'questionBn': 'জমা দেওয়া অভিযোগের বর্তমান অবস্থা বা \'স্ট্যাটাস\' কিভাবে চেক করব?',
        'answer':
            'To track the progress of your complaint, go to the \'All Complaints\' section of the app. There, you can view the detailed status of each complaint (e.g., Pending, In Progress, or Resolved).',
        'answerBn':
            'আপনার অভিযোগটি এখন কোন পর্যায়ে আছে তা জানতে অ্যাপের \'সকল অভিযোগ\' (All Complaints) সেকশনে যান। সেখানে আপনার প্রতিটি অভিযোগের বর্তমান অবস্থা (যেমন: পেন্ডিং, প্রসেসিং বা সমাধানকৃত) বিস্তারিতভাবে দেখতে পাবেন।'
      },
      {
        'question': 'Will I receive updates after filing a complaint?',
        'questionBn': 'অভিযোগ করার পর আমি কি কোনো আপডেট পাব?',
        'answer':
            'Yes, absolutely. We follow an automated update system. You will be notified of every stage—from the acceptance of your complaint to its final resolution—via push notifications. We recommend keeping your app\'s notification settings enabled.',
        'answerBn':
            'হ্যাঁ, অবশ্যই। আমরা একটি অটোমেটেড আপডেট সিস্টেম অনুসরণ করি। আপনার অভিযোগটি গ্রহণ করা থেকে শুরু করে সমাধান হওয়া পর্যন্ত প্রতিটি ধাপে আপনাকে পুশ নোটিফিকেশনের মাধ্যমে স্বয়ংক্রিয়ভাবে আপডেট জানানো হবে। তাই অ্যাপের নোটিফিকেশন সেটিংস সচল রাখার পরামর্শ দেওয়া হচ্ছে।'
      },
      {
        'question': 'What is the purpose of a \'Complaint ID\'?',
        'questionBn': '\'অভিযোগ আইডি\' বা কমপ্লেইন্ট আইডি-র কাজ কী?',
        'answer':
            'After submitting a complaint, the system provides you with a unique Complaint Number or ID. This ID serves as your reference. If you contact Customer Care or Live Chat later, providing this ID will help our representatives quickly track and update you on your specific issue.',
        'answerBn':
            'প্রতিটি অভিযোগ জমা দেওয়ার পর সিস্টেম থেকে আপনাকে একটি ইউনিক অভিযোগ নাম্বার বা আইডি প্রদান করা হয়। এই আইডিটি আপনার রেফারেন্স হিসেবে কাজ করে। পরবর্তীতে কাস্টমার কেয়ারে কল করলে বা লাইভ চ্যাটে কথা বললে এই আইডিটি প্রদান করলে আমাদের প্রতিনিধিরা দ্রুত আপনার সমস্যার আপডেট দিতে পারবেন।'
      },
      {
        'question': 'How quickly will my complaint be resolved?',
        'questionBn': 'অভিযোগ জানানোর পর কত দ্রুত সমাধান পাওয়া যাবে?',
        'answer':
            'The Clean Care team is committed to providing service in the shortest possible time. Once a complaint is received, it is immediately forwarded to the team responsible for that specific area. As soon as the team starts working, your complaint status will be updated in real-time within the app.\n\nThank you for staying with Clean Care to keep your city clean!',
        'answerBn':
            'Clean Care টিম দ্রুততম সময়ে সেবা প্রদানে বদ্ধপরিকর। অভিযোগ পাওয়ার সাথে সাথেই সংশ্লিষ্ট এলাকার দায়িত্বপ্রাপ্ত টিমকে জানানো হয়। টিম কাজ শুরু করার সাথে সাথে আপনার অ্যাপের স্ট্যাটাস পরিবর্তিত হবে, যা আপনি সরাসরি দেখতে পাবেন।\n\nআপনার শহরকে পরিচ্ছন্ন রাখতে Clean Care-এর সাথে থাকার জন্য ধন্যবাদ!'
      },
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
        const SizedBox(height: 12),
        const TranslatedText(
          'Review the following Q&A to ensure a smooth experience and quick resolution to any issues:',
          bn: 'আপনার যেকোনো সমস্যার দ্রুত সমাধান এবং অ্যাপের সঠিক ব্যবহার নিশ্চিত করতে নিচের প্রশ্নোত্তরগুলো দেখুন:',
          style: TextStyle(
            fontSize: 14,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 16),
        ...faqs.map((faq) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
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
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                title: TranslatedText(
                  faq['question']!,
                  bn: faq['questionBn'],
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: TranslatedText(
                      faq['answer']!,
                      bn: faq['answerBn'],
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black54,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
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
          _buildContactItem('📧', 'Email:clncrspprt@gmail.com'),
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

  Widget _buildDsccInfoBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFE6FFFA),
            const Color(0xFFE6FFFA).withOpacity(0.8),
          ],
        ),
        boxShadow: [
          // Main shadow
          BoxShadow(
            color: const Color(0xFF38A169).withOpacity(0.15),
            offset: const Offset(0, 8),
            blurRadius: 25,
            spreadRadius: 0,
          ),
          // Inner highlight
          BoxShadow(
            color: Colors.white.withOpacity(0.8),
            offset: const Offset(0, -2),
            blurRadius: 10,
            spreadRadius: -2,
          ),
        ],
        border: Border.all(
          color: const Color(0xFF38A169).withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF38A169).withOpacity(0.15),
                      const Color(0xFF38A169).withOpacity(0.05),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF38A169).withOpacity(0.2),
                      offset: const Offset(2, 2),
                      blurRadius: 8,
                      spreadRadius: -2,
                    ),
                    BoxShadow(
                      color: Colors.white.withOpacity(0.8),
                      offset: const Offset(-1, -1),
                      blurRadius: 6,
                      spreadRadius: -2,
                    ),
                  ],
                  border: Border.all(
                    color: const Color(0xFF38A169).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: const Icon(
                  Icons.info_outline,
                  color: Color(0xFF38A169),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TranslatedText(
                  'When to Call Clean Care Customer Care',
                  bn: 'কখন Clean Care এর কাস্টমার কেয়ারে কল করবেন',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF38A169),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoItem('Illegal waste dumping in progress'),
          _buildInfoItem('Hazardous waste spillage'),
          _buildInfoItem('Blocked drainage causing flooding'),
          _buildInfoItem('Dead animal removal'),
          _buildInfoItem('Environmental hazards'),
        ],
      ),
    ).animate(delay: 1000.ms)
        .fadeIn(duration: 1000.ms)
        .slideY(
          begin: 0.4,
          duration: 700.ms,
          curve: Curves.easeOutBack,
        )
        .scale(
          begin: const Offset(0.9, 0.9),
          duration: 600.ms,
          curve: Curves.easeOutBack,
        )
        .shimmer(
          duration: 2000.ms,
          color: const Color(0xFF38A169).withOpacity(0.1),
        );
  }

  Widget _buildInfoItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '• ',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2D3748),
              height: 1.4,
            ),
          ),
          Expanded(
            child: TranslatedText(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF2D3748),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
