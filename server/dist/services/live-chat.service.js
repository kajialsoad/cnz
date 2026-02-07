"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChatService = void 0;
const client_1 = require("@prisma/client");
const bot_message_service_1 = require("./bot-message.service");
const prisma = new client_1.PrismaClient();
class LiveChatService {
    async getUserAdmin(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true }
        });
        if (!user)
            throw new Error('User not found');
        if (!user.wardId && !user.zoneId)
            throw new Error('User has no assigned ward or zone');
        // Try to find ward admin - check both wardId column and permissions JSON
        if (user.wardId) {
            // First try: Check wardId column (old system)
            let wardAdmin = await prisma.user.findFirst({
                where: {
                    role: 'ADMIN',
                    wardId: user.wardId,
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    designation: true,
                    phone: true,
                    ward: { select: { id: true, number: true, wardNumber: true } },
                    zone: { select: { id: true, number: true, name: true } }
                }
            });
            if (wardAdmin)
                return wardAdmin;
            // Second try: Check permissions JSON (new system)
            const allAdmins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    designation: true,
                    phone: true,
                    permissions: true,
                    ward: { select: { id: true, number: true, wardNumber: true } },
                    zone: { select: { id: true, number: true, name: true } }
                }
            });
            // Check each admin's permissions for matching ward
            for (const admin of allAdmins) {
                if (admin.permissions) {
                    try {
                        const perms = typeof admin.permissions === 'string'
                            ? JSON.parse(admin.permissions)
                            : admin.permissions;
                        if (perms.wards && Array.isArray(perms.wards) && perms.wards.includes(user.wardId)) {
                            return admin;
                        }
                    }
                    catch (error) {
                        console.error('Error parsing admin permissions:', error);
                    }
                }
            }
        }
        // If no ward admin found, try zone super admin
        if (user.zoneId) {
            const superAdmin = await prisma.user.findFirst({
                where: {
                    role: 'SUPER_ADMIN',
                    zoneId: user.zoneId,
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    designation: true,
                    phone: true,
                    ward: { select: { id: true, number: true, wardNumber: true } },
                    zone: { select: { id: true, number: true, name: true } }
                }
            });
            if (superAdmin)
                return superAdmin;
        }
        return null;
    }
    async getUserMessages(userId, options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 1000;
        const skip = (page - 1) * limit;
        // We no longer filter by specific adminId. 
        // Users should see the full conversation history with ALL admins.
        const whereCondition = {
            OR: [
                { senderId: userId }, // Messages sent by user
                { receiverId: userId } // Messages received by user (from any admin)
            ]
        };
        const [messages, total] = await Promise.all([
            prisma.chatMessage.findMany({
                where: whereCondition,
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.chatMessage.count({
                where: whereCondition
            })
        ]);
        return {
            messages: messages.reverse(),
            total,
            page,
            limit,
            hasMore: skip + messages.length < total
        };
    }
    async sendUserMessage(userId, data) {
        const admin = await this.getUserAdmin(userId);
        if (!admin)
            throw new Error('No admin assigned to your ward');
        // Create user message
        const message = await prisma.chatMessage.create({
            data: {
                content: data.content,
                type: data.type || client_1.ChatMessageType.TEXT,
                fileUrl: data.fileUrl,
                voiceUrl: data.voiceUrl,
                senderId: userId,
                receiverId: admin.id,
                senderType: client_1.SenderType.CITIZEN,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });
        // Check if bot should trigger
        try {
            const conversationId = `live-chat-user-${userId}`;
            // Check if admin has replied to this user
            const hasAdminReplied = await this.hasAdminRepliedToUser(userId, admin.id);
            // Handle user message for bot state tracking
            await bot_message_service_1.botMessageService.handleUserMessage({
                chatType: client_1.ChatType.LIVE_CHAT,
                conversationId
            });
            // Check if bot should send a message
            const botTrigger = await bot_message_service_1.botMessageService.shouldTriggerBot({
                chatType: client_1.ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied
            });
            // If bot should send, insert bot message
            if (botTrigger.shouldSend && botTrigger.botMessage) {
                console.log(`[BOT] Bot trigger detected! shouldSend=${botTrigger.shouldSend}, step=${botTrigger.step}`);
                // Get user's language preference
                const userWithLanguage = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { preferredLanguage: true }
                });
                // Use Bangla content if user's language is 'bn', otherwise use English
                const messageContent = userWithLanguage?.preferredLanguage === 'bn'
                    ? (botTrigger.botMessage.contentBn || botTrigger.botMessage.content)
                    : botTrigger.botMessage.content;
                console.log(`[BOT] Creating bot message: content="${messageContent.substring(0, 50)}...", language=${userWithLanguage?.preferredLanguage || 'en'}`);
                const botMessage = await prisma.chatMessage.create({
                    data: {
                        content: messageContent,
                        type: client_1.ChatMessageType.TEXT,
                        senderId: admin.id, // Bot messages appear to come from admin
                        receiverId: userId,
                        senderType: client_1.SenderType.BOT,
                        isRead: false
                    }
                });
                console.log(`[BOT] ✅ Bot message created successfully! ID=${botMessage.id}, step=${botTrigger.step}, conversationId=${conversationId}`);
            }
            else {
                console.log(`[BOT] Bot NOT triggered. shouldSend=${botTrigger.shouldSend}, hasMessage=${!!botTrigger.botMessage}`);
            }
        }
        catch (error) {
            console.error('Error handling bot trigger:', error);
            // Don't throw - bot failure shouldn't break user messaging
        }
        return message;
    }
    async sendAdminMessage(adminId, userId, data) {
        const [admin, user] = await Promise.all([
            prisma.user.findUnique({
                where: { id: adminId },
                select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true }
            })
        ]);
        if (!admin)
            throw new Error('Admin not found');
        if (!user)
            throw new Error('User not found');
        const hasAccess = this.checkAdminAccess(admin, user);
        if (!hasAccess)
            throw new Error('Admin does not have access to this user');
        // ✅ CRITICAL: Deactivate bot BEFORE sending admin message
        // This ensures bot is deactivated SYNCHRONOUSLY and IMMEDIATELY
        try {
            const conversationId = `live-chat-user-${userId}`;
            console.log(`[BOT] 🛑 Admin sending message - IMMEDIATELY deactivating bot for conversation ${conversationId}`);
            await bot_message_service_1.botMessageService.handleAdminReply({
                chatType: client_1.ChatType.LIVE_CHAT,
                conversationId
            });
            console.log(`[BOT] ✅ Bot deactivated BEFORE admin message sent`);
        }
        catch (error) {
            console.error('❌ Error handling admin reply for bot:', error);
            // Don't throw - bot failure shouldn't break admin messaging
        }
        const message = await prisma.chatMessage.create({
            data: {
                content: data.content,
                type: data.type || client_1.ChatMessageType.TEXT,
                fileUrl: data.fileUrl,
                voiceUrl: data.voiceUrl,
                senderId: adminId,
                receiverId: userId,
                senderType: client_1.SenderType.ADMIN,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });
        return message;
    }
    async markMessagesAsRead(senderId, receiverId) {
        // Mark ALL unread messages from this sender as read, regardless of who the original receiver was.
        // This allows any admin to mark user messages as read (Shared Inbox behavior).
        const result = await prisma.chatMessage.updateMany({
            where: {
                senderId,
                isRead: false
            },
            data: { isRead: true }
        });
        return { updated: result.count };
    }
    async getAllUserConversations(adminId, filters = {}, requestingUser) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true }
        });
        if (!admin)
            throw new Error('Admin not found');
        const userWhere = { role: 'CUSTOMER' };
        // Apply status filter (default to ACTIVE if not specified or if 'ALL' is not passed)
        if (filters.status && filters.status !== 'ALL') {
            userWhere.status = filters.status;
        }
        else if (!filters.status) {
            userWhere.status = 'ACTIVE';
        }
        // Apply role-based filtering (matching UserManagement logic)
        console.log('🔍 Live Chat Filtering - Admin Role:', admin.role, 'RequestingUser:', requestingUser);
        if (admin.role === 'ADMIN') {
            // ADMIN: Restrict to assigned ward(s) from permissions
            // Fetch full admin data to get permissions
            const fullAdmin = await prisma.user.findUnique({
                where: { id: adminId },
                select: { permissions: true }
            });
            let adminWardIds = [];
            if (fullAdmin && fullAdmin.permissions) {
                try {
                    const permissionsData = typeof fullAdmin.permissions === 'string'
                        ? JSON.parse(fullAdmin.permissions)
                        : fullAdmin.permissions;
                    if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                        adminWardIds = permissionsData.wards;
                    }
                }
                catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }
            // Add the admin's own wardId to the list if it exists (Legacy support)
            if (admin.wardId && !adminWardIds.includes(admin.wardId)) {
                adminWardIds.push(admin.wardId);
            }
            console.log(`🔒 ADMIN assigned wards: [${adminWardIds.join(', ')}]`);
            if (adminWardIds.length > 0) {
                // Filter by assigned ward IDs (multiple ward support)
                userWhere.wardId = { in: adminWardIds };
            }
            else {
                // No wards assigned = no users visible
                console.log('⚠️ ADMIN has no assigned wards - returning empty result');
                return {
                    conversations: [],
                    total: 0,
                    page,
                    limit,
                    hasMore: false
                };
            }
        }
        else if (admin.role === 'SUPER_ADMIN') {
            // SUPER_ADMIN: Filter by their assigned zones (multi-zone support)
            if (requestingUser && requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                // Multi-zone filtering
                userWhere.zoneId = { in: requestingUser.assignedZoneIds };
            }
            else if (admin.zoneId) {
                // Fallback to single zone for backward compatibility
                userWhere.zoneId = admin.zoneId;
            }
            else {
                // No zones assigned = no users visible
                return {
                    conversations: [],
                    total: 0,
                    page,
                    limit,
                    hasMore: false
                };
            }
        }
        // MASTER_ADMIN: No automatic filtering - allows access to all users
        console.log('🔍 Live Chat - Final userWhere query:', JSON.stringify(userWhere, null, 2));
        if (filters.cityCorporationCode)
            userWhere.cityCorporationCode = filters.cityCorporationCode;
        if (filters.zoneId)
            userWhere.zoneId = filters.zoneId;
        if (filters.wardId)
            userWhere.wardId = filters.wardId;
        if (filters.search) {
            console.log('🔍 Applying search filter:', filters.search);
            userWhere.OR = [
                { firstName: { contains: filters.search } },
                { lastName: { contains: filters.search } },
                { phone: { contains: filters.search } }
            ];
        }
        const users = await prisma.user.findMany({ where: { ...userWhere }, select: { id: true, firstName: true, lastName: true, phone: true, avatar: true, wardId: true, zoneId: true, cityCorporationCode: true, ward: { select: { id: true, wardNumber: true } }, zone: { select: { id: true, name: true } } }, skip, take: limit });
        const conversations = await Promise.all(users.map(async (user) => {
            // Modified to show LAST MESSAGE from/to this user regardless of who the other party is (shared inbox)
            const [lastMessage, unreadCount] = await Promise.all([
                prisma.chatMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: user.id }, // Sent by user
                            { receiverId: user.id } // Received by user
                        ]
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.chatMessage.count({
                    where: {
                        senderId: user.id,
                        isRead: false
                        // Count ALL unread messages from this user, regardless of receiverId
                    }
                })
            ]);
            return { user, lastMessage, unreadCount };
        }));
        let filteredConversations = conversations;
        if (filters.unreadOnly) {
            filteredConversations = conversations.filter((c) => c.unreadCount > 0);
        }
        filteredConversations.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt?.getTime() || 0;
            const bTime = b.lastMessage?.createdAt?.getTime() || 0;
            return bTime - aTime;
        });
        const total = await prisma.user.count({
            where: {
                ...userWhere
            }
        });
        return {
            conversations: filteredConversations,
            total,
            page,
            limit,
            hasMore: skip + filteredConversations.length < total
        };
    }
    async getUnreadCount(userId) { const count = await prisma.chatMessage.count({ where: { receiverId: userId, isRead: false } }); return { count }; }
    async getStatistics(adminId) {
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true }
        });
        if (!admin)
            throw new Error('Admin not found');
        const userWhere = {
            id: { not: adminId } // Exclude self
        };
        // MASTER_ADMIN, SUPER_ADMIN, ADMIN: No automatic filtering
        const [totalConversations, unreadMessages, todayMessages] = await Promise.all([
            prisma.user.count({ where: { ...userWhere } }),
            prisma.chatMessage.count({ where: { receiverId: adminId, isRead: false } }),
            prisma.chatMessage.count({
                where: {
                    OR: [{ senderId: adminId }, { receiverId: adminId }],
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            })
        ]);
        return { totalConversations, unreadMessages, todayMessages };
    }
    checkAdminAccess(admin, user) {
        // Allow all admin types to message any user
        if (['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
            return true;
        }
        return false;
    }
    /**
     * Check if admin has replied to user in this conversation
     * Used for bot trigger logic
     */
    async hasAdminRepliedToUser(userId, adminId) {
        const adminMessage = await prisma.chatMessage.findFirst({
            where: {
                senderId: adminId,
                receiverId: userId,
                senderType: client_1.SenderType.ADMIN
            }
        });
        return adminMessage !== null;
    }
}
exports.LiveChatService = LiveChatService;
const liveChatService = new LiveChatService();
exports.default = liveChatService;
