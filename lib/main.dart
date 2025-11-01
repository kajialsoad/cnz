import 'package:flutter/material.dart';
import 'pages/welcome_screen.dart';
import 'pages/login_page.dart';
import 'pages/signup_page.dart';

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
        fontFamily: 'Roboto',
      ),
      initialRoute: '/welcome',
      routes: {
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginPage(),
        '/signup': (_) => const SignUpPage(),
      },
    );
  }
}