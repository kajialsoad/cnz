import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/custom_bottom_nav.dart';
import '../providers/complaint_provider.dart';
import '../config/api_config.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../models/city_corporation_model.dart';
import '../models/zone_model.dart';
import '../models/ward_model.dart';

class ComplaintAddressPage extends StatefulWidget {
  const ComplaintAddressPage({super.key});

  @override
  State<ComplaintAddressPage> createState() => _ComplaintAddressPageState();
}

class _ComplaintAddressPageState extends State<ComplaintAddressPage> {
  int _currentIndex = 0;
  bool _forMyself = true;
  late final AuthRepository _auth;

  // Form controllers
  final TextEditingController _fullAddressController = TextEditingController();

  // City Corporation, Zone and Ward state
  List<CityCorporation> _cityCorporations = [];
  CityCorporation? _selectedCityCorporation;
  List<Zone> _zones = [];
  Zone? _selectedZone;
  List<Ward> _wards = [];
  Ward? _selectedWard;
  bool _isLoadingCityCorps = false;
  bool _isLoadingZones = false;
  bool _isLoadingWards = false;

  @override
  void initState() {
    super.initState();
    _auth = AuthRepository(ApiClient(ApiConfig.baseUrl));
    _loadCityCorporations();
  }

  Future<void> _loadCityCorporations() async {
    setState(() => _isLoadingCityCorps = true);

    try {
      final cityCorps = await _auth.getActiveCityCorporations();
      if (mounted) {
        setState(() {
          _cityCorporations = cityCorps;
          _isLoadingCityCorps = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingCityCorps = false);
        _showErrorSnackBar(
          'Failed to load City Corporations: ${e.toString().replaceAll('Exception: ', '')}',
        );
      }
    }
  }

  Future<void> _onCityCorporationChanged(CityCorporation? cityCorporation) async {
    setState(() {
      _selectedCityCorporation = cityCorporation;
      _selectedZone = null;
      _selectedWard = null;
      _zones = [];
      _wards = [];
    });

    if (cityCorporation != null && cityCorporation.code != null) {
      setState(() => _isLoadingWards = true);

      try {
        // Fetch all wards for the city corporation directly
        final wards = await _auth.getWardsByCityCorporation(cityCorporation.code!);
        if (mounted) {
          setState(() {
            _wards = wards;
            _isLoadingWards = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isLoadingWards = false);
          _showErrorSnackBar(
            'Failed to load Wards: ${e.toString().replaceAll('Exception: ', '')}',
          );
        }
      }
    }
  }

  // Zone is now auto-selected based on Ward
  void _onWardChanged(Ward? ward) {
    setState(() {
      _selectedWard = ward;
      if (ward != null && ward.zone != null) {
        _selectedZone = ward.zone;
        // Also add to _zones list if needed for dropdown to show it selected
        if (!_zones.any((z) => z.id == ward.zone!.id)) {
          _zones = [ward.zone!];
        }
      } else {
        _selectedZone = null;
      }
    });
  }

  @override
  void dispose() {
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
        // City Corporation Dropdown
        _buildCityCorporationDropdown(),
        const SizedBox(height: 16),
        
        // Ward Dropdown (Shows after City Corp selected)
        if (_selectedCityCorporation != null) ...[
          _buildWardDropdown(),
          const SizedBox(height: 16),
        ],
        
        // Zone Dropdown (Read-only, auto-filled)
        if (_selectedWard != null) ...[
          _buildZoneDropdown(),
          const SizedBox(height: 16),
        ],

        // Show message if no wards available
        if (_selectedCityCorporation != null && _wards.isEmpty && !_isLoadingWards) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.orange[700], size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No wards available for this city corporation yet.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.orange[900],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        
        _buildTextFormField(
          label: 'Full Address / সম্পূর্ণ ঠিকানা',
          controller: _fullAddressController,
          hintText: 'House/Road/Area',
          maxLines: 3,
        ),
      ],
    );
  }
  
