"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
class AnalyticsService {
    /**
     * Get comprehensive complaint analytics
     */
    async getComplaintAnalytics(query = {}) {
        try {
            const { startDate, endDate } = query;
            // Build date filter
            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) {
                    dateFilter.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    dateFilter.createdAt.lte = new Date(endDate);
                }
            }
            // Get all analytics data in parallel
            const [totalComplaints, statusBreakdown, categoryBreakdown, wardBreakdown, averageResolutionTime, resolutionRate] = await Promise.all([
                this.getTotalComplaints(dateFilter),
                this.getStatusBreakdown(dateFilter),
                this.getCategoryBreakdown(dateFilter),
                this.getWardBreakdown(dateFilter),
                this.calculateAverageResolutionTime(dateFilter),
                this.calculateResolutionRate(dateFilter)
            ]);
            return {
                totalComplaints,
                statusBreakdown,
                categoryBreakdown,
                wardBreakdown,
                averageResolutionTime,
                resolutionRate
            };
        }
        catch (error) {
            console.error('Error getting complaint analytics:', error);
            throw new Error('Failed to fetch complaint analytics');
        }
    }
    /**
     * Get complaint trends over time
     */
    async getComplaintTrends(query = {}) {
        try {
            const { period = 'week', startDate, endDate } = query;
            // Calculate date range based on period
            const dateRange = this.calculateDateRange(period, startDate, endDate);
            // Get complaints within date range
            const complaints = await prisma_1.default.complaint.findMany({
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                },
                select: {
                    createdAt: true,
                    status: true
                }
            });
            // Group complaints by date
            const trendData = this.groupComplaintsByDate(complaints, period, dateRange);
            return trendData;
        }
        catch (error) {
            console.error('Error getting complaint trends:', error);
            throw new Error('Failed to fetch complaint trends');
        }
    }
    /**
     * Calculate average resolution time in hours
     */
    async calculateAverageResolutionTime(dateFilter = {}) {
        try {
            const resolvedComplaints = await prisma_1.default.complaint.findMany({
                where: {
                    ...dateFilter,
                    status: client_1.ComplaintStatus.RESOLVED
                },
                select: {
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (resolvedComplaints.length === 0) {
                return 0;
            }
            // Calculate total resolution time in milliseconds
            const totalResolutionTime = resolvedComplaints.reduce((sum, complaint) => {
                const resolutionTime = new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime();
                return sum + resolutionTime;
            }, 0);
            // Convert to hours and return average
            const averageMs = totalResolutionTime / resolvedComplaints.length;
            const averageHours = averageMs / (1000 * 60 * 60);
            return Math.round(averageHours * 10) / 10; // Round to 1 decimal place
        }
        catch (error) {
            console.error('Error calculating average resolution time:', error);
            throw new Error('Failed to calculate average resolution time');
        }
    }
    /**
     * Calculate resolution rate as percentage
     */
    async calculateResolutionRate(dateFilter = {}) {
        try {
            const [total, resolved] = await Promise.all([
                prisma_1.default.complaint.count({ where: dateFilter }),
                prisma_1.default.complaint.count({
                    where: {
                        ...dateFilter,
                        status: client_1.ComplaintStatus.RESOLVED
                    }
                })
            ]);
            if (total === 0) {
                return 0;
            }
            const rate = (resolved / total) * 100;
            return Math.round(rate * 10) / 10; // Round to 1 decimal place
        }
        catch (error) {
            console.error('Error calculating resolution rate:', error);
            throw new Error('Failed to calculate resolution rate');
        }
    }
    /**
     * Get total complaints count
     */
    async getTotalComplaints(dateFilter = {}) {
        return await prisma_1.default.complaint.count({ where: dateFilter });
    }
    /**
     * Get status breakdown
     */
    async getStatusBreakdown(dateFilter = {}) {
        const [pending, inProgress, resolved, rejected] = await Promise.all([
            prisma_1.default.complaint.count({
                where: { ...dateFilter, status: client_1.ComplaintStatus.PENDING }
            }),
            prisma_1.default.complaint.count({
                where: { ...dateFilter, status: client_1.ComplaintStatus.IN_PROGRESS }
            }),
            prisma_1.default.complaint.count({
                where: { ...dateFilter, status: client_1.ComplaintStatus.RESOLVED }
            }),
            prisma_1.default.complaint.count({
                where: { ...dateFilter, status: client_1.ComplaintStatus.REJECTED }
            })
        ]);
        return {
            pending,
            inProgress,
            resolved,
            rejected
        };
    }
    /**
     * Get category breakdown
     */
    async getCategoryBreakdown(dateFilter = {}) {
        const complaints = await prisma_1.default.complaint.findMany({
            where: dateFilter,
            select: {
                title: true
            }
        });
        // Group by category (extracted from title or description)
        const categoryMap = {};
        complaints.forEach(complaint => {
            // Extract category from title (simple categorization)
            const category = this.extractCategory(complaint.title);
            categoryMap[category] = (categoryMap[category] || 0) + 1;
        });
        return categoryMap;
    }
    /**
     * Get ward breakdown
     */
    async getWardBreakdown(dateFilter = {}) {
        const complaints = await prisma_1.default.complaint.findMany({
            where: dateFilter,
            select: {
                location: true
            }
        });
        // Group by ward
        const wardMap = {};
        complaints.forEach(complaint => {
            const ward = this.extractWard(complaint.location);
            if (ward) {
                wardMap[ward] = (wardMap[ward] || 0) + 1;
            }
        });
        return wardMap;
    }
    /**
     * Calculate date range based on period
     */
    calculateDateRange(period, startDate, endDate) {
        const end = endDate ? new Date(endDate) : new Date();
        let start;
        if (startDate) {
            start = new Date(startDate);
        }
        else {
            start = new Date(end);
            switch (period) {
                case 'day':
                    start.setDate(start.getDate() - 7); // Last 7 days
                    break;
                case 'week':
                    start.setDate(start.getDate() - 28); // Last 4 weeks
                    break;
                case 'month':
                    start.setMonth(start.getMonth() - 6); // Last 6 months
                    break;
                case 'year':
                    start.setFullYear(start.getFullYear() - 2); // Last 2 years
                    break;
            }
        }
        return { start, end };
    }
    /**
     * Group complaints by date based on period
     */
    groupComplaintsByDate(complaints, period, dateRange) {
        const dataMap = new Map();
        // Initialize all dates in range
        const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
            const key = this.formatDateKey(current, period);
            dataMap.set(key, {
                date: key,
                count: 0,
                resolved: 0,
                pending: 0,
                inProgress: 0
            });
            // Increment date based on period
            switch (period) {
                case 'day':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'year':
                    current.setFullYear(current.getFullYear() + 1);
                    break;
            }
        }
        // Count complaints by date
        complaints.forEach(complaint => {
            const key = this.formatDateKey(new Date(complaint.createdAt), period);
            const data = dataMap.get(key);
            if (data) {
                data.count++;
                if (complaint.status === client_1.ComplaintStatus.RESOLVED) {
                    data.resolved++;
                }
                else if (complaint.status === client_1.ComplaintStatus.PENDING) {
                    data.pending++;
                }
                else if (complaint.status === client_1.ComplaintStatus.IN_PROGRESS) {
                    data.inProgress++;
                }
            }
        });
        return Array.from(dataMap.values());
    }
    /**
     * Format date key based on period
     */
    formatDateKey(date, period) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        switch (period) {
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week':
                const weekNum = this.getWeekNumber(date);
                return `${year}-W${String(weekNum).padStart(2, '0')}`;
            case 'month':
                return `${year}-${month}`;
            case 'year':
                return `${year}`;
        }
    }
    /**
     * Get week number of the year
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }
    /**
     * Extract category from complaint title
     */
    extractCategory(title) {
        const lowerTitle = title.toLowerCase();
        // Define category keywords
        const categories = {
            'Waste Management': ['waste', 'garbage', 'trash', 'rubbish', 'disposal'],
            'Drainage': ['drainage', 'drain', 'sewer', 'water', 'flood'],
            'Street Cleaning': ['street', 'road', 'cleaning', 'sweep'],
            'Sanitation': ['sanitation', 'toilet', 'hygiene', 'bathroom'],
            'Infrastructure': ['infrastructure', 'repair', 'maintenance', 'broken'],
            'Other': []
        };
        // Find matching category
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
                return category;
            }
        }
        return 'Other';
    }
    /**
     * Extract ward from location string
     */
    extractWard(location) {
        const wardMatch = location.match(/Ward:\s*(\d+)/i);
        return wardMatch ? `Ward ${wardMatch[1]}` : null;
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
