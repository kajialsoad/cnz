
  Widget _buildInspectorDetailsCard(Complaint complaint) {
    // Check if we have ward or zone data
    final hasWardInspector = complaint.ward != null && 
                             (complaint.ward!['inspectorName'] != null || 
                              complaint.ward!['inspectorPhone'] != null);
    final hasZoneOfficer = complaint.zone != null && 
                          (complaint.zone!['officerName'] != null || 
                           complaint.zone!['officerPhone'] != null);
    
    if (!hasWardInspector && !hasZoneOfficer) {
      return SizedBox.shrink(); // Don't show if no data
    }

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.people_outline,
                size: 20,
                color: Color(0xFF4CAF50),
              ),
              SizedBox(width: 8),
              TranslatedText(
                'Responsible Officers',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          
          // Ward Inspector Section
          if (hasWardInspector) ...[
            _buildOfficerCard(
              title: 'Ward Inspector',
              titleBangla: 'ওয়ার্ড ইন্সপেক্টর',
              name: complaint.ward!['inspectorName'],
              phone: complaint.ward!['inspectorPhone'],
              icon: Icons.badge_outlined,
              iconColor: Color(0xFF2196F3),
            ),
          ],
          
          // Spacing between cards
          if (hasWardInspector && hasZoneOfficer)
            SizedBox(height: 12),
          
          // Zone Officer Section
          if (hasZoneOfficer) ...[
            _buildOfficerCard(
              title: 'Zone Officer',
              titleBangla: 'জোন অফিসার',
              name: complaint.zone!['officerName'],
              phone: complaint.zone!['officerPhone'],
              icon: Icons.person_outline,
              iconColor: Color(0xFFFFA726),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOfficerCard({
    required String title,
    required String titleBangla,
    String? name,
    String? phone,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: iconColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 24,
              color: iconColor,
            ),
          ),
          SizedBox(width: 12),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  '$title / $titleBangla',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 4),
                
                // Name
                if (name != null && name.isNotEmpty)
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                  ),
                
                // Phone
                if (phone != null && phone.isNotEmpty) ...[
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.phone,
                        size: 14,
                        color: iconColor,
                      ),
                      SizedBox(width: 4),
                      Text(
                        phone,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
