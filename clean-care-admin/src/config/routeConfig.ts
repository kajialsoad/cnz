export const ROUTE_PATHS = {
  // Auth routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Public routes
  HOME: '/home',
  ABOUT: '/about',
  BLOG: '/blog',
  
  // Main app routes
  DASHBOARD: '/dashboard',
  
  // User Management
  USERS: '/users',
  USER_DETAILS: '/users/:id',
  USER_CREATE: '/users/create',
  USER_EDIT: '/users/:id/edit',
  
  // Admin Management
  ADMINS: '/admins',
  ADMIN_DETAILS: '/admins/:id',
  ADMIN_CREATE: '/admins/create',
  ADMIN_EDIT: '/admins/:id/edit',
  ROLES: '/admins/roles',
  PERMISSIONS: '/admins/permissions',
  
  // Complaints
  COMPLAINTS: '/complaints',
  COMPLAINT_DETAILS: '/complaints/:id',
  COMPLAINT_CREATE: '/complaints/create',
  COMPLAINT_EDIT: '/complaints/:id/edit',
  COMPLAINT_MAP: '/complaints/map',
  
  // Reports
  REPORTS: '/reports',
  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_COMPLAINTS: '/reports/complaints',
  REPORTS_USERS: '/reports/users',
  REPORTS_CUSTOM: '/reports/custom',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_CREATE: '/notifications/create',
  NOTIFICATION_TEMPLATES: '/notifications/templates',
  NOTIFICATION_HISTORY: '/notifications/history',
  
  // Notice Board
  NOTICES: '/notices',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_GENERAL: '/settings/general',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_SYSTEM: '/settings/system',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  SETTINGS_BACKUP: '/settings/backup',
  
  // Error pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
} as const;

export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    path: ROUTE_PATHS.DASHBOARD,
    icon: 'Dashboard',
  },
  {
    title: 'User Management',
    path: ROUTE_PATHS.USERS,
    icon: 'People',
  },
  {
    title: 'Admin Management',
    path: ROUTE_PATHS.ADMINS,
    icon: 'AdminPanelSettings',
  },
  {
    title: 'Complaints',
    path: ROUTE_PATHS.COMPLAINTS,
    icon: 'ReportProblem',
  },
  {
    title: 'Reports',
    path: ROUTE_PATHS.REPORTS,
    icon: 'Analytics',
  },
  {
    title: 'Notifications',
    path: ROUTE_PATHS.NOTIFICATIONS,
    icon: 'Notifications',
  },
  {
    title: 'Settings',
    path: ROUTE_PATHS.SETTINGS,
    icon: 'Settings',
  },
] as const;