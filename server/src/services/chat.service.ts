import prisma from '../utils/prisma';

export interface SendChatMessageInput {
    complaintId: number;
    senderId: number;
    senderType: 'ADMIN' | 'CITIZEN';
    message: string;
    imageUrl?: string;
    voiceUrl?: string;
}

export interface ChatMessageQueryInput {
    page?: number;
    limit?: number;
}

export interface ChatListQueryInput {
    search?: string;
    district?: string;
    upazila?: string;
    ward?: string;
    zone?: string;
    cityCorporationCode?: string;
    thanaId?: number;
    status?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
}

export class ChatService {
    /**
     * Get all complaints for chat - shows ALL complaints with chat messages
     * This lists chats by complaint ID, not by user ID
     * ✅ FIXED: Better error handling and logging
     */
    async getAllCitizensForChat(query: ChatListQueryInput = {}) {
        try {
            console.log('📥 getAllCitizensForChat called with query:', JSON.stringify(query, null, 2));

            const {
                search,
                ward,
                zone,
                cityCorporationCode,
                unreadOnly = false,
                page = 1,
                limit = 20
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause for complaints
            const where: any = {};

            // Filter by ward - use complaintWardId
            if (ward) {
                const wardId = parseInt(ward);
                if (!isNaN(wardId)) {
                    where.complaintWardId = wardId;
                    console.log('🔍 Filtering by ward:', wardId);
                }
            }

            // Filter by zone - use complaintZoneId
            if (zone) {
                const zoneId = parseInt(zone);
                if (!isNaN(zoneId)) {
                    where.complaintZoneId = zoneId;
                    console.log('🔍 Filtering by zone:', zoneId);
                }
            }

            // Filter by city corporation code - use complaintCityCorporationCode
            if (cityCorporationCode && cityCorporationCode !== 'ALL') {
                where.complaintCityCorporationCode = cityCorporationCode;
                console.log('🔍 Filtering by city corp:', cityCorporationCode);
            }

            // Search filter - search in complaint title, description, or user details
            if (search && search.trim().length > 0) {
                where.OR = [
                    { title: { contains: search.trim() } },
                    { description: { contains: search.trim() } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: search.trim() } },
                                { lastName: { contains: search.trim() } },
                                { phone: { contains: search.trim() } },
                                { email: { contains: search.trim() } }
                            ]
                        }
                    }
                ];
                console.log('🔍 Searching for:', search.trim());
            }

            console.log('📊 Query where clause:', JSON.stringify(where, null, 2));

            // Get total count
            const total = await prisma.complaint.count({ where });
            console.log(`📊 Total complaints found: ${total}`);

            // Get complaints with their chat messages and user details
            const complaints = await prisma.complaint.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            email: true,
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
                                    name: true,
                                    zoneNumber: true
                                }
                            },
                            ward: {
                                select: {
                                    id: true,
                                    wardNumber: true
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
                            name: true,
                            zoneNumber: true
                        }
                    },
                    complaintWard: {
                        select: {
                            id: true,
                            wardNumber: true
                        }
                    },
                    chatMessages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });

            console.log(`📊 Fetched ${complaints.length} complaints for page ${page}`);

            // Format the response
            const conversations = await Promise.all(complaints.map(async (complaint) => {
                const lastMessage = complaint.chatMessages[0];

                // Get unread count for this complaint
                const unreadCount = await prisma.complaintChatMessage.count({
                    where: {
                        complaintId: complaint.id,
                        senderType: 'CITIZEN',
                        read: false
                    }
                });

                // Use complaint location data (priority) or fallback to user location
                const ward = complaint.complaintWard?.wardNumber?.toString() ||
                    complaint.user?.ward?.wardNumber?.toString() || '';
                const zone = complaint.complaintZone?.name ||
                    complaint.complaintZone?.zoneNumber?.toString() ||
                    complaint.user?.zone?.name ||
                    complaint.user?.zone?.zoneNumber?.toString() || '';
                const cityCorporationCode = complaint.complaintCityCorporationCode ||
                    complaint.user?.cityCorporationCode || null;
                const cityCorporation = complaint.complaintCityCorporation ||
                    complaint.user?.cityCorporation || null;

                return {
                    complaintId: complaint.id,
                    trackingNumber: `C${String(complaint.id).padStart(6, '0')}`,
                    complaintTitle: complaint.title,
                    complaintCategory: this.extractCategory(complaint.description),
                    complaintStatus: complaint.status,
                    complaintCreatedAt: complaint.createdAt,
                    citizen: {
                        id: complaint.user?.id || 0,
                        firstName: complaint.user?.firstName || 'Unknown',
                        lastName: complaint.user?.lastName || 'User',
                        phone: complaint.user?.phone || '',
                        email: complaint.user?.email || '',
                        district: '', // Not stored in model
                        upazila: '', // Not stored in model
                        ward,
                        zone,
                        cityCorporationCode,
                        cityCorporation: cityCorporation ? {
                            code: cityCorporation.code,
                            name: cityCorporation.name
                        } : null,
                        address: complaint.user?.address || complaint.location || '',
                        profilePicture: complaint.user?.avatar
                    },
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        text: lastMessage.message,
                        timestamp: lastMessage.createdAt,
                        senderType: lastMessage.senderType
                    } : null,
                    unreadCount,
                    totalMessages: 0,
                    isNew: unreadCount > 0,
                    lastActivity: lastMessage?.createdAt || complaint.updatedAt
                };
            }));

            // Filter by unread only if requested
            let filteredConversations = conversations;
            if (unreadOnly) {
                filteredConversations = conversations.filter(c => c.unreadCount > 0);
                console.log(`📊 Filtered to ${filteredConversations.length} unread conversations`);
            }

            // Sort by last activity (most recent first)
            filteredConversations.sort((a, b) => {
                return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
            });

            console.log(`✅ Returning ${filteredConversations.length} conversations`);

            return {
                chats: filteredConversations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('❌ Error getting complaints for chat:', error);
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.error('❌ Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'Unknown',
                query
            });
            throw new Error(`Failed to fetch complaints for chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all chat conversations with complaint and citizen details
     * DEPRECATED: Use getAllCitizensForChat instead
     */
    async getChatConversations(query: ChatListQueryInput = {}) {
        try {
            const {
                search,
                district,
                upazila,
                ward,
                zone,
                cityCorporationCode,
                thanaId,
                status,
                unreadOnly = false,
                page = 1,
                limit = 20
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause for complaints that have chat messages
            const where: any = {};

            // Filter by status
            if (status && status !== 'ALL') {
                where.status = status;
            }

            // Filter by location (district/upazila in location string)
            if (district) {
                where.location = {
                    contains: district
                };
            }

            if (upazila) {
                where.location = {
                    contains: upazila
                };
            }

            // Filter by ward (from user table)
            if (ward) {
                where.user = {
                    ...where.user,
                    ward: {
                        contains: ward
                    }
                };
            }

            // Filter by zone (from user table)
            if (zone) {
                where.user = {
                    ...where.user,
                    zone: {
                        contains: zone
                    }
                };
            }

            // Filter by city corporation code (from user table)
            if (cityCorporationCode && cityCorporationCode !== 'ALL') {
                where.user = {
                    ...where.user,
                    cityCorporationCode: cityCorporationCode
                };
            }

            // Filter by thana ID (from user table)
            if (thanaId) {
                where.user = {
                    ...where.user,
                    thanaId: thanaId
                };
            }

            // Search filter
            if (search) {
                where.OR = [
                    { title: { contains: search } },
                    { description: { contains: search } },
                    { location: { contains: search } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: search } },
                                { lastName: { contains: search } },
                                { phone: { contains: search } }
                            ]
                        }
                    }
                ];
            }

            // Get all complaints with chat messages
            const complaintsWithChats = await prisma.complaint.findMany({
                where: {
                    ...where,
                    chatMessages: {
                        some: {} // Only complaints that have at least one chat message
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            email: true,
                            avatar: true,
                            cityCorporationCode: true,
                            zoneId: true,
                            wardId: true,
                            zone: {
                                select: {
                                    name: true,
                                    zoneNumber: true
                                }
                            },
                            ward: {
                                select: {
                                    wardNumber: true
                                }
                            },
                            cityCorporation: {
                                select: {
                                    code: true,
                                    name: true
                                }
                            }
                        }
                    },
                    chatMessages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1 // Get only the last message
                    }
                },
                orderBy: {
                    updatedAt: 'desc' // Sort by last activity
                }
            });

            // Get unread counts for all complaints
            const complaintIds = complaintsWithChats.map(c => c.id);
            const unreadCounts = await this.getUnreadMessageCounts(complaintIds, 0, 'ADMIN');

            // Format the response
            let conversations = complaintsWithChats.map(complaint => {
                const lastMessage = complaint.chatMessages[0];
                const unreadCount = unreadCounts[complaint.id] || 0;

                // Parse location details
                const locationParts = complaint.location?.split(',') || [];
                const wardMatch = complaint.location?.match(/Ward:\s*(\d+)/i);
                const ward = wardMatch ? wardMatch[1] : null;
                const district = locationParts[1]?.trim() || '';
                const upazila = locationParts[2]?.trim() || '';
                const zone = complaint.user?.zone?.name || complaint.user?.zone?.zoneNumber?.toString() || '';

                return {
                    complaintId: complaint.id,
                    trackingNumber: `C${String(complaint.id).padStart(6, '0')}`,
                    complaintTitle: complaint.title,
                    complaintCategory: this.extractCategory(complaint.description),
                    complaintStatus: complaint.status,
                    complaintCreatedAt: complaint.createdAt,
                    citizen: {
                        id: complaint.user?.id || 0,
                        firstName: complaint.user?.firstName || 'Unknown',
                        lastName: complaint.user?.lastName || 'User',
                        phone: complaint.user?.phone || '',
                        email: complaint.user?.email || '',
                        district,
                        upazila,
                        ward: ward || "",
                        zone: zone || '',
                        cityCorporationCode: complaint.user?.cityCorporationCode || null,
                        cityCorporation: complaint.user?.cityCorporation ? {
                            code: complaint.user.cityCorporation.code,
                            name: complaint.user.cityCorporation.name
                        } : null,
                        address: locationParts[0]?.trim() || complaint.location,
                        profilePicture: complaint.user?.avatar
                    },
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        text: lastMessage.message,
                        timestamp: lastMessage.createdAt,
                        senderType: lastMessage.senderType
                    } : null,
                    unreadCount,
                    totalMessages: 0, // Will be calculated if needed
                    isNew: unreadCount > 0 && !lastMessage?.read,
                    lastActivity: lastMessage?.createdAt || complaint.updatedAt
                };
            });

            // Filter by unread only if requested
            if (unreadOnly) {
                conversations = conversations.filter(c => c.unreadCount > 0);
            }

            // Sort by last activity (most recent first)
            conversations.sort((a, b) => {
                return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
            });

            // Apply pagination
            const total = conversations.length;
            const paginatedConversations = conversations.slice(skip, skip + limit);

            return {
                chats: paginatedConversations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting chat conversations:', error);
            throw new Error('Failed to fetch chat conversations');
        }
    }

    /**
     * Extract category from description or title
     */
    private extractCategory(description: string): string {
        // Simple category extraction - can be enhanced
        const categories = ['Road', 'Water', 'Electricity', 'Waste', 'Other'];
        const lowerDesc = description.toLowerCase();

        for (const category of categories) {
            if (lowerDesc.includes(category.toLowerCase())) {
                return category;
            }
        }

        return 'General';
    }

    /**
     * Get chat messages for a complaint with pagination
     * Enhanced to return complete complaint and citizen details
     */
    async getChatMessages(complaintId: number, query: ChatMessageQueryInput = {}) {
        try {
            const { page = 1, limit = 50 } = query;
            const skip = (page - 1) * limit;

            // Fetch complaint with user details
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            email: true,
                            avatar: true,
                            ward: true,
                            zone: true,
                            cityCorporationCode: true,
                            // thanaId: true, // Removed - using zoneId/wardId
                            cityCorporation: {
                                select: {
                                    code: true,
                                    name: true
                                }
                            },
                            /* thana: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }, */
                            createdAt: true
                        }
                    }
                }
            });

            if (!complaint) {
                throw new Error('Complaint not found');
            }

            // Parse location details
            const locationParts = complaint.location?.split(',') || [];
            const wardMatch = complaint.location?.match(/Ward:\s*(\d+)/i);
            const ward = wardMatch ? wardMatch[1] : null;
            const district = locationParts[1]?.trim() || '';
            const upazila = locationParts[2]?.trim() || '';

            // Fetch messages with pagination
            const [messages, total] = await Promise.all([
                prisma.complaintChatMessage.findMany({
                    where: { complaintId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'asc' // Oldest first for chat display
                    }
                }),
                prisma.complaintChatMessage.count({
                    where: { complaintId }
                })
            ]);

            // Get sender information for each message
            const messagesWithSenderInfo = await Promise.all(
                messages.map(async (msg: any) => {
                    let senderName = 'Unknown';
                    let senderRole = undefined;

                    if (msg.senderType === 'CITIZEN') {
                        const user = await prisma.user.findUnique({
                            where: { id: msg.senderId },
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        });
                        if (user) {
                            senderName = `${user.firstName} ${user.lastName}`;
                        }
                    } else if (msg.senderType === 'ADMIN') {
                        const admin = await prisma.user.findUnique({
                            where: { id: msg.senderId },
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        });
                        if (admin) {
                            senderName = `${admin.firstName} ${admin.lastName} (Admin)`;
                            senderRole = admin.role;
                        }
                    }

                    return {
                        ...msg,
                        senderName,
                        senderRole
                    };
                })
            );

            return {
                complaint: {
                    id: complaint.id,
                    trackingNumber: `C${String(complaint.id).padStart(6, '0')}`,
                    title: complaint.title,
                    description: complaint.description,
                    category: this.extractCategory(complaint.description),
                    status: complaint.status,
                    priority: complaint.priority,
                    createdAt: complaint.createdAt,
                    updatedAt: complaint.updatedAt,
                    imageUrl: complaint.imageUrl,
                    audioUrl: complaint.audioUrl
                },
                citizen: complaint.user ? {
                    id: complaint.user.id,
                    firstName: complaint.user.firstName,
                    lastName: complaint.user.lastName,
                    phone: complaint.user.phone,
                    email: complaint.user.email,
                    district,
                    upazila,
                    ward: ward || complaint.user.ward || '',
                    cityCorporationCode: complaint.user.cityCorporationCode || null,
                    cityCorporation: complaint.user.cityCorporation ? {
                        code: complaint.user.cityCorporation.code,
                        name: complaint.user.cityCorporation.name
                    } : null,
                    address: locationParts[0]?.trim() || complaint.location,
                    profilePicture: complaint.user.avatar,
                    memberSince: complaint.user.createdAt
                } : null,
                messages: messagesWithSenderInfo,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting chat messages:', error);
            throw error;
        }
    }

    /**
     * Send a new chat message
     */
    async sendChatMessage(input: SendChatMessageInput) {
        try {
            // Verify complaint exists
            const complaint = await prisma.complaint.findUnique({
                where: { id: input.complaintId }
            });

            if (!complaint) {
                throw new Error('Complaint not found');
            }

            // Verify sender exists
            const sender = await prisma.user.findUnique({
                where: { id: input.senderId }
            });

            if (!sender) {
                throw new Error('Sender not found');
            }

            // Create chat message
            const message = await prisma.complaintChatMessage.create({
                data: ({
                    complaintId: input.complaintId,
                    senderId: input.senderId,
                    senderType: input.senderType,
                    message: input.message,
                    imageUrl: input.imageUrl,
                    voiceUrl: input.voiceUrl,
                    read: false
                } as any)
            });

            // Get sender name
            const senderName = `${sender.firstName} ${sender.lastName}${input.senderType === 'ADMIN' ? ' (Admin)' : ''}`;

            return {
                ...message,
                senderName,
                senderRole: input.senderType === 'ADMIN' ? sender.role : undefined
            };
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    }

    /**
     * Mark all messages as read for a complaint
     */
    async markMessagesAsRead(complaintId: number, readerId: number, readerType: 'ADMIN' | 'CITIZEN') {
        try {
            // Mark messages as read where the reader is NOT the sender
            // For admin: mark all citizen messages as read
            // For citizen: mark all admin messages as read
            const oppositeType = readerType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';

            const result = await prisma.complaintChatMessage.updateMany({
                where: {
                    complaintId,
                    senderType: oppositeType,
                    read: false
                },
                data: {
                    read: true
                }
            });

            return {
                success: true,
                messagesMarkedAsRead: result.count
            };
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw new Error('Failed to mark messages as read');
        }
    }

    /**
     * Get unread message count for a complaint
     */
    async getUnreadMessageCount(complaintId: number, userId: number, userType: 'ADMIN' | 'CITIZEN') {
        try {
            // Count unread messages where the user is NOT the sender
            const oppositeType = userType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';

            const count = await prisma.complaintChatMessage.count({
                where: {
                    complaintId,
                    senderType: oppositeType,
                    read: false
                }
            });

            return count;
        } catch (error) {
            console.error('Error getting unread message count:', error);
            throw new Error('Failed to get unread message count');
        }
    }

    /**
     * Get unread message counts for multiple complaints
     */
    async getUnreadMessageCounts(complaintIds: number[], userId: number, userType: 'ADMIN' | 'CITIZEN') {
        try {
            const oppositeType = userType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';

            // Get all unread messages for the complaints
            const unreadMessages = await prisma.complaintChatMessage.groupBy({
                by: ['complaintId'],
                where: {
                    complaintId: { in: complaintIds },
                    senderType: oppositeType,
                    read: false
                },
                _count: {
                    id: true
                }
            });

            // Convert to map for easy lookup
            const countsMap: Record<number, number> = {};
            unreadMessages.forEach((item: any) => {
                countsMap[item.complaintId] = item._count.id;
            });

            return countsMap;
        } catch (error) {
            console.error('Error getting unread message counts:', error);
            throw new Error('Failed to get unread message counts');
        }
    }

    /**
     * Delete a chat message (soft delete by marking as deleted)
     */
    async deleteChatMessage(messageId: number, userId: number) {
        try {
            // Verify message exists and user is the sender
            const message = await prisma.complaintChatMessage.findUnique({
                where: { id: messageId }
            });

            if (!message) {
                throw new Error('Message not found');
            }

            if (message.senderId !== userId) {
                throw new Error('Unauthorized to delete this message');
            }

            // Delete the message
            await prisma.complaintChatMessage.delete({
                where: { id: messageId }
            });

            return {
                success: true,
                message: 'Message deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting chat message:', error);
            throw error;
        }
    }

    /**
     * Get latest message for a complaint
     */
    async getLatestMessage(complaintId: number) {
        try {
            const message = await prisma.complaintChatMessage.findFirst({
                where: { complaintId },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!message) {
                return null;
            }

            // Get sender name
            const sender = await prisma.user.findUnique({
                where: { id: message.senderId },
                select: {
                    firstName: true,
                    lastName: true
                }
            });

            const senderName = sender
                ? `${sender.firstName} ${sender.lastName}${message.senderType === 'ADMIN' ? ' (Admin)' : ''}`
                : 'Unknown';

            return {
                ...message,
                senderName
            };
        } catch (error) {
            console.error('Error getting latest message:', error);
            throw new Error('Failed to get latest message');
        }
    }

    /**
     * Get chat statistics - based on ALL complaints, not just users
     */
    async getChatStatistics() {
        try {
            // Test database connection first
            await prisma.$queryRaw`SELECT 1`;

            // Get all complaints with their chat messages
            const allComplaints = await prisma.complaint.findMany({
                include: {
                    complaintWard: {
                        select: {
                            wardNumber: true
                        }
                    },
                    complaintZone: {
                        select: {
                            id: true,
                            name: true,
                            zoneNumber: true
                        }
                    },
                    user: {
                        select: {
                            ward: {
                                select: {
                                    wardNumber: true
                                }
                            },
                            zone: {
                                select: {
                                    id: true,
                                    name: true,
                                    zoneNumber: true
                                }
                            }
                        }
                    },
                    chatMessages: {
                        where: {
                            senderType: 'CITIZEN',
                            read: false
                        }
                    }
                }
            });

            const totalChats = allComplaints.length;

            // Calculate unread count across all complaints
            const unreadCount = allComplaints.reduce((sum, complaint) => {
                return sum + complaint.chatMessages.length;
            }, 0);

            // Group by ward, zone (using complaint location data)
            const byWard: Record<string, number> = {};
            const byZone: Record<string, number> = {};

            allComplaints.forEach((complaint: any) => {
                // Use complaint location (priority) or fallback to user location
                const ward = complaint.complaintWard?.wardNumber?.toString() ||
                    complaint.user?.ward?.wardNumber?.toString() || 'Unknown';
                const zone = complaint.complaintZone?.name ||
                    complaint.complaintZone?.zoneNumber?.toString() ||
                    complaint.user?.zone?.name ||
                    complaint.user?.zone?.zoneNumber?.toString() || 'Unknown';

                // Count by ward
                if (ward && ward !== 'Unknown') {
                    byWard[ward] = (byWard[ward] || 0) + 1;
                }

                // Count by zone
                if (zone && zone !== 'Unknown') {
                    byZone[zone] = (byZone[zone] || 0) + 1;
                }
            });

            return {
                totalChats,
                unreadCount,
                byDistrict: [], // Not used anymore
                byUpazila: [], // Not used anymore
                byWard: Object.entries(byWard).map(([category, count]) => ({
                    category,
                    count
                })),
                byZone: Object.entries(byZone).map(([category, count]) => ({
                    category,
                    count
                })),
                byStatus: [] // Not applicable for complaint list
            };
        } catch (error) {
            console.error('Error getting chat statistics:', error);
            throw new Error('Failed to get chat statistics');
        }
    }
}

export const chatService = new ChatService();
