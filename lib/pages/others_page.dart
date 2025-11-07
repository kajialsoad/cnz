import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../components/custom_bottom_nav.dart';

class OthersPage extends StatefulWidget {
  const OthersPage({super.key});

  @override
  State<OthersPage> createState() => _OthersPageState();
}

class _OthersPageState extends State<OthersPage> with TickerProviderStateMixin {
  int _currentIndex = 0;
  String? selectedCategory;
  final List<int> _hoveredIndex = [];

  final List<Map<String, dynamic>> categories = [
    {
      'bangla': 'বাসা/বাড়ি',
      'english': 'Home/House',
      'svgAsset': 'assets/house.svg',
      'color': const Color(0xFFE8F5E8), // Keep old for reference
      'isSpecialStyle': true, // New green styling
      'specialColor': const Color(0xFF3FA564), // Green color
      'id': 'home',
    },
    {
      'bangla': 'রাস্তা ও পরিবেশ',
      'english': 'Road & Environment',
      'svgAsset': 'assets/road.svg',
      'color': const Color(0xFFE8F5E8), // Keep old for reference
      'isSpecialStyle': true, // New green styling
      'specialColor': const Color(0xFF3FA564), // Green color
      'id': 'road_environment',
    },
    {
      'bangla': 'ব্যবসা প্রতিষ্ঠান',
      'english': 'Business Place',
      'svgAsset': 'assets/house2.svg',
      'color': const Color(0xFFFFF9C4), // Keep old for reference
      'isSpecialStyle': true, // New yellow styling
      'specialColor': const Color(0xFFFFD85B), // New yellow color
      'id': 'business',
    },
    {
      'bangla': 'অফিস',
      'english': 'Office',
      'svgAsset': 'assets/office.svg',
      'color': const Color(0xFFE3F2FD), // Keep old for reference
      'isSpecialStyle': true, // New blue styling
      'specialColor': const Color(0xFF5B9FFF), // New blue color
      'id': 'office',
    },
    {
      'bangla': 'শিক্ষা প্রতিষ্ঠান',
      'english': 'Educational Institution',
      'svgAsset': 'assets/graduate.svg',
      'color': const Color(0xFFF3E5F5), // Keep old for reference
      'isSpecialStyle': true, // New purple styling
      'specialColor': const Color(0xFF9B59B6), // Purple color
      'id': 'education',
    },
    {
      'bangla': 'হাসপাতাল',
      'english': 'Hospital',
      'svgAsset': 'assets/hospital.svg',
      'color': const Color(0xFFFFEBEE), // Keep old for reference
      'isSpecialStyle': true, // New red styling
      'specialColor': const Color(0xFFE74C3C), // Red color
      'id': 'hospital',
    },
    {
      'bangla': 'ধর্মীয় ও সেবামূলক',
      'english': 'Religious & Service',
      'svgAsset': 'assets/church.svg',
      'color': const Color(0xFFFFF3E0), // Keep old for reference
      'isSpecialStyle': true, // New orange styling
      'specialColor': const Color(0xFFF39C12), // Orange color
      'id': 'religious',
    },
    {
      'bangla': 'মেলা ও আনন্দোৎসব',
      'english': 'Events & Celebration',
      'svgAsset': 'assets/congratulations.svg',
      'color': const Color(0xFFFCE4EC), // Keep old for reference
      'isSpecialStyle': true, // New pink styling
      'specialColor': const Color(0xFFE91E63), // Pink color
      'id': 'events',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8F5E9),
      extendBody: true,
      body: Container(
        height: MediaQuery.of(context).size.height,
        width: MediaQuery.of(context).size.width,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE8F5E9),
              Color(0xFFF1F8E9),
              Color(0xFFE8F5E9),
            ],
          ),
        ),
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Container(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height - 160,
                  ),
                  child: Column(
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 24),
                      _buildCategoryGrid(),
                      const SizedBox(height: 32),
                      _buildInstructions(),
                      const SizedBox(height: 120), // Extra space for bottom nav
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
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
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 16,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF4CAF50),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          const Text(
            'Choose Category',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        const Text(
          'আপত্তিদায়ক করণ সিলেকশন করুন',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        const Text(
          'What type of issue?',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCategoryGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        return _buildCategoryCard(categories[index], index);
      },
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category, int index) {
    final isSelected = selectedCategory == category['id'];
    final isHovered = _hoveredIndex.contains(index);
    final isSpecialStyle = category['isSpecialStyle'] == true;

    if (isSpecialStyle) {
      final specialColor = category['specialColor'] as Color;
      // Use different opacity levels based on category for optimal appearance
      final isOfficeCategory = category['id'] == 'office';
      
      final gradientTopOpacity = isOfficeCategory ? 0.10 : 0.10; // All categories now use 10%
      final gradientBottomOpacity = isOfficeCategory ? 0.05 : 0.05; // All categories now use 5%
      final cornerOpacity = isOfficeCategory ? 0.08 : 0.08; // All categories now use 8%
      
      final colorGradientTop = Color.fromRGBO(specialColor.red, specialColor.green, specialColor.blue, gradientTopOpacity);
      final colorGradientBottom = Color.fromRGBO(specialColor.red, specialColor.green, specialColor.blue, gradientBottomOpacity);
      final color19Opacity = Color.fromRGBO(specialColor.red, specialColor.green, specialColor.blue, 0.19);
      final colorCorner = Color.fromRGBO(specialColor.red, specialColor.green, specialColor.blue, cornerOpacity);
      
      // Special styling for house, road, and business categories
      return GestureDetector(
        onTap: () => _selectCategory(category['id']),
        child: MouseRegion(
          onEnter: (_) => setState(() => _hoveredIndex.add(index)),
          onExit: (_) => setState(() => _hoveredIndex.remove(index)),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            transform: Matrix4.identity()
              ..scale(isHovered ? 1.05 : 1.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  colorGradientTop, // Dynamic opacity at TOP
                  colorGradientBottom, // Dynamic opacity at BOTTOM
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: specialColor,
                width: 1.33,
              ),
              boxShadow: [],
            ),
            child: Stack(
              children: [
                // Main content - perfectly centered
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: color19Opacity, // 19% opacity
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: specialColor.withOpacity(0.15),
                                offset: const Offset(0, 2),
                                blurRadius: 4,
                                spreadRadius: 0,
                              ),
                            ],
                          ),
                          child: SvgPicture.asset(
                            category['svgAsset'],
                            width: 24,
                            height: 24,
                            colorFilter: ColorFilter.mode(
                              specialColor,
                              BlendMode.srcIn,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          category['bangla'],
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          category['english'],
                          style: TextStyle(
                            fontSize: 9,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
                // Corner decoration with dynamic color
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: colorCorner, // Dynamic opacity for corner
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    } else {
      // Original styling for other categories
      return GestureDetector(
        onTap: () => _selectCategory(category['id']),
        child: MouseRegion(
          onEnter: (_) => setState(() => _hoveredIndex.add(index)),
          onExit: (_) => setState(() => _hoveredIndex.remove(index)),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            transform: Matrix4.identity()
              ..scale(isHovered ? 1.05 : 1.0),
            decoration: BoxDecoration(
              color: category['color'],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? const Color(0xFF4CAF50) : Colors.transparent,
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  offset: const Offset(0, 2),
                  blurRadius: 8,
                  spreadRadius: 0,
                ),
                if (isHovered)
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    offset: const Offset(0, 4),
                    blurRadius: 12,
                    spreadRadius: 0,
                  ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: SvgPicture.asset(
                      category['svgAsset'],
                      width: 24,
                      height: 24,
                      colorFilter: const ColorFilter.mode(
                        Colors.black87,
                        BlendMode.srcIn,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    category['bangla'],
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    category['english'],
                    style: TextStyle(
                      fontSize: 9,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
  }

  Widget _buildInstructions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Text(
            'আপনার সমস্যার ধরন অনুযায়ী একটি ক্যাটাগরি নির্বাচন করুন',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'Select a category that matches your issue type',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _selectCategory(String categoryId) {
    setState(() {
      selectedCategory = categoryId;
    });

    // Navigate to complaint details page after selection
    Future.delayed(const Duration(milliseconds: 300), () {
      Navigator.pushNamed(context, '/complaint-details');
    });
  }

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