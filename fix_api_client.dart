import 'dart:io';

void main() {
  final file = File('lib/services/api_client.dart');
  var content = file.readAsStringSync();
  
  // Replace the file handling logic
  content = content.replaceAll(
    '''          if (kIsWeb) {
            // For web, use XFile to read bytes
            try {
              // Create XFile from the path
              final xFile = XFile(file.path);
              final bytes = await xFile.readAsBytes();
              
              // Extract filename
              String fileName = xFile.name;''',
    '''          // Handle both XFile and File
          if (file is XFile) {
            // XFile handling (works for both web and mobile)
            try {
              final bytes = await file.readAsBytes();
              
              // Extract filename
              String fileName = file.name;'''
  );
  
  content = content.replaceAll(
    r'''            } catch (e) {
              print('Error reading file bytes on web: $e');
              throw ApiException('Failed to read file on web platform: ${e.toString()}');
            }
          } else {
            // For mobile, use fromPath''',
    r'''            } catch (e) {
              print('Error reading XFile bytes: $e');
              throw ApiException('Failed to read file: ${e.toString()}');
            }
          } else if (file is File) {
            // Legacy File handling for audio files'''
  );
  
  file.writeAsStringSync(content);
  print('Fixed api_client.dart');
}
