import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// A reusable widget to display admin information in Live Chat
/// Shows admin name, role, ward/zone, and online status
class AdminInfoCard extends StatelessWidget {
  final Map<String, dynamic> adminInfo;
  final bool showAnimation;

  const AdminInfoCard({
    super.key,
    required this.adminInfo,
    this.showAnimation = true,
  });

  @override
  Widget build(BuildContext context) {
    final name = adminInfo['name'] ?? 'Admin';
    final role = adminInfo['role'] ?? 'WARD_ADMIN';
    final ward = adminInfo['ward'];
    final zone = adminInfo['zone'];
    final profilePicture = adminInfo['profilePicture'];

    final roleText = _getRoleText(role);
    final locationText = _getLocationText(ward, zone);

    final card = Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          _buildAvatar(profilePicture),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2E8B57),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  roleText,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                if (locationText.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    locationText,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ],
            ),
          ),
          _buildOnlineIndicator(),
        ],
      ),
    );

    // Apply animation if enabled
    if (showAnimation) {
      return card.animate().fadeIn(duration: 400.ms).slideY(
            begin: -0.2,
            duration: 300.ms,
            curve: Curves.easeOut,
          );
    }

    return card;
  }

  /// Build avatar widget with profile picture or default icon
  Widget _buildAvatar(String? profilePicture) {
    if (profilePicture != null && profilePicture.isNotEmpty) {
      return Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: const Color(0xFF2E8B57),
            width: 2,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Image.network(
            profilePicture,
            width: 48,
            height: 48,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return _buildDefaultAvatar();
            },
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return _buildDefaultAvatar();
            },
          ),
        ),
      );
    }

    return _buildDefaultAvatar();
  }

  /// Build default avatar with gradient background
  Widget _buildDefaultAvatar() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2E8B57), Color(0xFF3CB371)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Icon(
        Icons.person,
        color: Colors.white,
        size: 24,
      ),
    );
  }

  /// Build online status indicator
  Widget _buildOnlineIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: Color(0xFF4CAF50),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        const Text(
          'অনলাইন',
          style: TextStyle(
            fontSize: 11,
            color: Color(0xFF4CAF50),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  /// Get Bangla role text from role enum
  String _getRoleText(String role) {
    switch (role) {
      case 'WARD_ADMIN':
        return 'ওয়ার্ড অ্যাডমিন';
      case 'ZONE_ADMIN':
        return 'জোন অ্যাডমিন';
      case 'SUPER_ADMIN':
        return 'সুপার অ্যাডমিন';
      case 'MASTER_ADMIN':
        return 'মাস্টার অ্যাডমিন';
      default:
        return 'অ্যাডমিন';
    }
  }

  /// Get location text from ward and zone
  String _getLocationText(dynamic ward, dynamic zone) {
    final List<String> parts = [];

    if (ward != null) {
      parts.add('Ward $ward');
    }

    if (zone != null) {
      parts.add('Zone $zone');
    }

    return parts.join(', ');
  }
}
