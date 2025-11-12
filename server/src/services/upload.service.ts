import path from 'path';
import fs from 'fs';
import { getFileUrl, deleteFile, validateFile, FILE_LIMITS } from '../config/upload.config';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  fieldName: string;
}

export interface UploadedFiles {
  images?: FileUploadResult[];
  voice?: FileUploadResult;
}

export class UploadService {
  // Process uploaded files and return file information
  async processUploadedFiles(files: any): Promise<UploadedFiles> {
    try {
      const result: UploadedFiles = {};
      
      if (files) {
        // Process multiple images
        if (files.images && Array.isArray(files.images)) {
          result.images = files.images.map((file: Express.Multer.File) => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: getFileUrl(file.filename, 'image'),
            fieldName: file.fieldname
          }));
        }
        
        // Process single voice file
        if (files.voice && files.voice[0]) {
          const voiceFile = files.voice[0];
          result.voice = {
            filename: voiceFile.filename,
            originalName: voiceFile.originalname,
            mimeType: voiceFile.mimetype,
            size: voiceFile.size,
            url: getFileUrl(voiceFile.filename, 'voice'),
            fieldName: voiceFile.fieldname
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      throw new Error('Failed to process uploaded files');
    }
  }

  // Validate all uploaded files
  async validateFiles(files: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      if (files) {
        // Validate images
        if (files.images && Array.isArray(files.images)) {
          if (files.images.length > FILE_LIMITS.MAX_IMAGES) {
            errors.push(`Maximum ${FILE_LIMITS.MAX_IMAGES} images allowed`);
          }
          
          files.images.forEach((file: Express.Multer.File, index: number) => {
            if (!validateFile(file, 'image')) {
              errors.push(`Image ${index + 1}: Invalid file type or size`);
            }
          });
        }
        
        // Validate voice file
        if (files.voice && files.voice[0]) {
          const voiceFile = files.voice[0];
          if (!validateFile(voiceFile, 'audio')) {
            errors.push('Voice file: Invalid file type or size');
          }
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating files:', error);
      return {
        isValid: false,
        errors: ['File validation failed']
      };
    }
  }

  // Delete uploaded files (cleanup on error)
  async cleanupFiles(files: any): Promise<void> {
    try {
      if (files) {
        // Clean up images
        if (files.images && Array.isArray(files.images)) {
          for (const file of files.images) {
            await deleteFile(file.path);
          }
        }
        
        // Clean up voice file
        if (files.voice && files.voice[0]) {
          await deleteFile(files.voice[0].path);
        }
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }

  // Get file information by filename
  async getFileInfo(filename: string, type: 'image' | 'voice'): Promise<FileUploadResult | null> {
    try {
      const filePath = path.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      const extension = path.extname(filename);
      
      return {
        filename,
        originalName: filename,
        mimeType: this.getMimeTypeFromExtension(extension),
        size: stats.size,
        url: getFileUrl(filename, type),
        fieldName: type === 'image' ? 'images' : 'voice'
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  // Delete file by filename
  async deleteFileByName(filename: string, type: 'image' | 'voice'): Promise<boolean> {
    try {
      const filePath = path.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
      await deleteFile(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Extract filenames from URLs for database storage
  extractFilenamesFromUrls(imageUrls?: string[], voiceUrl?: string): { imageFilenames: string[]; voiceFilename?: string } {
    const imageFilenames: string[] = [];
    let voiceFilename: string | undefined;
    
    if (imageUrls && imageUrls.length > 0) {
      imageUrls.forEach(url => {
        const filename = path.basename(url);
        if (filename) {
          imageFilenames.push(filename);
        }
      });
    }
    
    if (voiceUrl) {
      voiceFilename = path.basename(voiceUrl);
    }
    
    return { imageFilenames, voiceFilename };
  }

  // Convert filenames to URLs for API responses
  convertFilenamesToUrls(imageFilenames?: string, voiceFilename?: string): { imageUrls: string[]; voiceUrl?: string } {
    const imageUrls: string[] = [];
    let voiceUrl: string | undefined;
    
    if (imageFilenames) {
      // Assuming comma-separated filenames
      const filenames = imageFilenames.split(',').filter(f => f.trim());
      filenames.forEach(filename => {
        imageUrls.push(getFileUrl(filename.trim(), 'image'));
      });
    }
    
    if (voiceFilename) {
      voiceUrl = getFileUrl(voiceFilename, 'voice');
    }
    
    return { imageUrls, voiceUrl };
  }

  // Get MIME type from file extension
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/m4a',
      '.aac': 'audio/aac'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  // Check if file exists
  fileExists(filename: string, type: 'image' | 'voice'): boolean {
    const filePath = path.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
    return fs.existsSync(filePath);
  }

  // Get file path
  getFilePath(filename: string, type: 'image' | 'voice'): string {
    return path.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
  }
}

export const uploadService = new UploadService();