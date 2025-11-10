import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../widgets/translated_text.dart';

class Elevated3DButton extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final Color primaryColor;
  final Color secondaryColor;
  final double width;
  final double height;
  final bool isOval;
  final bool isFlat;

  const Elevated3DButton({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    required this.primaryColor,
    required this.secondaryColor,
    this.width = 140,
    this.height = 160,
    this.isOval = true,
    this.isFlat = false,
  });

  @override
  State<Elevated3DButton> createState() => _Elevated3DButtonState();
}

class _Elevated3DButtonState extends State<Elevated3DButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _elevationAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _elevationAnimation = Tween<double>(
      begin: 8.0,
      end: 4.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    setState(() {
      _isPressed = true;
    });
    _animationController.forward();
  }

  void _onTapUp(TapUpDetails details) {
    setState(() {
      _isPressed = false;
    });
    _animationController.reverse();
    widget.onTap();
  }

  void _onTapCancel() {
    setState(() {
      _isPressed = false;
    });
    _animationController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Transform.scale(
            scale: widget.isFlat ? 1 : _scaleAnimation.value,
            child: Transform.translate(
              offset: Offset(0, widget.isFlat ? 0 : (_isPressed ? 2 : 0)),
              child: Container(
                width: widget.width,
                height: widget.height,
                decoration: BoxDecoration(
                  color: widget.isFlat ? widget.primaryColor : null,
                  gradient: widget.isFlat
                      ? null
                      : LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            widget.primaryColor.withOpacity(0.9),
                            widget.primaryColor,
                            widget.secondaryColor,
                            widget.secondaryColor.withOpacity(0.8),
                          ],
                          stops: const [0.0, 0.3, 0.7, 1.0],
                        ),
                  borderRadius: widget.isOval
                      ? BorderRadius.all(Radius.elliptical(
                          widget.width / 2, widget.height / 2.2))
                      : BorderRadius.circular(50), // Much higher radius for very rounded petal shape
                  boxShadow: widget.isFlat
                      ? []
                      : [
                          // Primary deep shadow for strong 3D effect
                          BoxShadow(
                            color: widget.primaryColor.withOpacity(0.4),
                            offset: const Offset(0, 8),
                            blurRadius: _elevationAnimation.value + 12,
                            spreadRadius: 2,
                          ),
                          // Secondary shadow for depth
                          BoxShadow(
                            color: widget.primaryColor.withOpacity(0.2),
                            offset: const Offset(0, 4),
                            blurRadius: _elevationAnimation.value + 6,
                            spreadRadius: 1,
                          ),
                          // Dark shadow for contrast
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            offset: const Offset(0, 6),
                            blurRadius: _elevationAnimation.value + 8,
                            spreadRadius: 0,
                          ),
                          // Inner highlight effect
                          BoxShadow(
                            color: Colors.white.withOpacity(0.1),
                            offset: const Offset(0, -2),
                            blurRadius: _elevationAnimation.value + 2,
                            spreadRadius: 0,
                          ),
                        ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        widget.icon,
                        color: Colors.white,
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      TranslatedText(
                        widget.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 2),
                      TranslatedText(
                        widget.subtitle,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    ).animate().fadeIn(duration: 600.ms).scale(
          begin: const Offset(0.8, 0.8),
          duration: 400.ms,
          curve: Curves.elasticOut,
        );
  }
}