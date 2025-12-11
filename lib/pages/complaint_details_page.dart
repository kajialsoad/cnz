import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../components/custom_bottom_nav.dart';
import '../models/user_model.dart';
import '../providers/complaint_provider.dart';
import '../repositories/user_repository.dart';
import '../services/api_client.dart';
import '../services/file_handling_service.dart';
import '../widgets/translated_text.dart';

class ComplaintDetailsPage extends StatefulWidget {
  const ComplaintDetailsPage({super.key});

  @override
  State<ComplaintDetailsPage> createState() => _ComplaintDetailsPageState();
}

class _ComplaintDetailsPageState extends State<ComplaintDetailsPage> {
  int _currentIndex = 0;
  final TextEditingController _descriptionController = TextEditingController();
  bool isRecording = false;
  List<String> uploadedPhotos = [];

  // Backend integration variables
  final FileHandlingService _fileHandlingService = FileHandlingService();
  final List<XFile> _selectedImages = []; // Changed to XFile for web compatibility
  final List<File> _selectedAudioFiles = [];
  
  // Category data from previous page
  Map<String, dynamic>? selectedCategoryData;
  Map<String, dynamic>? selectedSectionData;

  // Ward image limit tracking
  UserModel? _currentUser;
  bool _isLoadingUser = true;
  int _wardImageLimit = 1; // Maximum 1 image per ward

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  /// Load current user profile to check ward image count
  Future<void> _loadUserProfile() async {
    try {
      final apiClient = Provider.of<ApiClient>(context, listen: false);
      final userRepository = UserRepository(apiClient);
      final user = await userRepository.getProfile();
      
      setState(() {
        _currentUser = user;
        _isLoadingUser = false;
      });
    } catch (e) {
      print('Error loading user profile: $e');
      setState(() {
        _isLoadingUser = false;
      });
      
      // Show error but don't block the user
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TranslatedText('Unable to load user profile. Image upload may be limited.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  /// Check if user can upload more images
  bool get _canUploadMoreImages {
    if (_currentUser == null) return true; // Allow if user data not loaded yet
    return _currentUser!.wardImageCount < _wardImageLimit;
  }

  /// Get remaining image uploads
  int get _remainingUploads {
    if (_currentUser == null) return _wardImageLimit;
    return _wardImageLimit - _currentUser!.wardImageCount;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Check if a photo was captured from camera and category data
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      // Capture category and section data
      if (args.containsKey('categoryData')) {
        selectedCategoryData = args['categoryData'] as Map<String, dynamic>?;
      }
      if (args.containsKey('sectionData')) {
        selectedSectionData = args['sectionData'] as Map<String, dynamic>?;
      }
      
      // Handle image path
      if (args.containsKey('imagePath')) {
        final imagePath = args['imagePath'] as String;
        // Add the captured photo to selected images if not already added
        if (imagePath != 'mock_web_image' && !kIsWeb) {
          final imageFile = XFile(imagePath); // Changed to XFile
          if (!_selectedImages.any((img) => img.path == imagePath)) {
            setState(() {
              _selectedImages.add(imageFile);
            });
          }
        } else if (imagePath == 'mock_web_image' || kIsWeb) {
          // For web testing, add a mock file
          if (_selectedImages.isEmpty || _selectedImages.first.path != 'mock_web_image') {
            setState(() {
              _selectedImages.add(XFile('mock_web_image')); // Changed to XFile
            });
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _fileHandlingService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (selectedSectionData != null || selectedCategoryData != null)
                    _buildSelectedCategorySection(),
                  if (selectedSectionData != null || selectedCategoryData != null)
                    const SizedBox(height: 24),
                  _buildUploadPhotosSection(),
                  const SizedBox(height: 24),
                  _buildVoiceRecordingSection(),
                  const SizedBox(height: 24),
                  _buildDescriptionSection(),
                  const SizedBox(height: 32),
                  _buildContinueButton(),
                  const SizedBox(height: 100), // Space for bottom nav
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
    );
  }

  Widget _buildSelectedCategorySection() {
    String sectionBangla = '';
    String sectionEnglish = '';
    String categoryBangla = '';
    String categoryEnglish = '';

    if (selectedSectionData != null) {
      sectionBangla = selectedSectionData!['bangla'] ?? '';
      sectionEnglish = selectedSectionData!['english'] ?? '';
    }
    if (selectedCategoryData != null) {
      categoryBangla = selectedCategoryData!['bangla'] ?? '';
      categoryEnglish = selectedCategoryData!['english'] ?? '';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selected Category',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          if (sectionBangla.isNotEmpty)
            Text(
              sectionBangla,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          if (sectionEnglish.isNotEmpty)
            Text(
              sectionEnglish,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
            ),
          if (categoryBangla.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.arrow_forward, size: 14, color: Color(0xFF4CAF50)),
                const SizedBox(width: 4),
                Text(
                  categoryBangla,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF4CAF50),
                  ),
                ),
              ],
            ),
          ]
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF4CAF50),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'অভিযোগের বিবরণ',
        style: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottom: PreferredSize(
        preferredSize: Size.fromHeight(20),
        child: Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.only(left: 56, bottom: 8),
            child: Text(
              'Complaint Details',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ),
      ),
      centerTitle: false,
    );
  }

