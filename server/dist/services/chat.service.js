"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const bot_message_service_1 = require("./bot-message.service");
class ChatService {
    /**
     * Get all complaints with their chat messages (complaint-centric view)
     * ✅ FIXED: Using EXACT same filtering logic as admin-complaint.service.ts
     * Each complaint appears as a separate chat entry
     */
    async getAllCitizensForChat(input) {
        const { search, ward, zone, cityCorporationCode, unreadOnly = false, page = 1, limit = 20, allowedZoneIds, adminUser } = input;
        const skip = (page - 1) * limit;
        // Build where clause for complaints
        const andConditions = [];
        // ========================================
        // ROLE-BASED FILTERING (MATCHING admin-complaint.service.ts EXACTLY)
        // ========================================
        // ADMIN Role: Ward-based filtering (Zone IGNORED)
        if (adminUser && adminUser.role === 'ADMIN') {
            console.log('🔒 ADMIN filtering: Ward-based only, Zone IGNORED');
            // 1. City Corporation Match (MANDATORY)
            if (adminUser.cityCorporationCode) {
                andConditions.push({
                    OR: [
                        { complaintCityCorporationCode: adminUser.cityCorporationCode },
                        {
                            AND: [
                                { complaintCityCorporationCode: null },
                                { cityCorporationCode: adminUser.cityCorporationCode }
                            ]
                        }
                    ]
                });
            }
            // 2. Ward Match (MANDATORY) - Multiple Ward Support
            let adminWardIds = [];
            // Parse ward IDs from permissions JSON
            if (adminUser.permissions) {
                try {
                    const permissionsData = JSON.parse(adminUser.permissions);
                    if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                        adminWardIds = permissionsData.wards;
                    }
                }
                catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }
            console.log(`🔒 ADMIN assigned wards: [${adminWardIds.join(', ')}]`);
            if (adminWardIds.length > 0) {
                // Filter by assigned ward IDs
                andConditions.push({
                    OR: [
                        { complaintWardId: { in: adminWardIds } },
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: { in: adminWardIds } }
                            ]
                        }
                    ]
                });
            }
            else {
                // No wards assigned = no complaints visible
                console.log('⚠️ ADMIN has no assigned wards - returning empty result');
                andConditions.push({ id: -1 });
            }
            // ⚠️ CRITICAL: Zone filtering is NOT applied for ADMIN role
            // Zone is COMPLETELY IGNORED for Admin
        }
        // SUPER_ADMIN Zone Filtering
        else if (allowedZoneIds && allowedZoneIds.length > 0) {
            console.log(`🔒 SUPER_ADMIN zone filtering: [${allowedZoneIds.join(', ')}]`);
            andConditions.push({
                OR: [
                    { complaintZoneId: { in: allowedZoneIds } },
                    {
                        AND: [
                            { complaintZoneId: null },
                            { zoneId: { in: allowedZoneIds } }
                        ]
                    }
                ]
            });
        }
        // Search filter
        if (search && search.trim()) {
            andConditions.push({
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                    { location: { contains: search } },
                    { user: { firstName: { contains: search } } },
                    { user: { lastName: { contains: search } } },
                    { user: { phone: { contains: search } } }
                ]
            });
        }
        // City Corporation filter (using complaint location)
        if (cityCorporationCode) {
            andConditions.push({
                OR: [
                    { complaintCityCorporationCode: cityCorporationCode },
                    {
                        AND: [
                            { complaintCityCorporationCode: null },
                            { cityCorporationCode: cityCorporationCode }
                        ]
                    }
                ]
            });
        }
        // Zone filter (using complaint location)
        if (zone) {
            const zoneId = parseInt(zone);
            if (!isNaN(zoneId)) {
                andConditions.push({
                    OR: [
                        { complaintZoneId: zoneId },
                        {
                            AND: [
                                { complaintZoneId: null },
                                { zoneId: zoneId }
                            ]
                        }
                    ]
                });
            }
        }
        // Ward filter (using complaint location)
        if (ward) {
            const wardId = parseInt(ward);
            if (!isNaN(wardId)) {
                andConditions.push({
                    OR: [
                        { complaintWardId: wardId },
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: wardId }
                            ]
                        }
                    ]
                });
            }
        }
        // Build final where clause
        const where = andConditions.length > 0 ? { AND: andConditions } : {};
        // Fetch complaints with their latest chat message
        const [complaints, total] = await Promise.all([
            prisma_1.default.complaint.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatar: true,
                            address: true,
                            cityCorporationCode: true,
                            zoneId: true,
                            wardId: true,
                            cityCorporation: {
                                select: {
                                    code: true,
                                    name: true
                                }
                            },
                            zone: {
                                select: {
                                    id: true,
                                    zoneNumber: true,
                                    name: true
                                }
                            },
                            ward: {
                                select: {
                                    id: true,
                                    wardNumber: true,
                                    inspectorName: true
                                }
                            }
                        }
                    },
                    complaintCityCorporation: {
                        select: {
                            code: true,
                            name: true
                        }
                    },
                    complaintZone: {
                        select: {
                            id: true,
                            zoneNumber: true,
                            name: true
                        }
                    },
                    complaintWard: {
                        select: {
                            id: true,
                            wardNumber: true,
                            inspectorName: true
                        }
                    },
                    chatMessages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            message: true,
                            imageUrl: true,
                            voiceUrl: true,
                            senderType: true,
                            read: true,
                            createdAt: true
                        }
                    }
                }
            }),
            prisma_1.default.complaint.count({ where })
        ]);
        // Format response - using 'chats' to match frontend expectation
        const chats = complaints.map(complaint => ({
            id: complaint.id,
            complaintId: complaint.id,
            trackingNumber: `C${String(complaint.id).padStart(6, '0')}`,
            complaintTitle: complaint.title,
            complaintCategory: complaint.category || 'UNCATEGORIZED',
            complaintStatus: complaint.status,
            complaintCreatedAt: complaint.createdAt,
            citizen: {
                id: complaint.user?.id,
                firstName: complaint.user?.firstName,
                lastName: complaint.user?.lastName,
                email: complaint.user?.email,
                phone: complaint.user?.phone,
                profilePicture: complaint.user?.avatar,
                address: complaint.user?.address,
                cityCorporationCode: complaint.user?.cityCorporationCode,
                cityCorporationName: complaint.user?.cityCorporation?.name,
                cityCorporation: complaint.user?.cityCorporation,
                zoneId: complaint.user?.zoneId,
                zone: complaint.user?.zone,
                wardId: complaint.user?.wardId,
                ward: complaint.user?.ward,
                district: complaint.user?.address || 'N/A',
                upazila: complaint.user?.address || 'N/A'
            },
            lastMessage: complaint.chatMessages[0] ? {
                id: complaint.chatMessages[0].id,
                text: complaint.chatMessages[0].message,
                imageUrl: complaint.chatMessages[0].imageUrl,
                voiceUrl: complaint.chatMessages[0].voiceUrl,
                senderType: complaint.chatMessages[0].senderType,
                read: complaint.chatMessages[0].read,
                timestamp: complaint.chatMessages[0].createdAt
            } : null,
            unreadCount: 0,
            totalMessages: 1,
            isNew: false,
            lastActivity: complaint.chatMessages[0]?.createdAt || complaint.createdAt
        }));
        return {
            chats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getChatStatistics(allowedZoneIds, adminUser) {
        const andConditions = [];
        // ADMIN Role: Ward-based filtering (matching getAllCitizensForChat)
        if (adminUser && adminUser.role === 'ADMIN') {
            // 1. City Corporation Match
            if (adminUser.cityCorporationCode) {
                andConditions.push({
                    OR: [
                        { complaintCityCorporationCode: adminUser.cityCorporationCode },
                        {
                            AND: [
                                { complaintCityCorporationCode: null },
                                { cityCorporationCode: adminUser.cityCorporationCode }
                            ]
                        }
                    ]
                });
            }
            // 2. Ward Match
            let adminWardIds = [];
            if (adminUser.permissions) {
                try {
                    const permissionsData = JSON.parse(adminUser.permissions);
                    if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                        adminWardIds = permissionsData.wards;
                    }
                }
                catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }
            if (adminWardIds.length > 0) {
                andConditions.push({
                    OR: [
                        { complaintWardId: { in: adminWardIds } },
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: { in: adminWardIds } }
                            ]
                        }
                    ]
                });
            }
            else {
                andConditions.push({ id: -1 });
            }
        }
        // SUPER_ADMIN Zone Filtering
        else if (allowedZoneIds && allowedZoneIds.length > 0) {
            andConditions.push({
                OR: [
                    { complaintZoneId: { in: allowedZoneIds } },
                    {
                        AND: [
                            { complaintZoneId: null },
                            { zoneId: { in: allowedZoneIds } }
                        ]
                    }
                ]
            });
        }
        const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};
        // Optimized query: Only count what is needed and support correct interface
        const [totalChats, unreadCount] = await Promise.all([
            prisma_1.default.complaint.count({ where: whereClause }),
            prisma_1.default.complaintChatMessage.count({
                where: {
                    complaint: whereClause,
                    read: false,
                    senderType: 'CITIZEN'
                }
            })
        ]);
        return {
            totalChats,
            unreadCount,
            byDistrict: [],
            byUpazila: [],
            byWard: [],
            byZone: [],
            byStatus: []
        };
    }
    async getChatMessages(complaintId, options = {}) {
        const { page = 1, limit = 50 } = options;
        const skip = (page - 1) * limit;
        const complaint = await prisma_1.default.complaint.findUnique({
            where: { id: complaintId },
            select: { id: true }
        });
        if (!complaint) {
            throw new Error('Complaint not found');
        }
        const [messages, total] = await Promise.all([
            prisma_1.default.complaintChatMessage.findMany({
                where: { complaintId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.complaintChatMessage.count({ where: { complaintId } })
        ]);
        return {
            messages: messages.reverse(),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    }
    async sendChatMessage(input) {
        const { complaintId, senderId, senderType, message, imageUrl, voiceUrl } = input;
        const complaint = await prisma_1.default.complaint.findUnique({
            where: { id: complaintId },
            select: { id: true, userId: true }
        });
        if (!complaint) {
            throw new Error('Complaint not found');
        }
        // ✅ CRITICAL: If admin is sending, deactivate bot BEFORE creating message
        if (senderType === 'ADMIN') {
            const conversationId = `complaint-${complaintId}`;
            try {
                console.log(`[BOT] 🛑 Admin sending message - IMMEDIATELY deactivating bot for complaint ${complaintId}`);
                await bot_message_service_1.botMessageService.handleAdminReply({
                    chatType: client_1.ChatType.COMPLAINT_CHAT,
                    conversationId
                });
                console.log(`[BOT] ✅ Bot deactivated BEFORE admin message sent`);
            }
            catch (error) {
                console.error('❌ Bot deactivation error:', error);
                // Don't throw - bot failures shouldn't break messaging
            }
        }
        const chatMessage = await prisma_1.default.complaintChatMessage.create({
            data: {
                complaintId,
                senderId,
                senderType,
                message,
                imageUrl,
                voiceUrl,
                read: false
            }
        });
        // ✅ Handle bot trigger SYNCHRONOUSLY for immediate response (only for citizen messages)
        let botMessage = null;
        if (senderType === 'CITIZEN') {
            const conversationId = `complaint-${complaintId}`;
            try {
                // Check if admin has replied
                const hasAdminReplied = await this.hasAdminRepliedToComplaint(complaintId);
                // Handle user message (increments counter if bot is inactive)
                await bot_message_service_1.botMessageService.handleUserMessage({
                    chatType: client_1.ChatType.COMPLAINT_CHAT,
                    conversationId
                });
                // Check if bot should send a message
                const botTrigger = await bot_message_service_1.botMessageService.shouldTriggerBot({
                    chatType: client_1.ChatType.COMPLAINT_CHAT,
                    conversationId,
                    hasAdminReplied
                });
                if (botTrigger.shouldSend && botTrigger.botMessage) {
                    // Insert bot message
                    botMessage = await prisma_1.default.complaintChatMessage.create({
                        data: {
                            complaintId,
                            senderId, // Bot appears to come from admin
                            senderType: 'BOT',
                            message: botTrigger.botMessage.content,
                            read: false
                        }
                    });
                    console.log(`✅ Bot message sent for complaint ${complaintId}, step ${botTrigger.step}`);
                }
            }
            catch (error) {
                console.error('Bot integration error:', error);
                // Don't throw - bot failures shouldn't break messaging
            }
        }
        // ✅ Create notification for user when admin sends message (async)
        if (senderType === 'ADMIN' && complaint.userId) {
            this.createNotificationAsync(complaint.userId, complaintId, message).catch(error => {
                console.error('❌ Error creating notification:', error);
            });
        }
        // ✅ Return both user message and bot message (if any)
        return {
            message: chatMessage,
            botMessage: botMessage
        };
    }
    async createNotificationAsync(userId, complaintId, message) {
        try {
            const notificationMessage = message && message.trim()
                ? (message.length > 100 ? message.substring(0, 100) + '...' : message)
                : 'আপনার অভিযোগ সম্পর্কে নতুন বার্তা';
            await prisma_1.default.notification.create({
                data: {
                    userId: userId,
                    type: 'COMPLAINT_CHAT_MESSAGE',
                    title: 'অভিযোগ নম্বর #' + complaintId + ' সম্পর্কে বার্তা',
                    message: notificationMessage,
                    complaintId: complaintId,
                    isRead: false
                }
            });
            console.log(`✅ Notification created for user ${userId} on complaint ${complaintId}`);
        }
        catch (error) {
            console.error('❌ Error creating notification:', error);
        }
    }
    async markMessagesAsRead(complaintId, userId, userType) {
        const result = await prisma_1.default.complaintChatMessage.updateMany({
            where: {
                complaintId,
                senderType: userType === 'ADMIN' ? 'CITIZEN' : 'ADMIN',
                read: false
            },
            data: {
                read: true
            }
        });
        return {
            updatedCount: result.count
        };
    }
    /**
     * Check if admin has replied to this complaint
     * Used for bot trigger logic
     */
    async hasAdminRepliedToComplaint(complaintId) {
        const adminMessage = await prisma_1.default.complaintChatMessage.findFirst({
            where: {
                complaintId,
                senderType: 'ADMIN'
            }
        });
        return adminMessage !== null;
    }
    /**
     * Handle bot trigger logic asynchronously
     * This runs in background without blocking message send
     */
    async handleBotTriggerAsync(complaintId, conversationId, senderId) {
        try {
            const hasAdminReplied = await this.hasAdminRepliedToComplaint(complaintId);
            // Handle user message (increments counter if bot is inactive)
            await bot_message_service_1.botMessageService.handleUserMessage({
                chatType: client_1.ChatType.COMPLAINT_CHAT,
                conversationId
            });
            // Check if bot should send a message
            const botTrigger = await bot_message_service_1.botMessageService.shouldTriggerBot({
                chatType: client_1.ChatType.COMPLAINT_CHAT,
                conversationId,
                hasAdminReplied
            });
            if (botTrigger.shouldSend && botTrigger.botMessage) {
                // Insert bot message
                await prisma_1.default.complaintChatMessage.create({
                    data: {
                        complaintId,
                        senderId, // Bot appears to come from admin
                        senderType: 'BOT',
                        message: botTrigger.botMessage.content,
                        read: false
                    }
                });
                console.log(`✅ Bot message sent for complaint ${complaintId}, step ${botTrigger.step}`);
            }
        }
        catch (error) {
            console.error('Error in handleBotTriggerAsync:', error);
            // Don't throw - bot failures shouldn't break messaging
        }
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
