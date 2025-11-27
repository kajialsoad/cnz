# Implementation Plan - Cloudinary Image Storage System

- [ ] 1. Setup Cloudinary Configuration
  - Install Cloudinary Node.js SDK (`npm install cloudinary`)
  - Create `server/src/config/cloudinary.config.ts` file
  - Add Cloudinary credentials to `server/.env` file
  - Initialize Cloudinary with credentials
  - Export configured Cloudinary instance
  - Add validation for required environment variables
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2. Create Cloud Upload Service
  - Create `server/src/services/cloud-upload.service.ts` file
  - Implement `uploadImage()` method with Cloudinary upload
  - Implement `uploadAudio()` method for voice files
  - Add retry logic (3 attempts) for network failures
  - Implement `deleteFile()` method for cleanup
  - Add `getOptimizedUrl()` helper for transformations
  - Configure folder structure: `clean-care/{type}/{date}/`
  - Add comprehensive error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 3. Update Upload Configuration
  - Modify `server/src/config/upload.config.ts`
  - Change Multer storage from disk to memory storage
  - Keep file validation (file type, size limits)
  - Remove local directory creation logic
  - Update file filter to work with memory storage
  - _Requirements: 2.1, 2.4_

- [ ] 4. Update Complaint Service for Cloudinary
  - Modify `server/src/services/complaint.service.ts`
  - Update `createComplaint()` to upload images to Cloudinary
  - Add `uploadImagesToCloudinary()` private method
  - Add `uploadAudioToCloudinary()` private method for voice files
  - Store Cloudinary URLs in database instead of local paths
  - Handle upload failures gracefully
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Update Chat Service for Cloudinary
  - Modify `server/src/services/chat.service.ts`
  - Update `sendMessage()` to upload images to Cloudinary
  - Store Cloudinary URLs in chat messages
  - Handle optional image uploads
  - Add error handling for failed uploads
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Create Migration Service
  - Create `server/src/services/migration.service.ts`
  - Implement `migrateComplaintImages()` method
  - Implement `migrateChatImages()` method
  - Implement `migrateVoiceFiles()` method
  - Implement `migrateAll()` orchestrator method
  - Add progress logging
  - Generate migration report with successes and failures
  - Handle missing local files gracefully
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Create Migration Script
  - Create `server/migrate-to-cloudinary.js` executable script
  - Import MigrationService
  - Add command-line options (--dry-run, --type)
  - Display progress during migration
  - Save migration report to file
  - Add confirmation prompt before starting
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Update Admin Panel Complaint Service
  - Modify `clean-care-admin/src/services/complaintService.ts`
  - Remove `fixMediaUrl()` method (no longer needed)
  - Use Cloudinary URLs directly from API
  - Add `getCloudinaryThumbnail()` helper for thumbnail URLs
  - Update image loading error handling
  - Add loading states for images
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 9. Update Admin Panel Chat Service
  - Modify `clean-care-admin/src/services/chatService.ts`
  - Use Cloudinary URLs directly for chat images
  - Remove any URL manipulation logic
  - Add image loading error handling
  - Implement thumbnail transformations for chat images
  - _Requirements: 13.2, 13.3_

- [ ] 10. Update Admin Panel Components
  - Update `ComplaintDetailsModal.tsx` to handle Cloudinary URLs
  - Update `ChatModal.tsx` to display Cloudinary images
  - Add loading spinners for images
  - Add error placeholders for failed image loads
  - Implement click-to-enlarge for images
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Update Mobile App Complaint Repository
  - Modify `lib/repositories/complaint_repository.dart`
  - Remove any local URL manipulation
  - Use Cloudinary URLs directly from API responses
  - Update `createComplaint()` to handle multipart uploads
  - Add upload progress tracking
  - Add error handling for upload failures
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12. Update Mobile App Chat Service
  - Modify `lib/services/chat_service.dart`
  - Use Cloudinary URLs for chat images
  - Update `sendMessage()` to handle image uploads
  - Add upload progress tracking
  - Implement image caching using `cached_network_image`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13. Update Mobile App UI Components
  - Update complaint list to display Cloudinary images
  - Update complaint details to display Cloudinary images
  - Update chat UI to display Cloudinary images
  - Add loading indicators for images
  - Add error placeholders for failed loads
  - Implement image caching
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14. Add Image Optimization
  - Configure Cloudinary transformations in upload service
  - Implement thumbnail generation (200x200)
  - Implement medium size generation (800x600)
  - Add automatic format optimization (WebP)
  - Add automatic quality optimization
  - Update admin panel to use thumbnail URLs
  - Update mobile app to use appropriate sizes
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Implement Security Measures
  - Ensure API credentials are in environment variables only
  - Add backend authorization checks before returning URLs
  - Use HTTPS URLs from Cloudinary
  - Implement file validation on backend
  - Add file size limits
  - Sanitize filenames
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16. Add Monitoring and Logging
  - Add logging for successful uploads (filename, size, duration)
  - Add logging for failed uploads (error details, retry attempts)
  - Create daily upload summary logs
  - Add Cloudinary usage tracking
  - Implement error rate monitoring
  - Add alerts for high failure rates
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 17. Testing - Backend Unit Tests
  - Test Cloudinary configuration initialization
  - Test CloudUploadService.uploadImage()
  - Test CloudUploadService.uploadAudio()
  - Test retry logic on network failures
  - Test error handling for invalid files
  - Test MigrationService methods
  - _Requirements: All_

- [ ] 18. Testing - Integration Tests
  - Test complaint creation with Cloudinary images
  - Test chat message with Cloudinary image
  - Test end-to-end upload flow
  - Test migration script on sample data
  - Verify Cloudinary URLs are accessible
  - _Requirements: All_

- [ ] 19. Testing - Manual Testing
  - Test backend image upload endpoint
  - Test backend audio upload endpoint
  - Test admin panel complaint image display
  - Test admin panel chat image display
  - Test mobile app complaint image upload
  - Test mobile app chat image upload
  - Test mobile app image display
  - Verify loading states work
  - Verify error states work
  - _Requirements: All_

- [ ] 20. Run Migration to Cloudinary
  - Backup database before migration
  - Run migration script with --dry-run first
  - Review dry-run results
  - Run actual migration
  - Verify all images are accessible
  - Keep local files as backup for 1 week
  - Monitor for any issues
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21. Cleanup and Documentation
  - Remove unused local file storage code
  - Remove URL fixing logic from admin panel
  - Update API documentation
  - Update deployment documentation
  - Document Cloudinary configuration
  - Add troubleshooting guide
  - _Requirements: All_

- [ ] 22. Final Checkpoint - Verify Everything Works
  - Ensure all tests pass
  - Verify admin panel displays all images correctly
  - Verify mobile app displays all images correctly
  - Verify new uploads work correctly
  - Verify migration was successful
  - Monitor Cloudinary usage and costs
  - Ask user if any issues arise