  Widget _buildUploadPhotosSection() {
    final bool limitReached = !_canUploadMoreImages;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: RichText(
                text: TextSpan(
                  text: 'ছবি আপলোড করুন ',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                  children: [
                    TextSpan(
                      text: '(Upload Photos)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Show remaining uploads badge
            if (!_isLoadingUser && _currentUser != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: limitReached ? Colors.red.shade50 : Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: limitReached ? Colors.red.shade200 : Colors.green.shade200,
                    width: 1,
                  ),
                ),
                child: Text(
                  limitReached 
                    ? 'সীমা পৌঁছেছে (Limit Reached)'
                    : '$_remainingUploads টি বাকি ($_remainingUploads left)',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: limitReached ? Colors.red.shade700 : Colors.green.shade700,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),

        // Show selected images in a horizontal scroll view
        if (_selectedImages.isNotEmpty) ...[
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _selectedImages.length + 1, // +1 for the add button
              itemBuilder: (context, index) {
                if (index == _selectedImages.length) {
                  // Add photo button - disabled when limit reached
                  final bool canAdd = _canUploadMoreImages;
                  return GestureDetector(
                    onTap: canAdd ? _addPhoto : _showLimitReachedMessage,
                    child: Container(
                      margin: const EdgeInsets.only(left: 8),
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        color: canAdd ? Colors.white : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: canAdd ? Colors.grey.shade300 : Colors.grey.shade200,
                          width: 1.5,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: canAdd ? Colors.grey.shade100 : Colors.grey.shade200,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              canAdd ? Icons.camera_alt_outlined : Icons.block,
                              size: 24,
                              color: canAdd ? Colors.grey.shade500 : Colors.grey.shade400,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TranslatedText(
                            canAdd ? 'Add Photo' : 'Limit Reached',
                            style: TextStyle(
                              fontSize: 12,
                              color: canAdd ? Colors.grey.shade600 : Colors.grey.shade400,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Display selected image
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  height: 120,
                  width: 120,
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: Colors.grey.shade200,
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: FutureBuilder<Uint8List>(
                            future: _selectedImages[index].readAsBytes(),
                            builder: (context, snapshot) {
                              if (snapshot.hasData) {
                                return kIsWeb
                                    ? Image.memory(
                                        snapshot.data!,
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        height: double.infinity,
                                      )
                                    : Image.file(
                                        File(_selectedImages[index].path),
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        height: double.infinity,
                                      );
                              }
                              return Container(
                                color: Colors.grey.shade300,
                                child: Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removeImage(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ] else ...[
          // Original add photo button when no images selected
          GestureDetector(
            onTap: _canUploadMoreImages ? _addPhoto : _showLimitReachedMessage,
            child: Container(
              height: 120,
              width: 120,
              decoration: BoxDecoration(
                color: _canUploadMoreImages ? Colors.white : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _canUploadMoreImages ? Colors.grey.shade300 : Colors.grey.shade200,
                  width: 1.5,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _canUploadMoreImages ? Colors.grey.shade100 : Colors.grey.shade200,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _canUploadMoreImages ? Icons.camera_alt_outlined : Icons.block,
                      size: 24,
                      color: _canUploadMoreImages ? Colors.grey.shade500 : Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TranslatedText(
                    _canUploadMoreImages ? 'Add Photo' : 'Limit Reached',
                    style: TextStyle(
                      fontSize: 12,
                      color: _canUploadMoreImages ? Colors.grey.shade600 : Colors.grey.shade400,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 8),
        // Show ward image limit info
        if (!_isLoadingUser && _currentUser != null)
          Text(
            limitReached 
              ? 'আপনার ওয়ার্ডের জন্য ছবি আপলোডের সীমা পৌঁছে গেছে (Image upload limit reached for your ward)'
              : 'আপনার ওয়ার্ডের জন্য $_remainingUploads টি ছবি আপলোড করতে পারবেন (You can upload $_remainingUploads image for your ward)',
            style: TextStyle(
              fontSize: 12,
              color: limitReached ? Colors.red.shade600 : Colors.grey.shade600,
              fontWeight: limitReached ? FontWeight.w500 : FontWeight.normal,
            ),
          )
        else
          Text(
            'You can add up to 6 photos',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
            ),
          ),
      ],
    );
  }

  Widget _buildVoiceRecordingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            text: 'তথ্যের রেকর্ডিং ',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
            children: [
              TextSpan(
                text: '(Optional)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w400,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Show recorded audio files
        if (_selectedAudioFiles.isNotEmpty) ...[
          ...(_selectedAudioFiles.asMap().entries.map((entry) {
            final index = entry.key;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200, width: 1),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.audiotrack,
                    color: Colors.green.shade600,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TranslatedText(
                      'Voice Recording ${index + 1}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _removeAudioFile(index),
                    child: Icon(Icons.close, color: Colors.red, size: 20),
                  ),
                ],
              ),
            );
          })),
          const SizedBox(height: 12),
        ],

        // Original recording button with same design
        GestureDetector(
          onTap: _toggleRecording,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade300, width: 1),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isRecording ? Icons.stop : Icons.mic,
                  color: isRecording ? Colors.red : Colors.grey.shade600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                TranslatedText(
                  isRecording ? 'Stop recording' : 'Tap to record',
                  style: TextStyle(
                    fontSize: 14,
                    color: isRecording ? Colors.red : Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDescriptionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            text: 'আপনার অভিযোগের বর্ণনা করুন ',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
            children: [
              TextSpan(
                text: '(Describe Your Complaint)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w400,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300, width: 1),
          ),
          child: TextField(
            controller: _descriptionController,
            maxLines: 6,
            decoration: InputDecoration(
              hintText: 'অনুগ্রহ করে আপনার সমস্যা সম্পর্কে বিস্তারিত লিখুন... (Please provide details about the waste issue...)',
              hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _continueToAddress,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4CAF50),
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          'ঠিকানায় যান (Continue to Address)',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  /// Show message when image upload limit is reached
  void _showLimitReachedMessage() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
              const SizedBox(width: 8),
              Expanded(
                child: TranslatedText(
                  'Upload Limit Reached',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TranslatedText(
                'আপনি ইতিমধ্যে আপনার ওয়ার্ডের জন্য সর্বোচ্চ সংখ্যক ছবি আপলোড করেছেন।',
                style: TextStyle(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 8),
              TranslatedText(
                'You have already uploaded the maximum number of images allowed for your ward.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600, height: 1.5),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange.shade700, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'সীমা: প্রতি ওয়ার্ডে ১টি ছবি\nLimit: 1 image per ward',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.orange.shade900,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: TranslatedText(
                'বুঝেছি (Understood)',
                style: TextStyle(
                  color: Color(0xFF4CAF50),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _addPhoto() async {
    // Check if user can upload more images
    if (!_canUploadMoreImages) {
      _showLimitReachedMessage();
      return;
    }

    try {
      // Show dialog to choose camera or gallery
      final String? choice = await showDialog<String>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: TranslatedText('Select Photo Source'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: Icon(Icons.camera_alt),
                  title: TranslatedText('Camera'),
                  onTap: () => Navigator.pop(context, 'camera'),
                ),
                ListTile(
                  leading: Icon(Icons.photo_library),
                  title: TranslatedText('Gallery'),
                  onTap: () => Navigator.pop(context, 'gallery'),
                ),
              ],
            ),
          );
        },
      );

      if (choice == 'camera') {
        // Navigate to camera page
        Navigator.pushNamed(context, '/camera');
      } else if (choice == 'gallery') {
        // Pick image from gallery
        final file = await _fileHandlingService.pickImage(source: ImageSource.gallery);
        if (file != null) {
          setState(() {
            _selectedImages.add(file);
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: TranslatedText('Photo added successfully'),
              backgroundColor: Color(0xFF4CAF50),
            ),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Error adding photo: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _toggleRecording() async {
    try {
      if (isRecording) {
        // Stop recording
        final audioFile = await _fileHandlingService.stopRecording();
        if (audioFile != null) {
          setState(() {
            _selectedAudioFiles.add(audioFile);
            isRecording = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: TranslatedText('Recording stopped and saved'),
              backgroundColor: const Color(0xFF4CAF50),
            ),
          );
        }
      } else {
        // Start recording
        final recordingPath = await _fileHandlingService.getRecordingPath();
        await _fileHandlingService.startRecording(recordingPath);

        setState(() {
          isRecording = true;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TranslatedText('Recording started...'),
            backgroundColor: const Color(0xFF4CAF50),
          ),
        );
      }
    } catch (e) {
      setState(() {
        isRecording = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Recording error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeAudioFile(int index) {
    setState(() {
      _selectedAudioFiles.removeAt(index);
    });
  }

  void _continueToAddress() {
    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText(
            'Please provide a description of your complaint',
          ),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Save data to complaint provider
    final complaintProvider = Provider.of<ComplaintProvider>(
      context,
      listen: false,
    );
    complaintProvider.setDescription(_descriptionController.text);

    // Update provider with selected files using proper methods
    complaintProvider.addImages(_selectedImages);
    complaintProvider.addAudioFiles(_selectedAudioFiles);

    // Navigate to complaint address page
    Navigator.pushNamed(context, '/complaint-address');
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
      case 4:
        // Camera - navigate to camera page
        Navigator.pushNamed(context, '/camera');
        break;
    }
  }
}
