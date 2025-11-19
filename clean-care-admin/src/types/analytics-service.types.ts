// Analytics Service Types

export interface AnalyticsData {
    totalComplaints: number;
    statusBreakdown: {
        pending: number;
        inProgress: number;
        resolved: number;
        rejected: number;
    };
    categoryBreakdown: Record<string, number>;
    wardBreakdown: Record<string, number>;
    trends: TrendData[];
    averageResolutionTime: number; // in hours
    resolutionRate: number; // percentage
}

export interface TrendData {
    date: string;
    count: number;
    resolved?: number;
    pending?: number;
    inProgress?: number;
}

export interface AnalyticsQuery {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
}

export interface GetAnalyticsResponse {
    success: boolean;
    data: AnalyticsData;
}

export interface GetTrendsResponse {
    success: boolean;
    data: {
        trends: TrendData[];
    };
}

// Category Statistics Types

export interface CategorySubcategory {
    subcategory: string;
    subcategoryNameEn: string;
    subcategoryNameBn: string;
    count: number;
    percentage: number;
}

export interface CategoryStatistic {
    category: string;
    categoryNameEn: string;
    categoryNameBn: string;
    categoryColor: string;
    totalCount: number;
    percentage: number;
    subcategories: CategorySubcategory[];
}

export interface GetCategoryStatsResponse {
    success: boolean;
    data: {
        statistics: CategoryStatistic[];
        totalCategories: number;
        totalComplaints: number;
    };
}

export interface CategoryTrendDataPoint {
    date: string;
    total: number;
    [categoryId: string]: number | string; // Dynamic category IDs with counts
}

export interface CategoryMetadata {
    id: string;
    nameEn: string;
    nameBn: string;
    color: string;
}

export interface GetCategoryTrendsResponse {
    success: boolean;
    data: {
        trends: CategoryTrendDataPoint[];
        categories: CategoryMetadata[];
    };
}
