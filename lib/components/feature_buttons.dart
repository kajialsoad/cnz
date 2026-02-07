import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'elevated_3d_button.dart';
import '../widgets/translated_text.dart';

class FeatureButtons extends StatefulWidget {
  final Function(String) onNavigate;
  final VoidCallback onComplaint;

  const FeatureButtons({
    super.key,
    required this.onNavigate,
    required this.onComplaint,
  });

  @override
  State<FeatureButtons> createState() => _FeatureButtonsState();
}

class _FeatureButtonsState extends State<FeatureButtons> {
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final double diameter = screenWidth < 360
        ? 100
        : (screenWidth < 480 ? 120 : 140);

    return RepaintBoundary(
      child: _buildFlowerPetalLayout(diameter),
    ).animate().fadeIn(delay: 200.ms, duration: 600.ms).slideY(
          begin: 0.2,
          end: 0,
          curve: Curves.easeOutQuad,
        );
  }

  Widget _buildFlowerPetalLayout(double diameter) {
    Widget buildCircleButton({
      required String title,
      required String subtitle,
      required IconData icon,
      required Color primary,
      required Color secondary,
      required VoidCallback onTap,
    }) {
      return Elevated3DButton(
        title: title,
        subtitle: subtitle,
        icon: icon,
        primaryColor: primary,
        secondaryColor: secondary,
        width: double.infinity,
        height: 135,
        isOval: false,
        isFlat: true,
        onTap: onTap,
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        // Background petal layout with tight spacing
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Flexible(
                  child: buildCircleButton(
                    title: "Customer Care",
                    subtitle: "",
                    icon: Icons.headset_mic,
                    primary: const Color(0xFFFF2424),
                    secondary: const Color(0xFFFF2424).withOpacity(0.8),
                    onTap: () => widget.onNavigate('/customer-care'),
                  ),
                ),
                const SizedBox(width: 2),
                Flexible(
                  child: buildCircleButton(
                    title: "Live Chat",
                    subtitle: "",
                    icon: Icons.chat_bubble_outline,
                    primary: const Color(0xFF36724A),
                    secondary: const Color(0xFF36724A).withOpacity(0.8),
                    onTap: () => widget.onNavigate('/live-chat'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                Flexible(
                  child: buildCircleButton(
                    title: "Waste Management",
                    subtitle: "",
                    icon: Icons.recycling,
                    primary: const Color(0xFF36724A),
                    secondary: const Color(0xFF36724A).withOpacity(0.8),
                    onTap: () => widget.onNavigate('/waste-management'),
                  ),
                ),
                const SizedBox(width: 2),
                Flexible(
                  child: buildCircleButton(
                    title: "Emergency",
                    subtitle: "",
                    icon: Icons.emergency,
                    primary: const Color(0xFFFF2424),
                    secondary: const Color(0xFFFF2424).withOpacity(0.8),
                    onTap: () => widget.onNavigate('/emergency'),
                  ),
                ),
              ],
            ),
          ],
        ),

        // Center complaint button
        Container(
          width: 110,
          height: 110,
          decoration: BoxDecoration(
            color: Colors.blue,
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white,
              width: 4,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 15,
                offset: const Offset(0, 5),
                spreadRadius: 2,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(70),
              onTap: widget.onComplaint,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'assets/complaint.svg',
                    width: 36,
                    height: 36,
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TranslatedText(
                    "Complaint",
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
