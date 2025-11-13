import 'package:flutter/material.dart';

class OnboardingPage1 extends StatelessWidget {
  final VoidCallback onNext;
  final VoidCallback onSkip;

  const OnboardingPage1({
    super.key,
    required this.onNext,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    const darkGreen = Color(0xFF065F46); // #065F46
    const skipGreen = Color(0xFF059669); // #059669
    const lightGreen = Color(0xFFE8F5E9);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: onSkip,
                  child: const Text(
                    'এড়িয়ে যান',
                    style: TextStyle(
                      color: skipGreen,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
              
              // Top text
              const Text(
                'পরিচ্ছন্ন ঢাকা, আমাদের অঙ্গীকার!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: darkGreen,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Icon
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  color: lightGreen,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(22.0),
                  child: Image.asset(
                    'assets/onboardingpage1.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Title
              const Text(
                'স্বাগতম ও পরিচ্ছন্নতার\nপ্রতিশ্রুতি',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: darkGreen,
                  height: 1.3,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Description
              const Text(
                'ঢাকা দক্ষিণ সিটি কর্পোরেশনের বর্জ্য\nব্যবস্থাপনা সংক্রান্ত যেকোনো সমস্যা এখন\nআপনার হাতের মুঠোয়',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black,
                  height: 1.5,
                ),
              ),
              
              const SizedBox(height: 40),
              
              // Page indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildIndicator(true),
                  const SizedBox(width: 8),
                  _buildIndicator(false),
                  const SizedBox(width: 8),
                  _buildIndicator(false),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Next button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: darkGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'পরবর্তী',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
      ),
    );
  }

  Widget _buildIndicator(bool isActive) {
    const darkGreen = Color(0xFF065F46);
    
    return Container(
      width: isActive ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? darkGreen : Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
