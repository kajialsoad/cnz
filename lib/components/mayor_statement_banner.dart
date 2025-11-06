import 'package:flutter/material.dart';
import 'dart:async';

class MayorStatementBanner extends StatefulWidget {
  const MayorStatementBanner({super.key});

  @override
  State<MayorStatementBanner> createState() => _MayorStatementBannerState();
}

class _MayorStatementBannerState extends State<MayorStatementBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late Timer _autoScrollTimer;
  int _currentIndex = 0;

  // Static mayor name
  final String mayorName = 'মেয়র মোঃ বদরুল আলম';
  
  // Only messages rotate, no titles
  final List<String> mayorMessages = [
    'আমাদের শহরকে পরিচ্ছন্ন ও সুন্দর রাখতে সকলের সহযোগিতা প্রয়োজন। Clean Care অ্যাপের মাধ্যমে আপনারা সহজেই সেবা পেতে পারবেন।',
    'প্রতিদিন আমাদের পরিবেশের যত্ন নেওয়া আমাদের সকলের দায়িত্ব। আসুন একসাথে গড়ি একটি সবুজ ও টেকসই ঢাকা।',
    'ডিজিটাল বাংলাদেশের স্বপ্ন বাস্তবায়নে আমরা প্রতিশ্রুতিবদ্ধ। আধুনিক প্রযুক্তির মাধ্যমে সেবা পৌঁছে দিচ্ছি আপনাদের দোরগোড়ায়।'
  ];

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _fadeController.forward();
    _startAutoScroll();
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _nextStatement();
    });
  }

  void _nextStatement() {
    _fadeController.reverse().then((_) {
      setState(() {
        _currentIndex = (_currentIndex + 1) % mayorMessages.length;
      });
      _fadeController.forward();
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _autoScrollTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentMessage = mayorMessages[_currentIndex];
    
    return Container(
      // Full width with no top margin to connect directly to app bar
      margin: const EdgeInsets.only(bottom: 8),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            offset: const Offset(0, 2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Mayor Profile Image (slightly smaller)
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      offset: const Offset(0, 2),
                      blurRadius: 4,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.asset(
                    'assets/profile.png',
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF36724A),
                        ),
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 24,
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Statement Content
              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mayorName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.normal,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        currentMessage,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF333333),
                          height: 1.35,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 18), // space to make room for indicator overlap
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Bottom-centred indicator (dots) with active one extended
          Positioned(
            bottom: 6,
            left: 0,
            right: 0,
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(mayorMessages.length, (index) {
                  final bool active = _currentIndex == index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 20 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active
                          ? const Color(0xFF044E1F)
                          : const Color(0xFF044E1F).withOpacity(0.28),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}