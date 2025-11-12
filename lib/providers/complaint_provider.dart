import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/complaint.dart';
import '../repositories/complaint_repository.dart';
import '../services/file_handling_service.dart';

class ComplaintProvider extends ChangeNotifier {
  final ComplaintRepository _complaintRepository;
  final FileHandlingService _fileHandlingService = FileHandlingService();

  ComplaintProvider(this._complaintRepository);

  // Current complaint form data
  String _title = '';
  String _description = '';
  String _category = '';
  String _urgencyLevel = '';
  String _location = '';
  String? _address;
  String? _district;
  String? _thana;
  String? _ward;
  List<File> _selectedImages = [];
  List<File> _selectedAudioFiles = [];

  // State management
  bool _isLoading = false;
  String? _error;
  List<Complaint> _complaints = [];
  Complaint? _currentComplaint;

  // Getters
  String get title => _title;
  String get description => _description;
  String get category => _category;
  String get urgencyLevel => _urgencyLevel;
  String get location => _location;
  String? get address => _address;
  String? get district => _district;
  String? get thana => _thana;
  String? get ward => _ward;
  List<File> get selectedImages => List.unmodifiable(_selectedImages);
  List<File> get selectedAudioFiles => List.unmodifiable(_selectedAudioFiles);
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Complaint> get complaints => List.unmodifiable(_complaints);
  Complaint? get currentComplaint => _currentComplaint;

  // Form validation
  bool get isFormValid {
    return _description.isNotEmpty &&
           _location.isNotEmpty;
  }

  // Setters for form data
  void setTitle(String title) {
    _title = title;
    notifyListeners();
  }

  void setDescription(String description) {
    _description = description;
    notifyListeners();
  }

  void setCategory(String category) {
    _category = category;
    notifyListeners();
  }

  void setUrgencyLevel(String urgencyLevel) {
    _urgencyLevel = urgencyLevel;
    notifyListeners();
  }

  void setLocation(String location) {
    _location = location;
    notifyListeners();
  }

  void setAddress(String? address) {
    _address = address;
    notifyListeners();
  }

  void setDistrict(String? district) {
    _district = district;
    notifyListeners();
  }

  void setThana(String? thana) {
    _thana = thana;
    notifyListeners();
  }

  void setWard(String? ward) {
    _ward = ward;
    notifyListeners();
  }

  // File management
  Future<void> addImage() async {
    try {
      _error = null;
      final file = await _fileHandlingService.pickImage();
      if (file != null) {
        _selectedImages.add(file);
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> addMultipleImages() async {
    try {
      _error = null;
      final files = await _fileHandlingService.pickMultipleImages();
      _selectedImages.addAll(files);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void removeImage(int index) {
    if (index >= 0 && index < _selectedImages.length) {
      _selectedImages.removeAt(index);
      notifyListeners();
    }
  }

  void addImages(List<File> images) {
    _selectedImages.addAll(images);
    notifyListeners();
  }

  void addAudioFiles(List<File> audioFiles) {
    _selectedAudioFiles.addAll(audioFiles);
    notifyListeners();
  }

  Future<void> startRecording() async {
    try {
      _error = null;
      final recordingPath = await _fileHandlingService.getRecordingPath();
      await _fileHandlingService.startRecording(recordingPath);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> stopRecording() async {
    try {
      final audioFile = await _fileHandlingService.stopRecording();
      if (audioFile != null) {
        _selectedAudioFiles.add(audioFile);
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> get isRecording => _fileHandlingService.isRecording();

  void removeAudioFile(int index) {
    if (index >= 0 && index < _selectedAudioFiles.length) {
      _selectedAudioFiles.removeAt(index);
      notifyListeners();
    }
  }

  // API operations
  Future<void> createComplaint() async {
    if (!isFormValid) {
      _error = 'Please fill all required fields';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final complaint = await _complaintRepository.createComplaint(
        description: _description,
        address: _address,
        district: _district,
        thana: _thana,
        ward: _ward,
        images: _selectedImages.isNotEmpty ? _selectedImages : null,
        audioFiles: _selectedAudioFiles.isNotEmpty ? _selectedAudioFiles : null,
      );

      _currentComplaint = complaint;
      await loadMyComplaints(); // Refresh the list
      clearForm(); // Clear form after successful creation
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMyComplaints() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _complaints = await _complaintRepository.getMyComplaints();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadComplaint(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentComplaint = await _complaintRepository.getComplaint(id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateComplaint(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final complaint = await _complaintRepository.updateComplaint(
        id: id,
        title: _title.isNotEmpty ? _title : null,
        description: _description.isNotEmpty ? _description : null,
        category: _category.isNotEmpty ? _category : null,
        urgencyLevel: _urgencyLevel.isNotEmpty ? _urgencyLevel : null,
        location: _location.isNotEmpty ? _location : null,
        address: _address,
        newImages: _selectedImages.isNotEmpty ? _selectedImages : null,
        newAudioFiles: _selectedAudioFiles.isNotEmpty ? _selectedAudioFiles : null,
      );

      _currentComplaint = complaint;
      await loadMyComplaints(); // Refresh the list
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteComplaint(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _complaintRepository.deleteComplaint(id);
      await loadMyComplaints(); // Refresh the list
      if (_currentComplaint?.id == id) {
        _currentComplaint = null;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Utility methods
  void clearForm() {
    _title = '';
    _description = '';
    _category = '';
    _urgencyLevel = '';
    _location = '';
    _address = null;
    _district = null;
    _thana = null;
    _ward = null;
    _selectedImages.clear();
    _selectedAudioFiles.clear();
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void loadFormFromComplaint(Complaint complaint) {
    _title = complaint.title;
    _description = complaint.description;
    _category = complaint.category;
    _urgencyLevel = complaint.urgencyLevel;
    _location = complaint.location;
    _address = complaint.address;
    // Note: Can't load existing files, only new ones can be added
    _selectedImages.clear();
    _selectedAudioFiles.clear();
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _fileHandlingService.dispose();
    super.dispose();
  }
}