  Widget _buildCityCorporationDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'City Corporation / সিটি কর্পোরেশন',
          style: TextStyle(
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
          child: _isLoadingCityCorps
              ? const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(
                    child: SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              : DropdownButtonFormField<CityCorporation>(
                  isExpanded: true,
                  value: _selectedCityCorporation,
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
                    'Select City Corporation',
                    style: TextStyle(color: Colors.grey[500], fontSize: 14),
                  ),
                  items: _cityCorporations.map((cc) {
                    return DropdownMenuItem<CityCorporation>(
                      value: cc,
                      child: Text(
                        cc.name,
                        style: const TextStyle(fontSize: 14, color: Colors.black87),
                      ),
                    );
                  }).toList(),
                  onChanged: _onCityCorporationChanged,
                  icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey[600]),
                  dropdownColor: Colors.white,
                ),
        ),
      ],
    );
  }
  
  Widget _buildZoneDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Zone / জোন (Auto-selected)',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[100], // Read-only look
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: DropdownButtonFormField<Zone>(
              isExpanded: true,
              value: _selectedZone,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                fillColor: Colors.grey[100],
                filled: true,
              ),
              hint: Text(
                'Zone will appear here',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
              items: _selectedZone != null 
                ? [DropdownMenuItem<Zone>(
                    value: _selectedZone,
                    child: Text(
                      _selectedZone!.displayName,
                      style: const TextStyle(fontSize: 14, color: Colors.black87),
                    ),
                  )] 
                : [],
              onChanged: null, // Read only
              icon: Icon(Icons.lock_outline, size: 18, color: Colors.grey[600]),
              dropdownColor: Colors.white,
            ),
        ),
      ],
    );
  }
  
  Widget _buildWardDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ward / ওয়ার্ড',
          style: TextStyle(
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
          child: _isLoadingWards
              ? const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(
                    child: SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              : DropdownButtonFormField<Ward>(
                  isExpanded: true,
                  value: _selectedWard,
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
                    'Select Ward',
                    style: TextStyle(color: Colors.grey[500], fontSize: 14),
                  ),
                  items: _wards.map((ward) {
                    return DropdownMenuItem<Ward>(
                      value: ward,
                      child: Text(
                        ward.displayName,
                        style: const TextStyle(fontSize: 14, color: Colors.black87),
                      ),
                    );
                  }).toList(),
                  onChanged: _onWardChanged,
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

            ),
            style: const TextStyle(fontSize: 14, color: Colors.black87),
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

  void _submitComplaint() async {
    // Validate form
    if (_validateForm()) {
      final complaintProvider = Provider.of<ComplaintProvider>(
        context,
        listen: false,
      );

      // Store address components for backend
      final fullAddress = _fullAddressController.text.trim();

      complaintProvider.setAddress(fullAddress);
      
      // Set geographical IDs for backend
      complaintProvider.setCityCorporationCode(_selectedCityCorporation?.code);
      complaintProvider.setZoneId(_selectedZone?.id);
      complaintProvider.setWardId(_selectedWard?.id);

      // Construct location string for display purposes
      final locationParts = <String>[];
      if (fullAddress.isNotEmpty) locationParts.add(fullAddress);
      if (_selectedCityCorporation != null) locationParts.add(_selectedCityCorporation!.name);
      if (_selectedZone != null) locationParts.add(_selectedZone!.displayName);
      if (_selectedWard != null) locationParts.add(_selectedWard!.displayName);
      
      final locationString = locationParts.join(', ');
      complaintProvider.setLocation(locationString);

      // Show loading indicator
      _showSubmittingDialog();

      try {
        // Submit complaint to backend
        await complaintProvider.createComplaint();

        Navigator.pop(context); // Close loading dialog

        if (complaintProvider.error != null) {
          // Enhanced error message handling
          final errorMessage = complaintProvider.error!;
          
          // Ward image limit error
          if (errorMessage.contains('WARD_IMAGE_LIMIT_EXCEEDED') || 
              errorMessage.contains('Image upload limit reached')) {
            _showErrorDialog(
              'আপলোড সীমা পৌঁছেছে (Upload Limit Reached)',
              errorMessage,
              showReturnButton: true,
            );
          }
          // Daily complaint limit error
          else if (errorMessage.contains('Daily complaint limit reached') || 
              errorMessage.contains('complaints per day')) {
            _showErrorDialog(
              'Daily Limit Reached / দৈনিক সীমা শেষ',
              errorMessage,
              showReturnButton: false,
            );
          }
          // Category validation errors
          else if (errorMessage.contains('category') || errorMessage.contains('subcategory')) {
            _showErrorDialog(
              'Category Error',
              errorMessage,
              showReturnButton: true,
            );
          } else {
            _showErrorSnackBar('Error: $errorMessage');
          }
        } else {
          // Navigate to success page
          _navigateToNextPage();
        }
      } catch (e) {
        Navigator.pop(context); // Close loading dialog
        
        // Enhanced error handling
        final errorString = e.toString();
        
        // Ward image limit error
        if (errorString.contains('WARD_IMAGE_LIMIT_EXCEEDED') || 
            errorString.contains('Image upload limit reached')) {
          _showErrorDialog(
            'আপলোড সীমা পৌঁছেছে (Upload Limit Reached)',
            errorString.replaceFirst('Exception: ', ''),
            showReturnButton: true,
          );
        }
        // Daily complaint limit error
        else if (errorString.contains('Daily complaint limit reached') || 
            errorString.contains('complaints per day')) {
          _showErrorDialog(
            'Daily Limit Reached / দৈনিক সীমা শেষ',
            errorString.replaceFirst('Exception: ', ''),
            showReturnButton: false, // Don't redirect, just show message
          );
        }
        // Category validation errors
        else if (errorString.contains('category') || errorString.contains('subcategory')) {
          _showErrorDialog(
            'Category Error',
            errorString.replaceFirst('Exception: ', ''),
            showReturnButton: true,
          );
        } else {
          _showErrorSnackBar('Failed to submit complaint: $errorString');
        }
      }
    }
  }

  bool _validateForm() {
    print('Validating form...');
    
    // Validate category is selected
    final complaintProvider = Provider.of<ComplaintProvider>(
      context,
      listen: false,
    );
    
    if (complaintProvider.category.isEmpty) {
      _showErrorDialog(
        'Category Required / ক্যাটাগরি প্রয়োজন',
        'Please select a category before submitting your complaint.\nঅভিযোগ জমা দেওয়ার আগে একটি ক্যাটাগরি নির্বাচন করুন।',
        showReturnButton: true,
      );
      return false;
    }
    
    print('selectedCityCorporation: $_selectedCityCorporation');
    print('selectedZone: $_selectedZone');
    print('selectedWard: $_selectedWard');
    print('fullAddress: ${_fullAddressController.text}');

    if (_selectedCityCorporation == null) {
      _showErrorSnackBar('সিটি কর্পোরেশন নির্বাচন করুন / Please select a city corporation');
      return false;
    }
    if (_selectedZone == null) {
      _showErrorSnackBar('জোন নির্বাচন করুন / Please select a zone');
      return false;
    }
    if (_selectedWard == null) {
      _showErrorSnackBar('ওয়ার্ড নির্বাচন করুন / Please select a ward');
      return false;
    }
    if (_fullAddressController.text.trim().isEmpty) {
      _showErrorSnackBar('সম্পূর্ণ ঠিকানা লিখুন / Please enter full address');
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

  // NEW: Show error dialog with option to return to category selection
  void _showErrorDialog(String title, String message, {bool showReturnButton = false}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 28),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        content: Text(
          message,
          style: TextStyle(fontSize: 14, color: Colors.black87),
        ),
        actions: [
          if (showReturnButton)
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                // Navigate back to category selection
                Navigator.popUntil(context, (route) => route.isFirst);
                Navigator.pushReplacementNamed(context, '/complaint');
              },
              child: Text(
                'Select Category Again',
                style: TextStyle(color: Color(0xFF4CAF50)),
              ),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'OK',
              style: TextStyle(color: Color(0xFF4CAF50), fontWeight: FontWeight.w600),
            ),
          ),
        ],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _navigateToNextPage() {
    final complaintProvider = Provider.of<ComplaintProvider>(context, listen: false);
    // Navigate to complaint success page
    Navigator.pushReplacementNamed(
      context, 
      '/complaint-success', 
      arguments: complaintProvider.currentComplaint,
    );
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
