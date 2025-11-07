import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../components/custom_bottom_nav.dart';

class ComplaintPage extends StatefulWidget {
  const ComplaintPage({super.key});

  @override
  State<ComplaintPage> createState() => _ComplaintPageState();
}

class _ComplaintPageState extends State<ComplaintPage> {
  int _currentIndex = 0;
  String? selectedComplaintType;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8F5E8), // Light green background
      extendBody: true,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(
                left: 16,
                right: 16,
                top: 40,
                bottom: 80, // Space for bottom navigation
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTitle(),
                  const SizedBox(height: 40),
                  _buildComplaintTypeOptions(),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _handleNavigation(index);
        },
      ),
  // No floating action button here - camera is provided in custom bottom nav
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF4CAF50), // Green header
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text(
        'Submit Complaint',
        style: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: false,
    );
  }

  Widget _buildTitle() {
    return Center(
      child: Text(
        'Select Complaint Type',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: Colors.grey[800],
        ),
      ),
    );
  }

  Widget _buildComplaintTypeOptions() {
    return Column(
      children: [
        _buildComplaintTypeCard(
          title: 'Own Residence',
          svgAsset: 'assets/house.svg',
          borderColor: const Color(0xFF4CAF50), // Green border
          isSelected: selectedComplaintType == 'own_residence',
          onTap: () {
            setState(() {
              selectedComplaintType = 'own_residence';
            });
            // Navigate to complaint details page
            Navigator.pushNamed(context, '/complaint-details');
          },
        ),
        const SizedBox(height: 24),
        _buildComplaintTypeCard(
          title: 'Others',
          svgAsset: 'assets/building.svg',
          borderColor: const Color(0xFFFFC107), // Yellow border
          isSelected: selectedComplaintType == 'others',
          onTap: () {
            setState(() {
              selectedComplaintType = 'others';
            });
            // Navigate to others category page
            Navigator.pushNamed(context, '/others');
          },
        ),
      ],
    );
  }

  Widget _buildComplaintTypeCard({
    required String title,
    IconData? icon,
    String? svgAsset,
    required Color borderColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: borderColor,
            width: 2.5,
          ),
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
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: borderColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: svgAsset != null
                  ? SvgPicture.asset(
                      svgAsset,
                      width: 28,
                      height: 28,
                      colorFilter: ColorFilter.mode(
                        borderColor,
                        BlendMode.srcIn,
                      ),
                    )
                  : Icon(
                      icon!,
                      size: 28,
                      color: borderColor,
                    ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Camera/FAB removed: camera action is available in the custom bottom nav

  void _handleNavigation(int index) {
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
        Navigator.pushReplacementNamed(context, '/gallery');
        break;
    }
  }
}