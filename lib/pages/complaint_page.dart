import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ComplaintPage extends StatefulWidget {
  const ComplaintPage({super.key});

  @override
  State<ComplaintPage> createState() => _ComplaintPageState();
}

class _ComplaintPageState extends State<ComplaintPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();

  String selectedCategory = 'পরিচ্ছন্নতা';
  String selectedPriority = 'মধ্যম';

  final List<String> categories = [
    'পরিচ্ছন্নতা',
    'বর্জ্য ব্যবস্থাপনা',
    'পানি সরবরাহ',
    'রাস্তাঘাট',
    'বিদ্যুৎ',
    'অন্যান্য',
  ];

  final List<String> priorities = ['উচ্চ', 'মধ্যম', 'নিম্ন'];

  final List<Complaint> complaints = [
    Complaint(
      id: '001',
      title: 'রাস্তার আবর্জনা পরিষ্কার করা হচ্ছে না',
      category: 'পরিচ্ছন্নতা',
      status: 'প্রক্রিয়াধীন',
      date: DateTime.now().subtract(const Duration(days: 2)),
      priority: 'উচ্চ',
    ),
    Complaint(
      id: '002',
      title: 'পানির পাইপ ভাঙা',
      category: 'পানি সরবরাহ',
      status: 'সমাধান হয়েছে',
      date: DateTime.now().subtract(const Duration(days: 5)),
      priority: 'মধ্যম',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat();

    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _tabController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
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
                    _buildNewComplaintTab(),
                    _buildMyComplaintsTab(),
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
              return Transform.rotate(
                angle: _backgroundController.value * 2 * 3.14159,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.report_problem,
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
              'অভিযোগ দাখিল',
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
          Tab(text: 'নতুন অভিযোগ'),
          Tab(text: 'আমার অভিযোগ'),
        ],
      ),
    );
  }

  Widget _buildNewComplaintTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionCard(
              title: 'অভিযোগের বিবরণ',
              icon: Icons.description,
              child: Column(
                children: [
                  _buildTextField(
                    controller: _titleController,
                    label: 'অভিযোগের শিরোনাম',
                    hint: 'সংক্ষেপে অভিযোগের বিষয় লিখুন',
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'শিরোনাম প্রয়োজন';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _descriptionController,
                    label: 'বিস্তারিত বিবরণ',
                    hint: 'অভিযোগের বিস্তারিত বিবরণ দিন',
                    maxLines: 4,
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'বিবরণ প্রয়োজন';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              title: 'ক্যাটেগরি ও অগ্রাধিকার',
              icon: Icons.category,
              child: Column(
                children: [
                  _buildDropdown(
                    label: 'ক্যাটেগরি',
                    value: selectedCategory,
                    items: categories,
                    onChanged: (value) {
                      setState(() {
                        selectedCategory = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'অগ্রাধিকার',
                    value: selectedPriority,
                    items: priorities,
                    onChanged: (value) {
                      setState(() {
                        selectedPriority = value!;
                      });
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              title: 'অবস্থান',
              icon: Icons.location_on,
              child: _buildTextField(
                controller: _locationController,
                label: 'ঠিকানা',
                hint: 'অভিযোগের স্থানের ঠিকানা দিন',
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'ঠিকানা প্রয়োজন';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 24),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildMyComplaintsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: complaints.length,
      itemBuilder: (context, index) {
        return _buildComplaintCard(complaints[index], index);
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
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

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
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
      items: items.map((item) {
        return DropdownMenuItem(
          value: item,
          child: Text(item),
        );
      }).toList(),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _submitComplaint,
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
          child: const Center(
            child: Text(
              'অভিযোগ দাখিল করুন',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildComplaintCard(Complaint complaint, int index) {
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
                  color: _getStatusColor(complaint.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  complaint.status,
                  style: TextStyle(
                    color: _getStatusColor(complaint.status),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'ID: ${complaint.id}',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            complaint.title,
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
                Icons.category,
                size: 16,
                color: Colors.grey.shade600,
              ),
              const SizedBox(width: 4),
              Text(
                complaint.category,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.priority_high,
                size: 16,
                color: _getPriorityColor(complaint.priority),
              ),
              const SizedBox(width: 4),
              Text(
                complaint.priority,
                style: TextStyle(
                  color: _getPriorityColor(complaint.priority),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
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
                _formatDate(complaint.date),
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
      case 'প্রক্রিয়াধীন':
        return Colors.orange;
      case 'সমাধান হয়েছে':
        return Colors.green;
      case 'বাতিল':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'উচ্চ':
        return Colors.red;
      case 'মধ্যম':
        return Colors.orange;
      case 'নিম্ন':
        return Colors.green;
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

  void _submitComplaint() {
    if (_formKey.currentState?.validate() ?? false) {
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('অভিযোগ সফলভাবে দাখিল হয়েছে'),
          backgroundColor: Color(0xFF2E8B57),
        ),
      );

      // Clear form
      _titleController.clear();
      _descriptionController.clear();
      _locationController.clear();
      setState(() {
        selectedCategory = 'পরিচ্ছন্নতা';
        selectedPriority = 'মধ্যম';
      });

      // Switch to complaints tab
      _tabController.animateTo(1);
    }
  }
}

class Complaint {
  final String id;
  final String title;
  final String category;
  final String status;
  final DateTime date;
  final String priority;

  Complaint({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.date,
    required this.priority,
  });
}