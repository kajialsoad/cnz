import 'package:flutter/material.dart';
import '../models/complaint.dart';
import 'translated_text.dart';

/// Dialog shown after successful complaint submission
/// Displays geographical information (City Corporation, Zone, Ward)
class ComplaintConfirmationDialog extends StatelessWidget {
  final Complaint complaint;
  final VoidCallback? onClose;

  const ComplaintConfirmationDialog({
    super.key,
    required this.complaint,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Color(0xFF4CAF50).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              color: Color(0xFF4CAF50),
              size: 28,
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TranslatedText(
                  'Complaint Submitted',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                Text(
                  'অভিযোগ জমা দেওয়া হয়েছে',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'আপনার অভিযোগ সফলভাবে জমা দেওয়া হয়েছে এবং নিম্নলিখিত এলাকায় পাঠানো হয়েছে:',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          SizedBox(height: 16),
          
          // Geographical Information
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              children: [
                // City Corporation
                if (complaint.cityCorporation != null)
                  _buildGeographicalRow(
                    icon: Icons.location_city,
                    label: 'City Corporation',
                    labelBangla: 'সিটি কর্পোরেশন',
                    value: complaint.cityCorporation!['name'] ?? 
                           complaint.cityCorporation!['nameBangla'] ?? 
                           'N/A',
                  ),
                
                if (complaint.cityCorporation != null && complaint.zone != null)
                  Divider(height: 24),
                
                // Zone
                if (complaint.zone != null)
                  _buildGeographicalRow(
                    icon: Icons.map,
                    label: 'Zone',
                    labelBangla: 'জোন',
                    value: complaint.zone!['name'] ?? 
                           complaint.zone!['displayName'] ?? 
                           'Zone ${complaint.zone!['zoneNumber'] ?? 'N/A'}',
                  ),
                
                if (complaint.zone != null && complaint.ward != null)
                  Divider(height: 24),
                
                // Ward
                if (complaint.ward != null)
                  _buildGeographicalRow(
                    icon: Icons.place,
                    label: 'Ward',
                    labelBangla: 'ওয়ার্ড',
                    value: complaint.ward!['displayName'] ?? 
                           'Ward ${complaint.ward!['wardNumber'] ?? 'N/A'}',
                  ),
              ],
            ),
          ),
          
          SizedBox(height: 16),
          
          // Complaint ID
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFF4CAF50).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.confirmation_number,
                  size: 18,
                  color: Color(0xFF4CAF50),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Complaint ID',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '#${complaint.id}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF4CAF50),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          SizedBox(height: 12),
          
          Text(
            'আপনি আপনার অভিযোগের স্ট্যাটাস ট্র্যাক করতে পারবেন "My Complaints" পেজে।',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            if (onClose != null) {
              onClose!();
            }
          },
          child: TranslatedText(
            'View My Complaints',
            style: TextStyle(
              color: Color(0xFF4CAF50),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            if (onClose != null) {
              onClose!();
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: TranslatedText('Close'),
        ),
      ],
    );
  }

  Widget _buildGeographicalRow({
    required IconData icon,
    required String label,
    required String labelBangla,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Color(0xFF4CAF50).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 20,
            color: Color(0xFF4CAF50),
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                labelBangla,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[500],
                ),
              ),
              SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
