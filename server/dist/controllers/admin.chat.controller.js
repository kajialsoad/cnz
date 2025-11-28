"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatConversations = getChatConversations;
exports.getChatStatistics = getChatStatistics;
exports.getChatMessages = getChatMessages;
exports.sendChatMessage = sendChatMessage;
exports.markMessagesAsRead = markMessagesAsRead;
const chat_service_1 = require("../services/chat.service");
/**
 * Get all chat conversations
 */
async function getChatConversations(req, res) {
    try {
        const { search, district, upazila, ward, zone, cityCorporationCode, thanaId, status, unreadOnly, page, limit } = req.query;
        const result = await chat_service_1.chatService.getChatConversations({
            search: search,
            district: district,
            upazila: upazila,
            ward: ward,
            zone: zone,
            cityCorporationCode: cityCorporationCode,
            thanaId: thanaId ? parseInt(thanaId) : undefined,
            status: status,
            unreadOnly: unreadOnly === 'true',
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
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
        const statistics = await chat_service_1.chatService.getChatStatistics();
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
        const chatMessage = await chat_service_1.chatService.sendChatMessage({
            complaintId,
            senderId: req.user.sub,
            senderType: 'ADMIN',
            message: message.trim(),
            imageUrl,
            voiceUrl,
            imageFile
        });
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: chatMessage }
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
