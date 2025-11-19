import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:mime/mime.dart';

class FileHandlingService {
  static const int maxImageSizeMB = 5;
  static const int maxAudioSizeMB = 50; // Increased temporarily for testing
  static const List<String> allowedImageTypes = ['jpeg', 'jpg', 'png', 'webp'];
  static const List<String> allowedAudioTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

  final ImagePicker _imagePicker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();

  /// Validate file size against limits
  static bool validateFileSize(File file, int maxSizeMB) {
    final fileSizeBytes = file.lengthSync();
    final maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileSizeBytes <= maxSizeBytes;
  }

  /// Validate image file type and size
  static bool validateImageFile(File file) {
    final mimeType = lookupMimeType(file.path);
    if (mimeType == null) return false;

    final extension = mimeType.split('/').last.toLowerCase();
    return allowedImageTypes.contains(extension) && 
           validateFileSize(file, maxImageSizeMB);
  }

  /// Validate audio file type and size
  static bool validateAudioFile(File file) {
    final mimeType = lookupMimeType(file.path);
    if (mimeType == null) return false;

    final extension = mimeType.split('/').last.toLowerCase();
    return allowedAudioTypes.contains(extension) && 
           validateFileSize(file, maxAudioSizeMB);
  }

  /// Get file size in MB for display
  static double getFileSizeMB(File file) {
    final fileSizeBytes = file.lengthSync();
    return fileSizeBytes / (1024 * 1024);
  }

  /// Pick image from gallery or camera
  Future<File?> pickImage({ImageSource source = ImageSource.gallery}) async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (pickedFile == null) return null;

      // Web platform handling
      if (kIsWeb) {
        // For web, return a File with the XFile path
        // The API client will handle reading bytes from XFile
        return File(pickedFile.path);
      }

      // Mobile platform handling
      final permission = source == ImageSource.camera 
          ? Permission.camera 
          : Permission.photos;
      
      final status = await permission.request();
      if (!status.isGranted) {
        throw Exception('Permission denied for ${source == ImageSource.camera ? 'camera' : 'gallery'}');
      }

      final file = File(pickedFile.path);
      
      // Validate the picked image
      if (!validateImageFile(file)) {
        throw Exception(
          'Invalid image file. Please select a JPEG, PNG, or WebP image under ${maxImageSizeMB}MB.'
        );
      }

      return file;
    } catch (e) {
      throw Exception('Error picking image: ${e.toString()}');
    }
  }

  /// Pick multiple images
  Future<List<File>> pickMultipleImages() async {
    try {
      final List<XFile> pickedFiles = await _imagePicker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      // Web platform handling
      if (kIsWeb) {
        return pickedFiles.map((file) => File(file.path)).toList();
      }

      // Mobile platform handling
      final status = await Permission.photos.request();
      if (!status.isGranted) {
        throw Exception('Permission denied for gallery access');
      }

      final List<File> validFiles = [];
      final List<String> errors = [];

      for (final pickedFile in pickedFiles) {
        final file = File(pickedFile.path);
        if (validateImageFile(file)) {
          validFiles.add(file);
        } else {
          errors.add('${pickedFile.name}: Invalid or too large');
        }
      }

      if (errors.isNotEmpty && validFiles.isEmpty) {
        throw Exception('No valid images selected. ${errors.join(', ')}');
      }

      return validFiles;
    } catch (e) {
      throw Exception('Error picking images: ${e.toString()}');
    }
  }

  /// Check if audio recording is supported
  Future<bool> isRecordingSupported() async {
    return await _audioRecorder.hasPermission();
  }

  /// Start audio recording
  Future<void> startRecording(String filePath) async {
    try {
      // Web doesn't support microphone permission API, browser handles it
      if (!kIsWeb) {
        final status = await Permission.microphone.request();
        if (!status.isGranted) {
          throw Exception('Microphone permission denied');
        }
      }

      if (!await _audioRecorder.hasPermission()) {
        throw Exception('Recording not supported on this device');
      }

      await _audioRecorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 64000,     // Reduced from 128000 to 64kbps (good quality for speech)
          sampleRate: 16000,  // Reduced from 44100 to 16kHz (sufficient for voice)
        ),
        path: filePath,
      );
    } catch (e) {
      throw Exception('Error starting recording: ${e.toString()}');
    }
  }

  /// Stop audio recording and return the file
  Future<File?> stopRecording() async {
    try {
      final path = await _audioRecorder.stop();
      if (path == null) return null;

      final file = File(path);
      
      // No validation - we've configured the codec properly
      // Backend will handle file size validation if needed
      
      return file;
    } catch (e) {
      throw Exception('Error stopping recording: ${e.toString()}');
    }
  }

  /// Check if currently recording
  Future<bool> isRecording() async {
    return await _audioRecorder.isRecording();
  }

  /// Get temporary directory for storing recordings
  Future<String> getRecordingPath() async {
    if (kIsWeb) {
      // For web, use a simple filename since we can't access file system directly
      final fileName = 'recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
      return fileName;
    }
    
    final directory = await getTemporaryDirectory();
    final fileName = 'recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
    return '${directory.path}/$fileName';
  }

  /// Dispose resources
  void dispose() {
    _audioRecorder.dispose();
  }
}

/// Helper class for managing file validation results
class FileValidationResult {
  final bool isValid;
  final String? error;
  final File? file;

  FileValidationResult({
    required this.isValid,
    this.error,
    this.file,
  });

  factory FileValidationResult.valid(File file) {
    return FileValidationResult(isValid: true, file: file);
  }

  factory FileValidationResult.invalid(String error) {
    return FileValidationResult(isValid: false, error: error);
  }
}