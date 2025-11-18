"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminComplaintServiceFixed = exports.AdminComplaintServiceFixed = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class AdminComplaintServiceFixed {
    /**
     * Get all complaints with proper search handling
     */
    async getAdminComplaints(query = {}) {
        try {
            const { page = 1, limit = 20, status, category, ward, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            const skip = (page - 1) * limit;
            // Build where clause properly
            const andConditions = [];
            // Status filter
            if (status && status !== 'ALL') {
                andConditions.push({ status });
            }
            // Category filter
            if (category) {
                andConditions.push({ category });
            }
            // Ward filter
            if (ward) {
                andConditions.push({
                    location: {
                        contains: ward,
                        mode: 'insensitive'
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
            // Search filter - FIXED VERSION
            if (search && search.trim()) {
                andConditions.push({
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { location: { contains: search, mode: 'insensitive' } },
                        {
                            user: {
                                firstName: { contains: search, mode: 'insensitive' }
                            }
                        },
                        {
                            user: {
                                lastName: { contains: search, mode: 'insensitive' }
                            }
                        },
                        {
                            user: {
                                phone: { contains: search, mode: 'insensitive' }
                            }
                        },
                        {
                            user: {
                                email: { contains: search, mode: 'insensitive' }
                            }
                        }
                    ]
                });
            }
            // Final where clause
            const where = andConditions.length > 0 ? { AND: andConditions } : {};
            // Build order by
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            console.log('Where clause:', JSON.stringify(where, null, 2));
            // Fetch complaints
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
                                ward: true,
                                zone: true
                            }
                        }
                    }
                }),
                prisma_1.default.complaint.count({ where })
            ]);
            // Get status counts
            const statusCounts = await this.getStatusCounts();
            // Format complaints
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
            throw error;
        }
    }
    /**
     * Get status counts
     */
    async getStatusCounts() {
        const counts = await prisma_1.default.complaint.groupBy({
            by: ['status'],
            _count: true
        });
        const statusCounts = {
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0,
            total: 0
        };
        counts.forEach(item => {
            const count = item._count;
            statusCounts.total += count;
            switch (item.status) {
                case 'PENDING':
                    statusCounts.pending = count;
                    break;
                case 'IN_PROGRESS':
                    statusCounts.inProgress = count;
                    break;
                case 'RESOLVED':
                    statusCounts.resolved = count;
                    break;
                case 'REJECTED':
                    statusCounts.rejected = count;
                    break;
            }
        });
        return statusCounts;
    }
    /**
     * Format complaint response
     */
    formatComplaintResponse(complaint) {
        // Parse image and audio URLs
        let imageUrls = [];
        let audioUrls = [];
        try {
            if (complaint.imageUrl) {
                imageUrls = JSON.parse(complaint.imageUrl);
            }
        }
        catch (e) {
            imageUrls = [];
        }
        try {
            if (complaint.audioUrl) {
                audioUrls = JSON.parse(complaint.audioUrl);
            }
        }
        catch (e) {
            audioUrls = [];
        }
        // Parse location
        const locationParts = complaint.location?.split(',') || [];
        const wardMatch = complaint.location?.match(/Ward:\s*(\d+)/i);
        return {
            ...complaint,
            user: complaint.user ? {
                ...complaint.user,
                name: `${complaint.user.firstName} ${complaint.user.lastName}`
            } : null,
            complaintId: `C${String(complaint.id).padStart(6, '0')}`,
            imageUrls,
            audioUrls,
            locationDetails: {
                address: locationParts[0]?.trim() || '',
                district: locationParts[1]?.trim() || '',
                thana: locationParts[2]?.trim() || '',
                ward: wardMatch ? wardMatch[1] : null,
                full: complaint.location
            },
            timeAgo: this.getTimeAgo(complaint.createdAt)
        };
    }
    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);
            if (interval >= 1) {
                return `${interval} ${name}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }
}
exports.AdminComplaintServiceFixed = AdminComplaintServiceFixed;
exports.adminComplaintServiceFixed = new AdminComplaintServiceFixed();
