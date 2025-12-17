import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'config/api_config.dart';
import 'guards/auth_guard.dart';
import 'pages/camera_page.dart';
import 'pages/category_selection_page.dart';
import 'pages/complaint_address_page.dart';
import 'pages/complaint_detail_view_page.dart';
import 'pages/complaint_details_page.dart';
import 'pages/complaint_list_page.dart';
import 'pages/complaint_page.dart';
import 'pages/complaint_success_page.dart';
import 'pages/customer_care_page.dart';
import 'pages/email_verification_page.dart';
import 'pages/emergency_page.dart';
import 'pages/gallery_page.dart';
import 'pages/government_calendar_page.dart';
import 'pages/home_page.dart';
import 'pages/live_chat_page.dart';
import 'pages/login_page.dart';
import 'pages/notice_board_page.dart';
import 'pages/onboarding_screen.dart';
import 'pages/otp_verification_page.dart';
import 'pages/others_page.dart';
import 'pages/payment_page.dart';
import 'pages/profile_settings_page.dart';
import 'pages/resend_verification_page.dart';
import 'pages/signup_page.dart';
import 'pages/waste_management_page.dart';
import 'pages/welcome_screen.dart';
import 'providers/complaint_provider.dart';
import 'providers/language_provider.dart';
import 'repositories/complaint_repository.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/smart_api_client.dart';

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: ".env");

  // Print current configuration for debugging
  print('🔧 Environment Configuration:');
  print('   USE_PRODUCTION: ${dotenv.env['USE_PRODUCTION']}');
  print('   Server URL: ${ApiConfig.baseUrl}');

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        Provider<ApiClient>(
          create: (_) => SmartApiClient.instance,
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
    // Wait for a minimum time for the splash effect (optional)
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    final isLoggedIn = await AuthService.isLoggedIn();

    if (!mounted) return;

    if (isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFFFF),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/logo_clean_c.png',
              width: 130,
              height: 128,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 22),
            const Text(
              'ক্লিন কেয়ার',
              style: TextStyle(
                color: Color(0xFF184F27),
                fontSize: 31,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            // Optional: Loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
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
        textTheme:
            GoogleFonts.notoSansTextTheme(), // Use Noto Sans which supports Bengali
        fontFamily: GoogleFonts.notoSans().fontFamily,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        // Handle /verify-email route with query parameters
        if (settings.name == '/verify-email') {
          final uri = Uri.parse(settings.name!);
          final token = uri.queryParameters['token'];
          return MaterialPageRoute(
            builder: (_) => EmailVerificationPage(token: token),
          );
        }

        // Handle /verify-otp route with email parameter
        if (settings.name == '/verify-otp') {
          final email = settings.arguments as String?;
          if (email == null) {
            return MaterialPageRoute(builder: (_) => const LoginPage());
          }
          return MaterialPageRoute(
            builder: (_) => OtpVerificationPage(email: email),
          );
        }

        return null;
      },
      routes: {
        // Splash screen - checks login status
        '/': (_) => const SplashScreen(),

        // Public routes (no auth required)
        '/onboarding': (_) => const OnboardingScreen(),
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginPage(),
        '/signup': (_) => const SignUpPage(),
        '/resend-verification': (_) => const ResendVerificationPage(),

        // Protected routes (auth required)
        '/home': (_) => const AuthGuard(child: HomePage()),
        '/customer-care': (_) => const AuthGuard(child: CustomerCarePage()),
        '/live-chat': (_) => const AuthGuard(child: LiveChatPage()),
        '/complaint': (_) => const AuthGuard(child: ComplaintPage()),
        '/complaint-details': (_) =>
            const AuthGuard(child: ComplaintDetailsPage()),
        '/complaint-address': (_) =>
            const AuthGuard(child: ComplaintAddressPage()),
        '/complaint-success': (_) =>
            const AuthGuard(child: ComplaintSuccessPage()),
        '/complaint-list': (_) => const AuthGuard(child: ComplaintListPage()),
        '/complaint-detail-view': (_) =>
            const AuthGuard(child: ComplaintDetailViewPage()),
        '/others': (_) => const AuthGuard(child: OthersPage()),
        '/category-selection': (_) =>
            const AuthGuard(child: CategorySelectionPage()),
        '/payment': (_) => const AuthGuard(child: PaymentPage()),
        '/donation': (_) => const AuthGuard(child: PaymentPage()),
        '/emergency': (_) => const AuthGuard(child: EmergencyPage()),
        '/waste-management': (_) =>
            const AuthGuard(child: WasteManagementPage()),
        '/gallery': (_) => const AuthGuard(child: GalleryPage()),
        '/camera': (_) => const AuthGuard(child: CameraPage()),
        '/profile-settings': (_) =>
            const AuthGuard(child: ProfileSettingsPage()),
        '/government-calendar': (_) =>
            const AuthGuard(child: GovernmentCalendarPage()),
        '/notice-board': (_) => const AuthGuard(child: NoticeBoardPage()),
      },
    );
  }
}
