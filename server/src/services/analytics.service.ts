import prisma from '../utils/prisma';
import { ComplaintStatus } from '@prisma/client';
import { categoryService } from './category.service';

export interface AnalyticsQueryInput {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
}

export interface CategoryStatistic {
    category: string;
    categoryNameEn: string;
    categoryNameBn: string;
    categoryColor: string;
    subcategory: string;
    subcategoryNameEn: string;
    subcategoryNameBn: string;
    count: number;
    percentage: number;
}

export interface CategorySummary {
    category: string;
    categoryNameEn: string;
    categoryNameBn: string;
    categoryColor: string;
    totalCount: number;
    percentage: number;
    subcategories: Array<{
        subcategory: string;
        subcategoryNameEn: string;
        subcategoryNameBn: string;
        count: number;
        percentage: number;
    }>;
}

export interface TrendDataPoint {
    date: string;
    count: number;
    resolved: number;
    pending: number;
    inProgress: number;
}

export class AnalyticsService {
    /**
     * Get comprehensive complaint analytics
     */
    async getComplaintAnalytics(query: AnalyticsQueryInput = {}) {
        try {
            const { startDate, endDate } = query;

            // Build date filter
            const dateFilter: any = {};
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
            const [
                totalComplaints,
                statusBreakdown,
                categoryBreakdown,
                wardBreakdown,
                averageResolutionTime,
                resolutionRate
            ] = await Promise.all([
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
        } catch (error) {
            console.error('Error getting complaint analytics:', error);
            throw new Error('Failed to fetch complaint analytics');
        }
    }

    /**
     * Get complaint trends over time
     */
    async getComplaintTrends(query: AnalyticsQueryInput = {}): Promise<TrendDataPoint[]> {
        try {
            const { period = 'week', startDate, endDate } = query;

            // Calculate date range based on period
            const dateRange = this.calculateDateRange(period, startDate, endDate);

            // Get complaints within date range
            const complaints = await prisma.complaint.findMany({
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
        } catch (error) {
            console.error('Error getting complaint trends:', error);
            throw new Error('Failed to fetch complaint trends');
        }
    }

    /**
     * Calculate average resolution time in hours
     */
    async calculateAverageResolutionTime(dateFilter: any = {}): Promise<number> {
        try {
            const resolvedComplaints = await prisma.complaint.findMany({
                where: {
                    ...dateFilter,
                    status: ComplaintStatus.RESOLVED
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
        } catch (error) {
            console.error('Error calculating average resolution time:', error);
            throw new Error('Failed to calculate average resolution time');
        }
    }

    /**
     * Calculate resolution rate as percentage
     */
    async calculateResolutionRate(dateFilter: any = {}): Promise<number> {
        try {
            const [total, resolved] = await Promise.all([
                prisma.complaint.count({ where: dateFilter }),
                prisma.complaint.count({
                    where: {
                        ...dateFilter,
                        status: ComplaintStatus.RESOLVED
                    }
                })
            ]);

            if (total === 0) {
                return 0;
            }

            const rate = (resolved / total) * 100;
            return Math.round(rate * 10) / 10; // Round to 1 decimal place
        } catch (error) {
            console.error('Error calculating resolution rate:', error);
            throw new Error('Failed to calculate resolution rate');
        }
    }

    /**
     * Get category statistics with counts and percentages
     */
    async getCategoryStatistics(query: AnalyticsQueryInput = {}): Promise<CategorySummary[]> {
        try {
            const { startDate, endDate } = query;

            // Build date filter
            const dateFilter: any = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) {
                    dateFilter.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    dateFilter.createdAt.lte = new Date(endDate);
                }
            }

            // Get complaints grouped by category and subcategory
            const complaints = await prisma.complaint.findMany({
                where: dateFilter,
                select: {
                    category: true,
                    subcategory: true
                }
            });

            // Get total count for percentage calculation
            const totalCount = complaints.length;

            if (totalCount === 0) {
                return [];
            }

            // Group by category and subcategory
            const categoryMap = new Map<string, Map<string, number>>();

            complaints.forEach(complaint => {
                if (!complaint.category || !complaint.subcategory) return;

                if (!categoryMap.has(complaint.category)) {
                    categoryMap.set(complaint.category, new Map());
                }

                const subcategoryMap = categoryMap.get(complaint.category)!;
                const currentCount = subcategoryMap.get(complaint.subcategory) || 0;
                subcategoryMap.set(complaint.subcategory, currentCount + 1);
            });

            // Build category summaries
            const categorySummaries: CategorySummary[] = [];

            categoryMap.forEach((subcategoryMap, categoryId) => {
                const category = categoryService.getCategoryById(categoryId);
                if (!category) return;

                // Calculate total for this category
                let categoryTotal = 0;
                subcategoryMap.forEach(count => {
                    categoryTotal += count;
                });

                // Build subcategory details
                const subcategories: CategorySummary['subcategories'] = [];
                subcategoryMap.forEach((count, subcategoryId) => {
                    const subcategory = categoryService.getSubcategoryById(categoryId, subcategoryId);
                    if (!subcategory) return;

                    subcategories.push({
                        subcategory: subcategoryId,
                        subcategoryNameEn: subcategory.english,
                        subcategoryNameBn: subcategory.bangla,
                        count,
                        percentage: Math.round((count / categoryTotal) * 100 * 10) / 10
                    });
                });

                // Sort subcategories by count (descending)
                subcategories.sort((a, b) => b.count - a.count);

                categorySummaries.push({
                    category: categoryId,
                    categoryNameEn: category.english,
                    categoryNameBn: category.bangla,
                    categoryColor: category.color,
                    totalCount: categoryTotal,
                    percentage: Math.round((categoryTotal / totalCount) * 100 * 10) / 10,
                    subcategories
                });
            });

            // Sort by total count (descending)
            categorySummaries.sort((a, b) => b.totalCount - a.totalCount);

            return categorySummaries;
        } catch (error) {
            console.error('Error getting category statistics:', error);
            throw new Error('Failed to fetch category statistics');
        }
    }

    /**
     * Get category trends over time
     */
    async getCategoryTrends(query: AnalyticsQueryInput = {}): Promise<any> {
        try {
            const { period = 'week', startDate, endDate } = query;

            // Calculate date range based on period
            const dateRange = this.calculateDateRange(period, startDate, endDate);

            // Get complaints within date range with category info
            const complaints = await prisma.complaint.findMany({
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                },
                select: {
                    createdAt: true,
                    category: true,
                    subcategory: true
                }
            });

            // Get all categories
            const allCategories = categoryService.getAllCategories();

            // Initialize data structure for each date and category
            const trendMap = new Map<string, Map<string, number>>();

            // Initialize all dates in range
            const current = new Date(dateRange.start);
            while (current <= dateRange.end) {
                const dateKey = this.formatDateKey(current, period);
                const categoryCountMap = new Map<string, number>();

                // Initialize all categories with 0
                allCategories.forEach(cat => {
                    categoryCountMap.set(cat.id, 0);
                });

                trendMap.set(dateKey, categoryCountMap);

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

            // Count complaints by date and category
            complaints.forEach(complaint => {
                if (!complaint.category) return;

                const dateKey = this.formatDateKey(new Date(complaint.createdAt), period);
                const categoryCountMap = trendMap.get(dateKey);

                if (categoryCountMap) {
                    const currentCount = categoryCountMap.get(complaint.category) || 0;
                    categoryCountMap.set(complaint.category, currentCount + 1);
                }
            });

            // Convert to array format suitable for charts
            const trends: any[] = [];

            trendMap.forEach((categoryCountMap, dateKey) => {
                const dataPoint: any = {
                    date: dateKey,
                    total: 0
                };

                // Add count for each category
                allCategories.forEach(cat => {
                    const count = categoryCountMap.get(cat.id) || 0;
                    dataPoint[cat.id] = count;
                    dataPoint.total += count;
                });

                trends.push(dataPoint);
            });

            // Return trends with category metadata
            return {
                trends,
                categories: allCategories.map(cat => ({
                    id: cat.id,
                    nameEn: cat.english,
                    nameBn: cat.bangla,
                    color: cat.color
                }))
            };
        } catch (error) {
            console.error('Error getting category trends:', error);
            throw new Error('Failed to fetch category trends');
        }
    }

    /**
     * Get total complaints count
     */
    private async getTotalComplaints(dateFilter: any = {}): Promise<number> {
        return await prisma.complaint.count({ where: dateFilter });
    }

    /**
     * Get status breakdown
     */
    private async getStatusBreakdown(dateFilter: any = {}) {
        const [pending, inProgress, resolved, rejected] = await Promise.all([
            prisma.complaint.count({
                where: { ...dateFilter, status: ComplaintStatus.PENDING }
            }),
            prisma.complaint.count({
                where: { ...dateFilter, status: ComplaintStatus.IN_PROGRESS }
            }),
            prisma.complaint.count({
                where: { ...dateFilter, status: ComplaintStatus.RESOLVED }
            }),
            prisma.complaint.count({
                where: { ...dateFilter, status: ComplaintStatus.REJECTED }
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
    private async getCategoryBreakdown(dateFilter: any = {}): Promise<Record<string, number>> {
        const complaints = await prisma.complaint.findMany({
            where: dateFilter,
            select: {
                title: true
            }
        });

        // Group by category (extracted from title or description)
        const categoryMap: Record<string, number> = {};

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
    private async getWardBreakdown(dateFilter: any = {}): Promise<Record<string, number>> {
        const complaints = await prisma.complaint.findMany({
            where: dateFilter,
            select: {
                location: true
            }
        });

        // Group by ward
        const wardMap: Record<string, number> = {};

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
    private calculateDateRange(
        period: 'day' | 'week' | 'month' | 'year',
        startDate?: string,
        endDate?: string
    ): { start: Date; end: Date } {
        const end = endDate ? new Date(endDate) : new Date();
        let start: Date;

        if (startDate) {
            start = new Date(startDate);
        } else {
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
    private groupComplaintsByDate(
        complaints: Array<{ createdAt: Date; status: ComplaintStatus }>,
        period: 'day' | 'week' | 'month' | 'year',
        dateRange: { start: Date; end: Date }
    ): TrendDataPoint[] {
        const dataMap = new Map<string, TrendDataPoint>();

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
                if (complaint.status === ComplaintStatus.RESOLVED) {
                    data.resolved++;
                } else if (complaint.status === ComplaintStatus.PENDING) {
                    data.pending++;
                } else if (complaint.status === ComplaintStatus.IN_PROGRESS) {
                    data.inProgress++;
                }
            }
        });

        return Array.from(dataMap.values());
    }

    /**
     * Format date key based on period
     */
    private formatDateKey(date: Date, period: 'day' | 'week' | 'month' | 'year'): string {
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
    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    /**
     * Extract category from complaint title
     */
    private extractCategory(title: string): string {
        const lowerTitle = title.toLowerCase();

        // Define category keywords
        const categories: Record<string, string[]> = {
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
    private extractWard(location: string): string | null {
        const wardMatch = location.match(/Ward:\s*(\d+)/i);
        return wardMatch ? `Ward ${wardMatch[1]}` : null;
    }
}

export const analyticsService = new AnalyticsService();
