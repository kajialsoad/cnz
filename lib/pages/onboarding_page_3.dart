import 'package:flutter/material.dart';

class OnboardingPage3 extends StatelessWidget {
  final VoidCallback onGetStarted;

  const OnboardingPage3({
    super.key,
    required this.onGetStarted,
  });

  @override
  Widget build(BuildContext context) {
    const bgDim = Color(0x33000000);
    const overlayBlack = Color(0xCC000000);
    const white = Colors.white;
    const primaryGreen = Color(0xFF3FA564);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/unsplash__N0srPVrfVk3.png',
              fit: BoxFit.cover,
            ),
          ),
          Positioned.fill(child: Container(color: bgDim)),
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
                    'আপনার এলাকার বর্জ্য সমস্যা?\nসহজেই ছবি তুলে অভিযোগ জানান,\nএখন বর্জ্য সমস্যার সমাধান হবে সহজেই।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: white,
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 107,
                        height: 44,
                        child: OutlinedButton(
                          onPressed: onGetStarted,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: primaryGreen),
                            foregroundColor: primaryGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Skip', style: TextStyle(fontSize: 20)),
                        ),
                      ),
                      SizedBox(
                        width: 107,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: onGetStarted,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryGreen,
                            foregroundColor: white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          child: const Text('Next', style: TextStyle(fontSize: 20)),
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
