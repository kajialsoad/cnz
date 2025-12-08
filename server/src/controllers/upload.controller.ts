import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { cloudUploadService } from '../services/cloud-upload.service';
import { isCloudinaryEnabled } from '../config/cloudinary.config';
import { uploadConfig, complaintFileUpload, imageUpload, voiceUpload } from '../config/upload.config';
import path from 'path';

export class UploadController {
  // Upload files with validation
  uploadFiles = async (req: Request, res: Response) => {
    try {
      console.log('📤 Upload files called, Cloudinary enabled:', isCloudinaryEnabled());
      console.log('📤 Files received:', req.files);

      // Check if Cloudinary is enabled
      if (isCloudinaryEnabled()) {
        // Upload to Cloudinary
        const files = req.files as any;
        const fileUrls: string[] = [];

        if (files && Array.isArray(files)) {
          // Handle files as array (from multer.any())
          for (const file of files) {
            if (file.fieldname === 'images' || file.fieldname === 'image') {
              try {
                const result = await cloudUploadService.uploadImage(file, 'complaints');
                fileUrls.push(result.secure_url);
                console.log('✅ Uploaded to Cloudinary:', result.secure_url);
              } catch (error) {
                console.error('❌ Cloudinary upload failed:', error);
                throw error;
              }
            }
          }
        }

        if (fileUrls.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No images found to upload'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Files uploaded successfully',
          data: {
            fileUrls: fileUrls,
            images: fileUrls.map(url => ({ url, filename: url.split('/').pop() }))
          }
        });
      } else {
        // Fallback to local storage
        const validation = await uploadService.validateFiles(req.files);

        if (!validation.isValid) {
          await uploadService.cleanupFiles(req.files);

          return res.status(400).json({
            success: false,
            message: 'File validation failed',
            errors: validation.errors
          });
        }

        const uploadedFiles = await uploadService.processUploadedFiles(req.files);

        return res.status(200).json({
          success: true,
          message: 'Files uploaded successfully',
          data: uploadedFiles
        });
      }

    } catch (error) {
      console.error('Error uploading files:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  };

  // Delete uploaded file
  deleteFile = async (req: Request, res: Response) => {
    try {
      const { filename, type } = req.params;

      if (!filename || !type) {
        return res.status(400).json({
          success: false,
          message: 'Filename and type are required'
        });
      }

      if (type !== 'image' && type !== 'voice') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "image" or "voice"'
        });
      }

      // Check if file exists
      if (!uploadService.fileExists(filename, type as 'image' | 'voice')) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete file
      const deleted = await uploadService.deleteFileByName(filename, type as 'image' | 'voice');

      if (deleted) {
        return res.status(200).json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete file'
        });
      }

    } catch (error) {
      console.error('Error deleting file:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  };

  // Get file information
  getFileInfo = async (req: Request, res: Response) => {
    try {
      const { filename, type } = req.params;

      if (!filename || !type) {
        return res.status(400).json({
          success: false,
          message: 'Filename and type are required'
        });
      }

      if (type !== 'image' && type !== 'voice') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "image" or "voice"'
        });
      }

      const fileInfo = await uploadService.getFileInfo(filename, type as 'image' | 'voice');

      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: fileInfo
      });

    } catch (error) {
      console.error('Error getting file info:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to get file information',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  };

  // Serve files (for direct file access)
  serveFile = async (req: Request, res: Response) => {
    try {
      const { filename, type } = req.params;

      if (!filename || !type) {
        return res.status(400).json({
          success: false,
          message: 'Filename and type are required'
        });
      }

      if (type !== 'image' && type !== 'voice') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "image" or "voice"'
        });
      }

      // Check if file exists
      if (!uploadService.fileExists(filename, type as 'image' | 'voice')) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Get file path
      const filePath = uploadService.getFilePath(filename, type as 'image' | 'voice');

      // Set appropriate content type
      const fileInfo = await uploadService.getFileInfo(filename, type as 'image' | 'voice');
      if (fileInfo) {
        res.setHeader('Content-Type', fileInfo.mimeType);
      }

      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

      // Send file
      return res.sendFile(path.resolve(filePath));

    } catch (error) {
      console.error('Error serving file:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to serve file',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  };

  // Upload middleware for complaint creation
  uploadComplaintFiles = complaintFileUpload;

  // Upload middleware for single image
  uploadSingleImage = uploadConfig.single('image');

  // Upload middleware for single voice
  uploadSingleVoice = uploadConfig.single('voice');

  // Upload middleware for multiple images
  uploadMultipleImages = uploadConfig.array('images', 5);

  // Upload avatar image for admin profile
  uploadAvatar = async (req: Request, res: Response) => {
    try {
      console.log('📤 Avatar upload called, Cloudinary enabled:', isCloudinaryEnabled());
      console.log('📤 File received:', req.file);
      console.log('📤 Request body:', req.body);

      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({
          success: false,
          message: 'No avatar file provided'
        });
      }

      // Check if Cloudinary is enabled
      if (isCloudinaryEnabled()) {
        try {
          // Upload to Cloudinary in avatars folder
          const result = await cloudUploadService.uploadImage(req.file, 'avatars');
          console.log('✅ Avatar uploaded to Cloudinary:', result.secure_url);

          return res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
              url: result.secure_url,
              publicId: result.public_id
            }
          });
        } catch (error) {
          console.error('❌ Cloudinary avatar upload failed:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload avatar to cloud storage',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
          });
        }
      } else {
        // Fallback to local storage
        try {
          const validation = await uploadService.validateFiles([req.file]);

          if (!validation.isValid) {
            await uploadService.cleanupFiles([req.file]);

            return res.status(400).json({
              success: false,
              message: 'Avatar validation failed',
              errors: validation.errors
            });
          }

          const uploadedFiles = await uploadService.processUploadedFiles({ images: [req.file] });

          if (!uploadedFiles.images || uploadedFiles.images.length === 0) {
            return res.status(500).json({
              success: false,
              message: 'Failed to process avatar'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
              url: uploadedFiles.images[0].url,
              filename: uploadedFiles.images[0].filename
            }
          });
        } catch (error) {
          console.error('❌ Local storage avatar upload failed:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to process avatar',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
          });
        }
      }

    } catch (error) {
      console.error('❌ Avatar upload error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  };
}

export const uploadController = new UploadController();