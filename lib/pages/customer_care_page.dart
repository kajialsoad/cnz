import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class CustomerCarePage extends StatefulWidget {
  const CustomerCarePage({super.key});

  @override
  State<CustomerCarePage> createState() => _CustomerCarePageState();
}

class _CustomerCarePageState extends State<CustomerCarePage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _cardController;

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _cardController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    )..forward();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _cardController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
          child: Column(
            children: [
              _buildAppBar(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildWelcomeCard(),
                      const SizedBox(height: 20),
                      _buildQuickActions(),
                      const SizedBox(height: 20),
                      _buildFAQSection(),
                      const SizedBox(height: 20),
                      _buildContactInfo(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: const Icon(
                Icons.arrow_back,
                color: Color(0xFF2E8B57),
              ),
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Text(
              'কাস্টমার কেয়ার',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2E8B57),
              ),
            ),
          ),
          AnimatedBuilder(
            animation: _backgroundController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _backgroundController.value * 2 * 3.14159,
                child: const Icon(
                  Icons.support_agent,
                  color: Color(0xFF2E8B57),
                  size: 28,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF2E8B57),
            Color(0xFF3CB371),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2E8B57).withOpacity(0.3),
            offset: const Offset(0, 4),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.waving_hand,
            color: Colors.white,
            size: 32,
          ),
          const SizedBox(height: 12),
          const Text(
            'স্বাগতম!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'আমরা আপনার সেবায় ২৪/৭ প্রস্তুত। আপনার যেকোনো সমস্যার সমাধানে আমাদের সাথে যোগাযোগ করুন।',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).slideY(
          begin: 0.3,
          duration: 400.ms,
          curve: Curves.easeOut,
        );
  }

  Widget _buildQuickActions() {
    final actions = [
      {
        'title': 'নতুন টিকেট',
        'subtitle': 'সমস্যা রিপোর্ট করুন',
        'icon': Icons.add_circle_outline,
        'color': const Color(0xFF2E8B57),
      },
      {
        'title': 'টিকেট ট্র্যাক',
        'subtitle': 'অগ্রগতি দেখুন',
        'icon': Icons.track_changes,
        'color': const Color(0xFFF6D66B),
      },
      {
        'title': 'লাইভ চ্যাট',
        'subtitle': 'তাৎক্ষণিক সাহায্য',
        'icon': Icons.chat_bubble_outline,
        'color': const Color(0xFF3CB371),
      },
      {
        'title': 'কল করুন',
        'subtitle': 'হটলাইন: ১৬২৬৩',
        'icon': Icons.phone,
        'color': const Color(0xFFE86464),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'দ্রুত সেবা',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E8B57),
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final action = actions[index];
            return GestureDetector(
              onTap: () => _handleActionTap(action['title'] as String),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: (action['color'] as Color).withOpacity(0.2),
                      offset: const Offset(0, 4),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      action['icon'] as IconData,
                      color: action['color'] as Color,
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      action['title'] as String,
                      style: TextStyle(
                        color: action['color'] as Color,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      action['subtitle'] as String,
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ).animate(delay: (index * 100).ms).fadeIn(duration: 400.ms).scale(
                  begin: const Offset(0.8, 0.8),
                  duration: 300.ms,
                  curve: Curves.elasticOut,
                );
          },
        ),
      ],
    );
  }

  Widget _buildFAQSection() {
    final faqs = [
      {
        'question': 'কিভাবে অভিযোগ দাখিল করব?',
        'answer': 'হোম পেজের কেন্দ্রীয় লাল বাটনে ক্লিক করে অভিযোগ দাখিল করতে পারেন।',
      },
      {
        'question': 'পেমেন্ট কিভাবে করব?',
        'answer': 'পেমেন্ট গেটওয়ে সেকশনে গিয়ে বিকাশ, নগদ বা কার্ড দিয়ে পেমেন্ট করতে পারেন।',
      },
      {
        'question': 'বর্জ্য সংগ্রহের সময় কখন?',
        'answer': 'বর্জ্য ব্যবস্থাপনা পেজে আপনার ওয়ার্ডের সময়সূচী দেখতে পারেন।',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'সচরাচর জিজ্ঞাসা',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E8B57),
          ),
        ),
        const SizedBox(height: 16),
        ...faqs.asMap().entries.map((entry) {
          final index = entry.key;
          final faq = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  offset: const Offset(0, 2),
                  blurRadius: 8,
                ),
              ],
            ),
            child: ExpansionTile(
              title: Text(
                faq['question']!,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E8B57),
                ),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    faq['answer']!,
                    style: const TextStyle(
                      color: Colors.grey,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ).animate(delay: (index * 150).ms).fadeIn(duration: 400.ms).slideX(
                begin: 0.3,
                duration: 300.ms,
                curve: Curves.easeOut,
              );
        }).toList(),
      ],
    );
  }

  Widget _buildContactInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, 4),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'যোগাযোগের তথ্য',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2E8B57),
            ),
          ),
          const SizedBox(height: 16),
          _buildContactItem(
            Icons.phone,
            'হটলাইন',
            '১৬২৬৩',
            const Color(0xFFE86464),
          ),
          const SizedBox(height: 12),
          _buildContactItem(
            Icons.email,
            'ইমেইল',
            'info@dscc.gov.bd',
            const Color(0xFF2E8B57),
          ),
          const SizedBox(height: 12),
          _buildContactItem(
            Icons.location_on,
            'ঠিকানা',
            'নগর ভবন, ঢাকা দক্ষিণ সিটি কর্পোরেশন',
            const Color(0xFFF6D66B),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).slideY(
          begin: 0.3,
          duration: 400.ms,
          curve: Curves.easeOut,
        );
  }

  Widget _buildContactItem(
    IconData icon,
    String title,
    String value,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: color,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _handleActionTap(String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$action সেকশনে যাচ্ছি...'),
        backgroundColor: const Color(0xFF2E8B57),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}