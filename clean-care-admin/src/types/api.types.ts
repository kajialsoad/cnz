import type { ApiResponse, PaginationParams, BaseFilters } from './common.types';
import type { User } from './auth.types';
import type { AppUser } from './user.types';
import type { Complaint } from './complaint.types';
import type { Notification } from './notification.types';

// Auth API types
export interface AuthApiClient {
  login: (credentials: { email: string; password: string }) => Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>;
  logout: () => Promise<ApiResponse<void>>;
  refreshToken: (refreshToken: string) => Promise<ApiResponse<{ accessToken: string; refreshToken: string }>>;
  forgotPassword: (email: string) => Promise<ApiResponse<void>>;
  resetPassword: (token: string, newPassword: string) => Promise<ApiResponse<void>>;
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
}

// Users API types
export interface UsersApiClient {
  getUsers: (params?: PaginationParams & BaseFilters) => Promise<ApiResponse<AppUser[]>>;
  getUserById: (id: string) => Promise<ApiResponse<AppUser>>;
  createUser: (userData: Partial<AppUser>) => Promise<ApiResponse<AppUser>>;
  updateUser: (id: string, userData: Partial<AppUser>) => Promise<ApiResponse<AppUser>>;
  deleteUser: (id: string) => Promise<ApiResponse<void>>;
  getUserStats: () => Promise<ApiResponse<{ total: number; active: number; newThisMonth: number }>>;
}

// Complaints API types
export interface ComplaintsApiClient {
  getComplaints: (params?: PaginationParams & BaseFilters) => Promise<ApiResponse<Complaint[]>>;
  getComplaintById: (id: string) => Promise<ApiResponse<Complaint>>;
  createComplaint: (complaintData: Partial<Complaint>) => Promise<ApiResponse<Complaint>>;
  updateComplaint: (id: string, complaintData: Partial<Complaint>) => Promise<ApiResponse<Complaint>>;
  deleteComplaint: (id: string) => Promise<ApiResponse<void>>;
  assignComplaint: (id: string, staffId: string) => Promise<ApiResponse<Complaint>>;
  updateStatus: (id: string, status: string) => Promise<ApiResponse<Complaint>>;
  getComplaintStats: () => Promise<ApiResponse<{ total: number; pending: number; resolved: number }>>;
}

// Notifications API types
export interface NotificationsApiClient {
  getNotifications: (params?: PaginationParams & BaseFilters) => Promise<ApiResponse<Notification[]>>;
  getNotificationById: (id: string) => Promise<ApiResponse<Notification>>;
  createNotification: (notificationData: Partial<Notification>) => Promise<ApiResponse<Notification>>;
  updateNotification: (id: string, notificationData: Partial<Notification>) => Promise<ApiResponse<Notification>>;
  deleteNotification: (id: string) => Promise<ApiResponse<void>>;
  sendNotification: (id: string) => Promise<ApiResponse<void>>;
  getNotificationStats: () => Promise<ApiResponse<{ total: number; sent: number; pending: number }>>;
}

// Settings API types
export interface SettingsApiClient {
  getSettings: () => Promise<ApiResponse<Record<string, unknown>>>;
  updateSettings: (settings: Record<string, unknown>) => Promise<ApiResponse<Record<string, unknown>>>;
  getSystemInfo: () => Promise<ApiResponse<{ version: string; uptime: number; dbStatus: string }>>;
}

// File upload API types
export interface FileUploadApiClient {
  uploadFile: (file: File, type: 'avatar' | 'attachment' | 'document') => Promise<ApiResponse<{ fileId: string; fileUrl: string }>>;
  deleteFile: (fileId: string) => Promise<ApiResponse<void>>;
  getFileInfo: (fileId: string) => Promise<ApiResponse<{ fileName: string; fileSize: number; mimeType: string; uploadedAt: string }>>;
}

// Dashboard API types
export interface DashboardApiClient {
  getDashboardStats: () => Promise<ApiResponse<{
    totalUsers: number;
    totalComplaints: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
    }>;
  }>>;
  getActivityFeed: (limit?: number) => Promise<ApiResponse<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>>>;
}