// Common API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  statusCode?: number;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Common filter parameters
export interface BaseFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// File upload types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

// Common status types
export type Status = 'active' | 'inactive' | 'suspended' | 'pending' | 'approved' | 'rejected';

// Common priority types
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Language types
export type Language = 'en' | 'bn' | 'hi';

// Coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Date range
export interface DateRange {
  from: Date;
  to: Date;
}

// Key-value pair
export interface KeyValuePair<T = string> {
  key: string;
  value: T;
  label?: string;
}

// Option for dropdowns/selects
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

// Toast notification
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Form field error
export interface FieldError {
  field: string;
  message: string;
}

// Generic entity with audit fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Search result
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters?: Record<string, unknown>;
}