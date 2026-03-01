import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DonationPage extends StatefulWidget {
  const DonationPage({super.key});

  @override
  State<DonationPage> createState() => _DonationPageState();
}

class _DonationPageState extends State<DonationPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _progressController;

  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  String selectedCause = 'পরিচ্ছন্নতা প্রকল্প';
  String selectedPaymentMethod = 'বিকাশ';

  final List<String> causes = [
    'পরিচ্ছন্নতা প্রকল্প',
    'বৃক্ষরোপণ কর্মসূচি',
    'পানি সংরক্ষণ',
    'বর্জ্য ব্যবস্থাপনা',
    'পরিবেশ সংরক্ষণ',
    'শিক্ষা কার্যক্রম',
  ];

  final List<PaymentMethod> paymentMethods = [
    PaymentMethod('বিকাশ', 'assets/bkash.png', const Color(0xFFE2136E)),
    PaymentMethod('নগদ', 'assets/nagad.png', const Color(0xFFEC1C24)),
    PaymentMethod('রকেট', 'assets/rocket.png', const Color(0xFF8B4A9C)),
    PaymentMethod('উপায়', 'assets/upay.png', const Color(0xFF1976D2)),
  ];

  final List<int> quickAmounts = [100, 500, 1000, 2000, 5000];

  final List<DonationCampaign> campaigns = [
    DonationCampaign(
      title: 'ঢাকা শহর পরিচ্ছন্নতা প্রকল্প',
      description:
          'ঢাকা শহরের রাস্তাঘাট ও পার্ক পরিষ্কার রাখার জন্য বিশেষ প্রকল্প',
      targetAmount: 500000,
      raisedAmount: 325000,
      daysLeft: 15,
      image:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20city%20street%20dhaka%20bangladesh%20cleaning%20project&image_size=landscape_4_3',
    ),
    DonationCampaign(
      title: 'বৃক্ষরোপণ কর্মসূচি ২০২৪',
      description: 'শহরে আরও সবুজায়নের জন্য বৃক্ষরোপণ ও পরিচর্যা কার্যক্রম',
      targetAmount: 200000,
      raisedAmount: 150000,
      daysLeft: 30,
      image:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tree%20plantation%20program%20bangladesh%20green%20environment&image_size=landscape_4_3',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _progressController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _progressController.forward();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _progressController.dispose();
    _amountController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE9F6EE), Color(0xFFF7FCF9), Color(0xFFF3FAF5)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              children: [
                _buildAppBar(),
                _buildHeroSection(),
                _buildCampaignsSection(),
                _buildDonationForm(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF2E8B57).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back, color: Color(0xFF2E8B57)),
            ),
          ),
          const SizedBox(width: 16),
          AnimatedBuilder(
            animation: _backgroundController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _backgroundController.value * 2 * 3.14159,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF6D66B), Color(0xFFFFD700)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.volunteer_activism,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              );
            },
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'দান করুন',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2E8B57),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2E8B57).withOpacity(0.3),
                offset: const Offset(0, 8),
                blurRadius: 20,
              ),
            ],
          ),
          child: Column(
            children: [
              const Icon(Icons.favorite, color: Colors.white, size: 40),
              const SizedBox(height: 12),
              const Text(
                'একসাথে গড়ি সুন্দর বাংলাদেশ',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'আপনার ছোট দানও পারে বড় পরিবর্তন আনতে। পরিচ্ছন্ন ও সুন্দর পরিবেশের জন্য আমাদের সাথে যুক্ত হন।',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatCard('মোট দাতা', '১,২৫০+'),
                  _buildStatCard('সংগৃহীত', '৫০ লক্ষ টাকা'),
                  _buildStatCard('প্রকল্প', '২৫টি'),
                ],
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: -0.3, duration: 400.ms, curve: Curves.easeOut);
  }

  Widget _buildStatCard(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _buildCampaignsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'চলমান প্রকল্পসমূহ',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2E8B57),
            ),
          ),
        ),
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: campaigns.length,
            itemBuilder: (context, index) {
              return _buildCampaignCard(campaigns[index], index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCampaignCard(DonationCampaign campaign, int index) {
    final progress = campaign.raisedAmount / campaign.targetAmount;

    return Container(
          width: 280,
          margin: const EdgeInsets.only(right: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                offset: const Offset(0, 4),
                blurRadius: 12,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: Image.network(
                  campaign.image,
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 120,
                      color: Colors.grey.shade200,
                      child: const Icon(
                        Icons.image,
                        color: Colors.grey,
                        size: 40,
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      campaign.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E8B57),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      campaign.description,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) {
                        return Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '৳${_formatAmount(campaign.raisedAmount)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF2E8B57),
                                  ),
                                ),
                                Text(
                                  '৳${_formatAmount(campaign.targetAmount)}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            LinearProgressIndicator(
                              value: progress * _progressController.value,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Color(0xFF2E8B57),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${(progress * 100).toInt()}% সম্পন্ন',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                Text(
                                  '${campaign.daysLeft} দিন বাকি',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        )
        .animate(delay: (index * 200).ms)
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.3, duration: 300.ms, curve: Curves.easeOut);
  }

  Widget _buildDonationForm() {
    return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                offset: const Offset(0, 8),
                blurRadius: 20,
              ),
            ],
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF6D66B), Color(0xFFFFD700)],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.volunteer_activism,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'দান করুন',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E8B57),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _buildCauseDropdown(),
                const SizedBox(height: 16),
                _buildQuickAmounts(),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _amountController,
                  label: 'দানের পরিমাণ (টাকা)',
                  hint: 'আপনার পছন্দের পরিমাণ লিখুন',
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'পরিমাণ প্রয়োজন';
                    }
                    if (double.tryParse(value!) == null) {
                      return 'সঠিক পরিমাণ লিখুন';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _nameController,
                  label: 'আপনার নাম (ঐচ্ছিক)',
                  hint: 'দাতার নাম',
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _phoneController,
                  label: 'মোবাইল নম্বর',
                  hint: '01XXXXXXXXX',
                  keyboardType: TextInputType.phone,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'মোবাইল নম্বর প্রয়োজন';
                    }
                    if (value!.length != 11) {
                      return 'সঠিক মোবাইল নম্বর লিখুন';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                const Text(
                  'পেমেন্ট পদ্ধতি',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2E8B57),
                  ),
                ),
                const SizedBox(height: 12),
                _buildPaymentMethods(),
                const SizedBox(height: 24),
                _buildDonateButton(),
              ],
            ),
          ),
        )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: 0.3, duration: 400.ms, curve: Curves.easeOut);
  }

  Widget _buildCauseDropdown() {
    return DropdownButtonFormField<String>(
      value: selectedCause,
      onChanged: (value) {
        setState(() {
          selectedCause = value!;
        });
      },
      decoration: InputDecoration(
        labelText: 'দানের উদ্দেশ্য',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2E8B57), width: 2),
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
      items: causes.map((cause) {
        return DropdownMenuItem(value: cause, child: Text(cause));
      }).toList(),
    );
  }

  Widget _buildQuickAmounts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'দ্রুত নির্বাচন',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E8B57),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: quickAmounts.map((amount) {
            return GestureDetector(
              onTap: () {
                _amountController.text = amount.toString();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF2E8B57)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '৳$amount',
                  style: const TextStyle(
                    color: Color(0xFF2E8B57),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ).animate().scale(begin: const Offset(0.8, 0.8), duration: 200.ms);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2E8B57), width: 2),
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
    );
  }

  Widget _buildPaymentMethods() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.5,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: paymentMethods.length,
      itemBuilder: (context, index) {
        final method = paymentMethods[index];
        final isSelected = selectedPaymentMethod == method.name;

        return GestureDetector(
              onTap: () {
                setState(() {
                  selectedPaymentMethod = method.name;
                });
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected
                      ? method.color.withOpacity(0.1)
                      : Colors.grey.shade50,
                  border: Border.all(
                    color: isSelected ? method.color : Colors.grey.shade300,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: method.color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.account_balance_wallet,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        method.name,
                        style: TextStyle(
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                          color: isSelected ? method.color : Colors.black87,
                        ),
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle, color: method.color, size: 20),
                  ],
                ),
              ),
            )
            .animate(delay: (index * 100).ms)
            .fadeIn(duration: 300.ms)
            .scale(begin: const Offset(0.8, 0.8), duration: 200.ms);
      },
    );
  }

  Widget _buildDonateButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          // Show coming soon dialog
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('শীঘ্রই আসছে'),
              content: const Text(
                'এই ফিচারটি শীঘ্রই চালু হবে। আমাদের সাথে থাকার জন্য ধন্যবাদ।',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('ঠিক আছে'),
                ),
              ],
            ),
          );
        },
        style:
            ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ).copyWith(
              backgroundColor: WidgetStateProperty.resolveWith((states) {
                return null;
              }),
            ),
        child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFF6D66B), Color(0xFFFFD700)],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.favorite, color: Colors.white),
              const SizedBox(width: 8),
              Text(
                'দান করুন ($selectedPaymentMethod)',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatAmount(double amount) {
    if (amount >= 100000) {
      return '${(amount / 100000).toStringAsFixed(1)} লক্ষ';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)} হাজার';
    } else {
      return amount.toInt().toString();
    }
  }

  void _processDonation() {
    if (_formKey.currentState?.validate() ?? false) {
      // Show processing dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF6D66B)),
              ),
              const SizedBox(height: 16),
              const Text('দান প্রক্রিয়া করা হচ্ছে...'),
            ],
          ),
        ),
      );

      // Simulate donation processing
      Future.delayed(const Duration(seconds: 3), () {
        Navigator.pop(context); // Close processing dialog

        // Show success dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF6D66B), Color(0xFFFFD700)],
                    ),
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: const Icon(
                    Icons.favorite,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'ধন্যবাদ!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2E8B57),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'আপনার দান সফলভাবে সম্পন্ন হয়েছে। আপনার অবদান আমাদের সমাজের উন্নতিতে সাহায্য করবে।',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // Clear form
                    _amountController.clear();
                    _nameController.clear();
                    _phoneController.clear();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E8B57),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'ঠিক আছে',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        );
      });
    }
  }
}

class PaymentMethod {
  final String name;
  final String iconPath;
  final Color color;

  PaymentMethod(this.name, this.iconPath, this.color);
}

class DonationCampaign {
  final String title;
  final String description;
  final double targetAmount;
  final double raisedAmount;
  final int daysLeft;
  final String image;

  DonationCampaign({
    required this.title,
    required this.description,
    required this.targetAmount,
    required this.raisedAmount,
    required this.daysLeft,
    required this.image,
  });
}
