import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/api_config.dart';
import '../services/api_client.dart';

class EmailVerificationPage extends StatefulWidget {
  final String? token;

  const EmailVerificationPage({super.key, this.token});

  @override
  State<EmailVerificationPage> createState() => _EmailVerificationPageState();
}

class _EmailVerificationPageState extends State<EmailVerificationPage> {
  bool _isLoading = true;
  bool _isSuccess = false;
  String _message = '';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _verifyEmail();
  }

  Future<void> _verifyEmail() async {
    if (widget.token == null || widget.token!.isEmpty) {
      setState(() {
        _isLoading = false;
        _isSuccess = false;
        _errorMessage = 'ভেরিফিকেশন টোকেন পাওয়া যায়নি';
      });
      return;
    }

    try {
      final apiClient = ApiClient(ApiConfig.baseUrl);
      final response = await apiClient.get(
        '/api/auth/verify-email?token=${widget.token}',
      );

      if (response['success'] == true) {
        setState(() {
          _isLoading = false;
          _isSuccess = true;
          _message = response['message'] ?? 'ইমেইল ভেরিফাই সফল হয়েছে!';
        });
      } else {
        throw Exception(response['message'] ?? 'Verification failed');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _isSuccess = false;
        _errorMessage = _getErrorMessage(e.toString());
      });
    }
  }

  String _getErrorMessage(String error) {
    if (error.contains('expired')) {
      return 'ভেরিফিকেশন লিঙ্ক মেয়াদ উত্তীর্ণ হয়েছে। নতুন লিঙ্ক পাঠান।';
    } else if (error.contains('Invalid')) {
      return 'ভেরিফিকেশন লিঙ্ক সঠিক নয়';
    } else if (error.contains('already verified')) {
      return 'এই ইমেইল ইতিমধ্যে ভেরিফাই করা হয়েছে';
    } else if (error.contains('Network')) {
      return 'ইন্টারনেট সংযোগ চেক করুন';
    }
    return 'ইমেইল ভেরিফিকেশন ব্যর্থ হয়েছে';
  }

  void _goToLogin() {
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _goToResendVerification() {
    Navigator.pushReplacementNamed(context, '/resend-verification');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          'ইমেইল ভেরিফিকেশন',
          style: GoogleFonts.notoSansBengali(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF2E8B57),
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Loading State
              if (_isLoading) ...[
                Container(
                  width: 120,
                  height: 120,
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
                  child: const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
                      strokeWidth: 3,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'ইমেইল ভেরিফাই হচ্ছে...',
                  style: GoogleFonts.notoSansBengali(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF333333),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'অনুগ্রহ করে অপেক্ষা করুন',
                  style: GoogleFonts.notoSansBengali(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],

              // Success State
              if (!_isLoading && _isSuccess) ...[
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2E8B57),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2E8B57).withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_circle_outline,
                    size: 70,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  '✅ সফল!',
                  style: GoogleFonts.notoSansBengali(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF2E8B57),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        _message,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.notoSansBengali(
                          fontSize: 16,
                          color: const Color(0xFF333333),
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'আপনার অ্যাকাউন্ট এখন সক্রিয়',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.notoSansBengali(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _goToLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E8B57),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.login, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'লগইন করুন',
                          style: GoogleFonts.notoSansBengali(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              // Error State
              if (!_isLoading && !_isSuccess) ...[
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.red[300]!, width: 3),
                  ),
                  child: Icon(
                    Icons.error_outline,
                    size: 70,
                    color: Colors.red[700],
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  '❌ ব্যর্থ',
                  style: GoogleFonts.notoSansBengali(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.red[700],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red[200]!),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Colors.red[700],
                        size: 24,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _errorMessage ?? 'কিছু সমস্যা হয়েছে',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.notoSansBengali(
                          fontSize: 16,
                          color: Colors.red[900],
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _goToResendVerification,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E8B57),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.email_outlined, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'নতুন ভেরিফিকেশন লিঙ্ক পাঠান',
                          style: GoogleFonts.notoSansBengali(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    onPressed: _goToLogin,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF2E8B57), width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'লগইন পেজে ফিরে যান',
                      style: GoogleFonts.notoSansBengali(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2E8B57),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
