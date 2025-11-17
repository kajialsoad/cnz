import 'package:flutter/material.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'dart:math' as math;

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _roadController = TextEditingController();
  bool _obscure = true;
  bool _agree = false;
  bool _nidAttached = false;
  String? _city;
  int? _ward;
  late final AuthRepository _auth;

  @override
  void initState() {
    super.initState();
    _auth = AuthRepository(ApiClient(ApiConfig.baseUrl));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _roadController.dispose();
    super.dispose();
  }

  bool _isLoading = false;

  Future<void> _submit() async {
    final valid = _formKey.currentState?.validate() ?? false;
    if (!valid) return;

    if (!_agree) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('টার্মস ও প্রাইভেসি মেনে নিতে হবে')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    try {
      await _auth.register(
        name: name,
        phone: phone,
        email: email.isEmpty ? null : email,
        password: password,
        ward: _ward?.toString(),
        zone: _city,
        address: _roadController.text.trim().isEmpty ? null : _roadController.text.trim(),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'রেজিস্ট্রেশন সফল! $name এর জন্য একাউন্ট তৈরি হয়েছে ✓\nইমেইল ভেরিফাই করুন',
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 4),
        ),
      );

      Navigator.pushReplacementNamed(context, '/login');
    } catch (e) {
      if (!mounted) return;

      String errorMessage = 'রেজিস্ট্রেশন ব্যর্থ';
      final errorStr = e.toString();

      if (errorStr.contains('already exists')) {
        errorMessage = 'এই ফোন নম্বর বা ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে';
      } else if (errorStr.contains('Network error')) {
        errorMessage = 'ইন্টারনেট সংযোগ চেক করুন';
      } else if (errorStr.contains('timeout')) {
        errorMessage = 'সার্ভার সাড়া দিচ্ছে না, আবার চেষ্টা করুন';
      } else if (errorStr.contains('Validation')) {
        errorMessage = 'সব তথ্য সঠিকভাবে পূরণ করুন';
      } else {
        errorMessage =
            'রেজিস্ট্রেশন ব্যর্থ: ${errorStr.replaceAll('Exception: ', '')}';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
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

  void _pickFromCamera() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('ওয়েবে ক্যামেরা ডেমো সক্রিয় নয়')),
    );
  }

  void _pickFromGallery() {
    setState(() => _nidAttached = true);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('ডেমো: NID সংযুক্ত হয়েছে')));
  }

  Widget _dashedUploadBox() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(16),
      ),
      child: CustomPaint(
        painter: _DashedRectPainter(
          color: Colors.black.withOpacity(0.25),
          strokeWidth: 1.6,
          gap: 6,
          dashWidth: 6,
          radius: 16,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.upload_outlined,
                size: 40,
                color: Colors.black.withOpacity(0.45),
              ),
              const SizedBox(height: 12),
              const Text(
                'Upload your NID or ID card',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: _pickFromCamera,
                    icon: const Icon(Icons.photo_camera_outlined),
                    label: const Text('Camera'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: _pickFromGallery,
                    icon: const Icon(Icons.file_upload_outlined),
                    label: const Text('Gallery'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fillColor = const Color(0xFFF3F3F5);
    InputDecoration _dec(String label, {String? hint}) => InputDecoration(
          labelText: label,
          hintText: hint,
          filled: true,
          fillColor: fillColor,
          contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 15),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        );
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF2E8B57),
        foregroundColor: Colors.white,
        title: const Text('Create Account'),
        leading: const BackButton(),
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: Container(color: const Color(0xFFF2F4F5)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: _dec('Full Name', hint: 'Enter your full name'),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'নাম দিন';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      decoration: _dec('Phone Number', hint: '+880 1XXX-XXXXX'),
                      keyboardType: TextInputType.phone,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'ফোন নম্বর দিন';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      decoration: _dec('Email Address', hint: 'your.email@example.com'),
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'ইমেইল দিন';
                        final ok = RegExp(r'^.+@.+\..+').hasMatch(v);
                        return ok ? null : 'ভ্যালিড ইমেইল দিন';
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      decoration: _dec('Password', hint: 'Create a strong password').copyWith(
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      obscureText: _obscure,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'পাসওয়ার্ড দিন';
                        if (v.length < 6) return 'কমপক্ষে ৬ অক্ষর দিন';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text('City Corporation Selection', style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Dhaka South City'),
                            selected: _city == 'DSCC',
                            onSelected: (s) => setState(() => _city = s ? 'DSCC' : null),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Dhaka North City'),
                            selected: _city == 'DNCC',
                            onSelected: (s) => setState(() => _city = s ? 'DNCC' : null),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text('Ward Number (1 to 72)', style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    DropdownButtonFormField<int>(
                      value: _ward,
                      decoration: _dec('Select Ward'),
                      items: List.generate(72, (i) => i + 1)
                          .map((w) => DropdownMenuItem<int>(value: w, child: Text('$w')))
                          .toList(),
                      onChanged: (v) => setState(() => _ward = v),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text('Road Address', style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    TextFormField(
                      controller: _roadController,
                      decoration: _dec('Road Address', hint: 'Road 7, Block B'),
                    ),
                    const SizedBox(height: 16),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'NID / ID Verification (Optional)',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 8),
                    _dashedUploadBox(),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Checkbox(value: _agree, onChanged: (v) => setState(() => _agree = v ?? false)),
                        Expanded(
                          child: Wrap(
                            children: const [
                              Text('I agree to the '),
                              Text('Terms & Conditions', style: TextStyle(fontWeight: FontWeight.w600)),
                              Text(' and '),
                              Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7CC289),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
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
                            : const Text('Create Account'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Already have an account? '),
                        GestureDetector(
                          onTap: () => Navigator.pushNamed(context, '/login'),
                          child: const Text('Login',
                              style: TextStyle(color: Color(0xFF2E8B57), fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedRectPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;
  final double dashWidth;
  final double radius;

  _DashedRectPainter({
    required this.color,
    required this.strokeWidth,
    required this.gap,
    required this.dashWidth,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = math.min(dashWidth, metric.length - distance);
        final extract = metric.extractPath(distance, distance + next);
        canvas.drawPath(extract, paint);
        distance += next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
