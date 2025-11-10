import 'package:flutter/material.dart';
import '../components/custom_bottom_nav.dart';
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

  @override
  void dispose() {
    _descriptionController.dispose();
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
        GestureDetector(
          onTap: _toggleRecording,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey.shade300,
                width: 1,
              ),
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
            border: Border.all(
              color: Colors.grey.shade300,
              width: 1,
            ),
          ),
          child: TextField(
            controller: _descriptionController,
            maxLines: 6,
            decoration: InputDecoration(
              hintText: 'Please provide details about the waste issue...',
              hintStyle: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black87,
            ),
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
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  void _addPhoto() {
    // TODO: Implement photo picker
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: TranslatedText('Photo picker will be implemented'),
        backgroundColor: Color(0xFF4CAF50),
      ),
    );
  }

  void _toggleRecording() {
    setState(() {
      isRecording = !isRecording;
    });
    
    // TODO: Implement voice recording
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: TranslatedText(isRecording ? 'Recording started...' : 'Recording stopped'),
        backgroundColor: const Color(0xFF4CAF50),
      ),
    );
  }

  void _continueToAddress() {
    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Please provide a description of your complaint'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // TODO: Navigate to address page or submit complaint
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: TranslatedText('Proceeding to address selection...'),
        backgroundColor: Color(0xFF4CAF50),
      ),
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