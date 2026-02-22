import 'package:flutter/material.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'login_page.dart';

class DeleteAccountPage extends StatefulWidget {
  const DeleteAccountPage({super.key});

  @override
  State<DeleteAccountPage> createState() => _DeleteAccountPageState();
}

class _DeleteAccountPageState extends State<DeleteAccountPage> {
  final _reasons = [
    'I found a better alternative',
    'Privacy concerns',
    'Too many notifications',
    'App is not useful',
    'Technical issues',
    'Poor customer support',
    'Temporary break',
    'Created account by mistake',
    'Security concerns',
    'Other',
  ];

  String? _selectedReason;
  final _otherReasonController = TextEditingController();
  bool _isLoading = false;
  late final AuthRepository _auth;

  @override
  void initState() {
    super.initState();
    _auth = AuthRepository(ApiClient(ApiConfig.baseUrl));
  }

  @override
  void dispose() {
    _otherReasonController.dispose();
    super.dispose();
  }

  Future<void> _deleteAccount() async {
    if (_selectedReason == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a reason')));
      return;
    }

    if (_selectedReason == 'Other' &&
        _otherReasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please specify the reason')),
      );
      return;
    }

    // Show confirmation dialog
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Are you sure?'),
        content: const Text(
          'This action is permanent and cannot be undone. Your account will be deleted immediately.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete Permanently'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);

    try {
      await _auth.deleteAccount(
        reason: _selectedReason!,
        customReason: _selectedReason == 'Other'
            ? _otherReasonController.text.trim()
            : null,
      );

      if (!mounted) return;

      // Navigate to Login Page and clear stack
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account deleted successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Delete Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'We are sorry to see you go.',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please let us know why you are deleting your account. This helps us improve our service.',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ..._reasons.map(
              (reason) => RadioListTile<String>(
                title: Text(reason),
                value: reason,
                groupValue: _selectedReason,
                onChanged: (value) => setState(() => _selectedReason = value),
              ),
            ),
            if (_selectedReason == 'Other')
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: TextField(
                  controller: _otherReasonController,
                  decoration: const InputDecoration(
                    hintText: 'Please tell us more...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _deleteAccount,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Delete My Account'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
