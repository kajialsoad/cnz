import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/custom_bottom_nav.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import '../pages/edit_profile_page.dart';
import '../providers/language_provider.dart';
import '../repositories/auth_repository.dart';
import '../repositories/user_repository.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../widgets/translated_text.dart';

class ProfileSettingsPage extends StatefulWidget {
  const ProfileSettingsPage({super.key});

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  int _currentIndex = 0;
  bool pushNotifications = true;
  bool emailNotifications = false;
  String selectedLanguage = 'EN';

  UserModel? _user;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
    _loadLanguagePreference();
  }

  Future<void> _loadLanguagePreference() async {
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );
    setState(() {
      selectedLanguage = languageProvider.isBangla ? 'বাং' : 'EN';
    });
  }

  Future<void> _loadUserProfile() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final userRepo = UserRepository(ApiClient(ApiConfig.baseUrl));
      final user = await userRepo.getProfile();

      setState(() {
        _user = user;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      extendBody: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF4CAF50),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: TranslatedText(
          'Profile',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadUserProfile,
                    child: TranslatedText('Retry'),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.only(
                left: 16.0,
                right: 16.0,
                top: 16.0,
                bottom: 100,
              ),
              child: Column(
                children: [
                  // Profile Section
                  _buildProfileSection(),
                  const SizedBox(height: 20),

                  // Account Information Section
                  _buildAccountInformationSection(),
                  const SizedBox(height: 20),

                  // Settings Section
                  _buildSettingsSection(),
                  const SizedBox(height: 30),

                  // Logout Button
                  _buildLogoutButton(),
                  const SizedBox(height: 20),

                  // Footer
                  _buildFooter(),
                ],
              ),
            ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _handleNavigation(index);
        },
      ),
    );
  }

  Widget _buildProfileSection() {
    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50),
              shape: BoxShape.circle,
              image: _user?.avatar != null && _user!.avatar!.isNotEmpty
                  ? DecorationImage(
                      image: NetworkImage(_user!.avatar!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: _user?.avatar == null || _user!.avatar!.isEmpty
                ? Center(
                    child: Text(
                      _user?.initials ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 16),

          // Name
          Text(
            _user?.fullName ?? 'User',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2E2E2E),
            ),
          ),
          const SizedBox(height: 8),

          // Phone Number
          Text(
            _user?.formattedPhone ?? '',
            style: const TextStyle(fontSize: 16, color: Color(0xFF666666)),
          ),
          const SizedBox(height: 20),

          // Edit Profile Button
          OutlinedButton.icon(
            onPressed: () async {
              if (_user == null) return;
              
              // Navigate to edit profile page
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => EditProfilePage(user: _user!),
                ),
              );
              
              // Reload profile if changes were saved
              if (result == true) {
                _loadUserProfile();
              }
            },
            icon: const Icon(Icons.edit, size: 18, color: Color(0xFF4CAF50)),
            label: TranslatedText(
              'Edit Profile',
              style: const TextStyle(
                color: Color(0xFF4CAF50),
                fontWeight: FontWeight.w500,
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF4CAF50)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountInformationSection() {
    return Container(
      padding: const EdgeInsets.all(20.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            'Account Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF4CAF50),
            ),
          ),
          const SizedBox(height: 20),

          // Email
          _buildInfoItem(
            icon: Icons.email_outlined,
            label: 'Email',
            value: _user?.email ?? 'Not provided',
            translateValue: _user?.email == null,
          ),
          const SizedBox(height: 20),

          // Phone
          _buildInfoItem(
            icon: Icons.phone_outlined,
            label: 'Phone',
            value: _user?.formattedPhone ?? '',
            translateValue: false,
          ),
          const SizedBox(height: 20),

          // Role
          _buildInfoItem(
            icon: Icons.person_outline,
            label: 'Role',
            value: _getRoleDisplayName(_user?.role ?? ''),
            translateValue: true,
          ),
          const SizedBox(height: 20),

          // Account Status
          _buildInfoItem(
            icon: Icons.verified_user_outlined,
            label: 'Account Status',
            value: _user?.status ?? '',
            translateValue: true,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
    bool translateValue = true,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF4CAF50), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TranslatedText(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF666666),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              translateValue
                  ? TranslatedText(
                      value,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF2E2E2E),
                        fontWeight: FontWeight.w500,
                      ),
                    )
                  : Text(
                      value,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF2E2E2E),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsSection() {
    return Container(
      padding: const EdgeInsets.all(20.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            'Settings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF4CAF50),
            ),
          ),
          const SizedBox(height: 20),

          // My Complaints
          _buildNavigationItem(
            icon: Icons.list_alt,
            title: 'My Complaints',
            onTap: () {
              Navigator.pushNamed(context, '/complaint-list');
            },
          ),
          const SizedBox(height: 20),

          // Language Setting
          _buildLanguageSetting(),
          const SizedBox(height: 20),

          // Push Notifications
          _buildToggleSetting(
            icon: Icons.notifications_outlined,
            title: 'Push Notifications',
            value: pushNotifications,
            onChanged: (value) {
              setState(() {
                pushNotifications = value;
              });
            },
          ),
          const SizedBox(height: 20),

          // Email Notifications
          _buildToggleSetting(
            icon: Icons.email_outlined,
            title: 'Email Notifications',
            value: emailNotifications,
            onChanged: (value) {
              setState(() {
                emailNotifications = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: const Color(0xFF4CAF50), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: TranslatedText(
              title,
              style: const TextStyle(
                fontSize: 16,
                color: Color(0xFF2E2E2E),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: Color(0xFF999999),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageSetting() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.language, color: Color(0xFF4CAF50), size: 20),
        ),
        const SizedBox(width: 16),
        const Expanded(
          child: Text(
            'Language / ভাষা',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF2E2E2E),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Row(
          children: [
            _buildLanguageButton('EN', selectedLanguage == 'EN'),
            const SizedBox(width: 8),
            _buildLanguageButton('বাং', selectedLanguage == 'বাং'),
          ],
        ),
      ],
    );
  }

  Widget _buildLanguageButton(String language, bool isSelected) {
    return GestureDetector(
      onTap: () async {
        setState(() {
          selectedLanguage = language;
        });

        // Save language preference and update app
        final languageCode = language == 'EN' ? 'en' : 'bn';
        final languageProvider = Provider.of<LanguageProvider>(
          context,
          listen: false,
        );
        await languageProvider.setLanguage(languageCode);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                language == 'EN'
                    ? 'Language changed to English'
                    : 'ভাষা বাংলায় পরিবর্তিত হয়েছে',
              ),
              backgroundColor: const Color(0xFF4CAF50),
            ),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.transparent,
          border: Border.all(color: const Color(0xFF4CAF50), width: 1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          language,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF4CAF50),
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildToggleSetting({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF4CAF50).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF4CAF50), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: TranslatedText(
            title,
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF2E2E2E),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          thumbColor: WidgetStateProperty.resolveWith<Color>(
            (Set<WidgetState> states) {
              if (states.contains(WidgetState.selected)) {
                return const Color(0xFF4CAF50);
              }
              return Colors.grey.shade400;
            },
          ),
          trackColor: WidgetStateProperty.resolveWith<Color>(
            (Set<WidgetState> states) {
              if (states.contains(WidgetState.selected)) {
                return const Color(0xFF4CAF50).withOpacity(0.3);
              }
              return Colors.grey.shade300;
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLogoutButton() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: OutlinedButton.icon(
        onPressed: () {
          _showLogoutDialog();
        },
        icon: const Icon(Icons.logout, color: Colors.red, size: 20),
        label: TranslatedText(
          'Logout',
          style: TextStyle(
            color: Colors.red,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.red),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Column(
      children: [
        Text(
          'Clean Care v1.0.0',
          style: TextStyle(fontSize: 14, color: Color(0xFF999999)),
        ),
        SizedBox(height: 4),
        Text(
          '© 2025 DSCC. All rights reserved.',
          style: TextStyle(fontSize: 12, color: Color(0xFF999999)),
        ),
      ],
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: TranslatedText('Logout'),
          content: TranslatedText('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: TranslatedText('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context); // Close dialog
                await _performLogout();
              },
              child: TranslatedText(
                'Logout',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _performLogout() async {
    try {
      // Show loading
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      // Call backend logout API
      final authRepo = AuthRepository(ApiClient(ApiConfig.baseUrl));
      await authRepo.logout();

      // Clear local tokens
      await AuthService.clearTokens();

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Logout successful! ✓'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      // Navigate to login
      Navigator.pushNamedAndRemoveUntil(
        context,
        '/login',
        (route) => false, // Remove all previous routes
      );
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog if open
      Navigator.pop(context);

      // Even if API call fails, clear local tokens and logout
      await AuthService.clearTokens();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TranslatedText('Logout successful! ✓'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      // Navigate to login
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  String _getRoleDisplayName(String role) {
    switch (role) {
      case 'CUSTOMER':
        return 'Customer';
      case 'SERVICE_PROVIDER':
        return 'Service Provider';
      case 'ADMIN':
        return 'Admin';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      default:
        return role;
    }
  }

  void _handleNavigation(int index) {
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
        // QR / Camera placeholder
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TranslatedText('QR Scanner coming soon...')),
        );
        break;
    }
  }
}
