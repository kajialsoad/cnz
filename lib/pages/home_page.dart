import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:math' as math;
import '../components/elevated_3d_button.dart';
import '../components/dscc_notice_board.dart';
import '../components/stats_card.dart';
import '../components/custom_bottom_nav.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _floatingController;
  int _currentIndex = 0;

  static const Color green = Color(0xFF2E8B57);
  static const Color greenLight = Color(0xFF3CB371);
  static const Color greenSoft = Color(0xFF7CC289);
  static const Color yellow = Color(0xFFF6D66B);
  static const Color yellowLight = Color(0xFFFFE55C);
  static const Color red = Color(0xFFE86464);
  static const Color redLight = Color(0xFFFF6B6B);

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();
    
    _floatingController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _floatingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3FAF5),
      extendBody: true, // Allow bottom nav to extend over body
      appBar: _buildAppBar(),
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
          child: SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 20),
                _buildFeatureCluster(),
                const SizedBox(height: 30),
                const DSCCNoticeBoard(),
                const SizedBox(height: 20),
                _buildStatsCards(),
                const SizedBox(height: 100), // Space for bottom nav
              ],
            ),
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

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: green,
      foregroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: 72,
      leadingWidth: 80,
      leading: Padding(
        padding: const EdgeInsets.only(left: 12.0),
        child: AnimatedBuilder(
          animation: _backgroundController,
          builder: (context, child) {
            return Transform.rotate(
              angle: _backgroundController.value * 2 * math.pi,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      offset: const Offset(0, 2),
                      blurRadius: 4,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.recycling,
                  color: Color(0xFF4CAF50),
                  size: 24,
                ),
              ),
            );
          },
        ),
      ),
      titleSpacing: 16,
      title: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Clean Care',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
          SizedBox(height: 2),
          Text(
            'Your City, Your Care',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
        ],
      ),
      actions: [
        // BD Language Icon
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: GestureDetector(
            onTap: () {
              _handleLanguageSwitch();
            },
            child: Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50), // Modern green background
                borderRadius: BorderRadius.circular(19),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    offset: const Offset(0, 2),
                    blurRadius: 4,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.language,
                    color: Colors.white,
                    size: 18,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'BD',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 12.0),
          child: PopupMenuButton<String>(
            icon: const Icon(Icons.menu, color: Colors.white),
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 8,
            offset: const Offset(-200, 50),
            constraints: const BoxConstraints(
              minWidth: 200,
              maxWidth: 250,
            ),
            itemBuilder: (BuildContext context) => [
              // Profile Settings
              PopupMenuItem<String>(
                value: 'profile',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.person, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Profile Settings',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Government Calendar
              PopupMenuItem<String>(
                value: 'calendar',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.calendar_today, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Government Calendar',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Notice Board
              PopupMenuItem<String>(
                value: 'notice',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: Image.asset(
                          'assets/logo.png',
                          width: 20,
                          height: 20,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Notice Board',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Language Switch
              PopupMenuItem<String>(
                value: 'language',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.language, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Language Switch',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Divider
              const PopupMenuDivider(height: 1),
              // Language Section Header
              PopupMenuItem<String>(
                enabled: false,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  'Language / ভাষা',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              // English Button
              PopupMenuItem<String>(
                value: 'english',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  decoration: BoxDecoration(
                    color: green,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'English',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              // Bengali Button
              PopupMenuItem<String>(
                value: 'bengali',
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: green, width: 1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'বাংলা',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: green,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
            onSelected: (String value) {
              _handleMenuSelection(value);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFeatureCluster() {
    final screenWidth = MediaQuery.of(context).size.width;
    // Responsive circle size: small phones -> 100, medium -> 120, large -> 140
    final double diameter = screenWidth < 360
        ? 100
        : (screenWidth < 480 ? 120 : 140);
    final double clusterHeight = diameter * 3 + 60; // room for 3 rows + gaps

    return Container(
      height: clusterHeight,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      child: _buildFlowerPetalLayout(diameter),
    );
  }

  Widget _buildBackgroundIcons() {
    return AnimatedBuilder(
      animation: _floatingController,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: 50 + _floatingController.value * 10,
              left: 30,
              child: Opacity(
                opacity: 0.1,
                child: Icon(
                  Icons.eco,
                  size: 40,
                  color: green,
                ),
              ),
            ),
            Positioned(
              top: 100 + _floatingController.value * 15,
              right: 40,
              child: Opacity(
                opacity: 0.08,
                child: Icon(
                  Icons.recycling,
                  size: 50,
                  color: yellow,
                ),
              ),
            ),
            Positioned(
              bottom: 80 + _floatingController.value * 12,
              left: 50,
              child: Opacity(
                opacity: 0.06,
                child: Icon(
                  Icons.nature,
                  size: 35,
                  color: greenSoft,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFlowerPetalLayout(double diameter) {
    final double gap = diameter * 0.18; // vertical gap between rows

    Widget buildCircleButton({
      required String title,
      required String subtitle,
      required IconData icon,
      required Color primary,
      required Color secondary,
      required VoidCallback onTap,
      double? size,
    }) {
      final double s = size ?? diameter;
      return Elevated3DButton(
        title: title,
        subtitle: subtitle,
        icon: icon,
        primaryColor: primary,
        secondaryColor: secondary,
        width: s,
        height: s,
        isOval: false, // perfect circle
        isFlat: true, // remove 3D and make 2D flat
        onTap: onTap,
      );
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            buildCircleButton(
              title: "Customer Care",
              subtitle: "24/7 Support",
              icon: Icons.headset_mic,
              primary: green,
              secondary: greenLight,
              onTap: () => _navigateToPage('/customer-care'),
            ),
            buildCircleButton(
              title: "Live Chat",
              subtitle: "Instant Help",
              icon: Icons.chat_bubble_outline,
              primary: green,
              secondary: greenLight,
              onTap: () => _navigateToPage('/live-chat'),
            ),
          ],
        ),
        SizedBox(height: gap),
        Elevated3DButton(
          title: "অভিযোগ",
          subtitle: "Complaint",
          icon: Icons.warning,
          primaryColor: red,
          secondaryColor: redLight,
          width: diameter * 0.9,
          height: diameter * 0.9,
          isOval: false,
          isFlat: true,
          onTap: () => _navigateToPage('/complaint'),
        ),
        SizedBox(height: gap),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            buildCircleButton(
              title: "Payment Gateway",
              subtitle: "Pay Bills",
              icon: Icons.credit_card,
              primary: yellow,
              secondary: yellowLight,
              onTap: () => _navigateToPage('/payment'),
            ),
            buildCircleButton(
              title: "Donation",
              subtitle: "Help City",
              icon: Icons.favorite_border,
              primary: yellow,
              secondary: yellowLight,
              onTap: () => _navigateToPage('/donation'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsCards() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: StatsCard(
              title: "Active Support",
              value: "24/7",
              icon: Icons.support_agent,
              primaryColor: greenSoft,
              secondaryColor: const Color(0xFF90EE90),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: StatsCard(
              title: "Issues Resolved",
              value: "1500+",
              icon: Icons.volunteer_activism,
              primaryColor: yellow,
              secondaryColor: yellowLight,
            ),
          ),
        ],
      ),
    );
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        // Home - already here
        break;
      case 1:
        _navigateToPage('/emergency');
        break;
      case 2:
        _navigateToPage('/waste-management');
        break;
      case 3:
        _navigateToPage('/gallery');
        break;
      case 4:
        // QR Scanner
        _showQRScanner();
        break;
    }
  }

  void _navigateToPage(String route) {
    Navigator.pushNamed(context, route);
  }

  void _showQRScanner() {
    // TODO: Implement QR scanner
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR স্ক্যানার খোলা হচ্ছে...'),
        backgroundColor: Color(0xFF2E8B57),
      ),
    );
  }

  void _handleLanguageSwitch() {
    // Show language selection dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.language, color: Color(0xFF2E8B57)),
              SizedBox(width: 8),
              Text(
                'ভাষা নির্বাচন / Language',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // English Button
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 12),
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _selectLanguage('english');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'English',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              // Bengali Button
              Container(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _selectLanguage('bengali');
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: green,
                    side: BorderSide(color: green, width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'বাংলা',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _selectLanguage(String language) {
    String message = language == 'english' 
        ? 'English Language Selected' 
        : 'বাংলা ভাষা নির্বাচিত হয়েছে';
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _handleMenuSelection(String value) {
    String message = '';
    String banglaMessage = '';
    
    switch (value) {
      case 'profile':
        Navigator.pushNamed(context, '/profile-settings');
        return;
      case 'calendar':
        Navigator.pushNamed(context, '/government-calendar');
        return;
      case 'notice':
        Navigator.pushNamed(context, '/notice-board');
        return;
      case 'language':
        message = 'Language Switch';
        banglaMessage = 'ভাষা পরিবর্তন আসছে শীঘ্রই...';
        break;
      case 'english':
        message = 'English Language Selected';
        banglaMessage = 'ইংরেজি ভাষা নির্বাচিত হয়েছে';
        break;
      case 'bengali':
        message = 'Bengali Language Selected';
        banglaMessage = 'বাংলা ভাষা নির্বাচিত হয়েছে';
        break;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.info_outline,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    message,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    banglaMessage,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: green,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}