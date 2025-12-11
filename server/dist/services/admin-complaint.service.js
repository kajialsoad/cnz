"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminComplaintService = exports.AdminComplaintService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
class AdminComplaintService {
    /**
     * Get all complaints with admin-level access (no user restriction)
     * Supports pagination, filtering, and search
     */
    async getAdminComplaints(query = {}) {
        try {
            const { page = 1, limit = 20, status, category, subcategory, ward, cityCorporationCode, thanaId, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            const skip = (page - 1) * limit;
            // Build where clause - COMPLETELY REWRITTEN
            const andConditions = [];
            // Status filter
            if (status && status !== 'ALL') {
                andConditions.push({ status });
            }
            // Category filter
            if (category) {
                // Handle "null" as a special value to filter for NULL categories
                if (category === 'null') {
                    andConditions.push({
                        OR: [
                            { category: null },
                            { category: '' }
                        ]
                    });
                }
                else {
                    andConditions.push({ category });
                }
            }
            // Subcategory filter
            if (subcategory) {
                // Handle "null" as a special value to filter for NULL subcategories
                if (subcategory === 'null') {
                    andConditions.push({
                        OR: [
                            { subcategory: null },
                            { subcategory: '' }
                        ]
                    });
                }
                else {
                    andConditions.push({ subcategory });
                }
            }
            // City Corporation filter (filter through user relationship)
            if (cityCorporationCode) {
                andConditions.push({
                    user: {
                        cityCorporationCode: cityCorporationCode
                    }
                });
            }
            // Ward filter (filter through user relationship)
            if (ward) {
                andConditions.push({
                    user: {
                        ward: ward
                    }
                });
            }
            // Thana filter (filter through user relationship)
            if (thanaId) {
                andConditions.push({
                    user: {
                        thanaId: thanaId
                    }
                });
            }
            // Date range filter
            if (startDate || endDate) {
                const dateFilter = {};
                if (startDate) {
                    dateFilter.gte = new Date(startDate);
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate);
                }
                andConditions.push({ createdAt: dateFilter });
            }
            // Search filter - searches across multiple fields
            // Note: MySQL string comparisons are case-insensitive by default
            if (search && search.trim()) {
                andConditions.push({
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } },
                        { location: { contains: search } },
                        {
                            user: {
                                firstName: { contains: search }
                            }
                        },
                        {
                            user: {
                                lastName: { contains: search }
                            }
                        },
                        {
                            user: {
                                phone: { contains: search }
                            }
                        },
                        {
                            user: {
                                email: { contains: search }
                            }
                        }
                    ]
                });
            }
            // Build final where clause
            const where = andConditions.length > 0 ? { AND: andConditions } : {};
            // Build order by clause
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            // Fetch complaints and total count
            const [complaints, total, statusCounts] = await Promise.all([
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
                                ward: true,
                                zone: true,
                                address: true,
                                cityCorporationCode: true,
                                zoneId: true,
                                wardId: true,
                                cityCorporation: {
                                    select: {
                                        code: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }),
                prisma_1.default.complaint.count({ where }),
                this.getStatusCounts(cityCorporationCode)
            ]);
            // Format complaints with parsed file URLs
            const formattedComplaints = complaints.map(complaint => this.formatComplaintResponse(complaint));
            return {
                complaints: formattedComplaints,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                statusCounts
            };
        }
        catch (error) {
            console.error('Error getting admin complaints:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error; // Throw original error to see actual message
        }
    }
    /**
     * Get single complaint by ID with full details (admin access)
     */
    async getAdminComplaintById(id) {
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
                            ward: true,
                            zone: true,
                            address: true,
                            createdAt: true,
                            cityCorporationCode: true,
                            zoneId: true,
                            wardId: true,
                            cityCorporation: {
                                select: {
                                    code: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Fetch status history and chat messages separately
            const [statusHistory, chatMessages] = await Promise.all([
                prisma_1.default.statusHistory.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma_1.default.complaintChatMessage.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                })
            ]);
            return this.formatComplaintResponse({
                ...complaint,
                statusHistory,
                chatMessages
            });
        }
        catch (error) {
            console.error('Error getting complaint by ID:', error);
            throw error;
        }
    }
    /**
     * Update complaint status and create status history entry
     */
    async updateComplaintStatus(id, input) {
        try {
            // Get current complaint
            const currentComplaint = await prisma_1.default.complaint.findUnique({
                where: { id }
            });
            if (!currentComplaint) {
                throw new Error('Complaint not found');
            }
            // Update complaint status and create status history in a transaction
            const result = await prisma_1.default.$transaction(async (tx) => {
                // Update complaint status
                const updatedComplaint = await tx.complaint.update({
                    where: { id },
                    data: {
                        status: input.status,
                        updatedAt: new Date()
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                });
                // Create status history entry
                await tx.statusHistory.create({
                    data: {
                        complaintId: id,
                        oldStatus: currentComplaint.status,
                        newStatus: input.status,
                        changedBy: input.adminId,
                        note: input.note
                    }
                });
                return updatedComplaint;
            });
            return this.formatComplaintResponse(result);
        }
        catch (error) {
            console.error('Error updating complaint status:', error);
            throw error;
        }
    }
    /**
     * Get all complaints for a specific user
     */
    async getComplaintsByUser(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [complaints, total, user] = await Promise.all([
                prisma_1.default.complaint.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma_1.default.complaint.count({ where: { userId } }),
                prisma_1.default.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        ward: true,
                        zone: true,
                        createdAt: true
                    }
                })
            ]);
            if (!user) {
                throw new Error('User not found');
            }
            // Calculate statistics
            const statistics = await this.getUserComplaintStatistics(userId);
            return {
                user,
                complaints: complaints.map(c => this.formatComplaintResponse(c)),
                statistics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        }
        catch (error) {
            console.error('Error getting complaints by user:', error);
            throw error;
        }
    }
    /**
     * Get complaint statistics for a specific user
     */
    async getUserComplaintStatistics(userId) {
        const [total, pending, inProgress, resolved, rejected] = await Promise.all([
            prisma_1.default.complaint.count({ where: { userId } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.ComplaintStatus.PENDING } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.ComplaintStatus.IN_PROGRESS } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.ComplaintStatus.RESOLVED } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.ComplaintStatus.REJECTED } })
        ]);
        return {
            total,
            resolved,
            unresolved: pending + inProgress,
            pending,
            inProgress,
            rejected
        };
    }
    /**
     * Get status counts for all complaints
     * Optionally filtered by city corporation
     */
    async getStatusCounts(cityCorporationCode) {
        // Build where clause for city corporation filter
        const whereClause = cityCorporationCode
            ? { user: { cityCorporationCode } }
            : {};
        const [pending, inProgress, resolved, rejected] = await Promise.all([
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.ComplaintStatus.PENDING
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.ComplaintStatus.IN_PROGRESS
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.ComplaintStatus.RESOLVED
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.ComplaintStatus.REJECTED
                }
            })
        ]);
        return {
            pending,
            inProgress,
            resolved,
            rejected,
            total: pending + inProgress + resolved + rejected
        };
    }
    /**
     * Helper method to parse file URLs from stored string
     */
    parseFileUrls(urlString) {
        if (!urlString)
            return [];
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(urlString);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (error) {
            // Not JSON, fall back to comma-separated parsing
        }
        // Parse comma-separated format
        return urlString
            .split(',')
            .map(url => url.trim())
            .filter(url => url && !url.startsWith('voice:'));
    }
    /**
     * Helper method to format complaint response with structured data
     */
    formatComplaintResponse(complaint) {
        // Parse location string to extract ward
        const locationParts = complaint.location?.split(',') || [];
        const wardMatch = complaint.location?.match(/Ward:\s*(\d+)/i);
        const ward = wardMatch ? wardMatch[1] : null;
        // Parse district and thana from location
        const district = locationParts[1]?.trim() || null;
        const thana = locationParts[2]?.trim() || null;
        const address = locationParts[0]?.trim() || complaint.location;
        return {
            ...complaint,
            complaintId: `C${String(complaint.id).padStart(6, '0')}`, // Format: C001234
            imageUrls: this.parseFileUrls(complaint.imageUrl),
            audioUrls: this.parseFileUrls(complaint.audioUrl),
            locationDetails: {
                address,
                district,
                thana,
                ward,
                full: complaint.location
            },
            timeAgo: this.getTimeAgo(complaint.createdAt),
            user: complaint.user ? {
                ...complaint.user,
                name: `${complaint.user.firstName} ${complaint.user.lastName}`
            } : null
        };
    }
    /**
     * Helper method to calculate time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7)
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffDays < 30)
            return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    }
}
exports.AdminComplaintService = AdminComplaintService;
exports.adminComplaintService = new AdminComplaintService();
