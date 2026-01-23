import 'dart:io';
import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:cached_network_image/cached_network_image.dart';
import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../widgets/admin_info_card.dart';
import '../services/live_chat_service.dart';
import '../models/chat_message.dart' as model;
import '../config/url_helper.dart';

/// Live Chat page for direct communication with ward/zone admin
/// Separate from complaint chat - uses different API endpoints
/// User chats with admin based on their signup location
class LiveChatPage extends StatefulWidget {
  const LiveChatPage({super.key});

  @override
  State<LiveChatPage> createState() => _LiveChatPageState();
}

class _LiveChatPageState extends State<LiveChatPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _typingController;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final LiveChatService _liveChatService = LiveChatService();
  final ImagePicker _picker = ImagePicker();
  AudioRecorder? _recorder;
  final AudioPlayer _audioPlayer = AudioPlayer();

  List<model.ChatMessage> messages = [];
  Map<String, dynamic>? adminInfo;
  bool isLoading = true;
  bool isSending = false;
  bool isRecording = false;
  
  // Upload progress tracking
  double _uploadProgress = 0.0;
  bool _isUploading = false;
  String _uploadingType = ''; // 'voice' or 'image'
  
  // New State Variables for Attachments
  XFile? _attachedImageXFile;
  Uint8List? _attachedImageBytes; // For web compatibility
  String? _recordedFilePath;
  bool _showVoicePreview = false;
  Duration _recordDuration = Duration.zero;
  Timer? _recordTimer;
  
  // Voice playback state
  String? _currentPlayingVoiceUrl;
  bool _isVoicePlaying = false;
  
  bool hasError = false;
  String errorMessage = '';
  Timer? _pollingTimer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _typingController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    if (!kIsWeb) {
      _recorder = AudioRecorder();
    }

    // Listen to audio player completion
    _audioPlayer.onPlayerComplete.listen((event) {
      setState(() {
        _isVoicePlaying = false;
        _currentPlayingVoiceUrl = null;
      });
    });

    // Load admin info and initial messages
    _loadAdminAndMessages();

    // Start polling for new messages every 5 seconds
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _recordTimer?.cancel();
    _backgroundController.dispose();
    _typingController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  /// Load admin info and messages from server
  Future<void> _loadAdminAndMessages() async {
    try {
      setState(() {
        isLoading = true;
        hasError = false;
      });

      // Get admin info
      final admin = await _liveChatService.getAdmin();
      
      // Get messages
      final fetchedMessages = await _liveChatService.getMessages();

      setState(() {
        adminInfo = admin;
        messages = fetchedMessages;
        isLoading = false;
      });

      // Mark messages as read
      await _liveChatService.markAsRead();

      // Scroll to bottom
      _scrollToBottom();
    } catch (e) {
      String userFriendlyError = 'Failed to load chat';
      
      final errorString = e.toString();
      if (errorString.contains('No admin found')) {
        userFriendlyError = 'আপনার এলাকার জন্য কোনো অ্যাডমিন পাওয়া যায়নি।';
        _pollingTimer?.cancel();
      } else if (errorString.contains('Unauthorized')) {
        userFriendlyError = 'অনুমতি নেই। দয়া করে আবার লগইন করুন।';
        _pollingTimer?.cancel();
      } else if (errorString.contains('Network') || errorString.contains('connection')) {
        userFriendlyError = 'ইন্টারনেট সংযোগ নেই। দয়া করে আপনার সংযোগ পরীক্ষা করুন।';
      } else if (errorString.contains('timeout')) {
        userFriendlyError = 'সার্ভার সাড়া দিচ্ছে না। দয়া করে পরে আবার চেষ্টা করুন।';
      }
      
      setState(() {
        isLoading = false;
        hasError = true;
        errorMessage = userFriendlyError;
      });
    }
  }

  /// Start polling for new messages
  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _loadMessagesQuietly();
    });
  }

  /// Load messages without showing loading indicator
  Future<void> _loadMessagesQuietly() async {
    try {
      final fetchedMessages = await _liveChatService.getMessages();

      // Only update if there are new messages
      if (fetchedMessages.length != messages.length) {
        setState(() {
          messages = fetchedMessages;
        });
        await _liveChatService.markAsRead();
        _scrollToBottom();
      }
    } catch (e) {
      final errorString = e.toString();
      if (errorString.contains('No admin found') || errorString.contains('Unauthorized')) {
        _pollingTimer?.cancel();
        setState(() {
          hasError = true;
          errorMessage = 'চ্যাট অ্যাক্সেস করতে সমস্যা হয়েছে।';
        });
      }
    }
  }

  /// Send message to server
  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if ((text.isEmpty && _attachedImageXFile == null && _recordedFilePath == null) || isSending) return;

    setState(() {
      isSending = true;
      _uploadProgress = 0.0;
    });

    try {
      // Upload image if attached
      String? imageUrl;
      if (_attachedImageXFile != null) {
        setState(() {
          _isUploading = true;
          _uploadingType = 'image';
          _uploadProgress = 0.0;
        });
        
        imageUrl = await _liveChatService.uploadImage(_attachedImageXFile!);
        
        setState(() {
          _uploadProgress = 1.0;
          _isUploading = false;
        });
      }

      // Upload voice if recorded
      String? voiceUrl;
      if (_recordedFilePath != null) {
        setState(() {
          _isUploading = true;
          _uploadingType = 'voice';
          _uploadProgress = 0.0;
        });
        
        try {
          final xfile = XFile(_recordedFilePath!);
          voiceUrl = await _liveChatService.uploadVoice(xfile);
          print('✅ Voice uploaded successfully: $voiceUrl');
          
          setState(() {
            _uploadProgress = 1.0;
            _isUploading = false;
          });
        } catch (e) {
          // Handle voice upload error specifically
          setState(() {
            isSending = false;
            _isUploading = false;
            _uploadProgress = 0.0;
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('ভয়েস আপলোড ব্যর্থ: ${_getErrorMessage(e)}'),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 5),
                action: SnackBarAction(
                  label: 'পুনরায় চেষ্টা করুন',
                  textColor: Colors.white,
                  onPressed: _sendMessage,
                ),
              ),
            );
          }
          return; // Don't proceed with sending message
        }
      }

      final sentMessage = await _liveChatService.sendMessage(
        text.isEmpty ? (imageUrl != null ? ' ' : (voiceUrl != null ? 'Voice Message' : ' ')) : text,
        imageUrl: imageUrl,
        voiceUrl: voiceUrl,
      );

      setState(() {
        messages.add(sentMessage);
        isSending = false;
        _isUploading = false;
        _uploadProgress = 0.0;
        _recordedFilePath = null;
        _attachedImageXFile = null;
        _attachedImageBytes = null;
        _showVoicePreview = false;
        _messageController.clear();
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        isSending = false;
        _isUploading = false;
        _uploadProgress = 0.0;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('মেসেজ পাঠাতে ব্যর্থ: ${_getErrorMessage(e)}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'পুনরায় চেষ্টা করুন',
              textColor: Colors.white,
              onPressed: _sendMessage,
            ),
          ),
        );
      }
    }
  }

  /// Get user-friendly error message based on error type
  String _getErrorMessage(dynamic error) {
    final errorString = error.toString();
    
    if (errorString.contains('500')) {
      return 'সার্ভার সমস্যা। দয়া করে পরে আবার চেষ্টা করুন।';
    } else if (errorString.contains('Network') || errorString.contains('connection')) {
      return 'ইন্টারনেট সংযোগ নেই।';
    } else if (errorString.contains('timeout')) {
      return 'সময় শেষ। দয়া করে আবার চেষ্টা করুন।';
    } else if (errorString.contains('File size') || errorString.contains('10MB')) {
      return 'ফাইল খুব বড়। সর্বোচ্চ 10MB।';
    } else if (errorString.contains('Invalid file type')) {
      return 'অসমর্থিত ফাইল ফরম্যাট।';
    } else if (errorString.contains('401') || errorString.contains('Unauthorized')) {
      return 'অনুমতি নেই। দয়া করে আবার লগইন করুন।';
    } else if (errorString.contains('403') || errorString.contains('Forbidden')) {
      return 'এই কাজ করার অনুমতি নেই।';
    } else if (errorString.contains('404') || errorString.contains('Not found')) {
      return 'সার্ভার খুঁজে পাওয়া যায়নি।';
    } else {
      return errorString.length > 100 ? errorString.substring(0, 100) + '...' : errorString;
    }
  }

  Future<void> _pickImage() async {
    try {
      final xfile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (xfile == null) return;
      
      // For web, we need to read bytes; for mobile, we can use File
      Uint8List? imageBytes;
      if (kIsWeb) {
        imageBytes = await xfile.readAsBytes();
      }
      
      setState(() {
        _attachedImageXFile = xfile;
        _attachedImageBytes = imageBytes;
        // Reset voice if image is picked
        _recordedFilePath = null;
        _showVoicePreview = false; 
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TranslatedText('ছবি নির্বাচন করতে ব্যর্থ: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildAttachmentPreview() {
    if (_attachedImageXFile != null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
        height: 100,
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: kIsWeb && _attachedImageBytes != null
                    ? Image.memory(
                        _attachedImageBytes!,
                        fit: BoxFit.cover,
                        width: 100,
                        height: 100,
                      )
                    : Image.file(
                        File(_attachedImageXFile!.path),
                        fit: BoxFit.cover,
                        width: 100,
                        height: 100,
                      ),
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _attachedImageXFile = null;
                    _attachedImageBytes = null;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Future<void> _toggleRecord() async {
    try {
      if (kIsWeb) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: TranslatedText('ওয়েবে ভয়েস রেকর্ডিং সমর্থিত নয়'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      if (_recorder == null) return;

      if (!isRecording) {
        // Start Recording
        final hasPermission = await _recorder!.hasPermission();
        if (!hasPermission) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: TranslatedText('মাইক্রোফোন অনুমতি প্রয়োজন'), backgroundColor: Colors.red),
            );
          }
          return;
        }

        final dir = await getTemporaryDirectory();
        final filePath = p.join(dir.path, 'live_chat_voice_${DateTime.now().millisecondsSinceEpoch}.m4a');
        await _recorder!.start(const RecordConfig(), path: filePath);
        
        setState(() {
          isRecording = true;
          _recordDuration = Duration.zero;
          _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
            setState(() {
              _recordDuration += const Duration(seconds: 1);
            });
          });
          // Reset other attachments if recording starts
          _attachedImageXFile = null;
        });
      } else {
        // Stop Recording
        final path = await _recorder!.stop();
        _recordTimer?.cancel();
        
        setState(() {
          isRecording = false;
          _recordTimer = null;
        });

        if (path == null) return;
        
        setState(() {
          _recordedFilePath = path;
          _showVoicePreview = true;
        });
      }
    } catch (e) {
      _recordTimer?.cancel();
      setState(() {
        isRecording = false;
        isSending = false;
        _recordTimer = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TranslatedText('ভয়েস পাঠাতে ব্যর্থ: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _cancelRecording() async {
     if (isRecording) {
       await _recorder?.stop();
     }
     _recordTimer?.cancel();
     setState(() {
       isRecording = false;
       _recordTimer = null;
       _showVoicePreview = false;
       _recordedFilePath = null;
       _recordDuration = Duration.zero;
     });
  }

  Widget _buildVoiceRecorderUI() {
    if (isRecording) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          height: 50,
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(25),
          ),
          child: Row(
            children: [
               const Icon(Icons.fiber_manual_record, color: Colors.red, size: 16),
               const SizedBox(width: 8),
               Text(
                 '${_recordDuration.inMinutes.toString().padLeft(2, '0')}:${(_recordDuration.inSeconds % 60).toString().padLeft(2, '0')}',
                 style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 14),
               ),
               const SizedBox(width: 8),
               // Animated recording indicator
               Expanded(
                 child: Container(
                   height: 30,
                   child: Row(
                     mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                     crossAxisAlignment: CrossAxisAlignment.center,
                     children: List.generate(
                       20,
                       (index) => AnimatedContainer(
                         duration: Duration(milliseconds: 300 + (index * 50)),
                         width: 2,
                         height: (10 + (_recordDuration.inSeconds % 3) * 5 + (index % 3) * 3).toDouble(),
                         decoration: BoxDecoration(
                           color: Colors.red.withOpacity(0.6),
                           borderRadius: BorderRadius.circular(1),
                         ),
                       ),
                     ),
                   ),
                 ),
               ),
               const Spacer(),
               TextButton(
                 onPressed: _cancelRecording,
                 child: const TranslatedText('বাতিল', style: TextStyle(color: Colors.red)),
               )
            ],
          ),
        ),
      );
    } else if (_showVoicePreview) {
       return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF2E8B57).withOpacity(0.1),
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: const Color(0xFF2E8B57).withOpacity(0.3)),
          ),
          child: Row(
            children: [
               GestureDetector(
                 onTap: () async {
                   if (_recordedFilePath != null) {
                      await _audioPlayer.play(DeviceFileSource(_recordedFilePath!));
                   }
                 },
                 child: Container(
                   padding: const EdgeInsets.all(6),
                   decoration: const BoxDecoration(
                     color: Color(0xFF2E8B57),
                     shape: BoxShape.circle,
                   ),
                   child: const Icon(Icons.play_arrow, color: Colors.white, size: 18),
                 ),
               ),
               const SizedBox(width: 8),
               // Audio waveform visualization
               Expanded(
                 child: Container(
                   height: 30,
                   child: Row(
                     mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                     crossAxisAlignment: CrossAxisAlignment.center,
                     children: List.generate(
                       20,
                       (index) => Container(
                         width: 2,
                         height: (index % 3 == 0 ? 18.0 : (index % 2 == 0 ? 12.0 : 8.0)),
                         decoration: BoxDecoration(
                           color: const Color(0xFF2E8B57).withOpacity(0.6),
                           borderRadius: BorderRadius.circular(1),
                         ),
                       ),
                     ),
                   ),
                 ),
               ),
               const SizedBox(width: 8),
               Text(
                 '${_recordDuration.inMinutes}:${(_recordDuration.inSeconds % 60).toString().padLeft(2, '0')}',
                 style: const TextStyle(
                   color: Color(0xFF2E8B57),
                   fontSize: 12,
                   fontWeight: FontWeight.w600,
                 ),
               ),
               IconButton(
                 icon: const Icon(Icons.close, color: Colors.red, size: 20),
                 onPressed: _cancelRecording,
                 padding: EdgeInsets.zero,
                 constraints: const BoxConstraints(),
               ),
            ],
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      extendBody: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE9F6EE),
              Color(0xFFF7FCF9),
              Color(0xFFF3FAF5),
            ],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              if (adminInfo != null) AdminInfoCard(adminInfo: adminInfo!),
              Expanded(
                child: _buildChatArea(),
              ),
              _buildMessageInput(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
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
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: TranslatedText('QR স্ক্যানার খোলা হচ্ছে...'),
                  backgroundColor: Color(0xFF2E8B57),
                ),
              );
              break;
          }
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF2E8B57),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          const SizedBox(width: 4),
          const CircleAvatar(
            radius: 16,
            backgroundColor: Color(0xFF3CB371),
            child: Icon(
              Icons.chat_bubble,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                TranslatedText(
                  'লাইভ চ্যাট',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Clean Care Support',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: _loadAdminAndMessages,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildChatArea() {
    if (isLoading && messages.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
        ),
      );
    }

    if (hasError && messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const TranslatedText(
                'চ্যাট লোড করতে ব্যর্থ',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back),
                    label: const TranslatedText('ফিরে যান'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: _loadAdminAndMessages,
                    icon: const Icon(Icons.refresh),
                    label: const TranslatedText('পুনরায় চেষ্টা করুন'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E8B57),
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    if (messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(
                Icons.chat_bubble_outline,
                size: 64,
                color: Colors.grey,
              ),
              SizedBox(height: 16),
              TranslatedText(
                'এখনো কোনো মেসেজ নেই',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
              SizedBox(height: 8),
              TranslatedText(
                'প্রথম মেসেজ পাঠিয়ে কথোপকথন শুরু করুন',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        controller: _scrollController,
        itemCount: messages.length,
        itemBuilder: (context, index) {
          return _buildMessageBubble(messages[index], index);
        },
      ),
    );
  }

  Widget _buildMessageBubble(model.ChatMessage message, int index) {
    final isUser = message.isUser;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.person,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser
                    ? const LinearGradient(
                        colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                      )
                    : null,
                color: isUser ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isUser
                        ? const Color(0xFF2E8B57).withValues(alpha: 0.3)
                        : Colors.black.withValues(alpha: 0.1),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sender name for admin messages - Always show "Clean Care Support"
                  if (!isUser) ...[
                    const Text(
                      'Clean Care Support',
                      style: TextStyle(
                        color: Color(0xFF2E8B57),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Message text
                  Text(
                    message.message,
                    style: TextStyle(
                      color: isUser ? Colors.white : Colors.black87,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                  // Image if present
                  if (message.imageUrl != null) ...[
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => _FullScreenChatImage(
                              imageUrl: UrlHelper.getImageUrl(message.imageUrl!),
                            ),
                          ),
                        );
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: UrlHelper.getImageUrl(message.imageUrl!),
                          fit: BoxFit.cover,
                          maxWidthDiskCache: 800,
                          maxHeightDiskCache: 600,
                          placeholder: (context, url) => Container(
                            height: 200,
                            color: isUser ? Colors.white.withOpacity(0.2) : Colors.grey[200],
                            child: Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isUser ? Colors.white : const Color(0xFF2E8B57),
                                ),
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 200,
                            padding: const EdgeInsets.all(16),
                            color: isUser ? Colors.white.withOpacity(0.2) : Colors.grey[200],
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.broken_image,
                                  color: isUser ? Colors.white70 : Colors.grey[600],
                                  size: 40,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'ছবি লোড করতে ব্যর্থ',
                                  style: TextStyle(
                                    color: isUser ? Colors.white70 : Colors.grey[600],
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  // Voice message if present
                  if (message.voiceUrl != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isUser 
                            ? Colors.white.withOpacity(0.2) 
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () async {
                              // Toggle play/pause for this voice message
                              if (_currentPlayingVoiceUrl == message.voiceUrl && _isVoicePlaying) {
                                // Pause if currently playing this message
                                await _audioPlayer.pause();
                                setState(() {
                                  _isVoicePlaying = false;
                                });
                              } else {
                                // Play this voice message
                                await _audioPlayer.stop();
                                await _audioPlayer.play(UrlSource(UrlHelper.getImageUrl(message.voiceUrl!)));
                                setState(() {
                                  _currentPlayingVoiceUrl = message.voiceUrl;
                                  _isVoicePlaying = true;
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isUser ? Colors.white : const Color(0xFF2E8B57),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                // Show pause icon if this message is currently playing, otherwise show play
                                (_currentPlayingVoiceUrl == message.voiceUrl && _isVoicePlaying)
                                    ? Icons.pause
                                    : Icons.play_arrow,
                                color: isUser ? const Color(0xFF2E8B57) : Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Audio waveform visualization (simplified)
                          Expanded(
                            child: Container(
                              height: 30,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: List.generate(
                                  25,
                                  (index) => Container(
                                    width: 2,
                                    height: (index % 3 == 0 ? 20.0 : (index % 2 == 0 ? 15.0 : 10.0)),
                                    decoration: BoxDecoration(
                                      color: isUser 
                                          ? Colors.white.withOpacity(0.7)
                                          : Colors.grey.shade400,
                                      borderRadius: BorderRadius.circular(1),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Voice',
                            style: TextStyle(
                              color: isUser ? Colors.white70 : Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  // Timestamp
                  Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      color: isUser ? Colors.white70 : Colors.grey.shade600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFF6D66B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.person,
                color: Colors.white,
                size: 16,
              ),
            ),
          ],
        ],
      ),
    ).animate(delay: (index * 100).ms).fadeIn(duration: 400.ms).slideY(
          begin: 0.3,
          duration: 300.ms,
          curve: Curves.easeOut,
        );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, -2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upload progress indicator
          if (_isUploading) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF2E8B57).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF2E8B57).withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      value: _uploadProgress > 0 ? _uploadProgress : null,
                      strokeWidth: 2,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _uploadingType == 'voice' ? 'ভয়েস আপলোড হচ্ছে...' : 'ছবি আপলোড হচ্ছে...',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF2E8B57),
                          ),
                        ),
                        if (_uploadProgress > 0 && _uploadProgress < 1)
                          Text(
                            '${(_uploadProgress * 100).toInt()}%',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Icon(
                    _uploadingType == 'voice' ? Icons.mic : Icons.image,
                    color: const Color(0xFF2E8B57),
                    size: 20,
                  ),
                ],
              ),
            ),
          ],
          _buildAttachmentPreview(),
          Row(
            children: [
              if (!isRecording && !_showVoicePreview) ...[ 
                IconButton(
                  onPressed: isSending ? null : _pickImage,
                  icon: const Icon(Icons.image, color: Color(0xFF2E8B57)),
                ),
                IconButton(
                  onPressed: isSending ? null : _toggleRecord,
                  icon: const Icon(Icons.mic, color: Color(0xFF2E8B57)),
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _messageController,
                      enabled: !isSending,
                      decoration: const InputDecoration(
                        hintText: 'মেসেজ লিখুন...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      minLines: 1,
                      maxLines: 4,
                    ),
                  ),
                ),
              ] else ...[
                 _buildVoiceRecorderUI(),
                 if (isRecording)
                   IconButton(
                     onPressed: _toggleRecord,
                     icon: const Icon(Icons.stop_circle, color: Colors.red, size: 32),
                   ),
              ],
              const SizedBox(width: 8),
              if (!isRecording) 
              Container(
                decoration: const BoxDecoration(
                  color: Color(0xFF2E8B57),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  onPressed: isSending ? null : _sendMessage,
                  icon: isSending
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.send, color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) {
      return 'এখনই';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} মিনিট আগে';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} ঘণ্টা আগে';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} দিন আগে';
    } else {
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');
      return '${time.day}/${time.month}/${time.year} $hour:$minute';
    }
  }
}

/// Full screen image viewer for chat images
class _FullScreenChatImage extends StatelessWidget {
  final String imageUrl;

  const _FullScreenChatImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.5,
          maxScale: 4.0,
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.contain,
            placeholder: (context, url) => const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            errorWidget: (context, url, error) => const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.broken_image,
                    color: Colors.white,
                    size: 64,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'ছবি লোড করতে ব্যর্থ',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
