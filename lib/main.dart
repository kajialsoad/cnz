import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'guards/auth_guard.dart';
import 'providers/language_provider.dart';
import 'pages/welcome_screen.dart';
import 'pages/login_page.dart';
import 'pages/signup_page.dart';
import 'pages/home_page.dart';
import 'pages/customer_care_page.dart';
import 'pages/live_chat_page.dart';
import 'pages/complaint_page.dart';
import 'pages/complaint_details_page.dart';
import 'pages/others_page.dart';
import 'pages/payment_page.dart';
import 'pages/emergency_page.dart';
import 'pages/waste_management_page.dart';
import 'pages/gallery_page.dart';
import 'pages/profile_settings_page.dart';
import 'pages/government_calendar_page.dart';
import 'pages/notice_board_page.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => LanguageProvider(),
      child: const MyApp(),
    ),
  );
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
        // Public routes (no auth required)
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginPage(),
        '/signup': (_) => const SignUpPage(),
        
        // Protected routes (auth required)
        '/home': (_) => const AuthGuard(child: HomePage()),
        '/customer-care': (_) => const AuthGuard(child: CustomerCarePage()),
        '/live-chat': (_) => const AuthGuard(child: LiveChatPage()),
        '/complaint': (_) => const AuthGuard(child: ComplaintPage()),
        '/complaint-details': (_) => const AuthGuard(child: ComplaintDetailsPage()),
        '/others': (_) => const AuthGuard(child: OthersPage()),
        '/payment': (_) => const AuthGuard(child: PaymentPage()),
        '/donation': (_) => const AuthGuard(child: PaymentPage()),
        '/emergency': (_) => const AuthGuard(child: EmergencyPage()),
        '/waste-management': (_) => const AuthGuard(child: WasteManagementPage()),
        '/gallery': (_) => const AuthGuard(child: GalleryPage()),
        '/profile-settings': (_) => const AuthGuard(child: ProfileSettingsPage()),
        '/government-calendar': (_) => const AuthGuard(child: GovernmentCalendarPage()),
        '/notice-board': (_) => const AuthGuard(child: NoticeBoardPage()),
      },
    );
  }
}