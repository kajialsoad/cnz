import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../components/custom_bottom_nav.dart';
import '../components/dscc_notice_board.dart';
import '../components/elevated_3d_button.dart';
import '../components/mayor_statement_banner.dart';
import '../providers/language_provider.dart';
import '../services/auth_service.dart';
import '../widgets/translated_text.dart';
import '../providers/notification_provider.dart';
import '../widgets/notification_sheet.dart';

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

    // Fetch initial notification count
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<NotificationProvider>().fetchNotifications();
      }
    });
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
      leadingWidth: 64,
      leading: Padding(
        padding: const EdgeInsets.only(left: 12.0),
        child: SizedBox(
          width: 57,
          height: 56,
          child: Image.asset(
            'assets/logo_clean_c.png',
            fit: BoxFit.contain,
            filterQuality: FilterQuality.high,
            cacheWidth: 114,
            cacheHeight: 112,
          ),
        ),
      ),
      titleSpacing: 16,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            'Clean Care',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 16,
              letterSpacing: 0.4,
            ),
          ),
          SizedBox(height: 2),
          TranslatedText(
            'Your City, Your Care',
            style: TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
      actions: [
        // Notification Icon
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: Consumer<NotificationProvider>(
            builder: (context, provider, _) {
              return Tooltip(
                message: 'Notifications',
                child: GestureDetector(
                  onTap: _showNotificationsModal,
                  child: Stack(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: const Color(0xFF4CAF50),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.15),
                              offset: const Offset(0, 2),
                              blurRadius: 4,
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.notifications_none,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      if (provider.unreadCount > 0)
                        Positioned(
                          top: -2,
                          right: -2,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 16,
                              minHeight: 16,
                            ),
                            child: Text(
                              provider.unreadCount > 99 ? '99+' : '${provider.unreadCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
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
              // Divider
              const PopupMenuDivider(height: 1),
              // Payment Gateway
              PopupMenuItem<String>(
                value: 'payment',
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
                      child: Icon(Icons.credit_card, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    TranslatedText(
                      'Payment Gateway',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Donation
              PopupMenuItem<String>(
                value: 'donation',
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
                      child: Icon(Icons.favorite_border, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    TranslatedText(
                      'Donation',
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

              // Photo Gallery
              PopupMenuItem<String>(
                value: 'gallery',
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
                      child: Icon(Icons.photo_library, color: green, size: 20),
                    ),
                    const SizedBox(width: 12),
                    TranslatedText(
                      'Photo Gallery',
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
              // MenuDrawer: Inline language selector (Figma)
              PopupMenuItem<String>(
                enabled: false,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Consumer<LanguageProvider>(
                  builder: (context, languageProvider, _) {
                    final isEnglish = languageProvider.isEnglish;
                    return Container(
                      width: 251,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F4F5),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Language / ভাষা',
                            style: const TextStyle(
                              color: Color(0xFF4A5565),
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () {
                                    Navigator.pop(context);
                                    _selectLanguage('en');
                                  },
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: isEnglish
                                          ? const Color(0xFF3FA564)
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                      border: isEnglish
                                          ? null
                                          : Border.all(
                                              color: const Color(0xFFD1D5DC),
                                            ),
                                    ),
                                    padding: const EdgeInsets.fromLTRB(
                                      16,
                                      9,
                                      16,
                                      9,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'English',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: isEnglish
                                            ? Colors.white
                                            : const Color(0xFF0A0A0A),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: InkWell(
                                  onTap: () {
                                    Navigator.pop(context);
                                    _selectLanguage('bn');
                                  },
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: !isEnglish
                                          ? const Color(0xFF3FA564)
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                      border: !isEnglish
                                          ? null
                                          : Border.all(
                                              color: const Color(0xFFD1D5DC),
                                            ),
                                    ),
                                    padding: const EdgeInsets.fromLTRB(
                                      16,
                                      8,
                                      16,
                                      8,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'বাংলা',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: !isEnglish
                                            ? Colors.white
                                            : const Color(0xFF0A0A0A),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
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
                    subtitle: "",
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
                    subtitle: "",
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
                    title: "Waste Management",
                    subtitle: "",
                    icon: Icons.recycling,
                    primary: const Color(0xFF36724A),
                    secondary: const Color(0xFF36724A).withOpacity(0.8),
                    onTap: () => _navigateToPage('/waste-management'),
                  ),
                ),
                SizedBox(width: 2), // Reduced gap from 12px to 2px
                Flexible(
                  child: buildCircleButton(
                    title: "Emergency",
                    subtitle: "",
                    icon: Icons.emergency,
                    primary: const Color(0xFFFF2424),
                    secondary: const Color(0xFFFF2424).withOpacity(0.8),
                    onTap: () => _navigateToPage('/emergency'),
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
              onTap: _showComplaintConfirmation,
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

  void _showComplaintConfirmation() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(Icons.report_problem, color: Color(0xFF2E8B57)),
              SizedBox(width: 8),
              Expanded(
                child: TranslatedText(
                  'Submit Complaint',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          content: TranslatedText(
            'আপনি একটি ময়লা সংক্রান্ত অভিযোগ করতে চাচ্ছেন?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
              child: TranslatedText(
                'No',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _navigateToPage('/others'); // Direct to Others page
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF2E8B57),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              child: TranslatedText(
                'Yes',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        // Home - already here
        break;
      case 1:
        // Complaint List
        _navigateToPage('/complaint-list');
        break;
      case 4:
        // Camera
        _openCamera();
        break;
    }
  }

  void _navigateToPage(String route) {
    Navigator.pushNamed(context, route);
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
              Icon(Icons.camera_alt, color: Color(0xFF2E8B57)),
              SizedBox(width: 8),
              Expanded(
                child: TranslatedText(
                  'Camera',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          content: TranslatedText(
            'আপনি একটি ছবি তুলতে এবং একটি ময়লা সংক্রান্ত অভিযোগ করতে ক্যামেরা ব্যবহার করতে চান?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
              child: TranslatedText(
                'No',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.pushNamed(context, '/camera');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF2E8B57),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              child: TranslatedText(
                'Yes',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }

  void _handleLanguageSwitch() {
    // Get current language
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );
    final isEnglish = languageProvider.isEnglish;

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
              // English Button - Green if selected
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 12),
                child: isEnglish
                    ? ElevatedButton(
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
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      )
                    : OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          _selectLanguage('en');
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
                          'English',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
              ),
              // Bengali Button - Green if selected
              SizedBox(
                width: double.infinity,
                child: !isEnglish
                    ? ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          _selectLanguage('bn');
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
                          'বাংলা',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      )
                    : OutlinedButton(
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

  void _selectLanguage(String languageCode) async {
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );
    await languageProvider.setLanguage(languageCode);

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
      case 'payment':
        Navigator.pushNamed(context, '/payment');
        return;
      case 'donation':
        Navigator.pushNamed(context, '/payment');
        return;
      case 'calendar':
        Navigator.pushNamed(context, '/government-calendar');
        return;
      case 'notice':
        Navigator.pushNamed(context, '/notice-board');
        return;
      case 'gallery':
        Navigator.pushNamed(context, '/gallery');
        return;
      case 'logout':
        _handleLogout();
        return;
      case 'language':
        _handleLanguageSwitch();
        return;
    }
  }

  void _handleLogout() async {
    // Capture context before any async operations
    final navigator = Navigator.of(context);
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

  void _showNotificationsModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NotificationSheet(),
    );
  }
}
