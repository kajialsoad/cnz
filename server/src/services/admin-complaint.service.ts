import prisma from '../utils/prisma';
import { ComplaintStatus } from '@prisma/client';

export interface AdminComplaintQueryInput {
    page?: number;
    limit?: number;
    status?: ComplaintStatus | 'ALL';
    category?: string;
    subcategory?: string;
    ward?: string;
    zoneId?: number; // New: Zone filter
    wardId?: number; // New: Ward filter
    cityCorporationCode?: string;
    thanaId?: number; // Deprecated: Keep for backward compatibility
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
                subcategory,
                ward,
                zoneId,
                wardId,
                cityCorporationCode,
                thanaId, // Deprecated but kept for backward compatibility
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause - COMPLETELY REWRITTEN
            const andConditions: any[] = [];

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
                } else {
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
                } else {
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

            // Zone filter (filter through user relationship)
            if (zoneId) {
                andConditions.push({
                    user: {
                        zoneId: zoneId
                    }
                });
            }

            // Ward filter (filter through user relationship using wardId)
            if (wardId) {
                andConditions.push({
                    user: {
                        wardId: wardId
                    }
                });
            }

            // Legacy ward filter (filter through user relationship using ward string)
            // Kept for backward compatibility
            if (ward && !wardId) {
                andConditions.push({
                    user: {
                        ward: ward
                    }
                });
            }

            // Thana filter (filter through user relationship)
            // Deprecated but kept for backward compatibility
            if (thanaId) {
                andConditions.push({
                    user: {
                        thanaId: thanaId
                    }
                });
            }

            // Date range filter
            if (startDate || endDate) {
                const dateFilter: any = {};
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
                                        name: true,
                                        officerName: true,
                                        officerDesignation: true
                                    }
                                },
                                ward: {
                                    select: {
                                        id: true,
                                        wardNumber: true,
                                        inspectorName: true,
                                        inspectorSerialNumber: true
                                    }
                                }
                            }
                        }
                    }
                }),
                prisma.complaint.count({ where }),
                this.getStatusCounts(cityCorporationCode, zoneId, wardId)
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
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error; // Throw original error to see actual message
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
     * Optionally filtered by city corporation, zone, or ward
     */
    private async getStatusCounts(cityCorporationCode?: string, zoneId?: number, wardId?: number) {
        // Build where clause for filters
        const userFilter: any = {};

        if (cityCorporationCode) {
            userFilter.cityCorporationCode = cityCorporationCode;
        }

        if (zoneId) {
            userFilter.zoneId = zoneId;
        }

        if (wardId) {
            userFilter.wardId = wardId;
        }

        const whereClause = Object.keys(userFilter).length > 0
            ? { user: userFilter }
            : {};

        const [pending, inProgress, resolved, rejected] = await Promise.all([
            prisma.complaint.count({
                where: {
                    ...whereClause,
                    status: ComplaintStatus.PENDING
                }
            }),
            prisma.complaint.count({
                where: {
                    ...whereClause,
                    status: ComplaintStatus.IN_PROGRESS
                }
            }),
            prisma.complaint.count({
                where: {
                    ...whereClause,
                    status: ComplaintStatus.RESOLVED
                }
            }),
            prisma.complaint.count({
                where: {
                    ...whereClause,
                    status: ComplaintStatus.REJECTED
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

    /**
     * Get complaint statistics grouped by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByZone(cityCorporationCode?: string) {
        try {
            // Build where clause
            const whereClause = cityCorporationCode
                ? { user: { cityCorporationCode } }
                : {};

            // Get all complaints with user zone information
            const complaints = await prisma.complaint.findMany({
                where: whereClause,
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            zoneId: true,
                            zone: {
                                select: {
                                    id: true,
                                    zoneNumber: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            // Group by zone
            const zoneStats = new Map<number, any>();

            complaints.forEach(complaint => {
                const zoneId = complaint.user?.zoneId;
                const zone = complaint.user?.zone;

                if (!zoneId || !zone) return;

                if (!zoneStats.has(zoneId)) {
                    zoneStats.set(zoneId, {
                        zoneId,
                        zoneNumber: zone.zoneNumber,
                        zoneName: zone.name,
                        total: 0,
                        pending: 0,
                        inProgress: 0,
                        resolved: 0,
                        rejected: 0
                    });
                }

                const stats = zoneStats.get(zoneId)!;
                stats.total++;

                switch (complaint.status) {
                    case ComplaintStatus.PENDING:
                        stats.pending++;
                        break;
                    case ComplaintStatus.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case ComplaintStatus.RESOLVED:
                        stats.resolved++;
                        break;
                    case ComplaintStatus.REJECTED:
                        stats.rejected++;
                        break;
                }
            });

            // Convert map to array and sort by zone number
            return Array.from(zoneStats.values()).sort((a, b) => a.zoneNumber - b.zoneNumber);
        } catch (error) {
            console.error('Error getting complaint stats by zone:', error);
            throw error;
        }
    }

    /**
     * Get complaint statistics grouped by ward
     * @param zoneId Optional filter by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByWard(zoneId?: number, cityCorporationCode?: string) {
        try {
            // Build where clause
            const userFilter: any = {};

            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }

            if (zoneId) {
                userFilter.zoneId = zoneId;
            }

            const whereClause = Object.keys(userFilter).length > 0
                ? { user: userFilter }
                : {};

            // Get all complaints with user ward information
            const complaints = await prisma.complaint.findMany({
                where: whereClause,
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            wardId: true,
                            zoneId: true,
                            ward: {
                                select: {
                                    id: true,
                                    wardNumber: true,
                                    inspectorName: true
                                }
                            },
                            zone: {
                                select: {
                                    id: true,
                                    zoneNumber: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            // Group by ward
            const wardStats = new Map<number, any>();

            complaints.forEach(complaint => {
                const wardId = complaint.user?.wardId;
                const ward = complaint.user?.ward;
                const zone = complaint.user?.zone;

                if (!wardId || !ward) return;

                if (!wardStats.has(wardId)) {
                    wardStats.set(wardId, {
                        wardId,
                        wardNumber: ward.wardNumber,
                        inspectorName: ward.inspectorName,
                        zoneId: complaint.user?.zoneId,
                        zoneNumber: zone?.zoneNumber,
                        zoneName: zone?.name,
                        total: 0,
                        pending: 0,
                        inProgress: 0,
                        resolved: 0,
                        rejected: 0
                    });
                }

                const stats = wardStats.get(wardId)!;
                stats.total++;

                switch (complaint.status) {
                    case ComplaintStatus.PENDING:
                        stats.pending++;
                        break;
                    case ComplaintStatus.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case ComplaintStatus.RESOLVED:
                        stats.resolved++;
                        break;
                    case ComplaintStatus.REJECTED:
                        stats.rejected++;
                        break;
                }
            });

            // Convert map to array and sort by zone number then ward number
            return Array.from(wardStats.values()).sort((a, b) => {
                if (a.zoneNumber !== b.zoneNumber) {
                    return a.zoneNumber - b.zoneNumber;
                }
                return a.wardNumber - b.wardNumber;
            });
        } catch (error) {
            console.error('Error getting complaint stats by ward:', error);
            throw error;
        }
    }
}

export const adminComplaintService = new AdminComplaintService();
