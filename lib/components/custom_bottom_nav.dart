import 'package:flutter/material.dart';

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
    
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Bottom navigation bar with perfect circular cutout
        ClipPath(
          clipper: CircularNotchClipper(),
          child: Container(
            height: 75, // Increased height for better proportions like image 2
            decoration: const BoxDecoration(
              color: Color.fromARGB(255, 7, 85, 7), // More vibrant green like image 2
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
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(Icons.home, "Home", 0),
                _buildNavItem(Icons.phone, "Emergency", 1),
                SizedBox(width: screenWidth * 0.28), // More space for larger cutout
                _buildNavItem(Icons.recycling, "Borja", 2),
                _buildNavItem(Icons.photo_library, "Gallery", 3),
              ],
            ),
          ),
        ),
        // Perfect floating camera button positioned exactly like image 2
        Positioned(
          top: -15, // Perfect floating position like image 2
          left: (screenWidth / 2) - 35, // Perfect center alignment for 70px button
          child: Container(
            width: 70, // Larger size like image 2
            height: 70,
            decoration: BoxDecoration(
              color: const Color(0xFFFF4444), // Bright red like image 2
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: 4, // Thicker white border like image 2
              ),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black45,
                  blurRadius: 15,
                  offset: Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.red,
                  blurRadius: 25,
                  offset: Offset(0, 0),
                  spreadRadius: -5,
                ),
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 30,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(35),
                onTap: () => onTap(4), // Camera/QR Scanner action
                child: const Icon(
                  Icons.camera_alt,
                  color: Colors.white,
                  size: 35, // Larger icon size like image 2
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = currentIndex == index;
    
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8), // Better padding
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.white70,
                size: isSelected ? 30 : 26, // Slightly larger icons
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: isSelected ? 12 : 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              // White dot indicator for selected state
              Container(
                width: isSelected ? 8 : 0,
                height: isSelected ? 8 : 0,
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

// Perfect circular notch clipper exactly like image 2
class CircularNotchClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    
    // Perfect proportions for image 2 style
    final notchRadius = 52.0; // Larger radius for perfect circular cutout like image 2
    final notchCenter = size.width / 2;
    final notchStart = notchCenter - notchRadius;
    final notchEnd = notchCenter + notchRadius;
    
    // Start from top-left
    path.moveTo(0, 0);
    
    // Draw to the start of the notch
    path.lineTo(notchStart, 0);
    
    // Create perfect smooth circular arc exactly like image 2
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