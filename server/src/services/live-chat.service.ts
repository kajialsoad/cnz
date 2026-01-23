import { PrismaClient, SenderType, ChatMessageType } from '@prisma/client';
const prisma = new PrismaClient();
export class LiveChatService {
    async getUserAdmin(userId: number) { const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true } }); if (!user) throw new Error('User not found'); if (!user.wardId && !user.zoneId) throw new Error('User has no assigned ward or zone'); if (user.wardId) { const wardAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN', wardId: user.wardId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, avatar: true, role: true, designation: true, phone: true, ward: { select: { id: true, number: true, wardNumber: true } }, zone: { select: { id: true, number: true, name: true } } } }); if (wardAdmin) return wardAdmin; } if (user.zoneId) { const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', zoneId: user.zoneId, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, avatar: true, role: true, designation: true, phone: true, ward: { select: { id: true, number: true, wardNumber: true } }, zone: { select: { id: true, number: true, name: true } } } }); if (superAdmin) return superAdmin; } return null; }
    async getUserMessages(userId: number, options: { page?: number; limit?: number; adminId?: number } = {}) { const page = options.page || 1; const limit = options.limit || 50; const skip = (page - 1) * limit; let adminId = options.adminId; if (!adminId) { const admin = await this.getUserAdmin(userId); if (!admin) return { messages: [], total: 0, page, limit, hasMore: false }; adminId = admin.id; } const [messages, total] = await Promise.all([prisma.chatMessage.findMany({ where: { OR: [{ senderId: userId, receiverId: adminId }, { senderId: adminId, receiverId: userId }] }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } }, orderBy: { createdAt: 'asc' }, skip, take: limit }), prisma.chatMessage.count({ where: { OR: [{ senderId: userId, receiverId: adminId }, { senderId: adminId, receiverId: userId }] } })]); return { messages, total, page, limit, hasMore: skip + messages.length < total }; }
    async sendUserMessage(userId: number, data: { content: string; type?: ChatMessageType; fileUrl?: string; voiceUrl?: string }) { const admin = await this.getUserAdmin(userId); if (!admin) throw new Error('No admin assigned to your ward'); const message = await prisma.chatMessage.create({ data: { content: data.content, type: data.type || ChatMessageType.TEXT, fileUrl: data.fileUrl, voiceUrl: data.voiceUrl, senderId: userId, receiverId: admin.id, senderType: SenderType.CITIZEN, isRead: false }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } } }); return message; }
    async sendAdminMessage(adminId: number, userId: number, data: { content: string; type?: ChatMessageType; fileUrl?: string; voiceUrl?: string }) { const [admin, user] = await Promise.all([prisma.user.findUnique({ where: { id: adminId }, select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true } }), prisma.user.findUnique({ where: { id: userId }, select: { id: true, wardId: true, zoneId: true, cityCorporationCode: true } })]); if (!admin) throw new Error('Admin not found'); if (!user) throw new Error('User not found'); const hasAccess = this.checkAdminAccess(admin, user); if (!hasAccess) throw new Error('Admin does not have access to this user'); const message = await prisma.chatMessage.create({ data: { content: data.content, type: data.type || ChatMessageType.TEXT, fileUrl: data.fileUrl, voiceUrl: data.voiceUrl, senderId: adminId, receiverId: userId, senderType: SenderType.ADMIN, isRead: false }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } } }); return message; }
    async markMessagesAsRead(senderId: number, receiverId: number) { const result = await prisma.chatMessage.updateMany({ where: { senderId, receiverId, isRead: false }, data: { isRead: true } }); return { updated: result.count }; }
    async getAllUserConversations(adminId: number, filters: { page?: number; limit?: number; cityCorporationCode?: string; zoneId?: number; wardId?: number; unreadOnly?: boolean; search?: string; status?: string } = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true }
        });

        if (!admin) throw new Error('Admin not found');

        const userWhere: any = { role: 'CUSTOMER' };

        // Apply status filter (default to ACTIVE if not specified or if 'ALL' is not passed)
        // Note: If filters.status is explicitly provided, use it. 
        // If it's 'ALL', we don't add a status filter (show all).
        // If it's undefined, we default to 'ACTIVE' to match typical behavior, 
        // OR we can default to ALL if that's what the user wants. 
        // Given the complaint "27 vs 72", defaulting to ALL might be better if the UI defaults to ACTIVE.
        // Let's support the filter properly.
        if (filters.status && filters.status !== 'ALL') {
            userWhere.status = filters.status;
        } else if (!filters.status) {
            userWhere.status = 'ACTIVE';
        }

        // MASTER_ADMIN, SUPER_ADMIN, ADMIN: No automatic filtering - allows access to all users


        if (filters.cityCorporationCode) userWhere.cityCorporationCode = filters.cityCorporationCode; if (filters.zoneId) userWhere.zoneId = filters.zoneId; if (filters.wardId) userWhere.wardId = filters.wardId; if (filters.search) { userWhere.OR = [{ firstName: { contains: filters.search } }, { lastName: { contains: filters.search } }, { phone: { contains: filters.search } }]; } const users = await prisma.user.findMany({ where: { ...userWhere }, select: { id: true, firstName: true, lastName: true, phone: true, avatar: true, wardId: true, zoneId: true, cityCorporationCode: true, ward: { select: { id: true, wardNumber: true } }, zone: { select: { id: true, name: true } } }, skip, take: limit }); const conversations = await Promise.all(users.map(async (user) => { const [lastMessage, unreadCount] = await Promise.all([prisma.chatMessage.findFirst({ where: { OR: [{ senderId: user.id, receiverId: adminId }, { senderId: adminId, receiverId: user.id }] }, orderBy: { createdAt: 'desc' } }), prisma.chatMessage.count({ where: { senderId: user.id, receiverId: adminId, isRead: false } })]); return { user, lastMessage, unreadCount }; })); let filteredConversations = conversations; if (filters.unreadOnly) { filteredConversations = conversations.filter((c) => c.unreadCount > 0); } filteredConversations.sort((a, b) => {
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
    async getUnreadCount(userId: number) { const count = await prisma.chatMessage.count({ where: { receiverId: userId, isRead: false } }); return { count }; }
    async getStatistics(adminId: number) {
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { id: true, role: true, wardId: true, zoneId: true, cityCorporationCode: true }
        });

        if (!admin) throw new Error('Admin not found');

        const userWhere: any = {
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
        ]); return { totalConversations, unreadMessages, todayMessages };
    }
    private checkAdminAccess(admin: { role: string; wardId: number | null; zoneId: number | null; cityCorporationCode: string | null }, user: { wardId: number | null; zoneId: number | null; cityCorporationCode: string | null }): boolean {
        // Allow all admin types to message any user
        if (['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
            return true;
        }
        return false;
    }
}
const liveChatService = new LiveChatService();
export default liveChatService;

