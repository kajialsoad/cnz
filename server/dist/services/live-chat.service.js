"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChatService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LiveChatService {
    async getUserAdmin(userId) { const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true } }); if (!user)
        throw new Error('User not found'); if (!user.wardId && !user.zoneId)
        throw new Error('User has no assigned ward or zone'); if (user.wardId) {
        const wardAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN', wardId: user.wardId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, avatar: true, role: true, designation: true, phone: true, ward: { select: { id: true, number: true, wardNumber: true } }, zone: { select: { id: true, number: true, name: true } } } });
        if (wardAdmin)
            return wardAdmin;
    } if (user.zoneId) {
        const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', zoneId: user.zoneId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, avatar: true, role: true, designation: true, phone: true, ward: { select: { id: true, number: true, wardNumber: true } }, zone: { select: { id: true, number: true, name: true } } } });
        if (superAdmin)
            return superAdmin;
    } return null; }
    async getUserMessages(userId, options = {}) { const page = options.page || 1; const limit = options.limit || 50; const skip = (page - 1) * limit; let adminId = options.adminId; if (!adminId) {
        const admin = await this.getUserAdmin(userId);
        if (!admin)
            return { messages: [], total: 0, page, limit, hasMore: false };
        adminId = admin.id;
    } const [messages, total] = await Promise.all([prisma.chatMessage.findMany({ where: { OR: [{ senderId: userId, receiverId: adminId }, { senderId: adminId, receiverId: userId }] }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } }, orderBy: { createdAt: 'asc' }, skip, take: limit }), prisma.chatMessage.count({ where: { OR: [{ senderId: userId, receiverId: adminId }, { senderId: adminId, receiverId: userId }] } })]); return { messages, total, page, limit, hasMore: skip + messages.length < total }; }
    async sendUserMessage(userId, data) { const admin = await this.getUserAdmin(userId); if (!admin)
        throw new Error('No admin assigned to your ward'); const message = await prisma.chatMessage.create({ data: { content: data.content, type: data.type || client_1.ChatMessageType.TEXT, fileUrl: data.fileUrl, voiceUrl: data.voiceUrl, senderId: userId, receiverId: admin.id, senderType: client_1.SenderType.CITIZEN, isRead: false }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } } }); return message; }
    async sendAdminMessage(adminId, userId, data) { const [admin, user] = await Promise.all([prisma.user.findUnique({ where: { id: adminId }, select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true } }), prisma.user.findUnique({ where: { id: userId }, select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true } })]); if (!admin)
        throw new Error('Admin not found'); if (!user)
        throw new Error('User not found'); const hasAccess = this.checkAdminAccess(admin, user); if (!hasAccess)
        throw new Error('Admin does not have access to this user'); const message = await prisma.chatMessage.create({ data: { content: data.content, type: data.type || client_1.ChatMessageType.TEXT, fileUrl: data.fileUrl, voiceUrl: data.voiceUrl, senderId: adminId, receiverId: userId, senderType: client_1.SenderType.ADMIN, isRead: false }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } } }); return message; }
    async markMessagesAsRead(senderId, receiverId) { const result = await prisma.chatMessage.updateMany({ where: { senderId, receiverId, isRead: false }, data: { isRead: true } }); return { updated: result.count }; }
    async getAllUserConversations(adminId, filters = {}) { const page = filters.page || 1; const limit = filters.limit || 20; const skip = (page - 1) * limit; const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true } }); if (!admin)
        throw new Error('Admin not found'); const userWhere = { role: 'CUSTOMER', status: 'ACTIVE' }; if (admin.role === 'ADMIN') {
        userWhere.wardId = admin.wardId;
    }
    else if (admin.role === 'SUPER_ADMIN') {
        userWhere.zoneId = admin.zoneId;
    }
    else if (admin.role === 'MASTER_ADMIN') {
        userWhere.cityCorporationCode = admin.cityCorporationCode;
    } if (filters.cityCorporationCode)
        userWhere.cityCorporationCode = filters.cityCorporationCode; if (filters.zoneId)
        userWhere.zoneId = filters.zoneId; if (filters.wardId)
        userWhere.wardId = filters.wardId; if (filters.search) {
        userWhere.OR = [{ firstName: { contains: filters.search, mode: 'insensitive' } }, { lastName: { contains: filters.search, mode: 'insensitive' } }, { phone: { contains: filters.search } }];
    } const users = await prisma.user.findMany({ where: { ...userWhere, OR: [{ sentMessages: { some: { receiverId: adminId } } }, { receivedMessages: { some: { senderId: adminId } } }] }, select: { id: true, firstName: true, lastName: true, phone: true, avatar: true, wardId: true, zoneId: true, cityCorporationCode: true, ward: { select: { id: true, wardNumber: true } }, zone: { select: { id: true, name: true } } }, skip, take: limit }); const conversations = await Promise.all(users.map(async (user) => { const [lastMessage, unreadCount] = await Promise.all([prisma.chatMessage.findFirst({ where: { OR: [{ senderId: user.id, receiverId: adminId }, { senderId: adminId, receiverId: user.id }] }, orderBy: { createdAt: 'desc' } }), prisma.chatMessage.count({ where: { senderId: user.id, receiverId: adminId, isRead: false } })]); return { user, lastMessage, unreadCount }; })); let filteredConversations = conversations; if (filters.unreadOnly) {
        filteredConversations = conversations.filter((c) => c.unreadCount > 0);
    } filteredConversations.sort((a, b) => { const aTime = a.lastMessage?.createdAt?.getTime() || 0; const bTime = b.lastMessage?.createdAt?.getTime() || 0; return bTime - aTime; }); const total = await prisma.user.count({ where: { ...userWhere, OR: [{ sentMessages: { some: { receiverId: adminId } } }, { receivedMessages: { some: { senderId: adminId } } }] } }); return { conversations: filteredConversations, total, page, limit, hasMore: skip + filteredConversations.length < total }; }
    async getUnreadCount(userId) { const count = await prisma.chatMessage.count({ where: { receiverId: userId, isRead: false } }); return { count }; }
    async getStatistics(adminId) { const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true } }); if (!admin)
        throw new Error('Admin not found'); const userWhere = { role: 'CUSTOMER', status: 'ACTIVE' }; if (admin.role === 'ADMIN') {
        userWhere.wardId = admin.wardId;
    }
    else if (admin.role === 'SUPER_ADMIN') {
        userWhere.zoneId = admin.zoneId;
    }
    else if (admin.role === 'MASTER_ADMIN') {
        userWhere.cityCorporationCode = admin.cityCorporationCode;
    } const [totalConversations, unreadMessages, todayMessages] = await Promise.all([prisma.user.count({ where: { ...userWhere, OR: [{ sentMessages: { some: { receiverId: adminId } } }, { receivedMessages: { some: { senderId: adminId } } }] } }), prisma.chatMessage.count({ where: { receiverId: adminId, isRead: false } }), prisma.chatMessage.count({ where: { OR: [{ senderId: adminId }, { receiverId: adminId }], createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })]); return { totalConversations, unreadMessages, todayMessages }; }
    checkAdminAccess(admin, user) { if (admin.role === 'MASTER_ADMIN') {
        return admin.cityCorporationCode === user.cityCorporationCode;
    } if (admin.role === 'SUPER_ADMIN') {
        return admin.zoneId === user.zoneId;
    } if (admin.role === 'ADMIN') {
        return admin.wardId === user.wardId;
    } return false; }
}
exports.LiveChatService = LiveChatService;
const liveChatService = new LiveChatService();
exports.default = liveChatService;
