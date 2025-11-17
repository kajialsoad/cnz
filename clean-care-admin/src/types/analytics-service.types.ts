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
