import prisma from '../utils/prisma';
import { ComplaintStatus } from '@prisma/client';

export interface AdminComplaintQueryInput {
    page?: number;
    limit?: number;
    status?: ComplaintStatus | 'ALL';
    category?: string;
    ward?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateComplaintStatusInput {
    status: ComplaintStatus;
    note?: string;
    adminId: number;
}

export class AdminComplaintService {
    /**
     * Get all complaints with admin-level access (no user restriction)
     * Supports pagination, filtering, and search
     */
    async getAdminComplaints(query: AdminComplaintQueryInput = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category,
                ward,
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            // Status filter
            if (status && status !== 'ALL') {
                where.status = status;
            }

            // Category filter
            if (category) {
                where.category = category;
            }

            // Ward filter (search in location string)
            if (ward) {
                where.location = {
                    contains: ward,
                    mode: 'insensitive'
                };
            }

            // Search filter (search across multiple fields)
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                                { phone: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } }
                            ]
                        }
                    }
                ];
            }

            // Date range filter
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate);
                }
            }

            // Build order by clause
            const orderBy: any = {};
            orderBy[sortBy] = sortOrder;

            // Fetch complaints and total count
            const [complaints, total, statusCounts] = await Promise.all([
                prisma.complaint.findMany({
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
                prisma.complaint.count({ where }),
                this.getStatusCounts()
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
        } catch (error) {
            console.error('Error getting admin complaints:', error);
            throw new Error('Failed to fetch complaints');
        }
    }

    /**
     * Get single complaint by ID with full details (admin access)
     */
    async getAdminComplaintById(id: number) {
        try {
            const complaint = await prisma.complaint.findUnique({
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
                            createdAt: true
                        }
                    }
                }
            });

            if (!complaint) {
                throw new Error('Complaint not found');
            }

            // Fetch status history and chat messages separately
            const [statusHistory, chatMessages] = await Promise.all([
                prisma.statusHistory.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.complaintChatMessage.findMany({
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
        } catch (error) {
            console.error('Error getting complaint by ID:', error);
            throw error;
        }
    }

    /**
     * Update complaint status and create status history entry
     */
    async updateComplaintStatus(id: number, input: UpdateComplaintStatusInput) {
        try {
            // Get current complaint
            const currentComplaint = await prisma.complaint.findUnique({
                where: { id }
            });

            if (!currentComplaint) {
                throw new Error('Complaint not found');
            }

            // Update complaint status and create status history in a transaction
            const result = await prisma.$transaction(async (tx) => {
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
        } catch (error) {
            console.error('Error updating complaint status:', error);
            throw error;
        }
    }

    /**
     * Get all complaints for a specific user
     */
    async getComplaintsByUser(userId: number, page: number = 1, limit: number = 20) {
        try {
            const skip = (page - 1) * limit;

            const [complaints, total, user] = await Promise.all([
                prisma.complaint.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.complaint.count({ where: { userId } }),
                prisma.user.findUnique({
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
        } catch (error) {
            console.error('Error getting complaints by user:', error);
            throw error;
        }
    }

    /**
     * Get complaint statistics for a specific user
     */
    private async getUserComplaintStatistics(userId: number) {
        const [total, pending, inProgress, resolved, rejected] = await Promise.all([
            prisma.complaint.count({ where: { userId } }),
            prisma.complaint.count({ where: { userId, status: ComplaintStatus.PENDING } }),
            prisma.complaint.count({ where: { userId, status: ComplaintStatus.IN_PROGRESS } }),
            prisma.complaint.count({ where: { userId, status: ComplaintStatus.RESOLVED } }),
            prisma.complaint.count({ where: { userId, status: ComplaintStatus.REJECTED } })
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
     */
    private async getStatusCounts() {
        const [pending, inProgress, resolved, rejected] = await Promise.all([
            prisma.complaint.count({ where: { status: ComplaintStatus.PENDING } }),
            prisma.complaint.count({ where: { status: ComplaintStatus.IN_PROGRESS } }),
            prisma.complaint.count({ where: { status: ComplaintStatus.RESOLVED } }),
            prisma.complaint.count({ where: { status: ComplaintStatus.REJECTED } })
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
    private parseFileUrls(urlString: string | null): string[] {
        if (!urlString) return [];

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(urlString);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
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
    private formatComplaintResponse(complaint: any) {
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
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    }
}

export const adminComplaintService = new AdminComplaintService();
