import 'package:flutter/material.dart';

class ComplaintGuideOverlay extends StatelessWidget {
  final VoidCallback onClose;

  const ComplaintGuideOverlay({super.key, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CustomPaint(
            painter: BubblePainter(),
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              constraints: const BoxConstraints(
                minWidth: 160,
                maxWidth: 200,
              ),
              child: const Text(
                'এখানে ময়লা বা বর্জ্য সংক্রান্ত অভিযোগ করুন।',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          Positioned(
            top: 6,
            right: 6,
            child: GestureDetector(
              onTap: onClose,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BubblePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF28628E).withOpacity(0.9) // Deep Blue transparent
      ..style = PaintingStyle.fill;

    final path = Path();
    final double w = size.width;
    final double h = size.height;
    final double r = 16.0; // Corner radius
    final double tailHeight = 16.0; // Height of the tail below the bubble body
    final double bodyBottom = h - tailHeight; // Bottom y-coordinate of the main body

    // Start top-left
    path.moveTo(r, 0);
    // Top edge
    path.lineTo(w - r, 0);
    // Top-right corner
    path.quadraticBezierTo(w, 0, w, r);
    // Right edge
    path.lineTo(w, bodyBottom - r);
    // Bottom-right corner
    path.quadraticBezierTo(w, bodyBottom, w - r, bodyBottom);
    
    // Bottom edge to tail start
    // We want the tail to be on the left side, pointing down-left
    path.lineTo(40, bodyBottom);
    
    // Tail
    path.lineTo(10, h); // Tail tip (bottom-left direction)
    path.lineTo(30, bodyBottom); // Back to body
    
    // Continue bottom edge
    path.lineTo(r, bodyBottom);
    // Bottom-left corner
    path.quadraticBezierTo(0, bodyBottom, 0, bodyBottom - r);
    // Left edge
    path.lineTo(0, r);
    // Top-left corner
    path.quadraticBezierTo(0, 0, r, 0);

    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
