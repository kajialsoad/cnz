import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config/api_config.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../models/city_corporation_model.dart';
import '../models/zone_model.dart';
import '../models/ward_model.dart';

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
  final _codeControllers = List.generate(6, (_) => TextEditingController());
  final _codeFocusNodes = List.generate(6, (_) => FocusNode());
  bool _obscure = true;
  bool _agree = false;
  bool _nidAttached = false;
  String? _city;
  late final AuthRepository _auth;

  // City Corporation, Zone and Ward state
  List<CityCorporation> _CityCorporations = [];
  CityCorporation? _selectedCityCorporation;
  List<Zone> _zones = [];
  Zone? _selectedZone;
  List<Ward> _wards = [];
  Ward? _selectedWard;
  bool _isLoadingCityCorps = false;
  bool _isLoadingZones = false;
  bool _isLoadingWards = false;

  // Email verification state
  bool _showVerificationSection = false;
  bool _isVerifying = false;
  bool _isSendingCode = false;
  int _resendCountdown = 0;
  int _expirySeconds = 900; // 15 minutes
  Timer? _resendTimer;
  Timer? _expiryTimer;

  @override
  void initState() {
    super.initState();
    _auth = AuthRepository(ApiClient(ApiConfig.baseUrl));
    _loadCityCorporations();
  }

  Future<void> _loadCityCorporations() async {
    setState(() => _isLoadingCityCorps = true);

    try {
      final cityCorps = await _auth.getActiveCityCorporations();
      if (mounted) {
        setState(() {
          _CityCorporations = cityCorps;
          _isLoadingCityCorps = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingCityCorps = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'সিটি কর্পোরেশন লোড করতে ব্যর্থ: ${e.toString().replaceAll('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _onCityCorporationChanged(
    CityCorporation? CityCorporation,
  ) async {
    setState(() {
      _selectedCityCorporation = CityCorporation;
      _city = CityCorporation?.code;
      _selectedZone = null;
      _selectedWard = null;
      _zones = [];
      _wards = [];
    });

    if (CityCorporation != null && CityCorporation.code != null) {
      setState(() => _isLoadingWards = true);

      try {
        final wards = await _auth.getWardsByCityCorporation(
          CityCorporation.code!,
        );
        if (mounted) {
          setState(() {
            _wards = wards;
            _isLoadingWards = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isLoadingWards = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'ওয়ার্ড লোড করতে ব্যর্থ: ${e.toString().replaceAll('Exception: ', '')}',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _onWardChanged(Ward? ward) {
    setState(() {
      _selectedWard = ward;
      if (ward != null && ward.zone != null) {
        _selectedZone = ward.zone;
        // Make sure the auto-selected zone is available in the list for dropdown
        if (!_zones.any((z) => z.id == ward.zone!.id)) {
          _zones = [ward.zone!];
        }
      } else {
        _selectedZone = null;
      }
    });
  }

  // _onZoneChanged is no longer needed but keeping empty or removing references
  // Future<void> _onZoneChanged(Zone? zone) async {}

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _roadController.dispose();
    for (var controller in _codeControllers) {
      controller.dispose();
    }
    for (var node in _codeFocusNodes) {
      node.dispose();
    }
    _resendTimer?.cancel();
    _expiryTimer?.cancel();
    super.dispose();
  }

  bool _isLoading = false;

  void _startExpiryTimer() {
    _expiryTimer?.cancel();
    _expirySeconds = 900; // Reset to 15 minutes
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_expirySeconds > 0) {
        setState(() => _expirySeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  void _startResendCountdown() {
    _resendCountdown = 60;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown > 0) {
        setState(() => _resendCountdown--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _sendVerificationCode() async {
    setState(() => _isSendingCode = true);

    try {
      final email = _emailController.text.trim();
      await _auth.resendVerificationCode(email);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ভেরিফিকেশন কোড পাঠানো হয়েছে ✓'),
          backgroundColor: Colors.green,
        ),
      );

      _startResendCountdown();
      _startExpiryTimer();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'কোড পাঠাতে ব্যর্থ: ${e.toString().replaceAll('Exception: ', '')}',
          ),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSendingCode = false);
      }
    }
  }

  Future<void> _verifyCode() async {
    final code = _codeControllers.map((c) => c.text).join();

    if (code.length != 6) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('৬ ডিজিটের কোড দিন')));
      return;
    }

    setState(() => _isVerifying = true);

    try {
      final email = _emailController.text.trim();
      await _auth.verifyEmail(email, code);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ইমেইল ভেরিফাই সফল! এখন লগইন করুন ✓'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );

      Navigator.pushReplacementNamed(context, '/login');
    } catch (e) {
      if (!mounted) return;

      String errorMessage = 'ভেরিফিকেশন ব্যর্থ';
      final errorStr = e.toString();

      if (errorStr.contains('Invalid') || errorStr.contains('incorrect')) {
        errorMessage = 'ভুল কোড দিয়েছেন';
      } else if (errorStr.contains('expired')) {
        errorMessage = 'কোডের মেয়াদ শেষ, নতুন কোড পাঠান';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

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
      final response = await _auth.register(
        name: name,
        phone: phone,
        email: email.isEmpty ? null : email,
        password: password,
        ward: null, // No longer used - using wardId instead
        zone: _city,
        address: _roadController.text.trim().isEmpty
            ? null
            : _roadController.text.trim(),
        CityCorporationCode: _selectedCityCorporation?.code,
        zoneId: _selectedZone?.id,
        wardId: _selectedWard?.id,
      );

      if (!mounted) return;

      // Check if email verification is required from backend response
      final requiresVerification =
          response['data']?['requiresVerification'] ?? false;

      if (requiresVerification) {
        // Email verification is enabled - navigate to verification page
        Navigator.pushReplacementNamed(
          context,
          '/verify-otp',
          arguments: email,
        );
      } else {
        // Email verification is disabled - navigate to home page
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'রেজিস্ট্রেশন সফল! $name এর জন্য একাউন্ট তৈরি হয়েছে ✓',
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
        Navigator.pushReplacementNamed(context, '/home');
      }
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

      setState(() => _isLoading = false);
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

  void _showTermsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terms & Conditions / শর্তাবলী'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'English:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              SizedBox(height: 8),
              Text(
                '1. Account Registration:\n'
                '   - You must provide accurate and complete information (Name, Phone, Address).\n'
                '   - You are responsible for maintaining the confidentiality of your account credentials.\n\n'
                '2. User Conduct:\n'
                '   - Do not submit false, misleading, or fake complaints.\n'
                '   - Do not use abusive, threatening, or obscene language in complaints or chats.\n'
                '   - Do not upload inappropriate, offensive, or illegal images/audio.\n\n'
                '3. Legal Compliance:\n'
                '   - You strictly agree not to use this app for any activities that violate the existing laws of Bangladesh.\n'
                '   - Any attempt to disrupt public order or spread misinformation through this app is punishable by law.\n\n'
                '4. Liability:\n'
                '   - You are solely responsible for your actions and the content you submit.\n'
                '   - The app authorities (Clean Care) are not liable for any user-generated content or misuse of the platform.\n\n'
                '5. Termination:\n'
                '   - We reserve the right to suspend or ban your account immediately if you violate these terms.',
                style: TextStyle(fontSize: 13),
              ),
              SizedBox(height: 16),
              Divider(),
              SizedBox(height: 16),
              Text(
                'বাংলা:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              SizedBox(height: 8),
              Text(
                '১. অ্যাকাউন্ট নিবন্ধন:\n'
                '   - আপনাকে অবশ্যই সঠিক এবং পূর্ণাঙ্গ তথ্য (নাম, ফোন, ঠিকানা) প্রদান করতে হবে।\n'
                '   - আপনার অ্যাকাউন্টের তথ্যের গোপনীয়তা রক্ষার দায়িত্ব আপনার।\n\n'
                '২. ব্যবহারকারীর আচরণ:\n'
                '   - কোনো ভুল, মিথ্যা বা বিভ্রান্তিকর অভিযোগ দায়ের করা যাবে না।\n'
                '   - অভিযোগ বা চ্যাটে কোনো অশালীন, গালিগালাজ বা হুমকিধামকি ব্যবহার করা যাবে না।\n'
                '   - কোনো আপত্তিকর বা বেআইনি ছবি/অডিও আপলোড করা সম্পূর্ণ নিষিদ্ধ।\n\n'
                '৩. আইন মেনে চলা:\n'
                '   - এই অ্যাপ ব্যবহার করে বাংলাদেশের প্রচলিত আইনের পরিপন্থী কোনো কাজ করা যাবে না।\n'
                '   - অ্যাপের মাধ্যমে জনশৃঙ্খলা বিঘ্নিত করার চেষ্টা বা গুজব ছড়ানো আইনত দণ্ডনীয় অপরাধ।\n\n'
                '৪. দায়বদ্ধতা:\n'
                '   - অ্যাপে আপনার কার্যকলাপ এবং জমা দেওয়া তথ্যের জন্য আপনি এককভাবে দায়ী থাকবেন।\n'
                '   - অ্যাপ কর্তৃপক্ষ ব্যবহারকারীর কোনো ভুল কাজ বা অপব্যবহারের জন্য দায়ী থাকবে না।\n\n'
                '৫. বাতিলকরণ:\n'
                '   - শর্তাবলী লঙ্ঘন করলে কোনো পূর্ব নোটিশ ছাড়াই আপনার অ্যাকাউন্ট বাতিল বা স্থগিত করার অধিকার কর্তৃপক্ষ সংরক্ষণ করে।',
                style: TextStyle(fontSize: 13),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _agree = false);
            },
            child: const Text('Cancel / বাতিল'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _agree = true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E8B57),
              foregroundColor: Colors.white,
            ),
            child: const Text('Agree & Continue / সম্মত আছি'),
          ),
        ],
      ),
    );
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
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
    );
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF2E8B57),
        foregroundColor: Colors.white,
        title: const Text('Create Account'),
        leading: const BackButton(),
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Stack(
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
                child: ScrollConfiguration(
                  behavior: ScrollConfiguration.of(
                    context,
                  ).copyWith(scrollbars: false),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _nameController,
                          decoration: _dec(
                            'Full Name',
                            hint: 'Enter your full name',
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'নাম দিন';
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phoneController,
                          decoration: _dec(
                            'Phone Number',
                            hint: '+880 1XXX-XXXXX',
                          ),
                          keyboardType: TextInputType.phone,
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'ফোন নম্বর দিন';
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _emailController,
                          decoration: _dec(
                            'Email Address *',
                            hint: 'your.email@example.com',
                          ),
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'ইমেইল আবশ্যক';
                            final ok = RegExp(r'^.+@.+\..+').hasMatch(v);
                            return ok ? null : 'ভ্যালিড ইমেইল দিন';
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _passwordController,
                          decoration:
                              _dec(
                                'Password',
                                hint: 'Create a strong password',
                              ).copyWith(
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscure
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                  ),
                                  onPressed: () =>
                                      setState(() => _obscure = !_obscure),
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
                          child: Text(
                            'City Corporation',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                        _isLoadingCityCorps
                            ? const Center(child: CircularProgressIndicator())
                            : DropdownButtonFormField<CityCorporation>(
                                isExpanded: true,
                                value: _selectedCityCorporation,
                                decoration: _dec('Select City Corporation'),
                                items: _CityCorporations.map((cc) {
                                  return DropdownMenuItem<CityCorporation>(
                                    value: cc,
                                    child: Text(
                                      cc.name,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: _onCityCorporationChanged,
                                validator: (v) => v == null
                                    ? 'সিটি কর্পোরেশন নির্বাচন করুন'
                                    : null,
                              ),
                        const SizedBox(height: 12),
                        if (_selectedCityCorporation != null) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Text(
                              'Ward',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                          _isLoadingWards
                              ? const Center(child: CircularProgressIndicator())
                              : DropdownButtonFormField<Ward>(
                                  isExpanded: true,
                                  value: _selectedWard,
                                  decoration: _dec('Select Ward'),
                                  items: _wards.map((ward) {
                                    return DropdownMenuItem<Ward>(
                                      value: ward,
                                      child: Text(
                                        ward.displayName,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: _onWardChanged,
                                  validator: (v) => v == null
                                      ? 'ওয়ার্ড নির্বাচন করুন'
                                      : null,
                                ),
                          const SizedBox(height: 12),
                        ],
                        if (_selectedWard != null) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Text(
                              'Zone (Auto-selected)',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                          DropdownButtonFormField<Zone>(
                            isExpanded: true,
                            value: _selectedZone,
                            decoration: _dec(
                              'Zone',
                              hint: 'Zone will appear here',
                            ).copyWith(fillColor: Colors.grey[200]),
                            items: _selectedZone != null
                                ? [
                                    DropdownMenuItem<Zone>(
                                      value: _selectedZone,
                                      child: Text(
                                        _selectedZone!.displayName,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ]
                                : [],
                            onChanged: null, // Read-only
                          ),
                          const SizedBox(height: 12),
                        ],
                        if (_selectedCityCorporation != null &&
                            _wards.isEmpty &&
                            !_isLoadingWards) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No wards available for this city corporation yet.',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.grey[600],
                                    fontStyle: FontStyle.italic,
                                  ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text(
                            'Road Address',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                        TextFormField(
                          controller: _roadController,
                          decoration: _dec(
                            'Road Address',
                            hint: 'Road 7, Block B',
                          ),
                        ),
                        const SizedBox(height: 16),
                        /*
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'NID / ID Verification (Optional)',
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(height: 8),
                        _dashedUploadBox(),
                        const SizedBox(height: 16),
                        */
                        Row(
                          children: [
                            Checkbox(
                              value: _agree,
                              onChanged: (v) {
                                if (v == true) {
                                  _showTermsDialog();
                                } else {
                                  setState(() => _agree = false);
                                }
                              },
                            ),
                            Expanded(
                              child: Wrap(
                                children: [
                                  const Text('I agree to the '),
                                  GestureDetector(
                                    onTap: _showTermsDialog,
                                    child: const Text(
                                      'Terms & Conditions',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF2E8B57),
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                  const Text(' and '),
                                  const Text(
                                    'Privacy Policy',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
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
                              backgroundColor: const Color(0xFF2E8B57),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(28),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
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
                              onTap: () =>
                                  Navigator.pushNamed(context, '/login'),
                              child: const Text(
                                'Login',
                                style: TextStyle(
                                  color: Color(0xFF2E8B57),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),

                        // Email Verification Section
                        if (_showVerificationSection) ...[
                          const SizedBox(height: 32),
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E8B57).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFF2E8B57).withOpacity(0.3),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.email_outlined,
                                      color: const Color(0xFF2E8B57),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'ইমেইল ভেরিফিকেশন',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF2E8B57),
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'আপনার ইমেইল ${_emailController.text} এ ভেরিফিকেশন কোড পাঠানো হয়েছে',
                                  style: const TextStyle(fontSize: 14),
                                ),
                                const SizedBox(height: 16),

                                // Timer display
                                if (_expirySeconds > 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 8,
                                      horizontal: 12,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.orange.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.timer_outlined,
                                          size: 16,
                                          color: Colors.orange[700],
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'কোড মেয়াদ: ${(_expirySeconds ~/ 60).toString().padLeft(2, '0')}:${(_expirySeconds % 60).toString().padLeft(2, '0')}',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.orange[700],
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                else
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 8,
                                      horizontal: 12,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.red.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.error_outline,
                                          size: 16,
                                          color: Colors.red[700],
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'কোডের মেয়াদ শেষ',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.red[700],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                const SizedBox(height: 20),

                                // 6-digit code input
                                Text(
                                  'ভেরিফিকেশন কোড',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: List.generate(6, (index) {
                                    return SizedBox(
                                      width: 45,
                                      child: TextFormField(
                                        controller: _codeControllers[index],
                                        focusNode: _codeFocusNodes[index],
                                        textAlign: TextAlign.center,
                                        keyboardType: TextInputType.number,
                                        maxLength: 1,
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        decoration: InputDecoration(
                                          counterText: '',
                                          filled: true,
                                          fillColor: Colors.white,
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                vertical: 16,
                                              ),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: Colors.grey[300]!,
                                            ),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: Colors.grey[300]!,
                                            ),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: const BorderSide(
                                              color: Color(0xFF2E8B57),
                                              width: 2,
                                            ),
                                          ),
                                        ),
                                        inputFormatters: [
                                          FilteringTextInputFormatter
                                              .digitsOnly,
                                        ],
                                        onChanged: (value) {
                                          if (value.isNotEmpty && index < 5) {
                                            _codeFocusNodes[index + 1]
                                                .requestFocus();
                                          }
                                        },
                                        onTap: () {
                                          _codeControllers[index].selection =
                                              TextSelection(
                                                baseOffset: 0,
                                                extentOffset:
                                                    _codeControllers[index]
                                                        .text
                                                        .length,
                                              );
                                        },
                                      ),
                                    );
                                  }),
                                ),

                                const SizedBox(height: 20),

                                // Verify button
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: _isVerifying
                                        ? null
                                        : _verifyCode,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF2E8B57),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                    ),
                                    child: _isVerifying
                                        ? const SizedBox(
                                            height: 20,
                                            width: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                    Colors.white,
                                                  ),
                                            ),
                                          )
                                        : const Text(
                                            'ভেরিফাই করুন',
                                            style: TextStyle(fontSize: 16),
                                          ),
                                  ),
                                ),

                                const SizedBox(height: 12),

                                // Resend code button
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    onPressed:
                                        (_isSendingCode || _resendCountdown > 0)
                                        ? null
                                        : _sendVerificationCode,
                                    icon: _isSendingCode
                                        ? const SizedBox(
                                            height: 16,
                                            width: 16,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Icon(Icons.refresh),
                                    label: Text(
                                      _resendCountdown > 0
                                          ? 'পুনরায় পাঠান (${_resendCountdown}s)'
                                          : 'নতুন কোড পাঠান',
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                      side: BorderSide(
                                        color:
                                            (_isSendingCode ||
                                                _resendCountdown > 0)
                                            ? Colors.grey[300]!
                                            : const Color(0xFF2E8B57),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
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
