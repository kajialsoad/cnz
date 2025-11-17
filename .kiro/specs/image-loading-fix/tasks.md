# Implementation Plan

- [x] 1. Update backend URL generation function


  - Modify the `getFileUrl` function in `server/src/config/upload.config.ts` to generate URLs matching the pattern `/api/uploads/{type}/{filename}`
  - Change from `/uploads/complaints/images/` to `/api/uploads/image/`
  - Change from `/uploads/complaints/voice/` to `/api/uploads/voice/`
  - Ensure the function uses the BASE_URL environment variable correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_



- [ ] 2. Update complaint service file URL generation
  - Import `getFileUrl` function from upload.config in `server/src/services/complaint.service.ts`
  - Replace manual URL construction (`/uploads/${file.filename}`) with `getFileUrl(file.filename, 'image')` for images
  - Replace manual URL construction for audio files with `getFileUrl(file.filename, 'voice')`
  - Update both the `createComplaint` method image URL generation

  - Update both the `createComplaint` method audio URL generation
  - _Requirements: 1.3, 2.1, 2.2, 2.3_

- [x] 3. Verify upload service file path method

  - Check if `getFilePath` method exists in `server/src/services/upload.service.ts`
  - If missing, add the method to construct correct file system paths: `uploads/complaints/{images|voice}/{filename}`
  - Ensure the method correctly maps 'image' type to 'images' directory and 'voice' type to 'voice' directory
  - _Requirements: 1.4, 2.2_

- [x] 4. Test the image loading fix



  - Start the backend server
  - Create a test complaint with images using the mobile app or API
  - Verify the API response contains URLs in the format `http://BASE_URL/api/uploads/image/{filename}`
  - Access the image URL directly in a browser to confirm the file is served correctly
  - Open the complaint detail view in the mobile app and verify images display without broken icons
  - Check that cache headers are set correctly (Cache-Control: public, max-age=31536000)
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Create database migration script for existing complaints



  - Create a migration script to update existing complaint image URLs in the database
  - Script should parse old URL format and extract filenames
  - Script should reconstruct URLs using the new format
  - Test the migration script on a backup database first
  - _Requirements: 2.4, 2.5_
