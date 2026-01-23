import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../config/url_helper.dart';

class VoiceMessagePlayer extends StatefulWidget {
  final String voiceUrl;
  final bool isUser;
  final Function(String, bool)? onPlayStateChanged;

  const VoiceMessagePlayer({
    super.key,
    required this.voiceUrl,
    required this.isUser,
    this.onPlayStateChanged,
  });

  @override
  State<VoiceMessagePlayer> createState() => _VoiceMessagePlayerState();
}

class _VoiceMessagePlayerState extends State<VoiceMessagePlayer> with SingleTickerProviderStateMixin {
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  bool _isLoading = false;
  bool _hasError = false;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();

    // Listen to player state changes
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
        });
        
        if (widget.onPlayStateChanged != null) {
          widget.onPlayStateChanged!(widget.voiceUrl, _isPlaying);
        }

        if (_isPlaying) {
          _animationController.repeat();
        } else {
          _animationController.stop();
          _animationController.reset();
        }
      }
    });

    // Listen to audio duration
    _audioPlayer.onDurationChanged.listen((newDuration) {
      if (mounted) {
        setState(() {
          _duration = newDuration;
        });
      }
    });

    // Listen to audio position
    _audioPlayer.onPositionChanged.listen((newPosition) {
      if (mounted) {
        setState(() {
          _position = newPosition;
        });
      }
    });

    // Listen to completion
    _audioPlayer.onPlayerComplete.listen((event) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _position = Duration.zero;
        });
        _animationController.stop();
        _animationController.reset();
        
        if (widget.onPlayStateChanged != null) {
          widget.onPlayStateChanged!(widget.voiceUrl, false);
        }
      }
    });
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    try {
      if (_isPlaying) {
        await _audioPlayer.pause();
      } else {
        setState(() {
          _isLoading = true;
          _hasError = false;
        });
        
        // Play the audio
        await _audioPlayer.play(UrlSource(UrlHelper.getImageUrl(widget.voiceUrl)));
        
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error playing audio: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
          _isPlaying = false;
        });
        _animationController.stop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: widget.isUser 
            ? Colors.white.withOpacity(0.2) 
            : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: _togglePlay,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: widget.isUser ? Colors.white : const Color(0xFF2E8B57),
                shape: BoxShape.circle,
              ),
              child: _isLoading 
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          widget.isUser ? const Color(0xFF2E8B57) : Colors.white
                        ),
                      ),
                    )
                  : Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      color: widget.isUser ? const Color(0xFF2E8B57) : Colors.white,
                      size: 20,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          // Audio waveform visualization
          Expanded(
            child: SizedBox(
              height: 30,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: List.generate(
                      20,
                      (index) {
                        // Calculate animated height based on index and animation value
                        double height = 10.0;
                        if (_isPlaying) {
                          final value = _animationController.value;
                          final wave = (index / 20.0 + value) * 2 * 3.14159;
                          // Use sin wave for animation
                          final normalized = (0.5 + 0.5 * double.parse(index.toString()) % 2 == 0 ? 1 : 0.6); 
                          height = 10.0 + 10.0 * normalized * (0.5 + 0.5 * (index % 3 == 0 ? 1.5 : 0.8));
                          
                          // Randomize slightly for more natural look
                          if (index % 2 == 0) {
                            height = 15.0 + 10.0 * value; 
                          } else {
                            height = 10.0 + 5.0 * (1 - value);
                          }
                          
                          // Clamp height
                          height = height.clamp(4.0, 25.0);
                        } else {
                          // Static waveform pattern
                          height = (index % 3 == 0 ? 20.0 : (index % 2 == 0 ? 15.0 : 10.0));
                        }
                        
                        return Container(
                          width: 3,
                          height: height,
                          decoration: BoxDecoration(
                            color: widget.isUser 
                                ? Colors.white.withOpacity(0.8)
                                : Colors.grey.shade400,
                            borderRadius: BorderRadius.circular(1.5),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _isPlaying 
                ? '${_position.inMinutes}:${(_position.inSeconds % 60).toString().padLeft(2, '0')}'
                : 'Voice',
            style: TextStyle(
              color: widget.isUser ? Colors.white70 : Colors.grey.shade600,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}