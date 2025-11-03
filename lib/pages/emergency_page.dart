import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';

class EmergencyPage extends StatefulWidget {
  const EmergencyPage({super.key});

  @override
  State<EmergencyPage> createState() => _EmergencyPageState();
}

class _EmergencyPageState extends State<EmergencyPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('কল করতে পারছি না: $phoneNumber'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
                    _buildEmergencyAlert(),
                    const SizedBox(height: 20),
                    _buildEmergencyCard(
                      title: 'DSCC Emergency',
                      subtitle: 'Waste emergency & city services',
                      phoneNumber: '16106',
                      color: const Color(0xFFE53E3E),
                      icon: Icons.warning,
                      delay: 0,
                    ),
                    const SizedBox(height: 16),
                    _buildEmergencyCard(
                      title: 'National Emergency',
                      subtitle: 'Police, Fire, Ambulance',
                      phoneNumber: '999',
                      color: const Color(0xFF3182CE),
                      icon: Icons.shield,
                      delay: 200,
                    ),
                    const SizedBox(height: 16),
                    _buildEmergencyCard(
                      title: 'Fire Service',
                      subtitle: 'Fire & rescue services',
                      phoneNumber: '102',
                      color: const Color(0xFFDD6B20),
                      icon: Icons.local_fire_department,
                      delay: 400,
                    ),
                    const SizedBox(height: 16),
                    _buildEmergencyCard(
                      title: 'Ambulance',
                      subtitle: 'Medical emergency',
                      phoneNumber: '199',
                      color: const Color(0xFF38A169),
                      icon: Icons.local_hospital,
                      delay: 600,
                    ),
                    const SizedBox(height: 24),
                    _buildDsccInfoBox(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFFE53E3E),
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
            'Emergency Numbers',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: -1, duration: 600.ms, curve: Curves.easeOut);
  }

  Widget _buildEmergencyAlert() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFED7D7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFE53E3E).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFE53E3E).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.warning,
              color: Color(0xFFE53E3E),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Emergency Contacts',
                  style: TextStyle(
                    color: Color(0xFFE53E3E),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Call these numbers only in case of genuine emergencies',
                  style: TextStyle(
                    color: Color(0xFFE53E3E),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 800.ms).slideY(begin: 0.3, duration: 600.ms);
  }

  Widget _buildEmergencyCard({
    required String title,
    required String subtitle,
    required String phoneNumber,
    required Color color,
    required IconData icon,
    required int delay,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          // Main shadow for depth
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            offset: const Offset(0, 8),
            blurRadius: 25,
            spreadRadius: 0,
          ),
          // Secondary shadow for more depth
          BoxShadow(
            color: color.withOpacity(0.1),
            offset: const Offset(0, 4),
            blurRadius: 15,
            spreadRadius: 0,
          ),
          // Highlight shadow for 3D effect
          BoxShadow(
            color: Colors.white.withOpacity(0.8),
            offset: const Offset(0, -2),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
        // Add gradient for more 3D effect
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            Colors.grey.shade50,
          ],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      color.withOpacity(0.15),
                      color.withOpacity(0.05),
                    ],
                  ),
                  boxShadow: [
                    // Inner shadow effect
                    BoxShadow(
                      color: color.withOpacity(0.2),
                      offset: const Offset(2, 2),
                      blurRadius: 8,
                      spreadRadius: -2,
                    ),
                    // Outer glow
                    BoxShadow(
                      color: color.withOpacity(0.1),
                      offset: const Offset(-2, -2),
                      blurRadius: 8,
                      spreadRadius: -2,
                    ),
                  ],
                  border: Border.all(
                    color: color.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D3748),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF718096),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    color,
                    color.withOpacity(0.8),
                  ],
                ),
                boxShadow: [
                  // Main button shadow
                  BoxShadow(
                    color: color.withOpacity(0.4),
                    offset: const Offset(0, 6),
                    blurRadius: 20,
                    spreadRadius: 0,
                  ),
                  // Inner highlight
                  BoxShadow(
                    color: Colors.white.withOpacity(0.2),
                    offset: const Offset(0, -2),
                    blurRadius: 8,
                    spreadRadius: -2,
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () => _makePhoneCall(phoneNumber),
                icon: const Icon(
                  Icons.phone,
                  color: Colors.white,
                  size: 20,
                ),
                label: Text(
                  'Call $phoneNumber',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                  shadowColor: Colors.transparent,
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate(delay: delay.ms)
        .fadeIn(duration: 800.ms)
        .slideY(
          begin: 0.5,
          duration: 600.ms,
          curve: Curves.easeOutBack,
        )
        .scale(
          begin: const Offset(0.8, 0.8),
          duration: 500.ms,
          curve: Curves.easeOutBack,
        )
        .shimmer(
          duration: 1500.ms,
          color: Colors.white.withOpacity(0.3),
        );
  }

  Widget _buildDsccInfoBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFE6FFFA),
            const Color(0xFFE6FFFA).withOpacity(0.8),
          ],
        ),
        boxShadow: [
          // Main shadow
          BoxShadow(
            color: const Color(0xFF38A169).withOpacity(0.15),
            offset: const Offset(0, 8),
            blurRadius: 25,
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
        border: Border.all(
          color: const Color(0xFF38A169).withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF38A169).withOpacity(0.15),
                      const Color(0xFF38A169).withOpacity(0.05),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF38A169).withOpacity(0.2),
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
                    color: const Color(0xFF38A169).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: const Icon(
                  Icons.info_outline,
                  color: Color(0xFF38A169),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'When to Call DSCC Emergency',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF38A169),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoItem('• Illegal waste dumping in progress'),
          _buildInfoItem('• Hazardous waste spillage'),
          _buildInfoItem('• Blocked drainage causing flooding'),
          _buildInfoItem('• Dead animal removal'),
          _buildInfoItem('• Environmental hazards'),
        ],
      ),
    ).animate(delay: 1000.ms)
        .fadeIn(duration: 1000.ms)
        .slideY(
          begin: 0.4,
          duration: 700.ms,
          curve: Curves.easeOutBack,
        )
        .scale(
          begin: const Offset(0.9, 0.9),
          duration: 600.ms,
          curve: Curves.easeOutBack,
        )
        .shimmer(
          duration: 2000.ms,
          color: const Color(0xFF38A169).withOpacity(0.1),
        );
  }

  Widget _buildInfoItem(String text) {
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