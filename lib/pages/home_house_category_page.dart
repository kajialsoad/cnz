import 'package:flutter/material.dart';
import 'package:provider/provider.dart';  // NEW: Import Provider

import '../providers/complaint_provider.dart';  // NEW: Import ComplaintProvider
import '../widgets/translated_text.dart';

class HomeHouseCategoryPage extends StatefulWidget {
  const HomeHouseCategoryPage({super.key});

  @override
  State<HomeHouseCategoryPage> createState() => _HomeHouseCategoryPageState();
}

class _HomeHouseCategoryPageState extends State<HomeHouseCategoryPage> {
  String? selectedCategory;
  String? capturedImagePath;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Check if an image path was passed
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null && args.containsKey('imagePath')) {
      capturedImagePath = args['imagePath'] as String;
    }
  }

  final List<Map<String, dynamic>> categories = [
    {
      'bangla': 'বাসা বাড়ির ময়লা নিচ্ছে না',
      'english': 'Not collecting household waste',
      'icon': Icons.delete_outline,
      'id': 'not_collecting_waste',
    },
    {
      'bangla': 'ময়লা কর্মীদের ব্যবহার আচরণ',
      'english': 'Poor behavior of waste workers',
      'icon': Icons.home_outlined,
      'id': 'worker_behavior',
    },
    {
      'bangla': 'বিল সংক্রান্ত ইস্যু',
      'english': 'Billing related issue',
      'icon': Icons.receipt_long_outlined,
      'id': 'billing_issue',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8F5E8),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3FA564),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TranslatedText(
              'বাসা/বাড়ি',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            const Text(
              'Home/House',
              style: TextStyle(
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
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Select the specific issue',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
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
                  return _buildCategoryCard(categories[index]);
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
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Select the option that best matches your issue',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category) {
    final isSelected = selectedCategory == category['id'];
    
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedCategory = category['id'];
        });
        
        // NEW: Store category and subcategory in provider
        final complaintProvider = Provider.of<ComplaintProvider>(context, listen: false);
        complaintProvider.setCategory('home');  // Set primary category as 'home'
        complaintProvider.setSubcategory(category['id']);  // Set subcategory
        
        // Navigate to complaint details after short delay
        Future.delayed(const Duration(milliseconds: 300), () {
          Navigator.pushNamed(
            context,
            '/complaint-details',
            arguments: capturedImagePath != null 
              ? {'imagePath': capturedImagePath}
              : null,
          );
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF3FA564) : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon container
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E8),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                category['icon'],
                size: 36,
                color: const Color(0xFF3FA564),
              ),
            ),
            const SizedBox(height: 16),
            // Bangla text
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                category['bangla'],
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 6),
            // English text
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                category['english'],
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
