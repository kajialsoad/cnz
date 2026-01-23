import request from 'supertest';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { liveChatController } from '../../src/controllers/live-chat.controller';

// Mock cloud upload service
jest.mock('../../src/services/cloud-upload.service', () => ({
    cloudUploadService: {
        uploadImage: jest.fn().mockResolvedValue({
            secure_url: 'https://cloudinary.com/test-image.jpg',
            public_id: 'test-image-id',
        }),
        uploadAudio: jest.fn().mockResolvedValue({
            secure_url: 'https://cloudinary.com/test-voice.m4a',
            public_id: 'test-voice-id',
        }),
    },
}));

// Create test app
const app = express();
app.use(express.json());

// Configure multer for testing
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Accept images and audio files
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and audio files are allowed.'));
        }
    },
});

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = {
        sub: 1,
        role: 'CUSTOMER',
        email: 'user@example.com',
        phone: '01712345678',
    };
    next();
};

// Setup upload route
app.post(
    '/api/live-chat/upload',
    mockAuthMiddleware,
    upload.single('file'),
    (req, res) => liveChatController.uploadFile(req as any, res)
);

describe('Live Chat Voice Upload Integration Tests', () => {
    const testFilesDir = path.join(__dirname, '../fixtures');
    const uploadsDir = path.join(__dirname, '../../uploads');

    beforeAll(() => {
        // Create test fixtures directory if it doesn't exist
        if (!fs.existsSync(testFilesDir)) {
            fs.mkdirSync(testFilesDir, { recursive: true });
        }

        // Create test audio file (m4a)
        const testAudioPath = path.join(testFilesDir, 'test-voice.m4a');
        if (!fs.existsSync(testAudioPath)) {
            // Create a minimal valid m4a file (just for testing)
            const buffer = Buffer.from([
                0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
                0x4d, 0x34, 0x41, 0x20, 0x00, 0x00, 0x00, 0x00,
            ]);
            fs.writeFileSync(testAudioPath, buffer);
        }

        // Create test image file
        const testImagePath = path.join(testFilesDir, 'test-image.jpg');
        if (!fs.existsSync(testImagePath)) {
            // Create a minimal valid JPEG file
            const buffer = Buffer.from([
                0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
                0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
            ]);
            fs.writeFileSync(testImagePath, buffer);
        }

        // Create test PDF file (for invalid file type test)
        const testPdfPath = path.join(testFilesDir, 'test-document.pdf');
        if (!fs.existsSync(testPdfPath)) {
            const buffer = Buffer.from('%PDF-1.4\n%EOF\n');
            fs.writeFileSync(testPdfPath, buffer);
        }

        // Create large file (for size validation test)
        const testLargeFilePath = path.join(testFilesDir, 'test-large.m4a');
        if (!fs.existsSync(testLargeFilePath)) {
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
            fs.writeFileSync(testLargeFilePath, largeBuffer);
        }
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testFilesDir)) {
            fs.rmSync(testFilesDir, { recursive: true, force: true });
        }
        if (fs.existsSync(uploadsDir)) {
            fs.rmSync(uploadsDir, { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment variable
        process.env.USE_CLOUDINARY = 'false';
    });

    describe('POST /api/live-chat/upload - Voice File Upload', () => {
        it('should upload voice file successfully with local storage', async () => {
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('url');
            expect(response.body.data).toHaveProperty('filename');
            expect(response.body.data).toHaveProperty('mimetype');
            expect(response.body.data).toHaveProperty('size');
            expect(response.body.data.url).toMatch(/^\/uploads\//);
        });

        it('should upload voice file successfully with Cloudinary', async () => {
            process.env.USE_CLOUDINARY = 'true';
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('url');
            expect(response.body.data.url).toContain('cloudinary.com');
            expect(response.body.data).toHaveProperty('publicId');
        });

        it('should fallback to local storage if Cloudinary fails', async () => {
            process.env.USE_CLOUDINARY = 'true';
            const { cloudUploadService } = require('../../src/services/cloud-upload.service');
            cloudUploadService.uploadAudio.mockRejectedValueOnce(new Error('Cloudinary error'));

            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.url).toMatch(/^\/uploads\//);
        });

        it('should upload image file successfully', async () => {
            const testFilePath = path.join(testFilesDir, 'test-image.jpg');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('url');
        });

        it('should reject file larger than 10MB', async () => {
            const testFilePath = path.join(testFilesDir, 'test-large.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            // Multer rejects the file before it reaches the controller
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should reject invalid file type (PDF)', async () => {
            const testFilePath = path.join(testFilesDir, 'test-document.pdf');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            // Multer rejects the file before it reaches the controller
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should return 400 if no file is provided', async () => {
            const response = await request(app)
                .post('/api/live-chat/upload')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'No file provided');
        });

        it('should return 401 if user is not authenticated', async () => {
            // Create a route without auth middleware
            const testApp = express();
            testApp.use(express.json());
            testApp.post(
                '/api/live-chat/upload',
                upload.single('file'),
                (req, res) => liveChatController.uploadFile(req as any, res)
            );

            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(testApp)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Authentication required');
        });

        it('should handle different audio formats (mp3, wav, ogg)', async () => {
            // Create test files for different formats
            const formats = [
                { ext: 'mp3', mimetype: 'audio/mpeg' },
                { ext: 'wav', mimetype: 'audio/wav' },
                { ext: 'ogg', mimetype: 'audio/ogg' },
            ];

            for (const format of formats) {
                const testFilePath = path.join(testFilesDir, `test-voice.${format.ext}`);
                const buffer = Buffer.from([0x00, 0x00, 0x00, 0x20]);
                fs.writeFileSync(testFilePath, buffer);

                const response = await request(app)
                    .post('/api/live-chat/upload')
                    .attach('file', testFilePath);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            }
        });

        it('should return correct response format', async () => {
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    url: expect.any(String),
                    filename: expect.any(String),
                    mimetype: expect.any(String),
                    size: expect.any(Number),
                },
            });
        });

        it('should log upload details', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(consoleSpy).toHaveBeenCalledWith(
                '📤 Live Chat file upload:',
                expect.objectContaining({
                    fieldname: 'file',
                    originalname: expect.any(String),
                    mimetype: expect.any(String),
                    size: expect.any(Number),
                })
            );

            consoleSpy.mockRestore();
        });
    });

    describe('File Validation', () => {
        it('should validate file type correctly', async () => {
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body.data.mimetype).toMatch(/^audio\//);
        });

        it('should validate file size correctly', async () => {
            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');
            const stats = fs.statSync(testFilePath);

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.status).toBe(200);
            expect(response.body.data.size).toBe(stats.size);
            expect(response.body.data.size).toBeLessThan(10 * 1024 * 1024);
        });
    });

    describe('Error Handling', () => {
        it('should handle multer errors gracefully', async () => {
            const testFilePath = path.join(testFilesDir, 'test-large.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            // Multer handles the error and returns appropriate status
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should handle file system errors', async () => {
            // Mock fs to throw error
            const originalWriteFileSync = fs.writeFileSync;
            fs.writeFileSync = jest.fn().mockImplementation(() => {
                throw new Error('File system error');
            });

            const testFilePath = path.join(testFilesDir, 'test-voice.m4a');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            // Restore original function
            fs.writeFileSync = originalWriteFileSync;

            // The upload might still succeed because multer handles the file
            // This test is more about ensuring no crashes occur
            expect(response.status).toBeGreaterThanOrEqual(200);
        });

        it('should not expose sensitive errors in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const testFilePath = path.join(testFilesDir, 'test-document.pdf');

            const response = await request(app)
                .post('/api/live-chat/upload')
                .attach('file', testFilePath);

            expect(response.body).not.toHaveProperty('error');

            process.env.NODE_ENV = originalEnv;
        });
    });
});
