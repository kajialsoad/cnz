import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'config/api_config.dart';
import 'guards/auth_guard.dart';
import 'providers/language_provider.dart';
import 'providers/complaint_provider.dart';
import 'repositories/complaint_repository.dart';
import 'services/auth_service.dart';
import 'services/api_client.dart';
import 'pages/welcome_screen.dart';
import 'pages/login_page.dart';
import 'pages/signup_page.dart';
import 'pages/home_page.dart';
import 'pages/customer_care_page.dart';
import 'pages/live_chat_page.dart';
import 'pages/complaint_page.dart';
import 'pages/complaint_details_page.dart';
import 'pages/complaint_address_page.dart';
import 'pages/complaint_success_page.dart';
import 'pages/others_page.dart';
import 'pages/payment_page.dart';
import 'pages/emergency_page.dart';
import 'pages/waste_management_page.dart';
import 'pages/gallery_page.dart';
import 'pages/profile_settings_page.dart';
import 'pages/government_calendar_page.dart';
import 'pages/notice_board_page.dart';
import 'pages/onboarding_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        Provider<ApiClient>(
          create: (_) => ApiClient(ApiConfig.baseUrl),
          dispose: (_, apiClient) => apiClient,
        ),
        ProxyProvider<ApiClient, ComplaintRepository>(
          update: (_, apiClient, __) => ComplaintRepository(apiClient),
          dispose: (_, repository) => repository,
        ),
        ChangeNotifierProxyProvider<ComplaintRepository, ComplaintProvider>(
          create: (context) => ComplaintProvider(
            Provider.of<ComplaintRepository>(context, listen: false),
          ),
          update: (_, repository, __) => ComplaintProvider(repository),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

// Splash screen to check login status
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final isLoggedIn = await AuthService.isLoggedIn();
    if (!mounted) return;
    if (isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2E8B57),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 18,
                  ),
                ],
              ),
              child: const Icon(Icons.recycling, color: Color(0xFF2E8B57), size: 64),
            ),
            const SizedBox(height: 24),
            const Text(
              'Clean Care',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
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
      initialRoute: '/',
      routes: {
        // Splash screen - checks login status
        '/': (_) => const SplashScreen(),
        
        // Public routes (no auth required)
        '/onboarding': (_) => const OnboardingScreen(),
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginPage(),
        '/signup': (_) => const SignUpPage(),
        
        // Protected routes (auth required)
        '/home': (_) => const AuthGuard(child: HomePage()),
        '/customer-care': (_) => const AuthGuard(child: CustomerCarePage()),
        '/live-chat': (_) => const AuthGuard(child: LiveChatPage()),
        '/complaint': (_) => const AuthGuard(child: ComplaintPage()),
        '/complaint-details': (_) => const AuthGuard(child: ComplaintDetailsPage()),
        '/complaint-address': (_) => const AuthGuard(child: ComplaintAddressPage()),
        '/complaint-success': (_) => const AuthGuard(child: ComplaintSuccessPage()),
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