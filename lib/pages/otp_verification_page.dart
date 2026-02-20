import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/api_config.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../services/system_config_service.dart';

class OtpVerificationPage extends StatefulWidget {
  final String? email;
  final String? phone;

  const OtpVerificationPage({super.key, this.email, this.phone});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  late final AuthRepository _auth;
  late final SystemConfigService _systemConfig;

  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  bool _isLoading = false;
  bool _canResend = false;
  int _resendCountdown = 60;

  // Verification Options Configuration
  bool _smsEnabled = true;
  bool _whatsappEnabled = true;
  bool _truecallerEnabled = false;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(ApiConfig.baseUrl);
    _auth = AuthRepository(apiClient);
    _systemConfig = SystemConfigService(apiClient);
    _startResendCountdown();
    _fetchVerificationConfigs();
  }

  Future<void> _fetchVerificationConfigs() async {
    try {
      final configs = await _systemConfig.getConfigs();
      if (mounted) {
        setState(() {
          _smsEnabled = configs['verification_sms_enabled'] != 'false';
          _whatsappEnabled =
              configs['verification_whatsapp_enabled'] != 'false';
          _truecallerEnabled =
              configs['verification_truecaller_enabled'] == 'true';
        });
      }
    } catch (e) {
      print('Failed to fetch verification configs: $e');
      // Fallback to defaults (already set)
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendCountdown() {
    setState(() {
      _canResend = false;
      _resendCountdown = 60;
    });

    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        _countdown();
      }
    });
  }

  void _countdown() {
    if (_resendCountdown > 0) {
      setState(() => _resendCountdown--);
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) _countdown();
      });
    } else {
      setState(() => _canResend = true);
    }
  }

  String _getOtpCode() {
    return _controllers.map((controller) => controller.text).join();
  }

  Future<void> _verifyOtp() async {
    final code = _getOtpCode();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '৬ সংখ্যার কোড লিখুন',
            style: GoogleFonts.notoSansBengali(),
          ),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (widget.phone != null) {
        await _auth.verifyPhone(widget.phone!, code);
      } else if (widget.email != null) {
        await _auth.verifyEmail(widget.email!, code);
      } else {
        throw Exception('No phone or email provided');
      }

      if (!mounted) return;

      // Show success dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: Color(0xFF2E8B57),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 50),
              ),
              const SizedBox(height: 24),
              Text(
                '✅ সফল!',
                style: GoogleFonts.notoSansBengali(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF2E8B57),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.phone != null
                    ? 'আপনার ফোন নম্বর ভেরিফাই হয়েছে'
                    : 'আপনার ইমেইল ভেরিফাই হয়েছে',
                textAlign: TextAlign.center,
                style: GoogleFonts.notoSansBengali(
                  fontSize: 16,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'এখন আপনি লগইন করতে পারবেন',
                textAlign: TextAlign.center,
                style: GoogleFonts.notoSansBengali(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/login',
                      (route) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E8B57),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'লগইন করুন',
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      String errorMessage = 'ভেরিফিকেশন ব্যর্থ';
      final errorStr = e.toString();

      if (errorStr.contains('expired')) {
        errorMessage = 'কোডের মেয়াদ শেষ। নতুন কোড পাঠান।';
      } else if (errorStr.contains('Invalid')) {
        errorMessage = 'ভুল কোড। আবার চেষ্টা করুন।';
      } else if (errorStr.contains('already verified')) {
        errorMessage = 'ইতোমধ্যে ভেরিফাই করা হয়েছে';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage, style: GoogleFonts.notoSansBengali()),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _resendCode({String method = 'sms'}) async {
    try {
      if (widget.phone != null) {
        await _auth.resendPhoneVerificationCode(widget.phone!, method: method);
      } else if (widget.email != null) {
        await _auth.resendVerificationCode(widget.email!);
      } else {
        throw Exception('No phone or email provided');
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            method == 'whatsapp'
                ? 'WhatsApp-এ নতুন কোড পাঠানো হয়েছে!'
                : 'নতুন কোড পাঠানো হয়েছে! চেক করুন।',
            style: GoogleFonts.notoSansBengali(),
          ),
          backgroundColor: Colors.green,
        ),
      );

      _startResendCountdown();

      // Clear all fields
      for (var controller in _controllers) {
        controller.clear();
      }
      _focusNodes[0].requestFocus();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'কোড পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।',
            style: GoogleFonts.notoSansBengali(),
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _verifyWithTruecaller() async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Truecaller ভেরিফিকেশন শীঘ্রই আসছে...',
          style: GoogleFonts.notoSansBengali(),
        ),
        backgroundColor: Colors.blue,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPhone = widget.phone != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          isPhone ? 'ফোন ভেরিফিকেশন' : 'ইমেইল ভেরিফিকেশন',
          style: GoogleFonts.notoSansBengali(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF2E8B57),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),

            // Icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Icon(
                isPhone ? Icons.phone_android : Icons.email_outlined,
                size: 50,
                color: const Color(0xFF2E8B57),
              ),
            ),

            const SizedBox(height: 32),

            // Title
            Text(
              'ভেরিফিকেশন কোড লিখুন',
              textAlign: TextAlign.center,
              style: GoogleFonts.notoSansBengali(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF333333),
              ),
            ),

            const SizedBox(height: 12),

            // Description
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue[700], size: 24),
                  const SizedBox(height: 8),
                  Text(
                    '৬ সংখ্যার কোড পাঠানো হয়েছে:',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 14,
                      color: Colors.blue[900],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isPhone ? widget.phone! : widget.email!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[900],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // OTP Input Fields
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(6, (index) {
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 60,
                    child: TextField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E8B57),
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: EdgeInsets.zero, // Adjust padding
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            8,
                          ), // Slightly smaller radius
                          borderSide: const BorderSide(
                            color: Colors.grey,
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(
                            color: Color(0xFF2E8B57),
                            width: 2,
                          ),
                        ),
                      ),
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (value) {
                        if (value.isNotEmpty && index < 5) {
                          _focusNodes[index + 1].requestFocus();
                        } else if (value.isEmpty && index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }

                        // Auto-verify when all 6 digits entered
                        if (index == 5 && value.isNotEmpty) {
                          _verifyOtp();
                        }
                      },
                    ),
                  ),
                );
              }),
            ),

            const SizedBox(height: 32),

            // Verify Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _verifyOtp,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E8B57),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'ভেরিফাই করুন',
                        style: GoogleFonts.notoSansBengali(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 24),

            // Resend Code
            if (_canResend)
              Column(
                children: [
                  Text(
                    'কোড পাননি?',
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      if (_smsEnabled)
                        _buildOptionButton(
                          onPressed: () => _resendCode(method: 'sms'),
                          icon: isPhone ? Icons.sms : Icons.email,
                          label: isPhone ? 'SMS' : 'Email',
                          color: const Color(0xFF2E8B57),
                        ),
                      if (isPhone) ...[
                        if (_whatsappEnabled)
                          _buildOptionButton(
                            onPressed: () => _resendCode(method: 'whatsapp'),
                            icon: Icons.message,
                            label: 'WhatsApp',
                            color: const Color(0xFF25D366),
                          ),
                        if (_truecallerEnabled)
                          _buildOptionButton(
                            onPressed: _verifyWithTruecaller,
                            icon: Icons.call,
                            label: 'Truecaller',
                            color: Colors.blue,
                          ),
                      ],
                    ],
                  ),
                ],
              )
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'কোড পাননি? ',
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  Text(
                    '($_resendCountdown সেকেন্ড)',
                    style: GoogleFonts.notoSansBengali(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // Tips
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: Colors.amber[800],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'টিপস:',
                        style: GoogleFonts.notoSansBengali(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber[900],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (!isPhone) _buildTip('• স্প্যাম/জাঙ্ক ফোল্ডার চেক করুন'),
                  _buildTip('• কোড ১০ মিনিটের জন্য বৈধ'),
                  _buildTip('• ৬ সংখ্যার কোড ব্যবহার করুন'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: GoogleFonts.notoSansBengali(
          fontSize: 12,
          color: Colors.amber[900],
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildOptionButton({
    required VoidCallback onPressed,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        style: GoogleFonts.notoSansBengali(
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
