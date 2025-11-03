import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'pages/welcome_screen.dart';
import 'pages/login_page.dart';
import 'pages/signup_page.dart';
import 'pages/home_page.dart';
import 'pages/customer_care_page.dart';
import 'pages/live_chat_page.dart';
import 'pages/complaint_page.dart';
import 'pages/payment_page.dart';
import 'pages/donation_page.dart';
import 'pages/emergency_page.dart';
import 'pages/waste_management_page.dart';
import 'pages/gallery_page.dart';
import 'pages/profile_settings_page.dart';
import 'pages/government_calendar_page.dart';
import 'pages/notice_board_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Clean Care',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E8B57)),
        useMaterial3: true,
        textTheme: GoogleFonts.notoSansTextTheme(), // Use Noto Sans which supports Bengali
        fontFamily: GoogleFonts.notoSans().fontFamily,
      ),
      initialRoute: '/welcome',
      routes: {
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginPage(),
        '/signup': (_) => const SignUpPage(),
        '/home': (_) => const HomePage(),
        '/customer-care': (_) => const CustomerCarePage(),
        '/live-chat': (_) => const LiveChatPage(),
        '/complaint': (_) => const ComplaintPage(),
        '/payment': (_) => const PaymentPage(),
        '/donation': (_) => const DonationPage(),
        '/emergency': (_) => const EmergencyPage(),
        '/waste-management': (_) => const WasteManagementPage(),
        '/gallery': (_) => const GalleryPage(),
        '/profile-settings': (_) => const ProfileSettingsPage(),
        '/government-calendar': (_) => const GovernmentCalendarPage(),
        '/notice-board': (_) => const NoticeBoardPage(),
      },
    );
  }
}