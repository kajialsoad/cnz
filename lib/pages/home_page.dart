import 'package:flutter/material.dart';
import 'dart:math' as math;

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with SingleTickerProviderStateMixin {
  late final AnimationController _iconController;

  static const Color green = Color(0xFF2E8B57);
  static const Color greenSoft = Color(0xFF7CC289);
  static const Color yellow = Color(0xFFF6D66B);
  static const Color red = Color(0xFFE86464);

  @override
  void initState() {
    super.initState();
    _iconController = AnimationController(vsync: this, duration: const Duration(seconds: 8))
      ..repeat();
  }

  @override
  void dispose() {
    _iconController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3FAF5),
      appBar: AppBar(
        backgroundColor: _HomePageState.green,
        foregroundColor: Colors.white,
        elevation: 0,
        toolbarHeight: 72,
        // Gradient to match header style of image 1
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E8B57), Color(0xFF2EA66C)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        leadingWidth: 76,
        leading: Padding(
          padding: const EdgeInsets.only(left: 10.0),
          child: Align(
            alignment: Alignment.centerLeft,
            child: _NavRecycleBadge(controller: _iconController),
          ),
        ),
        titleSpacing: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Clean Care', style: TextStyle(fontWeight: FontWeight.w600)),
            SizedBox(height: 2),
            Text('Your City, Your Care',
                style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12.0),
            child: Icon(Icons.menu, color: Colors.white),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 16),
              _FeatureCluster(),
              const SizedBox(height: 24),
              _NoticeCard(),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: const [
                    Expanded(child: _StatCard(title: '24/7', subtitle: 'Active Support', color: _HomePageState.greenSoft, icon: Icons.support_agent)),
                    SizedBox(width: 12),
                    Expanded(child: _StatCard(title: '1500+', subtitle: 'Issues Resolved', color: _HomePageState.yellow, icon: Icons.volunteer_activism)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        selectedItemColor: _HomePageState.green,
        unselectedItemColor: Colors.grey.shade600,
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.emergency), label: 'Emergency'),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt), label: 'Camera'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'Borjo'),
          BottomNavigationBarItem(icon: Icon(Icons.photo_library), label: 'Gallery'),
        ],
      ),
    );
  }
}

class _FeatureCluster extends StatelessWidget {
  const _FeatureCluster();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double itemW = 180;
        final double itemH = 220;
        const double pad = 24;
        return Container(
          height: 520,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFE9F6EE), Color(0xFFF7FCF9)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              const _BackgroundIcons(),
              Positioned(
                top: 18,
                left: pad,
                child: _CutoutFeature(
                  width: itemW,
                  height: itemH,
                  color: _HomePageState.green,
                  icon: Icons.headset_mic,
                  label: 'Customer Care',
                  side: _CutSide.bottom,
                ),
              ),
              Positioned(
              top: 18,
              right: pad,
              child: _CutoutFeature(
                width: itemW,
                height: itemH,
                color: _HomePageState.green,
                icon: Icons.chat_bubble_outline,
                label: 'Live Chat',
                side: _CutSide.bottom,
              ),
            ),
            Positioned(
              bottom: 40,
              left: pad,
              child: _CutoutFeature(
                width: itemW,
                height: itemH,
                color: _HomePageState.yellow,
                icon: Icons.credit_card,
                label: 'Payment Gateway',
                rotateLabel: true,
                side: _CutSide.top,
              ),
            ),
            Positioned(
              bottom: 40,
              right: pad,
              child: _CutoutFeature(
                width: itemW,
                height: itemH,
                color: _HomePageState.yellow,
                icon: Icons.favorite_border,
                label: 'Donation',
                rotateLabel: true,
                side: _CutSide.top,
              ),
            ),
              const _ComplaintButton(),
            ],
          ),
        );
      },
    );
  }
}

enum _CutSide { top, bottom }

class _CutoutFeature extends StatelessWidget {
  final double width;
  final double height;
  final Color color;
  final IconData icon;
  final String label;
  final bool rotateLabel;
  final _CutSide side;

  const _CutoutFeature({
    super.key,
    required this.width,
    required this.height,
    required this.color,
    required this.icon,
    required this.label,
    this.rotateLabel = false,
    required this.side,
  });

