import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../models/user_model.dart';
import '../repositories/user_repository.dart';
import '../services/api_client.dart';
import '../widgets/translated_text.dart';

class EditProfilePage extends StatefulWidget {
  final UserModel user;

  const EditProfilePage({super.key, required this.user});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  
  // Dynamic geographical data
  List<Map<String, dynamic>> _cityCorporations = [];
  List<Map<String, dynamic>> _zones = [];
  List<Map<String, dynamic>> _wards = [];
  
  int? _selectedCityCorporationId;
  int? _selectedZoneId;
  int? _selectedWardId;
  
  bool _isLoading = false;
  bool _isLoadingCityCorporations = false;
  bool _isLoadingZones = false;
  bool _isLoadingWards = false;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.user.firstName);
    _lastNameController = TextEditingController(text: widget.user.lastName);
    _phoneController = TextEditingController(text: widget.user.phone);
    _emailController = TextEditingController(text: widget.user.email ?? '');
    _addressController = TextEditingController(text: widget.user.address ?? '');
    
    // Initialize with user's current geographical data
    if (widget.user.cityCorporation != null) {
      _selectedCityCorporationId = widget.user.cityCorporation!['id'] as int?;
    }
    _selectedZoneId = widget.user.zoneId;
    _selectedWardId = widget.user.wardId;
    
    // Load city corporations
    _loadCityCorporations();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _loadCityCorporations() async {
    setState(() => _isLoadingCityCorporations = true);
    
    try {
      final apiClient = ApiClient(ApiConfig.baseUrl);
      final response = await apiClient.get('/api/city-corporations');
      
      if (!mounted) return;

      if (response['success'] == true && response['cityCorporations'] != null) {
        setState(() {
          _cityCorporations = List<Map<String, dynamic>>.from(
            response['cityCorporations'] as List
          );
          _isLoadingCityCorporations = false;
        });
        
        // If user has a city corporation, load zones
        if (_selectedCityCorporationId != null) {
          await _loadZones(_selectedCityCorporationId!);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingCityCorporations = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load city corporations: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadZones(int cityCorporationId) async {
    setState(() {
      _isLoadingZones = true;
      _zones = [];
      _wards = [];
    });
    
    try {
      final apiClient = ApiClient(ApiConfig.baseUrl);
      final response = await apiClient.get(
        '/api/zones?cityCorporationId=$cityCorporationId'
      );
      
      if (!mounted) return;

      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _zones = List<Map<String, dynamic>>.from(response['data'] as List);
          _isLoadingZones = false;
        });
        
        // If user has a zone, load wards
        if (_selectedZoneId != null) {
          await _loadWards(_selectedZoneId!);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingZones = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load zones: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadWards(int zoneId) async {
    setState(() {
      _isLoadingWards = true;
      _wards = [];
    });
    
    try {
      final apiClient = ApiClient(ApiConfig.baseUrl);
      final response = await apiClient.get('/api/wards?zoneId=$zoneId');
      
      if (!mounted) return;

      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _wards = List<Map<String, dynamic>>.from(response['data'] as List);
          _isLoadingWards = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingWards = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load wards: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userRepo = UserRepository(ApiClient(ApiConfig.baseUrl));
      
      await userRepo.updateProfile(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        zoneId: _selectedZoneId,
        wardId: _selectedWardId,
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Profile updated successfully! ✓'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );

      // Return true to indicate success
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;

      String errorMessage = 'Failed to update profile';
      final errorStr = e.toString();

      if (errorStr.contains('Network error')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (errorStr.contains('already exists')) {
        errorMessage = 'Phone or email already exists';
      } else {
        errorMessage = errorStr.replaceAll('Exception: ', '');
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final fillColor = const Color(0xFFF3F3F5);

    InputDecoration _dec(String label, {String? hint, IconData? icon}) {
      return InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon, color: const Color(0xFF4CAF50)) : null,
        filled: true,
        fillColor: fillColor,
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFF4CAF50),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: TranslatedText(
          'Edit Profile',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Profile Picture Section
              Center(
                child: Stack(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: const Color(0xFF4CAF50),
                        shape: BoxShape.circle,
                        image: widget.user.avatar != null && widget.user.avatar!.isNotEmpty
                            ? DecorationImage(
                                image: NetworkImage(widget.user.avatar!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: widget.user.avatar == null || widget.user.avatar!.isEmpty
                          ? Center(
                              child: Text(
                                widget.user.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          : null,
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF4CAF50), width: 2),
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          size: 20,
                          color: Color(0xFF4CAF50),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: TranslatedText('Profile picture upload coming soon!'),
                        backgroundColor: const Color(0xFF4CAF50),
                      ),
                    );
                  },
                  child: TranslatedText(
                    'Change Profile Picture',
                    style: const TextStyle(
                      color: Color(0xFF4CAF50),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // First Name
              TranslatedText(
                'First Name',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _firstNameController,
                decoration: _dec('First Name', hint: 'Enter your first name', icon: Icons.person),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'First name is required';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Last Name
              TranslatedText(
                'Last Name',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lastNameController,
                decoration: _dec('Last Name', hint: 'Enter your last name', icon: Icons.person_outline),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Last name is required';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Phone Number
              TranslatedText(
                'Phone Number',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _phoneController,
                decoration: _dec('Phone Number', hint: '+880 1XXX-XXXXX', icon: Icons.phone),
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Phone number is required';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Email Address
              TranslatedText(
                'Email Address (Optional)',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                decoration: _dec('Email Address', hint: 'your.email@example.com', icon: Icons.email),
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v != null && v.isNotEmpty && !RegExp(r'^.+@.+\..+').hasMatch(v)) {
                    return 'Enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // City Corporation Selection
              TranslatedText(
                'City Corporation',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              _isLoadingCityCorporations
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<int>(
                      value: _selectedCityCorporationId,
                      decoration: _dec('Select City Corporation', icon: Icons.location_city),
                      items: _cityCorporations.map((cc) {
                        return DropdownMenuItem<int>(
                          value: cc['id'] as int,
                          child: Text(cc['name'] as String),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCityCorporationId = value;
                          _selectedZoneId = null;
                          _selectedWardId = null;
                          _zones = [];
                          _wards = [];
                        });
                        if (value != null) {
                          _loadZones(value);
                        }
                      },
                      validator: (v) => v == null ? 'Please select a city corporation' : null,
                    ),
              const SizedBox(height: 16),

              // Zone Selection
              TranslatedText(
                'Zone',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              _isLoadingZones
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<int>(
                      value: _selectedZoneId,
                      decoration: _dec('Select Zone', icon: Icons.map),
                      items: _zones.map((zone) {
                        final zoneName = zone['name'] as String? ?? 'Zone ${zone['zoneNumber']}';
                        return DropdownMenuItem<int>(
                          value: zone['id'] as int,
                          child: Text(zoneName),
                        );
                      }).toList(),
                      onChanged: _selectedCityCorporationId == null
                          ? null
                          : (value) {
                              setState(() {
                                _selectedZoneId = value;
                                _selectedWardId = null;
                                _wards = [];
                              });
                              if (value != null) {
                                _loadWards(value);
                              }
                            },
                      validator: (v) => v == null ? 'Please select a zone' : null,
                    ),
              const SizedBox(height: 16),

              // Ward Selection
              TranslatedText(
                'Ward',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              _isLoadingWards
                  ? const Center(child: CircularProgressIndicator())
                  : DropdownButtonFormField<int>(
                      value: _selectedWardId,
                      decoration: _dec('Select Ward', icon: Icons.place),
                      items: _wards.map((ward) {
                        final wardNumber = ward['wardNumber'] as int?;
                        return DropdownMenuItem<int>(
                          value: ward['id'] as int,
                          child: Text('Ward ${wardNumber ?? 'N/A'}'),
                        );
                      }).toList(),
                      onChanged: _selectedZoneId == null
                          ? null
                          : (value) {
                              setState(() {
                                _selectedWardId = value;
                              });
                            },
                      validator: (v) => v == null ? 'Please select a ward' : null,
                    ),
              const SizedBox(height: 16),

              // Address
              TranslatedText(
                'Road Address (Optional)',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2E2E),
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _addressController,
                decoration: _dec('Road Address', hint: 'Road 7, Block B', icon: Icons.home),
                maxLines: 2,
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4CAF50),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : TranslatedText(
                          'Save Changes',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // Cancel Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF4CAF50),
                    side: const BorderSide(color: Color(0xFF4CAF50)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: TranslatedText(
                    'Cancel',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
