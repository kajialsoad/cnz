import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { uploadConfig, complaintFileUpload, imageUpload, voiceUpload } from '../config/upload.config';
import path from 'path';

export class UploadController {
  // Upload files with validation
  uploadFiles = async (req: Request, res: Response) => {
    try {
      // Validate uploaded files
      const validation = await uploadService.validateFiles(req.files);
      
      if (!validation.isValid) {
        // Clean up any uploaded files if validation fails
        await uploadService.cleanupFiles(req.files);
        
        return res.status(400).json({
          success: false,
          message: 'File validation failed',
          errors: validation.errors
        });
      }
      
      // Process files and get file information
      const uploadedFiles = await uploadService.processUploadedFiles(req.files);
      
      return res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
      });
      
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Clean up any uploaded files on error
      await uploadService.cleanupFiles(req.files);
      
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
}

export const uploadController = new UploadController();