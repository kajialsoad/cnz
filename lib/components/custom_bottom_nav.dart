import 'package:flutter/material.dart';
import '../widgets/translated_text.dart';

class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    
    return Container(
      height: 90 + bottomPadding, // Reduced height to minimize space below camera
      decoration: const BoxDecoration(
        color: Colors.transparent, // Make the container background transparent
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Bottom navigation bar with perfect circular cutout
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipPath(
              clipper: CircularNotchClipper(),
              child: Container(
                height: 60 + bottomPadding, // Significantly reduced height
                decoration: const BoxDecoration(
                  color: Color(0xFF044E1F),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 15,
                      offset: Offset(0, -5),
                    ),
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 25,
                      offset: Offset(0, -8),
                    ),
                  ],
                ),
                child: Padding(
                  padding: EdgeInsets.only(bottom: bottomPadding),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      _buildNavItem(Icons.home, "Home", 0),
                      _buildNavItem(Icons.phone, "Emergency", 1),
                      SizedBox(width: screenWidth * 0.2), // Further reduced space
                      _buildNavItem(Icons.recycling, "Borja", 2),
                      _buildNavItem(Icons.photo_library, "Gallery", 3),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Perfect floating camera button positioned 50% higher
          Positioned(
            top: 2, // Adjusted so camera center aligns with bar height
            left: (screenWidth / 2) - 28, // Perfect center alignment for 56px button
            child: Container(
              width: 56, // Further reduced size to prevent overflow
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFFF2424),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white,
                  width: 3, // Reduced border width
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black45,
                    blurRadius: 12,
                    offset: Offset(0, 6),
                  ),
                  BoxShadow(
                    color: Colors.red,
                    blurRadius: 20,
                    offset: Offset(0, 0),
                    spreadRadius: -5,
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(28),
                  onTap: () => onTap(4),
                  child: const Icon(
                    Icons.camera_alt,
                    color: Colors.white,
                    size: 26, // Reduced icon size to fit properly
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = currentIndex == index;
    
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2), // Further reduced padding
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.white70,
                size: isSelected ? 20 : 18, // Further reduced icon size
              ),
              const SizedBox(height: 1), // Minimal spacing
              Flexible(
                child: TranslatedText(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                    fontSize: isSelected ? 9 : 8, // Further reduced font size
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(height: 1), // Minimal spacing
              // White dot indicator for selected state
              Container(
                width: isSelected ? 4 : 0, // Further reduced dot size
                height: isSelected ? 4 : 0,
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : Colors.transparent,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Perfect circular notch clipper with optimized dimensions
class CircularNotchClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    
    // Optimized proportions to prevent overflow
    final notchRadius = 40.0; // Further reduced radius
    final notchCenter = size.width / 2;
    final notchStart = notchCenter - notchRadius;
    final notchEnd = notchCenter + notchRadius;
    
    // Start from top-left
    path.moveTo(0, 0);
    
    // Draw to the start of the notch
    path.lineTo(notchStart, 0);
    
    // Create perfect smooth circular arc
    path.arcToPoint(
      Offset(notchEnd, 0),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );
    
    // Continue to top-right
    path.lineTo(size.width, 0);
    
    // Draw right edge
    path.lineTo(size.width, size.height);
    
    // Draw bottom edge
    path.lineTo(0, size.height);
    
    // Close the path
    path.close();
    
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}