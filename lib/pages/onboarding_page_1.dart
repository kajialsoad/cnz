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
    const bgDim = Color(0x33000000); // #00000033
    const overlayBlack = Color(0xCC000000); // strong bottom gradient end
    const white = Colors.white;
    const primaryGreen = Color(0xFF3FA564); // figma button green

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/unsplash__N0srPVrfVk.png',
              fit: BoxFit.cover,
            ),
          ),
          // global dim overlay
          Positioned.fill(child: Container(color: bgDim)),
          // bottom gradient overlay
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x00000000), overlayBlack],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28.0),
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  // center logo
                  Image.asset(
                    'assets/logo_clean_c.png',
                    width: 130,
                    height: 128,
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'ক্লিন কেয়ার',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: white,
                      fontSize: 31,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'অভিযোগের স্থিতি (অভিযোগটি প্রক্রিয়াধীন/সমাধান হয়েছে) ট্র্যাক করুন এবং সরাসরি কর্তৃপক্ষের সাথে ময়লা সমস্যা নিয়ে কথা বলুন (লাইভ চ্যাট)।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: white,
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // frame9: buttons row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Skip outlined
                      SizedBox(
                        width: 107,
                        height: 44,
                        child: OutlinedButton(
                          onPressed: onSkip,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: primaryGreen),
                            foregroundColor: primaryGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Skip',
                            style: TextStyle(fontSize: 20),
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 107,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: onNext,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryGreen,
                            foregroundColor: white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Next',
                            style: TextStyle(fontSize: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
