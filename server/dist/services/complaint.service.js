"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintService = exports.ComplaintService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const upload_service_1 = require("./upload.service");
const upload_config_1 = require("../config/upload.config");
const category_service_1 = require("./category.service");
class ComplaintService {
    // Create a new complaint
    async createComplaint(input) {
        try {
            // Validate category and subcategory combination
            if (!category_service_1.categoryService.validateCategorySubcategory(input.category, input.subcategory)) {
                const validSubcategories = category_service_1.categoryService.getAllSubcategoryIds(input.category);
                throw new Error(`Invalid category and subcategory combination. Category '${input.category}' does not have subcategory '${input.subcategory}'. Valid subcategories: ${validSubcategories.join(', ')}`);
            }
            // Generate tracking number
            const trackingNumber = await this.generateTrackingNumber();
            let finalImageUrls = [];
            let finalAudioUrls = [];
            // Process uploaded files if provided
            if (input.uploadedFiles) {
                const files = input.uploadedFiles;
                // With .any(), files come as an array, need to separate by fieldname
                if (Array.isArray(files)) {
                    const imageFiles = files.filter((f) => f.fieldname === 'images');
                    const audioFiles = files.filter((f) => f.fieldname === 'audioFiles');
                    if (imageFiles.length > 0) {
                        finalImageUrls = imageFiles.map((file) => (0, upload_config_1.getFileUrl)(file.filename, 'image'));
                    }
                    if (audioFiles.length > 0) {
                        finalAudioUrls = audioFiles.map((file) => (0, upload_config_1.getFileUrl)(file.filename, 'voice'));
                    }
                }
                else {
                    // Fallback for .fields() format (if we ever switch back)
                    if (files.images) {
                        const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
                        finalImageUrls = imageFiles.map((file) => (0, upload_config_1.getFileUrl)(file.filename, 'image'));
                    }
                    if (files.audioFiles) {
                        const audioFilesArray = Array.isArray(files.audioFiles) ? files.audioFiles : [files.audioFiles];
                        finalAudioUrls = audioFilesArray.map((file) => (0, upload_config_1.getFileUrl)(file.filename, 'voice'));
                    }
                }
            }
            // Add URLs from direct input
            if (input.imageUrls && input.imageUrls.length > 0) {
                finalImageUrls = [...finalImageUrls, ...input.imageUrls];
            }
            if (input.voiceNoteUrl) {
                finalAudioUrls.push(input.voiceNoteUrl);
            }
            // Auto-generate title from description if not provided
            const title = input.title || this.generateTitleFromDescription(input.description);
            // Handle location formatting
            let locationString;
            if (typeof input.location === 'string') {
                locationString = input.location;
            }
            else {
                locationString = `${input.location.address}, ${input.location.district}, ${input.location.thana}, Ward: ${input.location.ward}`;
            }
            // Create complaint
            const complaint = await prisma_1.default.complaint.create({
                data: {
                    title: title,
                    description: input.description,
                    category: input.category,
                    subcategory: input.subcategory,
                    priority: input.priority || 1, // Default priority is 1
                    status: client_1.ComplaintStatus.PENDING,
                    imageUrl: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
                    audioUrl: finalAudioUrls.length > 0 ? JSON.stringify(finalAudioUrls) : null,
                    userId: input.forSomeoneElse ? undefined : (input.userId ?? undefined),
                    location: locationString
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            });
            return this.formatComplaintResponse(complaint);
        }
        catch (error) {
            console.error('Error creating complaint:', error);
            throw new Error(`Failed to create complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Helper method to generate title from description
    generateTitleFromDescription(description) {
        // Take first 50 characters of description as title
        const maxLength = 50;
        if (description.length <= maxLength) {
            return description;
        }
        // Find last space within maxLength to avoid cutting words
        const trimmed = description.substring(0, maxLength);
        const lastSpace = trimmed.lastIndexOf(' ');
        return lastSpace > 0 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...';
    }
    // Get complaint by ID
    async getComplaintById(id, userId) {
        try {
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Check if user can access this complaint (users can only view their own complaints)
            if (userId && complaint.userId !== userId) {
                throw new Error('Unauthorized to view this complaint');
            }
            return this.formatComplaintResponse(complaint);
        }
        catch (error) {
            console.error('Error getting complaint:', error);
            throw error;
        }
    }
    // Update complaint
    async updateComplaint(id, input, userId) {
        try {
            // Check if complaint exists and user has permission
            const existingComplaint = await this.getComplaintById(id, userId);
            let finalImageUrls = [];
            let finalVoiceUrl;
            // Process uploaded files if provided
            if (input.uploadedFiles) {
                const uploadedFiles = await upload_service_1.uploadService.processUploadedFiles(input.uploadedFiles);
                // Get image URLs
                if (uploadedFiles.images && uploadedFiles.images.length > 0) {
                    finalImageUrls = uploadedFiles.images.map(img => img.url);
                }
                // Get voice URL
                if (uploadedFiles.voice) {
                    finalVoiceUrl = uploadedFiles.voice.url;
                }
            }
            // Add URLs from direct input
            if (input.imageUrls && input.imageUrls.length > 0) {
                if (input.replaceFiles) {
                    finalImageUrls = [...input.imageUrls];
                }
                else {
                    finalImageUrls = [...finalImageUrls, ...input.imageUrls];
                }
            }
            if (input.voiceNoteUrl && !finalVoiceUrl) {
                finalVoiceUrl = input.voiceNoteUrl;
            }
            // Validate category/subcategory if both are being updated
            if (input.category !== undefined && input.subcategory !== undefined) {
                if (!category_service_1.categoryService.validateCategorySubcategory(input.category, input.subcategory)) {
                    const validSubcategories = category_service_1.categoryService.getAllSubcategoryIds(input.category);
                    throw new Error(`Invalid category and subcategory combination. Category '${input.category}' does not have subcategory '${input.subcategory}'. Valid subcategories: ${validSubcategories.join(', ')}`);
                }
            }
            // Prepare update data
            const updateData = {};
            if (input.title !== undefined)
                updateData.title = input.title;
            if (input.description !== undefined)
                updateData.description = input.description;
            if (input.category !== undefined)
                updateData.category = input.category;
            if (input.subcategory !== undefined)
                updateData.subcategory = input.subcategory;
            if (input.priority !== undefined)
                updateData.priority = input.priority;
            if (input.status !== undefined)
                updateData.status = input.status;
            // Handle file URLs - combine existing with new if not replacing
            if (finalImageUrls.length > 0 || finalVoiceUrl || input.replaceFiles) {
                let currentImageUrls = [];
                let currentVoiceUrl;
                // Parse existing files if not replacing
                if (!input.replaceFiles && existingComplaint.imageUrl) {
                    const parsed = this.parseFileUrls(existingComplaint.imageUrl);
                    currentImageUrls = parsed.imageUrls;
                    currentVoiceUrl = parsed.voiceUrl;
                }
                // Merge URLs
                const allImageUrls = input.replaceFiles
                    ? finalImageUrls
                    : [...currentImageUrls, ...finalImageUrls];
                const voiceUrl = finalVoiceUrl || currentVoiceUrl;
                // Format for storage
                updateData.imageUrl = this.formatFileUrlsForStorage(allImageUrls, voiceUrl);
            }
            // Update complaint
            const complaint = await prisma_1.default.complaint.update({
                where: { id },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            });
            // Update location string if provided
            if (input.location) {
                const locationString = `${input.location.address || ''}, ${input.location.district || ''}, ${input.location.thana || ''}, Ward: ${input.location.ward || ''}`;
                await prisma_1.default.complaint.update({
                    where: { id },
                    data: { location: locationString }
                });
            }
            // Convert stored data back to structured format for response
            const responseComplaint = this.formatComplaintResponse(complaint);
            return responseComplaint;
        }
        catch (error) {
            console.error('Error updating complaint:', error);
            // Clean up uploaded files on error
            if (input.uploadedFiles) {
                await upload_service_1.uploadService.cleanupFiles(input.uploadedFiles);
            }
            throw error;
        }
    }
    // Delete/Cancel complaint
    async deleteComplaint(id, userId) {
        try {
            // Check if complaint exists and user has permission
            await this.getComplaintById(id, userId);
            // Instead of hard delete, update status to rejected
            const complaint = await prisma_1.default.complaint.update({
                where: { id },
                data: {
                    status: client_1.ComplaintStatus.REJECTED
                }
            });
            return {
                success: true,
                message: 'Complaint cancelled successfully',
                complaint
            };
        }
        catch (error) {
            console.error('Error cancelling complaint:', error);
            throw error;
        }
    }
    // Get complaint statistics (for dashboard)
    async getComplaintStats(userId) {
        try {
            const where = userId ? { userId } : {};
            const [total, pending, inProgress, resolved, rejected] = await Promise.all([
                prisma_1.default.complaint.count({ where }),
                prisma_1.default.complaint.count({ where: { ...where, status: client_1.ComplaintStatus.PENDING } }),
                prisma_1.default.complaint.count({ where: { ...where, status: client_1.ComplaintStatus.IN_PROGRESS } }),
                prisma_1.default.complaint.count({ where: { ...where, status: client_1.ComplaintStatus.RESOLVED } }),
                prisma_1.default.complaint.count({ where: { ...where, status: client_1.ComplaintStatus.REJECTED } })
            ]);
            return {
                total,
                pending,
                inProgress,
                resolved,
                rejected,
                activeComplaints: total - rejected,
            };
        }
        catch (error) {
            console.error('Error getting complaint stats:', error);
            throw new Error('Failed to fetch complaint statistics');
        }
    }
    // Generate unique tracking number
    async generateTrackingNumber() {
        const prefix = 'CC';
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${timestamp.slice(-6)}${random}`;
    }
    // Get complaints by status for user
    async getComplaintsByStatus(userId, status) {
        try {
            const complaints = await prisma_1.default.complaint.findMany({
                where: {
                    userId,
                    status
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return complaints.map(complaint => this.formatComplaintResponse(complaint));
        }
        catch (error) {
            console.error('Error getting complaints by status:', error);
            throw new Error('Failed to fetch complaints by status');
        }
    }
    // Search complaints
    async searchComplaints(searchTerm, userId) {
        try {
            const where = {
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                    { trackingNumber: { contains: searchTerm, mode: 'insensitive' } },
                ]
            };
            if (userId) {
                where.userId = userId;
            }
            const complaints = await prisma_1.default.complaint.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return complaints.map(complaint => this.formatComplaintResponse(complaint));
        }
        catch (error) {
            console.error('Error searching complaints:', error);
            throw new Error('Failed to search complaints');
        }
    }
    // Helper method to parse file URLs from stored string
    parseFileUrls(imageUrlString) {
        const imageUrls = [];
        let voiceUrl;
        if (!imageUrlString) {
            return { imageUrls };
        }
        // Try to parse as JSON first (new format)
        try {
            const parsed = JSON.parse(imageUrlString);
            if (Array.isArray(parsed)) {
                return { imageUrls: parsed };
            }
        }
        catch (error) {
            // Not JSON, fall back to comma-separated parsing (old format)
        }
        // Parse comma-separated format (legacy)
        const parts = imageUrlString.split(',').map(part => part.trim()).filter(part => part);
        parts.forEach(part => {
            if (part.startsWith('voice:')) {
                voiceUrl = part.substring(6); // Remove 'voice:' prefix
            }
            else {
                imageUrls.push(part);
            }
        });
        return { imageUrls, voiceUrl };
    }
    // Helper method to format file URLs for storage
    formatFileUrlsForStorage(imageUrls, voiceUrl) {
        const parts = [];
        // Add image URLs
        imageUrls.forEach(url => {
            if (url && url.trim()) {
                parts.push(url.trim());
            }
        });
        // Add voice URL with prefix
        if (voiceUrl && voiceUrl.trim()) {
            parts.push(`voice:${voiceUrl.trim()}`);
        }
        return parts.join(',');
    }
    // Helper method to format complaint response with structured file URLs
    formatComplaintResponse(complaint) {
        const parsedImages = this.parseFileUrls(complaint.imageUrl || '');
        const parsedAudio = this.parseFileUrls(complaint.audioUrl || '');
        return {
            ...complaint,
            imageUrls: parsedImages.imageUrls,
            audioUrls: parsedAudio.imageUrls, // audioUrls are stored in imageUrls field of parsed result
            voiceNoteUrl: parsedAudio.imageUrls[0], // First audio URL for backward compatibility
            // Keep original fields for backward compatibility
            imageUrl: complaint.imageUrl,
            audioUrl: complaint.audioUrl
        };
    }
    // Update getComplaints to return formatted responses
    async getComplaints(query = {}) {
        try {
            const result = await this.getComplaintsRaw(query);
            return {
                ...result,
                data: result.data.map(complaint => this.formatComplaintResponse(complaint))
            };
        }
        catch (error) {
            throw error;
        }
    }
    // Raw method for internal use
    async getComplaintsRaw(query = {}) {
        const { page = 1, limit = 10, status, category, subcategory, priority, sortBy = 'createdAt', sortOrder = 'desc', userId } = query;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (subcategory)
            where.subcategory = subcategory;
        if (priority)
            where.priority = priority;
        if (userId)
            where.userId = userId;
        // Build order by clause
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const [complaints, total] = await Promise.all([
            prisma_1.default.complaint.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            }),
            prisma_1.default.complaint.count({ where })
        ]);
        return {
            data: complaints,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            }
        };
    }
}
exports.ComplaintService = ComplaintService;
exports.complaintService = new ComplaintService();
