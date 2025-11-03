import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../components/custom_bottom_nav.dart';

class GalleryPage extends StatelessWidget {
  const GalleryPage({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryGreen = Color(0xFF4CAF50);
    
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: primaryGreen,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Photo Gallery',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 100, // Extra padding for bottom navigation
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Clean Dhaka Activities Section
            const Text(
              'Clean Dhaka Activities',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3748),
              ),
            ),
            const SizedBox(height: 16),
            
            // Image Grid (2 rows, 3 columns)
            _buildImageGrid(),
            
            const SizedBox(height: 32),
            
            // Latest Updates Section
            _buildLatestUpdates(),
          ],
        ),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 3, // Gallery index
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/emergency');
              break;
            case 2:
              Navigator.pushReplacementNamed(context, '/waste-management');
              break;
            case 3:
              // Already on Gallery page
              break;
            case 4:
              // QR Scanner
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('QR স্ক্যানার খোলা হচ্ছে...'),
                  backgroundColor: Color(0xFF2E8B57),
                ),
              );
              break;
          }
        },
      ),
    );
  }

  Widget _buildImageGrid() {
    // Sample image data - in real app, these would be actual image URLs
    final List<String> imageDescriptions = [
      'Railway cleaning drive',
      'Waste collection bags',
      'Modern building cleaning',
      'Street cleaning worker',
      'Railway maintenance',
      'Recycling collection',
    ];

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            Colors.grey.shade50,
          ],
        ),
        boxShadow: [
          // Main shadow for depth
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            offset: const Offset(0, 10),
            blurRadius: 30,
            spreadRadius: 0,
          ),
          // Secondary shadow
          BoxShadow(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            offset: const Offset(0, 5),
            blurRadius: 20,
            spreadRadius: 0,
          ),
          // Inner highlight
          BoxShadow(
            color: Colors.white.withOpacity(0.8),
            offset: const Offset(0, -2),
            blurRadius: 10,
            spreadRadius: -2,
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1,
        ),
        itemCount: 6,
        itemBuilder: (context, index) {
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.grey.shade100,
                  Colors.grey.shade200,
                ],
              ),
              boxShadow: [
                // Main card shadow
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  offset: const Offset(0, 6),
                  blurRadius: 15,
                  spreadRadius: 0,
                ),
                // Inner highlight
                BoxShadow(
                  color: Colors.white.withOpacity(0.7),
                  offset: const Offset(0, -1),
                  blurRadius: 6,
                  spreadRadius: -1,
                ),
                // Colored glow
                BoxShadow(
                  color: const Color(0xFF4CAF50).withOpacity(0.1),
                  offset: const Offset(0, 3),
                  blurRadius: 10,
                  spreadRadius: 0,
                ),
              ],
              border: Border.all(
                color: Colors.white.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  // Placeholder for image with gradient
                  Container(
                    width: double.infinity,
                    height: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.grey.shade300,
                          Colors.grey.shade400,
                        ],
                      ),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment.center,
                          radius: 0.8,
                          colors: [
                            const Color(0xFF4CAF50).withOpacity(0.1),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: Icon(
                        Icons.photo_camera_outlined,
                        size: 32,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                  // Enhanced overlay with description
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(16),
                          bottomRight: Radius.circular(16),
                        ),
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.black.withOpacity(0.8),
                            Colors.black.withOpacity(0.4),
                            Colors.transparent,
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            offset: const Offset(0, -2),
                            blurRadius: 8,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                      child: Text(
                        imageDescriptions[index],
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          shadows: [
                            Shadow(
                              offset: Offset(1, 1),
                              blurRadius: 3,
                              color: Colors.black54,
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ).animate(delay: (index * 100).ms)
              .fadeIn(duration: 800.ms)
              .scale(
                begin: const Offset(0.8, 0.8),
                duration: 600.ms,
                curve: Curves.easeOutBack,
              )
              .slideY(
                begin: 0.3,
                duration: 500.ms,
                curve: Curves.easeOutBack,
              )
              .shimmer(
                duration: 1500.ms,
                color: const Color(0xFF4CAF50).withOpacity(0.2),
              );
        },
      ),
    ).animate(delay: 200.ms)
        .fadeIn(duration: 1000.ms)
        .slideY(
          begin: 0.2,
          duration: 800.ms,
          curve: Curves.easeOutBack,
        );
  }

  Widget _buildLatestUpdates() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            Colors.grey.shade50,
          ],
        ),
        boxShadow: [
          // Main shadow
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            offset: const Offset(0, 8),
            blurRadius: 25,
            spreadRadius: 0,
          ),
          // Green accent shadow
          BoxShadow(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            offset: const Offset(0, 4),
            blurRadius: 15,
            spreadRadius: 0,
          ),
          // Inner highlight
          BoxShadow(
            color: Colors.white.withOpacity(0.8),
            offset: const Offset(0, -2),
            blurRadius: 10,
            spreadRadius: -2,
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Latest Updates',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4CAF50),
            ),
          ),
          const SizedBox(height: 16),
          
          // Tree plantation update
          _buildUpdateItem(
            '📸',
            'Tree plantation drive - 500+ trees planted this month',
          ),
          
          const SizedBox(height: 12),
          
          // Community cleaning update
          _buildUpdateItem(
            '🌱',
            'Community cleaning event scheduled for next Saturday',
          ),
        ],
      ),
    ).animate(delay: 600.ms)
        .fadeIn(duration: 1000.ms)
        .slideY(
          begin: 0.3,
          duration: 800.ms,
          curve: Curves.easeOutBack,
        )
        .scale(
          begin: const Offset(0.9, 0.9),
          duration: 600.ms,
          curve: Curves.easeOutBack,
        )
        .shimmer(
          duration: 2000.ms,
          color: const Color(0xFF4CAF50).withOpacity(0.1),
        );
  }

  Widget _buildUpdateItem(String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                const Color(0xFFF0F9FF),
                const Color(0xFFE6F7FF),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4CAF50).withOpacity(0.2),
                offset: const Offset(2, 2),
                blurRadius: 8,
                spreadRadius: -2,
              ),
              BoxShadow(
                color: Colors.white.withOpacity(0.8),
                offset: const Offset(-1, -1),
                blurRadius: 6,
                spreadRadius: -2,
              ),
            ],
            border: Border.all(
              color: const Color(0xFF4CAF50).withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Text(
            emoji,
            style: const TextStyle(fontSize: 18),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2D3748),
              height: 1.4,
            ),
          ),
        ),
      ],
    ).animate(delay: 800.ms)
        .fadeIn(duration: 600.ms)
        .slideX(
          begin: 0.2,
          duration: 500.ms,
          curve: Curves.easeOutBack,
        );
  }
}