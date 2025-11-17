import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/complaints',
    'uploads/complaints/images',
    'uploads/complaints/voice',
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// File type validation
const fileFilter = (req: any, file: any, cb: (error: any, acceptFile: boolean) => void) => {
  console.log('File filter called:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Image files validation
  if (file.fieldname === 'images') {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  }
  // Audio files validation (voice or audioFiles fieldname)
  else if (file.fieldname === 'voice' || file.fieldname === 'audioFiles') {
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mp4'];
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3, WAV, OGG, M4A, and AAC audio files are allowed'), false);
    }
  } else {
    cb(new Error('Invalid file field'), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (error: any, destination: string) => void) => {
    let uploadPath = 'uploads/complaints/';

    if (file.fieldname === 'images') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'voice' || file.fieldname === 'audioFiles') {
      uploadPath += 'voice/';
    }

    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb: (error: any, filename: string) => void) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${extension}`;

    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// Multer configuration
export const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files at once
  }
});

// Field configurations for different upload types
// Using .any() to accept all fields including location[address], location[district], etc.
export const complaintFileUpload = uploadConfig.any();

// Single file upload configurations
export const imageUpload = uploadConfig.array('images', 5);
export const voiceUpload = uploadConfig.single('voice');

// File size limits in bytes
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024,  // 5MB
  AUDIO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES: 5,
  MAX_AUDIO_FILES: 1
};

// Allowed file types
export const ALLOWED_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
};

// Helper function to validate file
export const validateFile = (file: any, type: 'image' | 'audio'): boolean => {
  if (type === 'image') {
    return ALLOWED_TYPES.IMAGES.includes(file.mimetype) && file.size <= FILE_LIMITS.IMAGE_MAX_SIZE;
  } else {
    return ALLOWED_TYPES.AUDIO.includes(file.mimetype) && file.size <= FILE_LIMITS.AUDIO_MAX_SIZE;
  }
};

// Helper function to get file URL
export const getFileUrl = (filename: string, type: 'image' | 'voice'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/api/uploads/${type}/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
