import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../components/custom_bottom_nav.dart';

class MapPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Draw grid pattern
    for (double i = 0; i < size.width; i += 20) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i, size.height),
        paint,
      );
    }

    for (double i = 0; i < size.height; i += 20) {
      canvas.drawLine(
        Offset(0, i),
        Offset(size.width, i),
        paint,
      );
    }

    // Draw some decorative circles
    final circlePaint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(size.width * 0.2, size.height * 0.3), 30, circlePaint);
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.7), 25, circlePaint);
    canvas.drawCircle(Offset(size.width * 0.7, size.height * 0.2), 20, circlePaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}

class WasteManagementPage extends StatefulWidget {
  const WasteManagementPage({Key? key}) : super(key: key);
  
  @override
  _WasteManagementPageState createState() => _WasteManagementPageState();
}

class _WasteManagementPageState extends State<WasteManagementPage>
    with TickerProviderStateMixin {
  late AnimationController _truckController1;
  late AnimationController _truckController2;
  late AnimationController _truckController3;
  late AnimationController _truckController4;
  late AnimationController _mapController;
  late AnimationController _centerIconController;
  late AnimationController _pulseController;

  // Color palette
  static const Color primaryGreen = Color(0xFF4CAF50);
  static const Color lightGreen = Color(0xFFE8F5E8);
  static const Color darkGreen = Color(0xFF2E7D32);
  static const Color warningOrange = Color(0xFFFF9800);
  static const Color successGreen = Color(0xFF4CAF50);
  static const Color upcomingBlue = Color(0xFF2196F3);

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controllers
    _truckController1 = AnimationController(
      duration: Duration(seconds: 4),
      vsync: this,
    )..repeat();
    
    _truckController2 = AnimationController(
      duration: Duration(seconds: 5),
      vsync: this,
    )..repeat();
    
    _truckController3 = AnimationController(
      duration: Duration(seconds: 6),
      vsync: this,
    )..repeat();
    
    _truckController4 = AnimationController(
       duration: Duration(milliseconds: 4500),
       vsync: this,
     )..repeat();
     
     _mapController = AnimationController(
       duration: Duration(seconds: 3),
       vsync: this,
     )..repeat();

     _centerIconController = AnimationController(
       duration: Duration(seconds: 2),
       vsync: this,
     )..repeat();

     _pulseController = AnimationController(
       duration: Duration(milliseconds: 1500),
       vsync: this,
     )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _truckController1.dispose();
    _truckController2.dispose();
    _truckController3.dispose();
    _truckController4.dispose();
    _mapController.dispose();
    _centerIconController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  bottom: 100, // Extra padding for bottom navigation
                ),
                child: Column(
                  children: [
                    _buildInteractiveMap(),
                    const SizedBox(height: 20),
                    _buildNextPickupCard(),
                    const SizedBox(height: 24),
                    _buildCollectionSchedule(),
                    const SizedBox(height: 24),
                    _buildWasteSeparationTips(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 2, // Borjo/Waste index
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/emergency');
              break;
            case 2:
              // Already on Waste management page
              break;
            case 3:
              Navigator.pushReplacementNamed(context, '/gallery');
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

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF2E8B57),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(0),
          bottomRight: Radius.circular(0),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Borjo Management',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInteractiveMap() {
    return Container(
      width: double.infinity,
      height: 280,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, 8),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Map background with gradient
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  lightGreen.withOpacity(0.3),
                  lightGreen.withOpacity(0.2),
                  primaryGreen.withOpacity(0.1),
                ],
              ),
            ),
          ),
          // Map content - Centered properly
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Location icon with animation
                AnimatedBuilder(
                  animation: _centerIconController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: 1.0 + (_centerIconController.value * 0.1),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: primaryGreen,
                          borderRadius: BorderRadius.circular(50),
                          boxShadow: [
                            BoxShadow(
                              color: primaryGreen.withOpacity(0.3),
                              offset: const Offset(0, 4),
                              blurRadius: 12,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                const Text(
                  'Interactive Waste Pickup Map',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Tap to view collection zones',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF718096),
                  ),
                ),
              ],
            ),
          ),
          // Animated truck icons
          ..._buildAnimatedTrucks(),
        ],
      ),
    );
  }

  List<Widget> _buildAnimatedTrucks() {
    return [
      _buildMovingTruck(_truckController1, 0),
      _buildMovingTruck(_truckController2, 1),
      _buildMovingTruck(_truckController3, 2),
      _buildMovingTruck(_truckController4, 3),
    ];
  }

  Widget _buildMovingTruck(AnimationController controller, int truckIndex) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final progress = controller.value;
        
        // Simple right to left movement for all trucks
        late double x, y;
        late double rotation;
        late bool isVisible;
        
        // Different Y positions for each truck to avoid overlap
        final baseY = 40.0 + (truckIndex * 35.0); // Vertical spacing between trucks
        
        // All trucks move from left to right
        if (progress < 0.1) {
          // Starting from outside left edge
          x = -50;
          y = baseY;
          rotation = 0; // Facing right
          isVisible = false; // Not visible yet
        } else if (progress < 0.9) {
          // Moving from left to right across the map
          final moveProgress = (progress - 0.1) / 0.8;
          x = -50 + (moveProgress * 400); // Move 400 pixels from left to right
          y = baseY;
          rotation = 0; // Facing right
          isVisible = true;
        } else {
          // Exiting on the right side
          final exitProgress = (progress - 0.9) / 0.1;
          x = 350 + (exitProgress * 50);
          y = baseY;
          rotation = 0; // Facing right
          isVisible = exitProgress < 0.5; // Fade out
        }
        
        if (!isVisible) {
          return const SizedBox.shrink();
        }
        
        return Positioned(
          left: x,
          top: y,
          child: Transform.rotate(
            angle: rotation,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: primaryGreen.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: primaryGreen.withOpacity(0.3),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: const Icon(
                Icons.local_shipping,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildNextPickupCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: primaryGreen,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: primaryGreen.withOpacity(0.3),
            offset: const Offset(0, 4),
            blurRadius: 12,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.access_time,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Next Pickup in Your Area',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Tomorrow, 8:00 AM - 10:00 AM',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Ward 12, Dhanmondi',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCollectionSchedule() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Collection Schedule',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 16),
        _buildScheduleCard(
          ward: 'Ward 12',
          time: '8:00 AM - 10:00 AM',
          days: 'Monday, Wednesday, Friday',
          status: 'Collected',
          statusColor: successGreen,
          delay: 0,
        ),
        const SizedBox(height: 12),
        _buildScheduleCard(
          ward: 'Ward 13',
          time: '10:00 AM - 12:00 PM',
          days: 'Tuesday, Thursday, Saturday',
          status: 'Upcoming',
          statusColor: upcomingBlue,
          delay: 200,
        ),
        const SizedBox(height: 12),
        _buildScheduleCard(
          ward: 'Ward 14',
          time: '2:00 PM - 4:00 PM',
          days: 'Monday, Wednesday, Friday',
          status: 'In Progress',
          statusColor: warningOrange,
          delay: 400,
        ),
      ],
    );
  }

  Widget _buildScheduleCard({
    required String ward,
    required String time,
    required String days,
    required String status,
    required Color statusColor,
    required int delay,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.local_shipping,
                  color: statusColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          ward,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2D3748),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF718096),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.schedule,
                size: 16,
                color: Color(0xFF718096),
              ),
              const SizedBox(width: 8),
              Text(
                days,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF718096),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWasteSeparationTips() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: lightGreen.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: primaryGreen.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '♻️',
                  style: TextStyle(fontSize: 20),
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Waste Separation Tips',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(255, 24, 180, 76),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTipItem('• Separate organic and non-organic waste'),
          _buildTipItem('• Keep recyclables clean and dry'),
          _buildTipItem('• Place waste bags outside before pickup time'),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          color: Color(0xFF2D3748),
          height: 1.4,
        ),
      ),
    );
  }
}