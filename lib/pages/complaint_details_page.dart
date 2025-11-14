import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../providers/complaint_provider.dart';
import '../services/file_handling_service.dart';

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
  final List<File> _selectedImages = [];
  final List<File> _selectedAudioFiles = [];

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

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF4CAF50),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      title: TranslatedText(
        'Complaint Details',
        style: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: false,
    );
  }

  Widget _buildUploadPhotosSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TranslatedText(
          'Upload Photos',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
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
                  // Add photo button - same design as original
                  return GestureDetector(
                    onTap: _addPhoto,
                    child: Container(
                      margin: const EdgeInsets.only(left: 8),
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.grey.shade300,
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
                              color: Colors.grey.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.camera_alt_outlined,
                              size: 24,
                              color: Colors.grey.shade500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TranslatedText(
                            'Add Photo',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
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
                          child: kIsWeb
                              ? Image.network(
                                  _selectedImages[index].path,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Center(
                                      child: Icon(
                                        Icons.image,
                                        color: Colors.grey,
                                      ),
                                    );
                                  },
                                )
                              : Image.file(
                                  _selectedImages[index],
                                  fit: BoxFit.cover,
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
            onTap: _addPhoto,
            child: Container(
              height: 120,
              width: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.grey.shade300,
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
                      color: Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.camera_alt_outlined,
                      size: 24,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TranslatedText(
                    'Add Photo',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildVoiceRecordingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TranslatedText(
          'Voice Recording (Optional)',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
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
        TranslatedText(
          'Describe Your Complaint',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
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
              hintText: 'Please provide details about the waste issue...',
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
        child: TranslatedText(
          'Continue to Address',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  Future<void> _addPhoto() async {
    try {
      // Show dialog to choose camera or gallery
      final ImageSource? source = await showDialog<ImageSource>(
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
                  onTap: () => Navigator.pop(context, ImageSource.camera),
                ),
                ListTile(
                  leading: Icon(Icons.photo_library),
                  title: TranslatedText('Gallery'),
                  onTap: () => Navigator.pop(context, ImageSource.gallery),
                ),
              ],
            ),
          );
        },
      );

      if (source != null) {
        final file = await _fileHandlingService.pickImage(source: source);
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
    }
  }
}
