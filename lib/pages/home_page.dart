import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math;
import '../components/elevated_3d_button.dart';
import '../components/dscc_notice_board.dart';
import '../components/stats_card.dart';
import '../components/custom_bottom_nav.dart';
import '../components/mayor_statement_banner.dart';
import '../providers/language_provider.dart';
import '../widgets/translated_text.dart';
import '../services/auth_service.dart';

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
      body: Column(
        children: [
          const MayorStatementBanner(),
          // Background image container for all sections below banner
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: AssetImage('assets/home_background.jpg'),
                  fit: BoxFit.cover,
                  opacity: 0.1, // 10% opacity
                ),
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(
                  bottom: 100, // Space for bottom navigation
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _buildFeatureCluster(),
                    ),
                    const SizedBox(height: 30),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: const DSCCNoticeBoard(),
                    ),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _buildStatsCards(),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
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

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF1D9A4A),
      foregroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: 72,
      leadingWidth: 56,
      leading: Padding(
        padding: const EdgeInsets.only(left: 12.0),
        child: AnimatedBuilder(
          animation: _backgroundController,
          builder: (context, child) {
            return Transform.rotate(
              angle: _backgroundController.value * 2 * math.pi,
              child: Container(
                width: 32,
                height: 32,
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
                  size: 18,
                ),
              ),
            );
          },
        ),
      ),
      titleSpacing: 16,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            'Clean Care',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
          ),
          SizedBox(height: 2),
          TranslatedText(
            'Your City, Your Care',
            style: TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
      actions: [
        // Language Indicator - Shows current language
        Consumer<LanguageProvider>(
          builder: (context, languageProvider, child) {
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: GestureDetector(
                onTap: () {
                  _handleLanguageSwitch();
                },
                child: Container(
                  height: 38,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50),
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
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.language, color: Colors.white, size: 18),
                      const SizedBox(width: 6),
                      Text(
                        languageProvider.isBangla ? 'বাং' : 'EN',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
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
            constraints: const BoxConstraints(minWidth: 200, maxWidth: 250),
            itemBuilder: (BuildContext context) => [
              // Profile Settings
              PopupMenuItem<String>(
                value: 'profile',
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                    TranslatedText(
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
              // My Complaints
              PopupMenuItem<String>(
                value: 'complaints',
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.list_alt, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    TranslatedText(
                      'My Complaints',
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                    TranslatedText(
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                    TranslatedText(
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                    TranslatedText(
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
              // Logout
              PopupMenuItem<String>(
                value: 'logout',
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.logout,
                        color: Colors.red,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Logout',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const PopupMenuDivider(height: 1),
              // Language Section Header
              PopupMenuItem<String>(
                enabled: false,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 12,
                  ),
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 12,
                  ),
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

    // Remove fixed height container to prevent overflow
    return Padding(
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
                child: Icon(Icons.eco, size: 40, color: green),
              ),
            ),
            Positioned(
              top: 100 + _floatingController.value * 15,
              right: 40,
              child: Opacity(
                opacity: 0.08,
                child: Icon(Icons.recycling, size: 50, color: yellow),
              ),
            ),
            Positioned(
              bottom: 80 + _floatingController.value * 12,
              left: 50,
              child: Opacity(
                opacity: 0.06,
                child: Icon(Icons.nature, size: 35, color: greenSoft),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFlowerPetalLayout(double diameter) {
    // Using fixed dimensions for consistent mobile experience

    Widget buildCircleButton({
      required String title,
      required String subtitle,
      required IconData icon,
      required Color primary,
      required Color secondary,
      required VoidCallback onTap,
      double? size,
    }) {
      return Elevated3DButton(
        title: title,
        subtitle: subtitle,
        icon: icon,
        primaryColor: primary,
        secondaryColor: secondary,
        width: double.infinity, // Let Flexible control the width
        height: 135, // Fixed height for consistent petal shape
        isOval: false, // use rounded rectangle petal shape
        isFlat: true, // remove 3D and make 2D flat
        onTap: onTap,
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        // Background petal layout with tight spacing
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Flexible(
                  child: buildCircleButton(
                    title: "Customer Care",
                    subtitle: "24/7 Support",
                    icon: Icons.headset_mic,
                    primary: const Color(0xFFFF2424),
                    secondary: const Color(0xFFFF2424).withOpacity(0.8),
                    onTap: () => _navigateToPage('/customer-care'),
                  ),
                ),
                SizedBox(width: 2), // Reduced gap from 12px to 2px
                Flexible(
                  child: buildCircleButton(
                    title: "Live Chat",
                    subtitle: "Instant Help",
                    icon: Icons.chat_bubble_outline,
                    primary: const Color(0xFF36724A),
                    secondary: const Color(0xFF36724A).withOpacity(0.8),
                    onTap: () => _navigateToPage('/live-chat'),
                  ),
                ),
              ],
            ),
            SizedBox(height: 2), // Reduced spacing from 8px to 2px

            Row(
              children: [
                Flexible(
                  child: buildCircleButton(
                    title: "Payment Gateway",
                    subtitle: "Pay Bills",
                    icon: Icons.credit_card,
                    primary: const Color(0xFF36724A),
                    secondary: const Color(0xFF36724A).withOpacity(0.8),
                    onTap: () => _navigateToPage('/payment'),
                  ),
                ),
                SizedBox(width: 2), // Reduced gap from 12px to 2px
                Flexible(
                  child: buildCircleButton(
                    title: "Donation",
                    subtitle: "Help City",
                    icon: Icons.favorite_border,
                    primary: const Color(0xFFFF2424),
                    secondary: const Color(0xFFFF2424).withOpacity(0.8),
                    onTap: () => _navigateToPage('/payment'),
                  ),
                ),
              ],
            ),
          ],
        ),

        // Center complaint button - bigger circle with black background and white border
        Container(
          width: 110, // Increased from 120 to 140
          height: 110, // Increased from 120 to 140
          decoration: BoxDecoration(
            color: Colors.black,
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white, // Solid white border
              width: 4, // Thick white border
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 15,
                offset: const Offset(0, 5),
                spreadRadius: 2,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(70), // Updated for new size
              onTap: () => _navigateToPage('/complaint'),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'assets/complaint.svg',
                    width: 36,
                    height: 36,
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TranslatedText(
                    "Complaint",
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
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
      SnackBar(
        content: TranslatedText(
          'QR Scanner opening...',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Color(0xFF2E8B57),
      ),
    );
  }

  void _handleLanguageSwitch() {
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );

    // Show language selection dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(Icons.language, color: Color(0xFF2E8B57)),
              SizedBox(width: 8),
              TranslatedText(
                'Language Selection',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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
                    _selectLanguage('en');
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
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
              // Bengali Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _selectLanguage('bn');
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
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _selectLanguage(String languageCode) async {
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );
    await languageProvider.setLanguage(languageCode);

    String message = languageCode == 'en'
        ? 'English Language Selected'
        : 'বাংলা ভাষা নির্বাচিত হয়েছে';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: TranslatedText(
          languageCode == 'en'
              ? 'English Language Selected'
              : 'Bangla Language Selected',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _handleMenuSelection(String value) async {
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );

    switch (value) {
      case 'profile':
        Navigator.pushNamed(context, '/profile-settings');
        return;
      case 'complaints':
        Navigator.pushNamed(context, '/complaint-list');
        return;
      case 'calendar':
        Navigator.pushNamed(context, '/government-calendar');
        return;
      case 'notice':
        Navigator.pushNamed(context, '/notice-board');
        return;
      case 'logout':
        _handleLogout();
        return;
      case 'language':
        _handleLanguageSwitch();
        return;
      case 'english':
        await languageProvider.setLanguage('en');
        _showLanguageChangeSnackbar('English Language Selected');
        break;
      case 'bengali':
        await languageProvider.setLanguage('bn');
        _showLanguageChangeSnackbar('Bangla Language Selected');
        break;
    }
  }

  void _handleLogout() async {
    // Capture context before any async operations
    final navigator = Navigator.of(context);

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await AuthService.clearTokens();
      navigator.pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  void _showLanguageChangeSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TranslatedText(
                message,
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: green,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
