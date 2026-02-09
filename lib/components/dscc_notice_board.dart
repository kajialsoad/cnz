import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../widgets/translated_text.dart';
import '../providers/notice_provider.dart';
import '../providers/language_provider.dart';

class DSCCNoticeBoard extends StatefulWidget {
  const DSCCNoticeBoard({super.key});

  @override
  State<DSCCNoticeBoard> createState() => _DSCCNoticeBoardState();
}

class _DSCCNoticeBoardState extends State<DSCCNoticeBoard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scrollController;
  late Animation<Offset> _scrollAnimation;

  @override
  void initState() {
    super.initState();
    _scrollController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    );

    _scrollAnimation = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: const Offset(-1.0, 0.0),
    ).animate(CurvedAnimation(parent: _scrollController, curve: Curves.linear));

    _startScrolling();
    
    // Load notices
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NoticeProvider>(context, listen: false).loadNotices();
    });
  }

  void _startScrolling() {
    _scrollController.repeat();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final noticeProvider = Provider.of<NoticeProvider>(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.languageCode;

    // Get urgent and recent notices for scrolling
    final urgentNotices = noticeProvider.notices
        .where((n) => n.isUrgent && !n.isExpired)
        .take(3)
        .toList();
    
    final recentNotices = noticeProvider.notices
        .where((n) => !n.isUrgent && !n.isExpired)
        .take(2)
        .toList();

    final displayNotices = [...urgentNotices, ...recentNotices];

    if (displayNotices.isEmpty) {
      return const SizedBox.shrink();
    }

    // Create scrolling text from notices
    final noticeTexts = displayNotices.map((notice) {
      final title = notice.getLocalizedTitle(currentLanguage);
      final icon = notice.isUrgent ? '🚨' : '📢';
      return '$icon $title';
    }).toList();

    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/notice-board');
      },
      child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.95),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  offset: const Offset(0, 3),
                  blurRadius: 10,
                  spreadRadius: 0,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            offset: const Offset(0, 1),
                            blurRadius: 2,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.asset(
                          'assets/logo.png',
                          width: 24,
                          height: 24,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TranslatedText(
                        "DSCC Notice Board",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2E8B57),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: Color(0xFF2E8B57),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 30,
                  width: double.infinity,
                  child: ClipRect(
                    child: AnimatedBuilder(
                      animation: _scrollAnimation,
                      builder: (context, child) {
                        final String scrollingText =
                            '${noticeTexts.join(' • ')} • ${noticeTexts.join(' • ')}';

                        return SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const NeverScrollableScrollPhysics(),
                          child: Transform.translate(
                            offset: Offset(
                              _scrollAnimation.value.dx *
                                  MediaQuery.of(context).size.width,
                              0,
                            ),
                            child: RepaintBoundary(
                              child: Container(
                                height: 30,
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  scrollingText,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF333333),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.visible,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          )
          .animate()
          .fadeIn(duration: 800.ms)
          .slideY(begin: 0.3, duration: 600.ms, curve: Curves.easeOut),
    );
  }
}