import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart'; // NEW: Import Provider

import '../providers/complaint_provider.dart'; // NEW: Import ComplaintProvider
import '../widgets/translated_text.dart';

class CategorySelectionPage extends StatefulWidget {
  const CategorySelectionPage({super.key});

  @override
  State<CategorySelectionPage> createState() => _CategorySelectionPageState();
}

class _CategorySelectionPageState extends State<CategorySelectionPage> {
  String? selectedCategory;
  String? capturedImagePath;
  Map<String, dynamic>? sectionData;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Get section data and image path from arguments
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      sectionData = args['sectionData'] as Map<String, dynamic>?;
      if (args.containsKey('imagePath')) {
        capturedImagePath = args['imagePath'] as String;
      }
    }
  }

  // Category data for each section
  Map<String, List<Map<String, dynamic>>> getCategoriesForSection(
    String sectionId,
  ) {
    final allCategories = {
      'home': [
        {
          'bangla': 'বাসা বাড়ির ময়লা নিচ্ছে না',
          'english': 'Not collecting household waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting_waste',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/house.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত ইস্যু',
          'english': 'Billing related issue',
          'svgAsset': 'assets/building.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'home_others',
        },
      ],
      'road_environment': [
        {
          'bangla': 'রাস্তার ধারে ময়লা',
          'english': 'Waste beside the road',
          'icon': Icons.delete_outline,
          'id': 'road_waste',
        },
        {
          'bangla': 'রাস্তায় পানি জমে আছে',
          'english': 'Water logging on road',
          'icon': Icons.location_on_outlined,
          'id': 'water_logging',
        },
        {
          'bangla': 'নর্দমা সমস্যা',
          'english': 'Drainage issue',
          'icon': Icons.water_damage_outlined,
          'id': 'drainage_issue',
        },
        {
          'bangla': 'ম্যানহোল ঢাকনা নেই',
          'english': 'Missing manhole cover',
          'icon': Icons.location_on_outlined,
          'id': 'manhole_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'road_others',
        },
      ],
      'business': [
        {
          'bangla': 'ময়লা নিচ্ছে না',
          'english': 'Not collecting waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/building.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত সমস্যা',
          'english': 'Billing related issue',
          'svgAsset': 'assets/building.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'business_others',
        },
      ],
      'office': [
        {
          'bangla': 'ময়লা নিচ্ছে না',
          'english': 'Not collecting waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/building.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত সমস্যা',
          'english': 'Billing related issue',
          'svgAsset': 'assets/building.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'office_others',
        },
      ],
      'education': [
        {
          'bangla': 'ময়লা নিচ্ছে না',
          'english': 'Not collecting waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/graduate.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত সমস্যা',
          'english': 'Billing related issue',
          'svgAsset': 'assets/graduate.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'education_others',
        },
      ],
      'hospital': [
        {
          'bangla': 'ময়লা নিচ্ছে না',
          'english': 'Not collecting waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/hospital.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত সমস্যা',
          'english': 'Billing related issue',
          'svgAsset': 'assets/hospital.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'hospital_others',
        },
      ],
      'religious': [
        {
          'bangla': 'ময়লা নিচ্ছে না',
          'english': 'Not collecting waste',
          'icon': Icons.delete_outline,
          'id': 'not_collecting',
        },
        {
          'bangla': 'ময়লা সংগ্রহকারীদের আচরণগত সমস্যা',
          'english': 'Behavioral issues of waste collectors',
          'svgAsset': 'assets/church.svg',
          'id': 'worker_behavior',
        },
        {
          'bangla': 'বিল সংক্রান্ত সমস্যা',
          'english': 'Billing related issue',
          'svgAsset': 'assets/church.svg',
          'id': 'billing_issue',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'religious_others',
        },
      ],
      'events': [
        {
          'bangla': 'মেলার ময়লা',
          'english': 'Fair waste',
          'icon': Icons.festival_outlined,
          'id': 'fair_waste',
        },
        {
          'bangla': 'উৎসবের ময়লা',
          'english': 'Celebration waste',
          'icon': Icons.celebration_outlined,
          'id': 'celebration_waste',
        },
        {
          'bangla': 'অনুষ্ঠানের ময়লা',
          'english': 'Event waste',
          'svgAsset': 'assets/congratulations.svg',
          'id': 'event_waste',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'event_others',
        },
      ],
      'canal_waterbody': [
        {
          'bangla': 'খালে ময়লা জমে আছে',
          'english': 'Waste accumulated in canal',
          'icon': Icons.water,
          'id': 'canal_waste',
        },
        {
          'bangla': 'জলাশয়ে ময়লা',
          'english': 'Waste in water body',
          'icon': Icons.water_drop,
          'id': 'waterbody_waste',
        },
        {
          'bangla': 'খাল বন্ধ হয়ে গেছে',
          'english': 'Canal is blocked',
          'icon': Icons.block,
          'id': 'canal_blocked',
        },
        {
          'bangla': 'পানি দূষণ',
          'english': 'Water pollution',
          'icon': Icons.warning_amber,
          'id': 'water_pollution',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'canal_waterbody_others',
        },
      ],
      'drainage_waterlogging': [
        {
          'bangla': 'নর্দমা বন্ধ',
          'english': 'Drainage blocked',
          'icon': Icons.block,
          'id': 'drainage_blocked',
        },
        {
          'bangla': 'জলাবদ্ধতা',
          'english': 'Waterlogging',
          'icon': Icons.water_damage,
          'id': 'waterlogging',
        },
        {
          'bangla': 'নর্দমার ঢাকনা নেই',
          'english': 'Missing drainage cover',
          'icon': Icons.warning,
          'id': 'drainage_cover_missing',
        },
        {
          'bangla': 'দুর্গন্ধ',
          'english': 'Bad smell',
          'icon': Icons.air,
          'id': 'bad_smell',
        },
        {
          'bangla': 'অন্যান্য',
          'english': 'Others',
          'icon': Icons.more_horiz,
          'id': 'drainage_waterlogging_others',
        },
      ],
    };

    return {sectionId: allCategories[sectionId] ?? []};
  }

  @override
  Widget build(BuildContext context) {
    if (sectionData == null) {
      return const Scaffold(
        body: Center(child: Text('No section data provided')),
      );
    }

    final categories =
        getCategoriesForSection(sectionData!['id'])[sectionData!['id']] ?? [];
    final themeColor =
        (sectionData!['specialColor'] as Color?) ?? const Color(0xFF3FA564);

    return Scaffold(
      backgroundColor: const Color(
        0xFFE8F5E8,
      ), // Fixed green background like others page
      appBar: AppBar(
        backgroundColor: const Color(0xFF3FA564), // Fixed green app bar
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              sectionData!['bangla'] ?? '',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sectionData!['english'] ?? '',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          const SizedBox(height: 24),
          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                TranslatedText(
                  'সমস্যার ধরন নির্বাচন করুন',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Select the specific issue',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          // Categories Grid
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.95,
                ),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  return _buildCategoryCard(categories[index], themeColor);
                },
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Bottom instruction
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Column(
              children: [
                TranslatedText(
                  'আপনার সমস্যা অনুসারে সঠিক অপশন নির্বাচন করুন',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Select the option that best matches your issue',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category, Color themeColor) {
    final isSelected = selectedCategory == category['id'];
    // Create lighter version of theme color for icon background - matching others_page
    final iconBgColor = Color.fromRGBO(
      themeColor.red,
      themeColor.green,
      themeColor.blue,
      0.19, // 19% opacity like others_page
    );

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedCategory = category['id'];
        });

        // NEW: Store category and subcategory in provider
        final complaintProvider = Provider.of<ComplaintProvider>(
          context,
          listen: false,
        );
        if (sectionData != null) {
          complaintProvider.setCategory(
            sectionData!['id'],
          ); // Set primary category (e.g., 'home', 'road_environment')
        }
        complaintProvider.setSubcategory(
          category['id'],
        ); // Set subcategory (e.g., 'not_collecting_waste')

        // Navigate to complaint details after short delay
        Future.delayed(const Duration(milliseconds: 300), () {
          Navigator.pushNamed(
            context,
            '/complaint-details',
            arguments: {
              if (capturedImagePath != null) 'imagePath': capturedImagePath,
              'categoryData': category,
              'sectionData': sectionData,
            },
          );
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? themeColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon container - matching others_page styling
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconBgColor, // 19% opacity
                  borderRadius: BorderRadius.circular(8),
                ),
                child: category.containsKey('svgAsset')
                    ? SvgPicture.asset(
                        category['svgAsset'],
                        width: 24,
                        height: 24,
                        colorFilter: ColorFilter.mode(
                          themeColor,
                          BlendMode.srcIn,
                        ),
                      )
                    : Icon(category['icon'], size: 24, color: themeColor),
              ),
              const SizedBox(height: 8),
              // Bangla text
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
              // English text
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
    );
  }
}
