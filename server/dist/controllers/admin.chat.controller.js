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
exports.getChatConversations = getChatConversations;
exports.getChatStatistics = getChatStatistics;
exports.getChatMessages = getChatMessages;
exports.sendChatMessage = sendChatMessage;
exports.markMessagesAsRead = markMessagesAsRead;
const chat_service_1 = require("../services/chat.service");
const cloud_upload_service_1 = require("../services/cloud-upload.service");
const cloudinary_config_1 = require("../config/cloudinary.config");
const multi_zone_service_1 = require("../services/multi-zone.service");
const complaint_notification_service_1 = require("../services/complaint-notification.service");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get all chat conversations - shows ALL complaints for messaging
 * Each complaint has its own chat entry (complaint-centric view)
 * ✅ FIXED: Added proper admin user context (matching All Complaints page)
 */
async function getChatConversations(req, res) {
    try {
        const { search, ward, zone, cityCorporationCode, unreadOnly, page, limit } = req.query;
        // Get allowed zones for Super Admin
        let allowedZoneIds;
        if (req.user?.role === 'SUPER_ADMIN') {
            allowedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        // Prepare admin user info for filtering (MATCHING admin.complaint.controller.ts)
        let adminUser;
        if (req.user) {
            // Fetch full user data to get permissions
            const prisma = (await Promise.resolve().then(() => __importStar(require('../utils/prisma')))).default;
            const fullUser = await prisma.user.findUnique({
                where: { id: req.user.sub },
                select: {
                    role: true,
                    cityCorporationCode: true,
                    permissions: true
                }
            });
            if (fullUser) {
                adminUser = {
                    role: fullUser.role,
                    cityCorporationCode: fullUser.cityCorporationCode || undefined,
                    permissions: fullUser.permissions || undefined
                };
                console.log(`🔐 Chat filtering for ${fullUser.role} ${req.user.sub}:`, {
                    cityCorporation: adminUser.cityCorporationCode,
                    permissions: adminUser.permissions
                });
            }
        }
        // Get all complaints with their chat messages (complaint-centric)
        const result = await chat_service_1.chatService.getAllCitizensForChat({
            search: search,
            ward: ward,
            zone: zone,
            cityCorporationCode: cityCorporationCode,
            unreadOnly: unreadOnly === 'true',
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            allowedZoneIds,
            adminUser // Pass full admin user object
        });
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getChatConversations:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat conversations'
        });
    }
}
/**
 * Get chat statistics
 */
async function getChatStatistics(req, res) {
    try {
        // Get allowed zones for Super Admin
        let allowedZoneIds;
        if (req.user?.role === 'SUPER_ADMIN') {
            allowedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        // Prepare admin user info for filtering
        let adminUser;
        if (req.user) {
            const prisma = (await Promise.resolve().then(() => __importStar(require('../utils/prisma')))).default;
            const fullUser = await prisma.user.findUnique({
                where: { id: req.user.sub },
                select: {
                    role: true,
                    cityCorporationCode: true,
                    permissions: true
                }
            });
            if (fullUser) {
                adminUser = {
                    role: fullUser.role,
                    cityCorporationCode: fullUser.cityCorporationCode || undefined,
                    permissions: fullUser.permissions || undefined
                };
            }
        }
        const statistics = await chat_service_1.chatService.getChatStatistics(allowedZoneIds, adminUser);
        res.status(200).json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        console.error('Error in getChatStatistics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat statistics'
        });
    }
}
/**
 * Get chat messages for a complaint
 */
async function getChatMessages(req, res) {
    try {
        const complaintId = parseInt(req.params.complaintId);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        const { page, limit } = req.query;
        const result = await chat_service_1.chatService.getChatMessages(complaintId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        });
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getChatMessages:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
        });
    }
}
/**
 * Send a chat message
 */
async function sendChatMessage(req, res) {
    try {
        const complaintId = parseInt(req.params.complaintId);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        const { message, imageUrl, voiceUrl } = req.body;
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Get uploaded image file if present
        const imageFile = req.file;
        let finalImageUrl = imageUrl;
        // If an image file was uploaded, upload it to Cloudinary
        if (imageFile && (0, cloudinary_config_1.isCloudinaryEnabled)()) {
            try {
                console.log('📤 Uploading chat image to Cloudinary...');
                const uploadResult = await cloud_upload_service_1.cloudUploadService.uploadImage(imageFile, 'chat');
                finalImageUrl = uploadResult.secure_url;
                console.log('✅ Chat image uploaded to Cloudinary:', finalImageUrl);
            }
            catch (error) {
                console.error('❌ Failed to upload chat image to Cloudinary:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image'
                });
            }
        }
        const { message: sentMessage, botMessage } = await chat_service_1.chatService.sendChatMessage({
            complaintId,
            senderId: req.user.sub,
            senderType: 'ADMIN',
            message: message.trim(),
            imageUrl: finalImageUrl,
            voiceUrl
        });
        // Get complaint and admin info for notification
        const complaint = await prisma_1.default.complaint.findUnique({
            where: { id: complaintId },
            select: { userId: true }
        });
        const admin = await prisma_1.default.user.findUnique({
            where: { id: req.user.sub },
            select: { firstName: true, lastName: true }
        });
        // Create notification for the user (NO Firebase needed!)
        if (complaint?.userId) {
            const adminName = `${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() || 'Admin';
            await (0, complaint_notification_service_1.createComplaintChatNotification)(complaint.userId, complaintId, adminName, message.trim());
        }
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                message: sentMessage,
                botMessage // Return bot message so frontend can display it if needed
            },
            notificationCreated: true
        });
    }
    catch (error) {
        console.error('Error in sendChatMessage:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send message'
        });
    }
}
/**
 * Mark messages as read
 */
async function markMessagesAsRead(req, res) {
    try {
        const complaintId = parseInt(req.params.complaintId);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const result = await chat_service_1.chatService.markMessagesAsRead(complaintId, req.user.sub, 'ADMIN');
        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
            data: result
        });
    }
    catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to mark messages as read'
        });
    }
}
