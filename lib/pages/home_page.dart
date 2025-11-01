import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF2E8B57);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: green,
        foregroundColor: Colors.white,
        title: const Text('Home'),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.check_circle, color: green, size: 64),
            SizedBox(height: 12),
            Text(
              'Welcome Home!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 6),
            Text('আপনি সফলভাবে লগইন করেছেন'),
          ],
        ),
      ),
    );
  }
}