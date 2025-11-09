export const APP_CONFIG = {
  APP_NAME: 'Clean Care Admin',
  VERSION: '1.0.0',
  DESCRIPTION: 'City Clean Care Management System Admin Panel',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  
  // UI
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 64,
  DRAWER_WIDTH: 280,
  
  // Map settings
  MAP_CONFIG: {
    DEFAULT_ZOOM: 12,
    MAX_ZOOM: 18,
    MIN_ZOOM: 8,
    DEFAULT_CENTER: { lat: 23.8103, lng: 90.4125 }, // Dhaka, Bangladesh
  },
  
  // Date formats
  DATE_FORMATS: {
    DISPLAY: 'MMM dd, yyyy',
    DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
    API: 'yyyy-MM-dd',
    API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  },
  
  // File uploads
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
  
  // Notifications
  NOTIFICATION_DURATION: 5000,
  
  // Auto-refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    DASHBOARD: 30000, // 30 seconds
    COMPLAINTS: 60000, // 1 minute
    NOTIFICATIONS: 15000, // 15 seconds
  },
  
  // Status options
  COMPLAINT_STATUS: [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'assigned', label: 'Assigned', color: 'info' },
    { value: 'in-progress', label: 'In Progress', color: 'primary' },
    { value: 'resolved', label: 'Resolved', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
  ],
  
  USER_STATUS: [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'error' },
    { value: 'suspended', label: 'Suspended', color: 'warning' },
  ],
  
  PRIORITY_LEVELS: [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'urgent', label: 'Urgent', color: 'error' },
  ],
} as const;