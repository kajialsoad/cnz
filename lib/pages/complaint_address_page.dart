import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/custom_bottom_nav.dart';
import '../providers/complaint_provider.dart';
import '../widgets/translated_text.dart';

class ComplaintAddressPage extends StatefulWidget {
  const ComplaintAddressPage({super.key});

  @override
  State<ComplaintAddressPage> createState() => _ComplaintAddressPageState();
}

class _ComplaintAddressPageState extends State<ComplaintAddressPage> {
  int _currentIndex = 0;
  bool _forMyself = true;

  // Form controllers
  String? selectedDistrict;
  String? selectedThana;
  String? selectedCityCorporation;
  final TextEditingController _wardController = TextEditingController();
  final TextEditingController _fullAddressController = TextEditingController();

  // Data lists
  final List<String> districts = [
    'Select district',
    'Dhaka',
    'Chittagong',
    'Sylhet',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Rangpur',
    'Mymensingh',
  ];

  final List<String> thanas = [
    'Select thana',
    'Dhanmondi',
    'Gulshan',
    'Uttara',
    'Mirpur',
    'Wari',
    'Ramna',
    'Tejgaon',
    'Pallabi',
  ];

  final List<String> cityCorporations = [
    'Select city corporation',
    'DSCC (Dhaka South)',
    'DNCC (Dhaka North)',
    'Chittagong City Corporation',
    'Sylhet City Corporation',
    'Rajshahi City Corporation',
  ];

