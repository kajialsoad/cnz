import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../components/custom_bottom_nav.dart';

class NoticeBoardPage extends StatefulWidget {
  const NoticeBoardPage({super.key});

  @override
  State<NoticeBoardPage> createState() => _NoticeBoardPageState();
}

class _NoticeBoardPageState extends State<NoticeBoardPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  int _currentIndex = 0;

  // Color scheme matching the home page
  static const Color green = Color(0xFF2E8B57);
  static const Color greenLight = Color(0xFF3CB371);
  static const Color greenSoft = Color(0xFF7CC289);
  static const Color yellow = Color(0xFFF6D66B);
  static const Color yellowLight = Color(0xFFFFE55C);
  static const Color red = Color(0xFFE86464);
  static const Color redLight = Color(0xFFFF6B6B);
  static const Color blue = Color(0xFF4A90E2);
  static const Color purple = Color(0xFF9B59B6);
  static const Color orange = Color(0xFFFF8C42);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3FAF5),
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
              _buildHeader(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildLatestAnnouncementsSection(),
                      const SizedBox(height: 20),
                      _buildNoticesList(),
                      const SizedBox(height: 20),
                      _buildStayUpdatedCard(),
                      const SizedBox(height: 100), // Space for bottom nav
                    ],
                  ),
                ),
              ),
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
          _handleNavigation(index);
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: green,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: green.withOpacity(0.3),
            offset: const Offset(0, 8),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'Notice Board',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: -1, duration: 600.ms).fadeIn();
  }

  Widget _buildLatestAnnouncementsSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 4),
            blurRadius: 12,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.notifications_active,
              color: green,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'Latest Announcements',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2C3E50),
            ),
          ),
        ],
      ),
    ).animate().slideX(begin: -1, duration: 800.ms).fadeIn();
  }

  Widget _buildNoticesList() {
    final notices = [
      {
        'title': 'Waste Collection Schedule Update',
        'description': 'New waste collection timings for Ward 10-15. Morning collection will now start at 7:00 AM instead of 8:00 AM.',
        'date': 'Oct 24, 2025',
        'tags': ['NEW', 'Schedule'],
        'tagColors': [red, blue],
      },
      {
        'title': 'Tree Plantation Campaign',
        'description': 'Join us for a city-wide tree plantation drive this Friday. Register through the app to participate.',
        'date': 'Oct 20, 2025',
        'tags': ['NEW', 'Event'],
        'tagColors': [red, greenSoft],
      },
      {
        'title': 'Recycling Bin Installation',
        'description': 'New recycling bins have been installed in Dhanmondi area. Please use separate bins for plastic, paper, and organic waste.',
        'date': 'Oct 18, 2025',
        'tags': ['Infrastructure'],
        'tagColors': [purple],
      },
      {
        'title': 'Public Holiday - Waste Collection',
        'description': 'Waste collection services will be suspended on public holidays. Next collection date will be announced separately.',
        'date': 'Oct 15, 2025',
        'tags': ['Holiday'],
        'tagColors': [orange],
      },
      {
        'title': 'Clean Dhaka Campaign Launch',
        'description': 'DSCC launches \'Clean Dhaka 2025\' campaign. Citizens are encouraged to report illegal dumping and participate in weekly cleaning drives.',
        'date': 'Oct 10, 2025',
        'tags': ['Campaign'],
        'tagColors': [red],
      },
    ];

    return Column(
      children: notices.asMap().entries.map((entry) {
        int index = entry.key;
        Map<String, dynamic> notice = entry.value;
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: _buildNoticeCard(
            title: notice['title'],
            description: notice['description'],
            date: notice['date'],
            tags: List<String>.from(notice['tags']),
            tagColors: List<Color>.from(notice['tagColors']),
          ),
        ).animate(delay: (index * 200).ms).slideX(begin: 1, duration: 600.ms).fadeIn();
      }).toList(),
    );
  }

  Widget _buildNoticeCard({
    required String title,
    required String description,
    required String date,
    required List<String> tags,
    required List<Color> tagColors,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            offset: const Offset(0, 2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            offset: const Offset(0, 8),
            blurRadius: 24,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tags
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tags.asMap().entries.map((entry) {
              int index = entry.key;
              String tag = entry.value;
              Color color = tagColors[index % tagColors.length];
              
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      offset: const Offset(0, 2),
                      blurRadius: 4,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Text(
                  tag,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          
          // Title
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF2C3E50),
              height: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          
          // Description
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          
          // Date
          Row(
            children: [
              Icon(
                Icons.calendar_today,
                size: 16,
                color: Colors.grey[500],
              ),
              const SizedBox(width: 8),
              Text(
                date,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStayUpdatedCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            greenSoft.withOpacity(0.1),
            green.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: green.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: green,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: green.withOpacity(0.3),
                      offset: const Offset(0, 4),
                      blurRadius: 12,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.campaign,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              const Text(
                '📢 Stay Updated',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Enable notifications to receive instant updates about waste collection schedules, events, and important announcements.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    ).animate(delay: 1000.ms).slideY(begin: 1, duration: 600.ms).fadeIn();
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        Navigator.pushReplacementNamed(context, '/');
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
        // QR Scanner
        _showQRScanner();
        break;
    }
  }

  void _showQRScanner() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR স্ক্যানার খোলা হচ্ছে...'),
        backgroundColor: Color(0xFF2E8B57),
      ),
    );
  }
}