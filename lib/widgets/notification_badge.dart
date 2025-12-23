import 'package:flutter/material.dart';

/// A badge widget that displays a notification count
/// 
/// Features:
/// - Displays unread count
/// - Pulsing animation for attention
/// - Customizable colors and size
/// - Auto-hides when count is 0
class NotificationBadge extends StatefulWidget {
  /// The number of unread notifications
  final int count;
  
  /// The child widget to display the badge on
  final Widget child;
  
  /// Badge background color (default: red)
  final Color? backgroundColor;
  
  /// Badge text color (default: white)
  final Color? textColor;
  
  /// Badge size (default: 18)
  final double? size;
  
  /// Whether to show pulsing animation (default: true)
  final bool showAnimation;
  
  /// Offset position of the badge (default: top-right)
  final Offset? offset;

  const NotificationBadge({
    super.key,
    required this.count,
    required this.child,
    this.backgroundColor,
    this.textColor,
    this.size,
    this.showAnimation = true,
    this.offset,
  });

  @override
  State<NotificationBadge> createState() => _NotificationBadgeState();
}

class _NotificationBadgeState extends State<NotificationBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controller
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    // Create scale animation (pulse effect)
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    // Start animation if enabled and count > 0
    if (widget.showAnimation && widget.count > 0) {
      _animationController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(NotificationBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Update animation based on count changes
    if (widget.count > 0 && widget.showAnimation) {
      if (!_animationController.isAnimating) {
        _animationController.repeat(reverse: true);
      }
    } else {
      _animationController.stop();
      _animationController.reset();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // If count is 0, just show the child without badge
    if (widget.count <= 0) {
      return widget.child;
    }

    final badgeSize = widget.size ?? 18.0;
    final bgColor = widget.backgroundColor ?? Colors.red;
    final txtColor = widget.textColor ?? Colors.white;
    final badgeOffset = widget.offset ?? const Offset(10, -5);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        widget.child,
        Positioned(
          right: badgeOffset.dx,
          top: badgeOffset.dy,
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: widget.showAnimation ? _scaleAnimation.value : 1.0,
                child: child,
              );
            },
            child: Container(
              constraints: BoxConstraints(
                minWidth: badgeSize,
                minHeight: badgeSize,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(badgeSize / 2),
                border: Border.all(
                  color: Colors.white,
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: bgColor.withOpacity(0.4),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  widget.count > 99 ? '99+' : widget.count.toString(),
                  style: TextStyle(
                    color: txtColor,
                    fontSize: badgeSize * 0.6,
                    fontWeight: FontWeight.bold,
                    height: 1.0,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// A simple unread indicator dot for complaint cards
/// 
/// Shows a small red dot to indicate unread notifications
class UnreadIndicator extends StatelessWidget {
  /// Size of the indicator dot (default: 8)
  final double size;
  
  /// Color of the indicator (default: red)
  final Color? color;

  const UnreadIndicator({
    super.key,
    this.size = 8.0,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color ?? Colors.red,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (color ?? Colors.red).withOpacity(0.4),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
    );
  }
}
