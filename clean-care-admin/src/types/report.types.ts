export interface ReportFilter {
  dateFrom: Date;
  dateTo: Date;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeResolved?: boolean;
  includePending?: boolean;
  categories?: string[];
  priorities?: string[];
  locations?: string[];
}

export interface DashboardReport {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  avgResolutionTime: number;
  satisfactionRating: number;
  trendsData: TrendData[];
  categoryBreakdown: CategoryData[];
  priorityBreakdown: PriorityData[];
  locationBreakdown: LocationData[];
  recentActivity: ActivityData[];
}

export interface TrendData {
  date: string;
  total: number;
  resolved: number;
  pending: number;
  cancelled: number;
}

export interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface PriorityData {
  priority: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface LocationData {
  location: string;
  count: number;
  percentage: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ActivityData {
  id: string;
  type: 'complaint_created' | 'complaint_resolved' | 'user_registered' | 'staff_assigned';
  description: string;
  timestamp: Date;
  relatedId?: string;
}

export interface ComplaintReport {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    avgResolutionTime: number;
    satisfactionRating: number;
  };
  trends: TrendData[];
  topCategories: CategoryData[];
  performanceMetrics: {
    resolutionRate: number;
    avgResponseTime: number;
    customerSatisfaction: number;
    staffEfficiency: number;
  };
}

export interface UserReport {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    byStatus: Record<string, number>;
  };
  demographics: {
    byCity: Record<string, number>;
    byAge: Record<string, number>;
    registrationTrends: Array<{
      date: string;
      count: number;
    }>;
  };
  engagement: {
    totalComplaints: number;
    avgComplaintsPerUser: number;
    mostActiveUsers: Array<{
      userId: string;
      userName: string;
      complaintCount: number;
    }>;
  };
}

export interface StaffPerformanceReport {
  summary: {
    totalStaff: number;
    activeStaff: number;
    totalAssignments: number;
    avgResolutionTime: number;
  };
  performance: Array<{
    staffId: string;
    staffName: string;
    assignedComplaints: number;
    resolvedComplaints: number;
    avgResolutionTime: number;
    satisfactionRating: number;
    efficiency: number;
  }>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    from: Date;
    to: Date;
  };
  includeCharts: boolean;
  includeDetails: boolean;
  filters?: Record<string, unknown>;
}