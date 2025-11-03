import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class PaymentPage extends StatefulWidget {
  const PaymentPage({super.key});

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();

  String selectedService = 'পরিচ্ছন্নতা সেবা';
  String selectedPaymentMethod = 'বিকাশ';

  final List<String> services = [
    'পরিচ্ছন্নতা সেবা',
    'বর্জ্য ব্যবস্থাপনা',
    'পানি বিল',
    'বিদ্যুৎ বিল',
    'গ্যাস বিল',
    'অন্যান্য',
  ];

  final List<PaymentMethod> paymentMethods = [
    PaymentMethod('বিকাশ', 'assets/bkash.png', const Color(0xFFE2136E)),
    PaymentMethod('নগদ', 'assets/nagad.png', const Color(0xFFEC1C24)),
    PaymentMethod('রকেট', 'assets/rocket.png', const Color(0xFF8B4A9C)),
    PaymentMethod('উপায়', 'assets/upay.png', const Color(0xFF1976D2)),
  ];

  final List<PaymentHistory> paymentHistory = [
    PaymentHistory(
      id: 'TXN001',
      service: 'পরিচ্ছন্নতা সেবা',
      amount: 500,
      method: 'বিকাশ',
      date: DateTime.now().subtract(const Duration(days: 1)),
      status: 'সফল',
    ),
    PaymentHistory(
      id: 'TXN002',
      service: 'পানি বিল',
      amount: 800,
      method: 'নগদ',
      date: DateTime.now().subtract(const Duration(days: 3)),
      status: 'সফল',
    ),
    PaymentHistory(
      id: 'TXN003',
      service: 'বিদ্যুৎ বিল',
      amount: 1200,
      method: 'রকেট',
      date: DateTime.now().subtract(const Duration(days: 7)),
      status: 'ব্যর্থ',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _tabController.dispose();
    _amountController.dispose();
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
            colors: [
              Color(0xFFE9F6EE),
              Color(0xFFF7FCF9),
              Color(0xFFF3FAF5),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildAppBar(),
              _buildTabBar(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPaymentTab(),
                    _buildHistoryTab(),
                  ],
                ),
              ),
            ],
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
              child: const Icon(
                Icons.arrow_back,
                color: Color(0xFF2E8B57),
              ),
            ),
          ),
          const SizedBox(width: 16),
          AnimatedBuilder(
            animation: _backgroundController,
            builder: (context, child) {
              return Transform.scale(
                scale: 1.0 + (0.1 * (1 - (_backgroundController.value - 0.5).abs() * 2)),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.payment,
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
              'পেমেন্ট',
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

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF2E8B57),
        tabs: const [
          Tab(text: 'পেমেন্ট করুন'),
          Tab(text: 'ইতিহাস'),
        ],
      ),
    );
  }

  Widget _buildPaymentTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionCard(
              title: 'সেবা নির্বাচন',
              icon: Icons.miscellaneous_services,
              child: _buildServiceDropdown(),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              title: 'পেমেন্ট পদ্ধতি',
              icon: Icons.payment,
              child: _buildPaymentMethods(),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              title: 'পেমেন্ট তথ্য',
              icon: Icons.info,
              child: Column(
                children: [
                  _buildTextField(
                    controller: _amountController,
                    label: 'পরিমাণ (টাকা)',
                    hint: 'পেমেন্টের পরিমাণ লিখুন',
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
                ],
              ),
            ),
            const SizedBox(height: 24),
            _buildPayButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: paymentHistory.length,
      itemBuilder: (context, index) {
        return _buildHistoryCard(paymentHistory[index], index);
      },
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2E8B57),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(
          begin: 0.3,
          duration: 300.ms,
          curve: Curves.easeOut,
        );
  }

  Widget _buildServiceDropdown() {
    return DropdownButtonFormField<String>(
      value: selectedService,
      onChanged: (value) {
        setState(() {
          selectedService = value!;
        });
      },
      decoration: InputDecoration(
        labelText: 'সেবা নির্বাচন করুন',
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
      items: services.map((service) {
        return DropdownMenuItem(
          value: service,
          child: Text(service),
        );
      }).toList(),
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
              color: isSelected ? method.color.withOpacity(0.1) : Colors.grey.shade50,
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
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? method.color : Colors.black87,
                    ),
                  ),
                ),
                if (isSelected)
                  Icon(
                    Icons.check_circle,
                    color: method.color,
                    size: 20,
                  ),
              ],
            ),
          ),
        ).animate(delay: (index * 100).ms).fadeIn(duration: 300.ms).scale(
              begin: const Offset(0.8, 0.8),
              duration: 200.ms,
            );
      },
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

  Widget _buildPayButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _processPayment,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ).copyWith(
          backgroundColor: MaterialStateProperty.resolveWith((states) {
            return null;
          }),
        ),
        child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.payment,
                color: Colors.white,
              ),
              const SizedBox(width: 8),
              Text(
                'পেমেন্ট করুন ($selectedPaymentMethod)',
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

  Widget _buildHistoryCard(PaymentHistory payment, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(payment.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  payment.status,
                  style: TextStyle(
                    color: _getStatusColor(payment.status),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                payment.id,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            payment.service,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2E8B57),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                Icons.account_balance_wallet,
                size: 16,
                color: Colors.grey.shade600,
              ),
              const SizedBox(width: 4),
              Text(
                '৳${payment.amount}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2E8B57),
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.payment,
                size: 16,
                color: Colors.grey.shade600,
              ),
              const SizedBox(width: 4),
              Text(
                payment.method,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                Icons.access_time,
                size: 16,
                color: Colors.grey.shade600,
              ),
              const SizedBox(width: 4),
              Text(
                _formatDate(payment.date),
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: (index * 100).ms).fadeIn(duration: 400.ms).slideY(
          begin: 0.3,
          duration: 300.ms,
          curve: Curves.easeOut,
        );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'সফল':
        return Colors.green;
      case 'ব্যর্থ':
        return Colors.red;
      case 'প্রক্রিয়াধীন':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date).inDays;
    
    if (difference == 0) {
      return 'আজ';
    } else if (difference == 1) {
      return 'গতকাল';
    } else {
      return '${difference} দিন আগে';
    }
  }

  void _processPayment() {
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
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E8B57)),
              ),
              const SizedBox(height: 16),
              Text('পেমেন্ট প্রক্রিয়া করা হচ্ছে...'),
            ],
          ),
        ),
      );

      // Simulate payment processing
      Future.delayed(const Duration(seconds: 3), () {
        Navigator.pop(context); // Close processing dialog
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('পেমেন্ট সফল হয়েছে'),
            backgroundColor: Color(0xFF2E8B57),
          ),
        );

        // Clear form
        _amountController.clear();
        _phoneController.clear();

        // Switch to history tab
        _tabController.animateTo(1);
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

class PaymentHistory {
  final String id;
  final String service;
  final double amount;
  final String method;
  final DateTime date;
  final String status;

  PaymentHistory({
    required this.id,
    required this.service,
    required this.amount,
    required this.method,
    required this.date,
    required this.status,
  });
}