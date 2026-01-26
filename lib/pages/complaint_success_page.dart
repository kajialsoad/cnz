import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../models/complaint.dart';
import '../providers/complaint_provider.dart';

class ComplaintSuccessPage extends StatefulWidget {
  const ComplaintSuccessPage({super.key});

  @override
  State<ComplaintSuccessPage> createState() => _ComplaintSuccessPageState();
}

class _ComplaintSuccessPageState extends State<ComplaintSuccessPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4CAF50),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.top -
                  MediaQuery.of(context).padding.bottom,
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  // Top spacing
                  const SizedBox(height: 40),
                  
                  // Success Icon with Animation
                  _buildSuccessIcon(),
                  
                  // Success Title
                  const SizedBox(height: 24),
                  _buildSuccessTitle(),
                  
                  // Success Message
                  const SizedBox(height: 12),
                  _buildSuccessMessage(),
                  
                  // Spacer to push content up and card down
                  SizedBox(height: MediaQuery.of(context).size.height * 0.08),
                  
                  // Officer Assignment Card
                  _buildOfficerCard(),
                  
                  // Complaint ID
                  const SizedBox(height: 20),
                  _buildComplaintId(),
                  
                  // Bottom spacing
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessIcon() {
    return Container(
      width: 120,
      height: 120,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF4CAF50),
          shape: BoxShape.circle,
          border: Border.all(
            color: const Color(0xFF4CAF50),
            width: 3,
          ),
        ),
        child: const Icon(
          Icons.check,
          color: Colors.white,
          size: 48,
        ),
      ),
    ).animate()
      .scale(duration: const Duration(milliseconds: 600))
      .then()
      .shake(duration: const Duration(milliseconds: 300));
  }

  Widget _buildSuccessTitle() {
    return const Text(
      'Complaint Submitted!',
      style: TextStyle(
        color: Colors.white,
        fontSize: 24,
        fontWeight: FontWeight.w700,
      ),
      textAlign: TextAlign.center,
    ).animate()
      .fadeIn(duration: const Duration(milliseconds: 800))
      .slideY(begin: 0.3, duration: const Duration(milliseconds: 800));
  }

  Widget _buildSuccessMessage() {
    return const Text(
      'Your complaint has been successfully registered',
      style: TextStyle(
        color: Colors.white,
        fontSize: 16,
        fontWeight: FontWeight.w400,
      ),
      textAlign: TextAlign.center,
    ).animate()
      .fadeIn(duration: const Duration(milliseconds: 1000))
      .slideY(begin: 0.3, duration: const Duration(milliseconds: 1000));
  }

  Widget _buildOfficerCard() {
    // Get complaint from arguments
    final complaint = ModalRoute.of(context)!.settings.arguments as Complaint?;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Ward Inspector Title
          Text(
            'Ward Inspector',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Officer Info
          Row(
            children: [
              // Officer Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFA726),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.person,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              
              const SizedBox(width: 10),
              
              // Officer Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      complaint?.ward?['inspectorName'] ?? 'Ward Inspector',
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      complaint?.ward != null
                          ? 'Ward ${complaint!.ward!['wardNumber'] ?? complaint!.ward!['number'] ?? ''}'
                          : 'Ward Inspector',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Contact Information
          if (complaint?.ward != null) ...[ 
            Column(
              children: [
                // Phone Number
                if (complaint!.ward!['inspectorPhone'] != null)
                  Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: const Color(0xFF4CAF50).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: const Icon(
                          Icons.phone,
                          color: Color(0xFF4CAF50),
                          size: 13,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        complaint!.ward!['inspectorPhone'] ?? 'N/A',
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                
                const SizedBox(height: 10),
                
                // Location
                Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: const Color(0xFF4CAF50).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Icon(
                        Icons.location_on,
                        color: Color(0xFF4CAF50),
                        size: 13,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        complaint!.geographicalInfo.isNotEmpty
                            ? complaint!.geographicalInfo
                            : complaint!.location,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ] else ...[ 
             Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CAF50).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: const Icon(
                      Icons.info_outline,
                       color: Colors.orange,
                      size: 13,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Ward information not available',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
          ],
          
          const SizedBox(height: 18),
          
          // Action Buttons
          Column(
            children: [
              // Track Complaint Button
              Container(
                width: double.infinity,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFF4CAF50),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: ElevatedButton(
                  onPressed: _trackComplaint,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Track Complaint',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 10),
              
              // Back to Home Button
              Container(
                width: double.infinity,
                height: 44,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: const Color(0xFF4CAF50),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: ElevatedButton(
                  onPressed: _backToHome,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    foregroundColor: const Color(0xFF4CAF50),
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Back to Home',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate()
      .fadeIn(duration: const Duration(milliseconds: 1200))
      .slideY(begin: 0.5, duration: const Duration(milliseconds: 1200));
  }

  Widget _buildComplaintId() {
    final complaint = ModalRoute.of(context)!.settings.arguments as Complaint?;
    return Column(
      children: [
        Text(
          complaint != null ? 'Complaint ID: #${complaint.id}' : 'Complaint ID: #...',
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 14,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    ).animate()
      .fadeIn(duration: const Duration(milliseconds: 1400))
      .slideY(begin: 0.3, duration: const Duration(milliseconds: 1400));
  }

  void _trackComplaint() {
    // Clear form data now that we've successfully navigated to success page
    final complaintProvider = Provider.of<ComplaintProvider>(context, listen: false);
    complaintProvider.clearForm();
    
    // Navigate to complaint list page
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/complaint-list',
      (route) => false,
    );
  }

  void _backToHome() {
    // Clear form data now that we've successfully navigated to success page
    final complaintProvider = Provider.of<ComplaintProvider>(context, listen: false);
    complaintProvider.clearForm();
    
    // Navigate back to home and remove all previous routes
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/home',
      (route) => false,
    );
  }
}