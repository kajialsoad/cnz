import 'dart:async';

import 'package:flutter/material.dart';

import '../widgets/translated_text.dart';

class MayorStatementBanner extends StatefulWidget {
  const MayorStatementBanner({super.key});

  @override
  State<MayorStatementBanner> createState() => _MayorStatementBannerState();
}

class _MayorStatementBannerState extends State<MayorStatementBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late Timer _messageAutoScrollTimer;
  late Timer _personAutoScrollTimer;
  int _currentPersonIndex = 0;
  int _currentMessageIndex = 0;
  late PageController _pageController;

  // Data for 3 people with their messages
  final List<Map<String, dynamic>> peopleData = [
    {
      'name': 'Mayor Md. Badrul Alam',
      'image': 'assets/profile.png',
      'messages': [
        {
          'bangla': 'আমাদের শহরকে পরিচ্ছন্ন ও সুন্দর রাখতে সবার সহযোগিতা দরকার। ক্লিন কেয়ার অ্যাপের মাধ্যমে আপনি সহজেই সেবা পেতে পারবেন।',
          'english': 'We need everyone\'s cooperation to keep our city clean and beautiful. Through the Clean Care app, you can easily access services.',
        },
        {
          'bangla': 'প্রতিদিন আমাদের পরিবেশের যত্ন নেওয়া সবার দায়িত্ব। চলুন একসঙ্গে একটি সবুজ ও সুস্থ ঢাকা গড়ি।',
          'english': 'Taking care of our environment every day is everyone\'s responsibility. Let\'s build a green and sustainable Dhaka together.',
        },
        {
          'bangla': 'আমরা ডিজিটাল বাংলাদেশের স্বপ্ন বাস্তবায়নে প্রতিশ্রুতিবদ্ধ। আধুনিঙ5 প্রযুক্তির মাধ্যমে আপনার দোরগোড়ায় সেবা পৌঁছে দিচ্ছি।',
          'english': 'We are committed to realizing the dream of Digital Bangladesh. We are delivering services to your doorstep through modern technology.',
        },
      ],
    },
    {
      'name': 'Mohammad Azaz',
      'image': 'assets/profile2.jpeg',
      'messages': [
        {
          'bangla': 'পরিচ্ছন্ন ঢাকা উত্তর আমাদের ভবিষ্যতের অঙ্গীকার। প্রতিটি নাগরিকের সচেতনতা ও সহযোগিতাই এই অঙ্গীকারকে সফল করবে।',
          'english': 'A cleaner Dhaka North is our pledge for the future. Every citizen\'s awareness and cooperation will help fulfill that pledge.',
        },
        {
          'bangla': 'আপনার ছোট্ট উদ্যোগ—সঠিক স্থানে বর্জ্য ফেলানো—আমাদের শহরকে আরও বাসযোগ্য করে তুলতে পারে। চলুন সবাই মিলে একটি সুস্থ, সবুজ ও পরিচ্ছন্ন উত্তরের পথে এগিয়ে যাই।',
          'english': 'Your small action—disposing waste in the right place—can make our city more livable. Let us move forward together toward a healthy, green, and clean Dhaka North.',
        },
        {
          'bangla': 'স্বচ্ছতা ও পরিচ্ছন্নতার যাত্রায় নাগরিকই আমাদের শক্তি। আপনার অংশগ্রহণই গড়ে তুলবে একটি আধুনিক, পরিচ্ছন্ন ঢাকা উত্তর।',
          'english': 'In our journey toward cleanliness and transparency, citizens are our strength. Your participation will build a modern and clean Dhaka North.',
        },
      ],
    },
    {
      'name': 'Md. Shahjahan Miah',
      'image': 'assets/profile3.jpeg',
      'messages': [
        {
          'bangla': 'একটি পরিচ্ছন্ন ঢাকা দক্ষিণ আমাদের সবার দায়িত্ব। শহরকে সুন্দর রাখতে নাগরিক সহযোগিতার কোনো বিকল্প নেই।',
          'english': 'A clean Dhaka South is the responsibility of us all. There is no alternative to collective citizen cooperation to keep the city beautiful.',
        },
        {
          'bangla': 'বর্জ্য ব্যবস্থাপনায় সক্রিয় অংশগ্রহণই একটি উন্নত ও নান্দনিক দক্ষিণ গড়ে তুলতে সাহায্য করবে। চলুন পরিবর্তনের অংশ হই।',
          'english': 'Active participation in waste management will help build a better and more aesthetic Dhaka South. Let us be part of this positive change.',
        },
        {
          'bangla': 'পরিচ্ছন্নতার সংস্কৃতি আমাদের পরিবার, সমাজ ও শহরের উন্নয়নকে ত্বরান্বিত করে। নাগরিক হিসেবে আপনার সচেতনতা দক্ষিণ নগরকে আরও উন্নত করবে।',
          'english': 'A culture of cleanliness strengthens the development of our families, society, and city. Your awareness as a citizen will make Dhaka South even better.',
        },
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
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
    _startMessageAutoScroll();
    _startPersonAutoScroll();
  }

  void _startMessageAutoScroll() {
    _messageAutoScrollTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      _nextMessage();
    });
  }

  void _startPersonAutoScroll() {
    _personAutoScrollTimer = Timer.periodic(const Duration(seconds: 6), (timer) {
      _nextPerson();
    });
  }

  void _nextMessage() {
    _fadeController.reverse().then((_) {
      setState(() {
        final maxMessages = (peopleData[_currentPersonIndex]['messages'] as List).length;
        _currentMessageIndex = (_currentMessageIndex + 1) % maxMessages;
      });
      _fadeController.forward();
    });
  }

  void _nextPerson() {
    final nextIndex = (_currentPersonIndex + 1) % peopleData.length;
    _pageController.animateToPage(
      nextIndex,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPersonIndex = index;
      _currentMessageIndex = 0; // Reset message index when person changes
    });
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _messageAutoScrollTimer.cancel();
    _personAutoScrollTimer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      height: 120,
      child: PageView.builder(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        itemCount: peopleData.length,
        itemBuilder: (context, personIndex) {
          final person = peopleData[personIndex];
          final currentMessage = person['messages'][_currentMessageIndex];
          
          return Container(
            margin: EdgeInsets.zero,
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
                    // Profile Image
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
                          person['image'],
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
                            TranslatedText(
                              person['name'],
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.normal,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TranslatedText(
                              currentMessage['bangla'],
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF333333),
                                height: 1.35,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 18),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Bottom-centered message indicators (dots)
                Positioned(
                  bottom: 6,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(person['messages'].length, (index) {
                        final bool active = _currentMessageIndex == index;
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

                // Person page indicators (top right)
                Positioned(
                  top: 4,
                  right: 4,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(peopleData.length, (index) {
                      final bool active = _currentPersonIndex == index;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: active
                              ? const Color(0xFF044E1F)
                              : const Color(0xFF044E1F).withOpacity(0.28),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}