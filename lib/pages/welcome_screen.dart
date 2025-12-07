import 'dart:math' as math;

import 'package:flutter/material.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final CurvedAnimation _curved;
  late final AnimationController _spinController;
  late final Animation<double> _spin;
  late final AnimationController _pulseController;
  late final CurvedAnimation _pulseCurved;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);
    _curved = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 16),
    )..repeat();
    _spin = Tween<double>(begin: 0, end: 2 * math.pi)
        .animate(CurvedAnimation(parent: _spinController, curve: Curves.linear));

    // Faster pulse for twinkling small icons (e.g., star)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseCurved = CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _spinController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Widget _animatedBgIcon({
    required IconData icon,
    required Alignment begin,
    required Alignment end,
    required double size,
    Color color = Colors.white,
    double minOpacity = 0.15,
    double maxOpacity = 0.35,
    double minScale = 0.95,
    double maxScale = 1.05,
    Curve curve = Curves.easeInOut,
    bool rotate = true,
    double rotationSpeed = 1.0,
  }) {
    final alignAnim = AlignmentTween(begin: begin, end: end)
        .animate(CurvedAnimation(parent: _controller, curve: curve));
    final opacityAnim = Tween<double>(begin: minOpacity, end: maxOpacity)
        .animate(CurvedAnimation(parent: _controller, curve: curve));
    final scaleAnim = Tween<double>(begin: minScale, end: maxScale)
        .animate(CurvedAnimation(parent: _controller, curve: curve));

    return AnimatedBuilder(
      animation: Listenable.merge([_controller, _spinController]),
      builder: (_, __) => Align(
        alignment: alignAnim.value,
        child: Transform.scale(
          scale: scaleAnim.value,
          child: Transform.rotate(
            angle: rotate ? _spin.value * rotationSpeed : 0,
            child: Icon(icon, size: size, color: color.withOpacity(opacityAnim.value)),
          ),
        ),
      ),
    );
  }

  // Twinkling variant: uses pulse controller for scale/opacity and adds soft glow
  Widget _twinkleBgIcon({
    required IconData icon,
    required Alignment begin,
    required Alignment end,
    required double size,
    Color color = Colors.white,
    double minOpacity = 0.45,
    double maxOpacity = 0.85,
    double minScale = 0.85,
    double maxScale = 1.15,
    Curve curve = Curves.easeInOut,
    bool rotate = true,
    double rotationSpeed = 0.8,
  }) {
    final alignAnim = AlignmentTween(begin: begin, end: end)
        .animate(CurvedAnimation(parent: _controller, curve: curve));
    final opacityAnim = Tween<double>(begin: minOpacity, end: maxOpacity)
        .animate(_pulseCurved);
    final scaleAnim = Tween<double>(begin: minScale, end: maxScale)
        .animate(_pulseCurved);

    return AnimatedBuilder(
      animation: Listenable.merge([_controller, _pulseController, _spinController]),
      builder: (_, __) => Align(
        alignment: alignAnim.value,
        child: Transform.scale(
          scale: scaleAnim.value,
          child: Transform.rotate(
            angle: rotate ? _spin.value * rotationSpeed : 0,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Soft glow layer
                Icon(
                  icon,
                  size: size * 1.25,
                  color: color.withOpacity(opacityAnim.value * 0.20),
                ),
                // Main icon
                Icon(
                  icon,
                  size: size,
                  color: color.withOpacity(opacityAnim.value),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF3FA564),
        ),
        child: Stack(
          children: [
            // Animated background icons: Leaf, Star, Dustbin
            Positioned.fill(
              child: IgnorePointer(
                child: Stack(
                  children: [
                    _animatedBgIcon(
                      icon: Icons.eco_outlined,
                      begin: const Alignment(-0.85, -0.70),
                      end: const Alignment(-0.60, -0.45),
                      size: 84,
                      rotate: true,
                      rotationSpeed: 0.15,
                    ),
                    _twinkleBgIcon(
                      icon: Icons.star_outline,
                      begin: const Alignment(-0.55, -0.10),
                      end: const Alignment(-0.35, 0.05),
                      size: 40,
                      rotate: true,
                      rotationSpeed: 1.0,
                    ),
                    _animatedBgIcon(
                      icon: Icons.delete_outline,
                      begin: const Alignment(0.65, -0.05),
                      end: const Alignment(0.78, -0.28),
                      size: 64,
                      rotate: true,
                      rotationSpeed: 0.3,
                    ),
                    _animatedBgIcon(
                      icon: Icons.autorenew,
                      begin: const Alignment(0.35, 0.65),
                      end: const Alignment(0.55, 0.78),
                      size: 96,
                      rotate: true,
                      rotationSpeed: 0.5,
                    ),
                  ],
                ),
              ),
            ),

            // Foreground content
            SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 130,
                        height: 130,
                        child: Image.asset(
                          'assets/logo_clean_c.png',
                          width: 130,
                          height: 128,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Clean Care',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Clean City, Green Life',
                        style: TextStyle(color: Colors.white70, fontSize: 18),
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF2E8B57),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24)),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          onPressed: () => Navigator.pushNamed(context, '/signup'),
                          child: const Text('Sign Up'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white70, width: 2),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24)),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          onPressed: () => Navigator.pushNamed(context, '/login'),
                          child: const Text('Login'),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.eco_outlined, color: Colors.white70, size: 18),
                          SizedBox(width: 6),
                          Text('Eco-Friendly', style: TextStyle(color: Colors.white70)),
                          SizedBox(width: 22),
                          Icon(Icons.autorenew, color: Colors.white70, size: 18),
                          SizedBox(width: 6),
                          Text('Smart City', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