  @override
  void dispose() {
    _wardController.dispose();
    _fullAddressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: Column(
        children: [
          _buildAppBar(),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildForMyselfToggle(),
                    const SizedBox(height: 24),
                    _buildFormFields(),
                    const SizedBox(height: 32),
                    _buildSubmitButton(),
                    const SizedBox(height: 100), // Space for bottom nav
                  ],
                ),
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
      decoration: const BoxDecoration(color: Color(0xFF4CAF50)),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          const Text(
            'Address Details',
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

  Widget _buildForMyselfToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _forMyself ? 'For Myself' : 'For Someone Else',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch.adaptive(
              value: _forMyself,
              onChanged: (value) {
                setState(() {
                  _forMyself = value;
                });
              },
              activeColor: const Color(0xFF4CAF50),
              activeTrackColor: const Color(0xFF4CAF50).withOpacity(0.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormFields() {
    return Column(
      children: [
        _buildDropdownField(
          label: 'District',
          value: selectedDistrict,
          items: districts,
          onChanged: (value) {
            setState(() {
              selectedDistrict = value;
            });
          },
        ),
        const SizedBox(height: 16),
        _buildDropdownField(
          label: 'Thana / Police station',
          value: selectedThana,
          items: thanas,
          onChanged: (value) {
            setState(() {
              selectedThana = value;
            });
          },
        ),
        const SizedBox(height: 16),
        _buildDropdownField(
          label: 'City Corporation',
          value: selectedCityCorporation,
          items: cityCorporations,
          onChanged: (value) {
            setState(() {
              selectedCityCorporation = value;
            });
          },
        ),
        const SizedBox(height: 16),
        _buildTextFormField(
          label: 'Ward Number',
          controller: _wardController,
          hintText: 'Enter ward number',
          keyboardType: TextInputType.number,
          isWardNumber: true,
        ),
        const SizedBox(height: 16),
        _buildTextFormField(
          label: 'Full Address',
          controller: _fullAddressController,
          hintText: 'House/Road/Area',
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: DropdownButtonFormField<String>(
            initialValue: value,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              fillColor: Colors.white,
              filled: true,
            ),
            hint: Text(
              items.first,
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
            items: items.skip(1).map((String item) {
              return DropdownMenuItem<String>(
                value: item,
                child: Text(
                  item,
                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                ),
              );
            }).toList(),
            onChanged: (value) {
              // Pass the value directly without converting to null
              onChanged(value);
            },
            icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey[600]),
            dropdownColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildTextFormField({
    required String label,
    required TextEditingController controller,
    required String hintText,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    bool isWardNumber = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              fillColor: Colors.white,
              filled: true,
              suffixIcon: isWardNumber ? _buildWardNumberButtons() : null,
            ),
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  Widget _buildWardNumberButtons() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Decrease button
        Container(
          width: 32,
          height: 32,
          margin: const EdgeInsets.only(right: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: InkWell(
            onTap: _decreaseWardNumber,
            borderRadius: BorderRadius.circular(6),
            child: const Icon(Icons.remove, size: 18, color: Color(0xFF4CAF50)),
          ),
        ),
        // Increase button
        Container(
          width: 32,
          height: 32,
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: InkWell(
            onTap: _increaseWardNumber,
            borderRadius: BorderRadius.circular(6),
            child: const Icon(Icons.add, size: 18, color: Color(0xFF4CAF50)),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      width: double.infinity,
      height: 50,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4CAF50), Color(0xFF66BB6A)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4CAF50).withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _submitComplaint,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
        ),
        child: const Text(
          'Submit Complaint',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  void _decreaseWardNumber() {
    final currentValue = int.tryParse(_wardController.text) ?? 0;
    if (currentValue > 1) {
      _wardController.text = (currentValue - 1).toString();
    }
  }

  void _increaseWardNumber() {
    final currentValue = int.tryParse(_wardController.text) ?? 0;
    _wardController.text = (currentValue + 1).toString();
  }

  void _submitComplaint() async {
    // Validate form
    if (_validateForm()) {
      final complaintProvider = Provider.of<ComplaintProvider>(
        context,
        listen: false,
      );

      // Store address components separately for backend
      final fullAddress = _fullAddressController.text.trim();
      final ward = _wardController.text.trim();

      complaintProvider.setAddress(fullAddress);
      complaintProvider.setDistrict(selectedDistrict);
      complaintProvider.setThana(selectedThana);
      complaintProvider.setWard(ward);

      // Also construct location string for display purposes
      final locationString =
          '$fullAddress, $selectedDistrict, $selectedThana, $selectedCityCorporation, Ward: $ward';
      complaintProvider.setLocation(locationString);

      // Show loading indicator
      _showSubmittingDialog();

      try {
        // Submit complaint to backend
        await complaintProvider.createComplaint();

        Navigator.pop(context); // Close loading dialog

        if (complaintProvider.error != null) {
          _showErrorSnackBar('Error: ${complaintProvider.error}');
        } else {
          // Navigate to success page
          _navigateToNextPage();
        }
      } catch (e) {
        Navigator.pop(context); // Close loading dialog
        _showErrorSnackBar('Failed to submit complaint: ${e.toString()}');
      }
    }
  }

  bool _validateForm() {
    print('Validating form...');
    print('selectedDistrict: $selectedDistrict');
    print('selectedThana: $selectedThana');
    print('selectedCityCorporation: $selectedCityCorporation');
    print('ward: ${_wardController.text}');
    print('fullAddress: ${_fullAddressController.text}');

    if (selectedDistrict == null || selectedDistrict!.isEmpty) {
      _showErrorSnackBar('Please select a district');
      return false;
    }
    if (selectedThana == null || selectedThana!.isEmpty) {
      _showErrorSnackBar('Please select a thana/police station');
      return false;
    }
    if (selectedCityCorporation == null || selectedCityCorporation!.isEmpty) {
      _showErrorSnackBar('Please select a city corporation');
      return false;
    }
    if (_wardController.text.trim().isEmpty) {
      _showErrorSnackBar('Please enter ward number');
      return false;
    }
    if (_fullAddressController.text.trim().isEmpty) {
      _showErrorSnackBar('Please enter full address');
      return false;
    }
    return true;
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _showSubmittingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
            ),
            const SizedBox(height: 16),
            const Text(
              'Submitting Complaint...',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _navigateToNextPage() {
    // Navigate to complaint success page
    Navigator.pushReplacementNamed(context, '/complaint-success');
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
