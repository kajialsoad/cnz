import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'config/api_config.dart';
import 'guards/auth_guard.dart';
import 'services/fast_storage.dart';
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
import 'pages/officer_review_list_page.dart';
import 'pages/officer_review_detail_page.dart';
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
import 'providers/notice_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/gallery_provider.dart';
import 'providers/calendar_provider.dart';
import 'providers/review_provider.dart';
import 'repositories/complaint_repository.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/smart_api_client.dart';
import 'services/notification_polling_service.dart';
import 'widgets/in_app_notification.dart';
import 'models/cached_chat_message.dart';
import 'models/cached_complaint_info.dart';

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize sqflite for desktop (skip on Web and Mobile)
  final isDesktop =
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.windows ||
          defaultTargetPlatform == TargetPlatform.linux ||
          defaultTargetPlatform == TargetPlatform.macOS);
  if (isDesktop) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
    print('✅ sqflite_common_ffi initialized for desktop');
  }

  // ✅ Initialize FastStorage first (performance optimization)
  await FastStorage.getInstance();
  print('✅ FastStorage initialized');

  // Load environment variables
  await dotenv.load(fileName: ".env");

  // Initialize Hive for offline storage
  await Hive.initFlutter();
  Hive.registerAdapter(CachedChatMessageAdapter());
  Hive.registerAdapter(CachedComplaintInfoAdapter());

  // Print current configuration for debugging
  print('🔧 Environment Configuration:');
  print('   USE_PRODUCTION: ${dotenv.env['USE_PRODUCTION']}');
  print('   Server URL: ${ApiConfig.baseUrl}');

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => NoticeProvider()),
        ChangeNotifierProvider(create: (_) => GalleryProvider()),
        ChangeNotifierProvider(create: (_) => CalendarProvider()),
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
        ChangeNotifierProvider(create: (_) => ReviewProvider()),
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
  String? _targetRoute;
  bool _isReady = false;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Precache logo for smoother transitions
    precacheImage(const AssetImage('assets/logo_clean_c.png'), context);
    // Precache Home Page background to prevent lag on transition
    precacheImage(const AssetImage('assets/home_background.jpg'), context);
  }

  Future<void> _checkLoginStatus() async {
    // Start initializing home data in parallel but DON'T await it
    // This allows the splash screen to finish quickly while data loads in background
    _initializeHomeData();

    // Wait for a minimal time for the splash effect (reduced to 1.5s)
    await Future.delayed(const Duration(milliseconds: 1500));

    if (!mounted) return;

    final isLoggedIn = await AuthService.isLoggedIn();

    if (!mounted) return;

    setState(() {
      if (isLoggedIn) {
        _targetRoute = '/home';
      } else {
        _targetRoute = '/onboarding';
      }
      _isReady = true;
    });

    // Wait for manual tap instead of auto-navigating
    // The _isReady flag will show the loading indicator as complete
    // and enable the tap handler
  }

  // Pre-fetch essential data for Home Page to prevent jank
  Future<void> _initializeHomeData() async {
    try {
      if (!mounted) return;

      // Use addPostFrameCallback to ensure providers are accessed safely
      // This prevents "setState() or markNeedsBuild() called during build" errors
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;

        // Initialize providers that are needed immediately on Home Page
        final noticeProvider = Provider.of<NoticeProvider>(
          context,
          listen: false,
        );
        final notificationProvider = Provider.of<NotificationProvider>(
          context,
          listen: false,
        );

        // Load data in background without blocking UI
        noticeProvider.loadNotices();
        notificationProvider.fetchNotifications();
      });
    } catch (e) {
      print('Error pre-fetching home data: $e');
    }
  }

  void _navigateToTarget() {
    if (_isReady && _targetRoute != null) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) {
            if (_targetRoute == '/home') return const HomePage();
            return const OnboardingScreen();
          },
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          settings: RouteSettings(name: _targetRoute),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _navigateToTarget,
      child: Scaffold(
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
              // Show loading indicator
              if (!_isReady)
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
                )
              else
                // Optional: Hint to user
                const Text(
                  'Tap screen to continue',
                  style: TextStyle(color: Color(0xFF2E8B57), fontSize: 16),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    _setupNotifications();
  }

  void _setupNotifications() {
    // Delay notification setup until after first frame is rendered
    // This ensures the overlay is ready and user is logged in
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Give it a tiny bit more time for storage to be ready on web
      await Future.delayed(const Duration(milliseconds: 500));

      // Check if user is logged in before starting notifications
      bool isLoggedIn = await AuthService.isLoggedIn();

      // Retry once if not logged in (to handle potential race conditions on web)
      if (!isLoggedIn) {
        await Future.delayed(const Duration(seconds: 1));
        isLoggedIn = await AuthService.isLoggedIn();
      }

      if (!isLoggedIn) {
        print('⚠️ User not logged in, skipping notification setup');
        return;
      }

      // Start polling after app is fully initialized
      NotificationPollingService.startPolling();

      // Listen for new notifications
      NotificationPollingService.addListener(_handleNewNotification);

      print('✅ Notification system initialized after first frame');
    });
  }

  void _handleNewNotification(Map<String, dynamic> notification) {
    // Ensure we're on the UI thread and widget is mounted
    if (!mounted) {
      return;
    }

    final title = notification['title'] ?? 'নতুন বার্তা';
    final message =
        notification['message'] ?? 'আপনার অভিযোগ সম্পর্কে নতুন বার্তা';
    final notificationId = notification['id'];

    print('📬 Notification received: $title - $message');

    // Get current context safely
    final currentContext = navigatorKey.currentContext;

    // If no context available, skip UI updates but log the notification
    if (currentContext == null) {
      print('⚠️ No context available for notification UI, skipping display');
      return;
    }

    // Refresh the notification provider to update UI
    try {
      final notificationProvider = Provider.of<NotificationProvider>(
        currentContext,
        listen: false,
      );
      notificationProvider.refreshNotifications();
    } catch (e) {
      print('⚠️ Failed to refresh notification provider: $e');
    }

    // Show in-app notification popup
    // The InAppNotification.show() method already handles overlay checks safely
    InAppNotification.show(
      currentContext,
      title: title,
      message: message,
      onTap: () {
        // Navigate to notification page or complaint details
        print('📱 Notification tapped: $notificationId');
      },
    );

    // Mark as read automatically after showing
    if (notificationId != null) {
      Future.delayed(const Duration(seconds: 2), () {
        NotificationPollingService.markAsRead(notificationId);
        // Refresh provider again after marking as read
        try {
          final currentContext = navigatorKey.currentContext;
          if (currentContext != null) {
            final notificationProvider = Provider.of<NotificationProvider>(
              currentContext,
              listen: false,
            );
            notificationProvider.refreshUnreadCount();
          }
        } catch (e) {
          print('⚠️ Failed to refresh unread count: $e');
        }
      });
    }
  }

  @override
  void dispose() {
    NotificationPollingService.stopPolling();
    NotificationPollingService.removeListener(_handleNewNotification);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Clean Care',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E8B57)),
        useMaterial3: true,
        textTheme: GoogleFonts.notoSansBengaliTextTheme(),
        fontFamily: GoogleFonts.notoSansBengali().fontFamily,
        // Add font fallback chain for better character coverage
        fontFamilyFallback: const ['Noto Sans Bengali', 'Noto Sans', 'Roboto'],
      ),
      // Wrap with Builder to get context with Overlay access
      builder: (context, child) {
        return child ?? const SizedBox.shrink();
      },
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

        // Handle /camera route with source parameter
        if (settings.name == '/camera') {
          final args = settings.arguments as Map<String, dynamic>?;
          final source = args?['source'] as String?;
          return MaterialPageRoute(
            builder: (_) => AuthGuard(child: CameraPage(source: source)),
            settings: settings,
          );
        }

        // Handle /officer-review-detail route with officerReview parameter
        if (settings.name == '/officer-review-detail') {
          final officerReview = settings.arguments as Map<String, dynamic>?;
          if (officerReview == null) {
            return MaterialPageRoute(
              builder: (_) => const AuthGuard(child: OfficerReviewListPage()),
            );
          }
          return MaterialPageRoute(
            builder: (_) => AuthGuard(
              child: OfficerReviewDetailPage(officerReview: officerReview),
            ),
            settings: settings,
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
        '/officer-review-list': (_) =>
            const AuthGuard(child: OfficerReviewListPage()),
        '/profile-settings': (_) =>
            const AuthGuard(child: ProfileSettingsPage()),
        '/government-calendar': (_) =>
            const AuthGuard(child: GovernmentCalendarPage()),
        '/notice-board': (_) => const AuthGuard(child: NoticeBoardPage()),
      },
    );
  }
}