  @override
  Widget build(BuildContext context) {
    final Color c2 = Color.lerp(color, Colors.white, 0.12)!;
    return ClipPath(
      clipper: _CutoutClipper(side: side, radius: 72),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, c2],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.20),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 12),
                Transform.rotate(
                  angle: rotateLabel ? -0.25 : 0,
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
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
}

class _CutoutClipper extends CustomClipper<Path> {
  final _CutSide side;
  final double radius;
  const _CutoutClipper({required this.side, required this.radius});

  @override
  Path getClip(Size size) {
    final rectPath = Path()
      ..addRRect(RRect.fromRectXY(
        Rect.fromLTWH(0, 0, size.width, size.height),
        32,
        32,
      ));
    final cy = side == _CutSide.bottom ? size.height - radius - 4 : radius + 4;
    final circlePath = Path()
      ..addOval(Rect.fromCircle(center: Offset(size.width / 2, cy), radius: radius));
    return Path.combine(PathOperation.difference, rectPath, circlePath);
  }

  @override
  bool shouldReclip(covariant _CutoutClipper oldClipper) {
    return oldClipper.side != side || oldClipper.radius != radius;
  }
}

class _OvalFeature extends StatelessWidget {
  final double width;
  final double height;
  final Color color;
  final IconData icon;
  final String label;
  final bool rotateLabel;

  const _OvalFeature({
    super.key,
    required this.width,
    required this.height,
    required this.color,
    required this.icon,
    required this.label,
    this.rotateLabel = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 14, offset: const Offset(0, 10)),
        ],
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.20),
                shape: BoxShape.circle,
              ),
                child: Icon(icon, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 12),
              Transform.rotate(
                angle: rotateLabel ? -0.25 : 0,
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 8)),
          ],
        ),
        child: const ListTile(
          leading: Icon(Icons.campaign, color: Colors.redAccent),
          title: Text('DSCC Notice Board', style: TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Tree plantation drive this Friday at Ramna Park • ✨'),
        ),
      ),
    );
  }
}

class _ComplaintButton extends StatelessWidget {
  const _ComplaintButton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer green soft ring
          Container(
            width: 210,
            height: 210,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: _HomePageState.greenSoft.withOpacity(0.25),
                width: 16,
              ),
            ),
          ),
          // Middle white ring
          Container(
            width: 178,
            height: 178,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
          ),
          // Main red circle
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: _HomePageState.red,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, color: Colors.white, size: 42),
                  SizedBox(height: 8),
                  Text(
                    'অভিযোগ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text('Complaint', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BackgroundIcons extends StatelessWidget {
  const _BackgroundIcons();

  @override
  Widget build(BuildContext context) {
    final Color c = Colors.black.withOpacity(0.06);
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(top: 20, left: 40, child: Icon(Icons.grid_3x3, color: c, size: 18)),
          Positioned(top: 70, right: 32, child: Icon(Icons.eco_outlined, color: c, size: 20)),
          Positioned(top: 140, left: 20, child: Icon(Icons.auto_awesome, color: c, size: 18)),
          Positioned(bottom: 120, left: 36, child: Icon(Icons.crop_square, color: c, size: 18)),
          Positioned(bottom: 80, right: 46, child: Icon(Icons.circle_outlined, color: c, size: 18)),
          Positioned(bottom: 30, right: 20, child: Icon(Icons.blur_on, color: c, size: 18)),
        ],
      ),
    );
  }
}

class _NavRecycleBadge extends StatelessWidget {
  final AnimationController controller;
  const _NavRecycleBadge({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      clipBehavior: Clip.none,
      children: [
        // Outer subtle spinner ring
        RotationTransition(
          turns: CurvedAnimation(parent: controller, curve: Curves.linear),
          child: SizedBox(
            width: 58,
            height: 58,
            child: CircularProgressIndicator(
              strokeWidth: 2.6,
              valueColor: AlwaysStoppedAnimation(_HomePageState.greenSoft.withOpacity(0.9)),
              backgroundColor: Colors.transparent,
            ),
          ),
        ),
        // White circular badge with rotating recycle icon
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4)),
            ],
          ),
          child: RotationTransition(
            turns: CurvedAnimation(parent: controller, curve: Curves.linear),
            child: const Icon(Icons.recycling, color: _HomePageState.green, size: 26),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color color;
  final IconData icon;

  const _StatCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 8)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}