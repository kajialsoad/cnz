import 'package:flutter/material.dart';

/// In-app notification popup widget
/// Shows a notification banner at the top of the screen
class InAppNotification {
  static OverlayEntry? _overlayEntry;

  /// Show an in-app notification
  static void show(
    BuildContext context, {
    required String title,
    required String message,
    required VoidCallback onTap,
  }) {
    try {
      // Remove existing notification if any
      hide();

      // Get the overlay - context should already have access to it
      final overlay = Overlay.of(context, rootOverlay: false);

      _overlayEntry = OverlayEntry(
        builder: (context) => Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          left: 10,
          right: 10,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: () {
                hide();
                onTap();
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.message,
                        color: Colors.green,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            message,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black54,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      overlay.insert(_overlayEntry!);

      // Auto-hide after 5 seconds
      Future.delayed(const Duration(seconds: 5), () {
        hide();
      });
    } catch (e) {
      print('❌ Failed to show in-app notification: $e');
      // Don't throw - just log the error
    }
  }

  /// Hide the current notification
  static void hide() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }
}
