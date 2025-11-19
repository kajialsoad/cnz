/**
 * Category Service Types
 * Type definitions for the category service
 */

// ============================================================================
// Category Data Types
// ============================================================================

export interface SubcategoryItem {
    id: string;
    bangla: string;
    english: string;
}

export interface CategoryItem {
    id: string;
    bangla: string;
    english: string;
    color: string;
    icon: string;
    subcategories: SubcategoryItem[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GetCategoriesResponse {
    success: boolean;
    data: {
        categories: CategoryItem[];
    };
}

export interface GetCategoryResponse {
    success: boolean;
    data: {
        category: CategoryItem;
    };
}

export interface GetSubcategoriesResponse {
    success: boolean;
    data: {
        categoryId: string;
        subcategories: SubcategoryItem[];
    };
}

// ============================================================================
// Category Statistics Types
// ============================================================================

export interface CategoryStatistic {
    category: string;
    categoryNameEn: string;
    categoryNameBn: string;
    categoryColor: string;
    totalCount: number;
    percentage: number;
    subcategories: SubcategoryStatistic[];
}

export interface SubcategoryStatistic {
    subcategory: string;
    subcategoryNameEn: string;
    subcategoryNameBn: string;
    count: number;
    percentage: number;
}

export interface GetCategoryStatisticsResponse {
    success: boolean;
    data: {
        statistics: CategoryStatistic[];
        totalCategories: number;
        totalComplaints: number;
    };
}

// ============================================================================
// Category Trends Types
// ============================================================================

export interface CategoryTrendDataPoint {
    date: string;
    total: number;
    [categoryId: string]: number | string; // Dynamic category counts
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

// ============================================================================
// Query Parameters
// ============================================================================

export interface CategoryStatisticsQuery {
    startDate?: string;
    endDate?: string;
}

export interface CategoryTrendsQuery {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
}
