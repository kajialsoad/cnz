"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationService = exports.MigrationService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const cloud_upload_service_1 = require("./cloud-upload.service");
const cloudinary_config_1 = require("../config/cloudinary.config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Migration Service Class
 */
class MigrationService {
    constructor() {
        // Default uploads directory
        this.uploadsDir = path.join(process.cwd(), 'uploads');
    }
    /**
     * Check if Cloudinary is enabled
     */
    ensureCloudinaryEnabled() {
        if (!(0, cloudinary_config_1.isCloudinaryEnabled)()) {
            throw new Error('Cloudinary is not enabled. Please configure Cloudinary credentials.');
        }
    }
    /**
     * Extract file path from URL
     * Handles both absolute and relative URLs
     */
    extractLocalPath(url) {
        if (!url)
            return null;
        // If already a Cloudinary URL, skip it
        if (url.includes('cloudinary.com')) {
            return null;
        }
        // Extract path from URL
        // Example: http://localhost:4000/api/uploads/image/filename.jpg -> uploads/image/filename.jpg
        const match = url.match(/uploads\/[^?]+/);
        if (match) {
            return match[0];
        }
        // If it's already a relative path
        if (url.startsWith('uploads/')) {
            return url;
        }
        return null;
    }
    /**
     * Check if file exists locally
     */
    fileExists(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            return fs.existsSync(fullPath);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Read file from local storage
     */
    readFile(filePath) {
        const fullPath = path.join(process.cwd(), filePath);
        return fs.readFileSync(fullPath);
    }
    /**
     * Create a mock Express.Multer.File from local file
     */
    createMockFile(filePath, buffer) {
        const filename = path.basename(filePath);
        const ext = path.extname(filename).toLowerCase();
        // Determine mimetype
        let mimetype = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) {
            mimetype = 'image/jpeg';
        }
        else if (ext === '.png') {
            mimetype = 'image/png';
        }
        else if (ext === '.gif') {
            mimetype = 'image/gif';
        }
        else if (ext === '.webp') {
            mimetype = 'image/webp';
        }
        else if (ext === '.mp3') {
            mimetype = 'audio/mpeg';
        }
        else if (ext === '.wav') {
            mimetype = 'audio/wav';
        }
        else if (ext === '.ogg') {
            mimetype = 'audio/ogg';
        }
        return {
            fieldname: 'file',
            originalname: filename,
            encoding: '7bit',
            mimetype,
            size: buffer.length,
            buffer,
            destination: '',
            filename,
            path: filePath,
            stream: null
        };
    }
    /**
     * Migrate complaint images to Cloudinary
     */
    async migrateComplaintImages() {
        this.ensureCloudinaryEnabled();
        console.log('🚀 Starting complaint images migration...');
        const result = {
            totalFiles: 0,
            successCount: 0,
            failureCount: 0,
            failures: [],
            successes: []
        };
        try {
            // Get all complaints with image URLs
            const complaints = await prisma_1.default.complaint.findMany({
                where: {
                    imageUrl: {
                        not: null
                    }
                },
                select: {
                    id: true,
                    imageUrl: true
                }
            });
            console.log(`📊 Found ${complaints.length} complaints with images`);
            for (const complaint of complaints) {
                if (!complaint.imageUrl)
                    continue;
                try {
                    // Parse image URLs (could be JSON array or comma-separated)
                    let imageUrls = [];
                    try {
                        // Try parsing as JSON first
                        const parsed = JSON.parse(complaint.imageUrl);
                        if (Array.isArray(parsed)) {
                            imageUrls = parsed;
                        }
                    }
                    catch {
                        // Fall back to comma-separated
                        imageUrls = complaint.imageUrl
                            .split(',')
                            .map(url => url.trim())
                            .filter(url => url && !url.startsWith('voice:'));
                    }
                    const cloudinaryUrls = [];
                    let hasChanges = false;
                    for (const imageUrl of imageUrls) {
                        result.totalFiles++;
                        // Skip if already a Cloudinary URL
                        if (imageUrl.includes('cloudinary.com')) {
                            cloudinaryUrls.push(imageUrl);
                            console.log(`⏭️  Skipping (already on Cloudinary): ${imageUrl}`);
                            continue;
                        }
                        // Extract local path
                        const localPath = this.extractLocalPath(imageUrl);
                        if (!localPath) {
                            result.failureCount++;
                            result.failures.push({
                                localPath: imageUrl,
                                error: 'Could not extract local path from URL',
                                recordId: complaint.id,
                                recordType: 'complaint'
                            });
                            console.log(`❌ Failed to extract path: ${imageUrl}`);
                            cloudinaryUrls.push(imageUrl); // Keep original URL
                            continue;
                        }
                        // Check if file exists
                        if (!this.fileExists(localPath)) {
                            result.failureCount++;
                            result.failures.push({
                                localPath,
                                error: 'File not found on local storage',
                                recordId: complaint.id,
                                recordType: 'complaint'
                            });
                            console.log(`❌ File not found: ${localPath}`);
                            cloudinaryUrls.push(imageUrl); // Keep original URL
                            continue;
                        }
                        // Read file
                        const buffer = this.readFile(localPath);
                        const mockFile = this.createMockFile(localPath, buffer);
                        // Upload to Cloudinary
                        try {
                            const uploadResult = await cloud_upload_service_1.cloudUploadService.uploadImage(mockFile, 'complaints/images');
                            cloudinaryUrls.push(uploadResult.secure_url);
                            hasChanges = true;
                            result.successCount++;
                            result.successes.push({
                                localPath,
                                cloudinaryUrl: uploadResult.secure_url,
                                recordId: complaint.id,
                                recordType: 'complaint'
                            });
                            console.log(`✅ Migrated: ${localPath} -> ${uploadResult.secure_url}`);
                        }
                        catch (uploadError) {
                            result.failureCount++;
                            result.failures.push({
                                localPath,
                                error: uploadError.message || 'Upload failed',
                                recordId: complaint.id,
                                recordType: 'complaint'
                            });
                            console.log(`❌ Upload failed: ${localPath} - ${uploadError.message}`);
                            cloudinaryUrls.push(imageUrl); // Keep original URL
                        }
                    }
                    // Update database if there were changes
                    if (hasChanges && cloudinaryUrls.length > 0) {
                        await prisma_1.default.complaint.update({
                            where: { id: complaint.id },
                            data: {
                                imageUrl: JSON.stringify(cloudinaryUrls)
                            }
                        });
                        console.log(`💾 Updated complaint ${complaint.id} with Cloudinary URLs`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error processing complaint ${complaint.id}:`, error.message);
                    // Continue with next complaint
                }
            }
            console.log('✅ Complaint images migration completed');
            return result;
        }
        catch (error) {
            console.error('❌ Fatal error during complaint images migration:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    }
    /**
     * Migrate chat images to Cloudinary
     */
    async migrateChatImages() {
        this.ensureCloudinaryEnabled();
        console.log('🚀 Starting chat images migration...');
        const result = {
            totalFiles: 0,
            successCount: 0,
            failureCount: 0,
            failures: [],
            successes: []
        };
        try {
            // Get all chat messages with image URLs
            const chatMessages = await prisma_1.default.complaintChatMessage.findMany({
                where: {
                    imageUrl: {
                        not: null
                    }
                },
                select: {
                    id: true,
                    imageUrl: true
                }
            });
            console.log(`📊 Found ${chatMessages.length} chat messages with images`);
            for (const message of chatMessages) {
                if (!message.imageUrl)
                    continue;
                result.totalFiles++;
                try {
                    const imageUrl = message.imageUrl;
                    // Skip if already a Cloudinary URL
                    if (imageUrl.includes('cloudinary.com')) {
                        console.log(`⏭️  Skipping (already on Cloudinary): ${imageUrl}`);
                        continue;
                    }
                    // Extract local path
                    const localPath = this.extractLocalPath(imageUrl);
                    if (!localPath) {
                        result.failureCount++;
                        result.failures.push({
                            localPath: imageUrl,
                            error: 'Could not extract local path from URL',
                            recordId: message.id,
                            recordType: 'chat'
                        });
                        console.log(`❌ Failed to extract path: ${imageUrl}`);
                        continue;
                    }
                    // Check if file exists
                    if (!this.fileExists(localPath)) {
                        result.failureCount++;
                        result.failures.push({
                            localPath,
                            error: 'File not found on local storage',
                            recordId: message.id,
                            recordType: 'chat'
                        });
                        console.log(`❌ File not found: ${localPath}`);
                        continue;
                    }
                    // Read file
                    const buffer = this.readFile(localPath);
                    const mockFile = this.createMockFile(localPath, buffer);
                    // Upload to Cloudinary
                    try {
                        const uploadResult = await cloud_upload_service_1.cloudUploadService.uploadImage(mockFile, 'chat/images');
                        // Update database
                        await prisma_1.default.complaintChatMessage.update({
                            where: { id: message.id },
                            data: {
                                imageUrl: uploadResult.secure_url
                            }
                        });
                        result.successCount++;
                        result.successes.push({
                            localPath,
                            cloudinaryUrl: uploadResult.secure_url,
                            recordId: message.id,
                            recordType: 'chat'
                        });
                        console.log(`✅ Migrated: ${localPath} -> ${uploadResult.secure_url}`);
                    }
                    catch (uploadError) {
                        result.failureCount++;
                        result.failures.push({
                            localPath,
                            error: uploadError.message || 'Upload failed',
                            recordId: message.id,
                            recordType: 'chat'
                        });
                        console.log(`❌ Upload failed: ${localPath} - ${uploadError.message}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error processing chat message ${message.id}:`, error.message);
                    // Continue with next message
                }
            }
            console.log('✅ Chat images migration completed');
            return result;
        }
        catch (error) {
            console.error('❌ Fatal error during chat images migration:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    }
    /**
     * Migrate voice files to Cloudinary
     */
    async migrateVoiceFiles() {
        this.ensureCloudinaryEnabled();
        console.log('🚀 Starting voice files migration...');
        const result = {
            totalFiles: 0,
            successCount: 0,
            failureCount: 0,
            failures: [],
            successes: []
        };
        try {
            // Get all complaints with audio URLs
            const complaints = await prisma_1.default.complaint.findMany({
                where: {
                    audioUrl: {
                        not: null
                    }
                },
                select: {
                    id: true,
                    audioUrl: true
                }
            });
            console.log(`📊 Found ${complaints.length} complaints with voice files`);
            for (const complaint of complaints) {
                if (!complaint.audioUrl)
                    continue;
                try {
                    // Parse audio URLs (could be JSON array or comma-separated)
                    let audioUrls = [];
                    try {
                        // Try parsing as JSON first
                        const parsed = JSON.parse(complaint.audioUrl);
                        if (Array.isArray(parsed)) {
                            audioUrls = parsed;
                        }
                    }
                    catch {
                        // Fall back to comma-separated
                        audioUrls = complaint.audioUrl
                            .split(',')
                            .map(url => url.trim())
                            .filter(url => url);
                    }
                    const cloudinaryUrls = [];
                    let hasChanges = false;
                    for (const audioUrl of audioUrls) {
                        result.totalFiles++;
                        // Skip if already a Cloudinary URL
                        if (audioUrl.includes('cloudinary.com')) {
                            cloudinaryUrls.push(audioUrl);
                            console.log(`⏭️  Skipping (already on Cloudinary): ${audioUrl}`);
                            continue;
                        }
                        // Extract local path
                        const localPath = this.extractLocalPath(audioUrl);
                        if (!localPath) {
                            result.failureCount++;
                            result.failures.push({
                                localPath: audioUrl,
                                error: 'Could not extract local path from URL',
                                recordId: complaint.id,
                                recordType: 'voice'
                            });
                            console.log(`❌ Failed to extract path: ${audioUrl}`);
                            cloudinaryUrls.push(audioUrl); // Keep original URL
                            continue;
                        }
                        // Check if file exists
                        if (!this.fileExists(localPath)) {
                            result.failureCount++;
                            result.failures.push({
                                localPath,
                                error: 'File not found on local storage',
                                recordId: complaint.id,
                                recordType: 'voice'
                            });
                            console.log(`❌ File not found: ${localPath}`);
                            cloudinaryUrls.push(audioUrl); // Keep original URL
                            continue;
                        }
                        // Read file
                        const buffer = this.readFile(localPath);
                        const mockFile = this.createMockFile(localPath, buffer);
                        // Upload to Cloudinary
                        try {
                            const uploadResult = await cloud_upload_service_1.cloudUploadService.uploadAudio(mockFile, 'complaints/voice');
                            cloudinaryUrls.push(uploadResult.secure_url);
                            hasChanges = true;
                            result.successCount++;
                            result.successes.push({
                                localPath,
                                cloudinaryUrl: uploadResult.secure_url,
                                recordId: complaint.id,
                                recordType: 'voice'
                            });
                            console.log(`✅ Migrated: ${localPath} -> ${uploadResult.secure_url}`);
                        }
                        catch (uploadError) {
                            result.failureCount++;
                            result.failures.push({
                                localPath,
                                error: uploadError.message || 'Upload failed',
                                recordId: complaint.id,
                                recordType: 'voice'
                            });
                            console.log(`❌ Upload failed: ${localPath} - ${uploadError.message}`);
                            cloudinaryUrls.push(audioUrl); // Keep original URL
                        }
                    }
                    // Update database if there were changes
                    if (hasChanges && cloudinaryUrls.length > 0) {
                        await prisma_1.default.complaint.update({
                            where: { id: complaint.id },
                            data: {
                                audioUrl: JSON.stringify(cloudinaryUrls)
                            }
                        });
                        console.log(`💾 Updated complaint ${complaint.id} with Cloudinary URLs`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error processing complaint ${complaint.id}:`, error.message);
                    // Continue with next complaint
                }
            }
            console.log('✅ Voice files migration completed');
            return result;
        }
        catch (error) {
            console.error('❌ Fatal error during voice files migration:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    }
    /**
     * Migrate all files (orchestrator method)
     */
    async migrateAll() {
        this.ensureCloudinaryEnabled();
        console.log('🚀 Starting complete migration to Cloudinary...');
        console.log('================================================\n');
        const combinedResult = {
            totalFiles: 0,
            successCount: 0,
            failureCount: 0,
            failures: [],
            successes: []
        };
        try {
            // Migrate complaint images
            console.log('📸 Step 1/3: Migrating complaint images...');
            const complaintImagesResult = await this.migrateComplaintImages();
            this.mergeResults(combinedResult, complaintImagesResult);
            console.log('');
            // Migrate chat images
            console.log('💬 Step 2/3: Migrating chat images...');
            const chatImagesResult = await this.migrateChatImages();
            this.mergeResults(combinedResult, chatImagesResult);
            console.log('');
            // Migrate voice files
            console.log('🎤 Step 3/3: Migrating voice files...');
            const voiceFilesResult = await this.migrateVoiceFiles();
            this.mergeResults(combinedResult, voiceFilesResult);
            console.log('');
            // Print summary
            console.log('================================================');
            console.log('✅ Migration completed!');
            console.log('================================================');
            console.log(`📊 Total files processed: ${combinedResult.totalFiles}`);
            console.log(`✅ Successfully migrated: ${combinedResult.successCount}`);
            console.log(`❌ Failed: ${combinedResult.failureCount}`);
            console.log(`📈 Success rate: ${this.calculateSuccessRate(combinedResult)}%`);
            console.log('================================================\n');
            if (combinedResult.failures.length > 0) {
                console.log('⚠️  Failed migrations:');
                combinedResult.failures.forEach((failure, index) => {
                    console.log(`  ${index + 1}. ${failure.recordType} #${failure.recordId}: ${failure.localPath}`);
                    console.log(`     Error: ${failure.error}`);
                });
                console.log('');
            }
            return combinedResult;
        }
        catch (error) {
            console.error('❌ Fatal error during migration:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    }
    /**
     * Merge migration results
     */
    mergeResults(target, source) {
        target.totalFiles += source.totalFiles;
        target.successCount += source.successCount;
        target.failureCount += source.failureCount;
        target.failures.push(...source.failures);
        target.successes.push(...source.successes);
    }
    /**
     * Calculate success rate
     */
    calculateSuccessRate(result) {
        if (result.totalFiles === 0)
            return '0.00';
        return ((result.successCount / result.totalFiles) * 100).toFixed(2);
    }
    /**
     * Generate migration report
     */
    generateReport(result) {
        const timestamp = new Date().toISOString();
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('CLOUDINARY MIGRATION REPORT');
        lines.push('='.repeat(80));
        lines.push(`Generated: ${timestamp}`);
        lines.push('');
        lines.push('SUMMARY');
        lines.push('-'.repeat(80));
        lines.push(`Total files processed: ${result.totalFiles}`);
        lines.push(`Successfully migrated: ${result.successCount}`);
        lines.push(`Failed: ${result.failureCount}`);
        lines.push(`Success rate: ${this.calculateSuccessRate(result)}%`);
        lines.push('');
        if (result.successes.length > 0) {
            lines.push('SUCCESSFUL MIGRATIONS');
            lines.push('-'.repeat(80));
            result.successes.forEach((success, index) => {
                lines.push(`${index + 1}. ${success.recordType.toUpperCase()} #${success.recordId}`);
                lines.push(`   Local: ${success.localPath}`);
                lines.push(`   Cloud: ${success.cloudinaryUrl}`);
                lines.push('');
            });
        }
        if (result.failures.length > 0) {
            lines.push('FAILED MIGRATIONS');
            lines.push('-'.repeat(80));
            result.failures.forEach((failure, index) => {
                lines.push(`${index + 1}. ${failure.recordType.toUpperCase()} #${failure.recordId}`);
                lines.push(`   Path: ${failure.localPath}`);
                lines.push(`   Error: ${failure.error}`);
                lines.push('');
            });
        }
        lines.push('='.repeat(80));
        lines.push('END OF REPORT');
        lines.push('='.repeat(80));
        return lines.join('\n');
    }
}
exports.MigrationService = MigrationService;
// Export singleton instance
exports.migrationService = new MigrationService();
exports.default = exports.migrationService;
