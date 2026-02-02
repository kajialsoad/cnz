import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../config/api_config.dart';
import '../models/user_model.dart';
import '../repositories/user_repository.dart';
import '../services/api_client.dart';
import '../services/smart_api_client.dart';
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
  bool _isUploadingImage = false;

  final ApiClient _apiClient = SmartApiClient.instance;
  final ImagePicker _imagePicker = ImagePicker();
  
  File? _selectedImageFile;
  XFile? _selectedXFile; // For web platform preview
  String? _uploadedAvatarUrl;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.user.firstName);
    _lastNameController = TextEditingController(text: widget.user.lastName);
    _phoneController = TextEditingController(text: widget.user.phone);
    _emailController = TextEditingController(text: widget.user.email ?? '');
    _addressController = TextEditingController(text: widget.user.address ?? '');
    
    // Initialize with user's current geographical data
    if (widget.user.cityCorporation != null && widget.user.cityCorporation!['id'] != null) {
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
      final response = await _apiClient.get('/api/city-corporations');
      
      if (!mounted) return;

      if (response['success'] == true && response['cityCorporations'] != null) {
        final loadedCityCorps = List<Map<String, dynamic>>.from(
          response['cityCorporations'] as List
        );

        // Ensure selected ID actually exists in the list
        if (_selectedCityCorporationId != null) {
          final exists = loadedCityCorps.any((cc) => cc['id'] == _selectedCityCorporationId);
          if (!exists) {
            _selectedCityCorporationId = null;
          }
        }

        // Try to match city corporation if not already selected
        if (_selectedCityCorporationId == null && widget.user.cityCorporation != null) {
          final userCC = widget.user.cityCorporation!;
          
          // Try matching by ID first (if it wasn't caught in initState)
          var match = loadedCityCorps.firstWhere(
            (cc) => cc['id'] == userCC['id'],
            orElse: () => <String, dynamic>{},
          );
          
          // If no ID match, try matching by code
          if (match.isEmpty && userCC['code'] != null) {
            match = loadedCityCorps.firstWhere(
              (cc) => cc['code'] == userCC['code'],
              orElse: () => <String, dynamic>{},
            );
          }
          
          // If still no match, try matching by name (English or Bangla)
          if (match.isEmpty) {
            final name = userCC['name'] as String?;
            final nameBangla = userCC['nameBangla'] as String?;
            
            if (name != null || nameBangla != null) {
              match = loadedCityCorps.firstWhere(
                (cc) => (name != null && cc['name'] == name) || 
                       (nameBangla != null && cc['nameBangla'] == nameBangla),
                orElse: () => <String, dynamic>{},
              );
            }
          }

          if (match.isNotEmpty) {
            _selectedCityCorporationId = match['id'] as int?;
          }
        }

        setState(() {
          _cityCorporations = loadedCityCorps;
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
      // Use cityCorporationId directly (API expects ID, not code)
      final response = await _apiClient.get(
        '/api/zones?cityCorporationId=$cityCorporationId'
      );
      
      if (!mounted) return;

      if (response['success'] == true && response['data'] != null) {
        final loadedZones = List<Map<String, dynamic>>.from(response['data'] as List);
        
        // Ensure selected ID actually exists in the list
        if (_selectedZoneId != null) {
          final exists = loadedZones.any((z) => z['id'] == _selectedZoneId);
          if (!exists) {
            _selectedZoneId = null;
          }
        }

        // Try to match zone if not already selected
        if (_selectedZoneId == null && (widget.user.zoneData != null || widget.user.zoneId != null)) {
          // Try matching by ID first
          var match = loadedZones.firstWhere(
            (z) => z['id'] == (widget.user.zoneId ?? widget.user.zoneData?['id']),
            orElse: () => <String, dynamic>{},
          );
          
          // If no ID match, try matching by name or zone number
          if (match.isEmpty && widget.user.zoneData != null) {
            final userZone = widget.user.zoneData!;
            final name = userZone['name'] as String?;
            final zoneNumber = userZone['zoneNumber'];
            
            if (name != null || zoneNumber != null) {
              match = loadedZones.firstWhere(
                (z) => (name != null && z['name'] == name) || 
                       (zoneNumber != null && z['zoneNumber'] == zoneNumber),
                orElse: () => <String, dynamic>{},
              );
            }
          }
          
          if (match.isNotEmpty) {
            _selectedZoneId = match['id'] as int?;
          }
        }

        setState(() {
          _zones = loadedZones;
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
      final response = await _apiClient.get('/api/wards?zoneId=$zoneId');
      
      if (!mounted) return;

      if (response['success'] == true && response['data'] != null) {
        final loadedWards = List<Map<String, dynamic>>.from(response['data'] as List);
        
        // Try to match ward if not already selected
        if (_selectedWardId == null && (widget.user.wardData != null || widget.user.wardId != null)) {
          // Try matching by ID first
          var match = loadedWards.firstWhere(
            (w) => w['id'] == (widget.user.wardId ?? widget.user.wardData?['id']),
            orElse: () => <String, dynamic>{},
          );
          
          // If no ID match, try matching by ward number or name
          if (match.isEmpty && widget.user.wardData != null) {
            final userWard = widget.user.wardData!;
            final name = userWard['name'] as String?;
            final wardNumber = userWard['wardNumber'];
            
            if (name != null || wardNumber != null) {
              match = loadedWards.firstWhere(
                (w) => (name != null && w['name'] == name) || 
                       (wardNumber != null && w['wardNumber'] == wardNumber),
                orElse: () => <String, dynamic>{},
              );
            }
          }
          
          if (match.isNotEmpty) {
            _selectedWardId = match['id'] as int?;
          }
        }
        
        // Ensure selected ID actually exists in the list
        if (_selectedWardId != null) {
          final exists = loadedWards.any((w) => w['id'] == _selectedWardId);
          if (!exists) {
            _selectedWardId = null;
          }
        }

        setState(() {
          _wards = loadedWards;
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

  Future<void> _pickAndUploadImage() async {
    try {
      // Show image source selection dialog
      final ImageSource? source = await showDialog<ImageSource>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: TranslatedText('Select Image Source'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.camera_alt, color: Color(0xFF4CAF50)),
                  title: TranslatedText('Camera'),
                  onTap: () => Navigator.pop(context, ImageSource.camera),
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library, color: Color(0xFF4CAF50)),
                  title: TranslatedText('Gallery'),
                  onTap: () => Navigator.pop(context, ImageSource.gallery),
                ),
              ],
            ),
          );
        },
      );

      if (source == null) return;

      // Pick image
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() {
        _isUploadingImage = true;
      });

      // Read image bytes (works on both mobile and web)
      final imageBytes = await pickedFile.readAsBytes();
      final fileName = pickedFile.name;

      // Store for preview - handle platform differences
      setState(() {
        if (kIsWeb) {
          _selectedXFile = pickedFile;
          _selectedImageFile = null;
        } else {
          _selectedImageFile = File(pickedFile.path);
          _selectedXFile = null;
        }
      });

      // Upload image using bytes
      final userRepo = UserRepository(_apiClient);
      final avatarUrl = await userRepo.uploadAvatar(
        imageBytes: imageBytes,
        fileName: fileName,
      );

      setState(() {
        _uploadedAvatarUrl = avatarUrl;
        _isUploadingImage = false;
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Profile picture uploaded successfully! ✓'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      setState(() {
        _isUploadingImage = false;
        _selectedImageFile = null;
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to upload image: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  /// Get avatar image decoration based on platform and state
  DecorationImage? _getAvatarImage() {
    // Priority: Selected image > Uploaded URL > User's existing avatar
    if (kIsWeb && _selectedXFile != null) {
      // Web platform: use NetworkImage with data URL
      return DecorationImage(
        image: NetworkImage(_selectedXFile!.path),
        fit: BoxFit.cover,
      );
    } else if (!kIsWeb && _selectedImageFile != null) {
      // Mobile platform: use FileImage
      return DecorationImage(
        image: FileImage(_selectedImageFile!),
        fit: BoxFit.cover,
      );
    } else if (_uploadedAvatarUrl != null && _uploadedAvatarUrl!.isNotEmpty) {
      return DecorationImage(
        image: NetworkImage(_uploadedAvatarUrl!),
        fit: BoxFit.cover,
      );
    } else if (widget.user.avatar != null && widget.user.avatar!.isNotEmpty) {
      return DecorationImage(
        image: NetworkImage(widget.user.avatar!),
        fit: BoxFit.cover,
      );
    }
    return null;
  }

  /// Check if initials should be shown
  bool _shouldShowInitials() {
    return _selectedImageFile == null &&
        _selectedXFile == null &&
        (_uploadedAvatarUrl == null || _uploadedAvatarUrl!.isEmpty) &&
        (widget.user.avatar == null || widget.user.avatar!.isEmpty);
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userRepo = UserRepository(_apiClient);
      
      // Get cityCorporationCode from selected city corporation
      String? cityCorporationCode;
      if (_selectedCityCorporationId != null && _cityCorporations.isNotEmpty) {
        try {
          final cityCorp = _cityCorporations.firstWhere(
            (cc) => cc['id'] == _selectedCityCorporationId,
            orElse: () => <String, dynamic>{},
          );
          
          if (cityCorp.isNotEmpty && cityCorp.containsKey('code')) {
            cityCorporationCode = cityCorp['code'] as String?;
          }
        } catch (e) {
          print('Error getting city corporation code: $e');
        }
      }
      
      await userRepo.updateProfile(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        zoneId: _selectedZoneId,
        wardId: _selectedWardId,
        cityCorporationCode: cityCorporationCode,
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        avatar: _uploadedAvatarUrl, // Include uploaded avatar URL
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
                        image: _getAvatarImage(),
                      ),
                      child: _shouldShowInitials()
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
                    if (_isUploadingImage)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.5),
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: GestureDetector(
                        onTap: _isUploadingImage ? null : _pickAndUploadImage,
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
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: _isUploadingImage ? null : _pickAndUploadImage,
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
                      isExpanded: true,
                      items: _cityCorporations.map((cc) {
                        return DropdownMenuItem<int>(
                          value: cc['id'] as int,
                          child: Text(
                            cc['name'] as String,
                            overflow: TextOverflow.ellipsis,
                          ),
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
                      isExpanded: true,
                      items: _zones.map((zone) {
                        final zoneName = zone['name'] as String? ?? 'Zone ${zone['zoneNumber']}';
                        return DropdownMenuItem<int>(
                          value: zone['id'] as int,
                          child: Text(
                            zoneName,
                            overflow: TextOverflow.ellipsis,
                          ),
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
                      isExpanded: true,
                      items: _wards.map((ward) {
                        final wardNumber = ward['wardNumber'] as int?;
                        return DropdownMenuItem<int>(
                          value: ward['id'] as int,
                          child: Text(
                            'Ward ${wardNumber ?? 'N/A'}',
                            overflow: TextOverflow.ellipsis,
                          ),
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
