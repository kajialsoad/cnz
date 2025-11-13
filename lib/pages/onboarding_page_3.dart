import 'package:flutter/material.dart';

class OnboardingPage3 extends StatelessWidget {
  final VoidCallback onGetStarted;

  const OnboardingPage3({
    super.key,
    required this.onGetStarted,
  });

  @override
  Widget build(BuildContext context) {
    const darkGreen = Color(0xFF065F46);
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
              const SizedBox(height: 56), // Space where skip button was
              
              // Top text
              const Text(
                'পরিবর্তন শুরু হোক আপনার হাতেই',
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
                    'assets/onboardingpage3.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Title
              const Text(
                'সহজেই সরাসরি\nকর্তৃপক্ষের কাছে আপনার\nঅভিযোগ জমা দিন।',
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
                'আপনার অভিযোগের বর্তমান অবস্থা\nতাৎক্ষণিক জানুন এবং সরকারি দপ্তরের\nসমাধান প্রক্রিয়া ট্র্যাক করুন।',
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
                  _buildIndicator(false),
                  const SizedBox(width: 8),
                  _buildIndicator(false),
                  const SizedBox(width: 8),
                  _buildIndicator(true),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Get Started button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onGetStarted,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: darkGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'শুরু করুন',
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
