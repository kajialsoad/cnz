export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  TIMEOUT: 30000, // Increased to 30 seconds for slow database queries
  FALLBACK_TIMEOUT: 3000, // Fast timeout for local server check
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/admin/auth/login',
      LOGOUT: '/api/admin/auth/logout',
      REFRESH: '/api/admin/auth/refresh',
      PROFILE: '/api/admin/auth/me',
    },
    USERS: {
      LIST: '/api/admin/users',
      CREATE: '/api/admin/users',
      UPDATE: '/api/admin/users',
      DELETE: '/api/admin/users',
      DETAILS: '/api/admin/users',
    },
    ADMINS: {
      LIST: '/api/admin/users',
      CREATE: '/api/admin/users',
      UPDATE: '/api/admin/users',
      DELETE: '/api/admin/users',
      ROLES: '/api/admin/users/roles',
      PERMISSIONS: '/api/admin/users/permissions',
    },
    COMPLAINTS: {
      LIST: '/api/admin/complaints',
      CREATE: '/api/admin/complaints',
      UPDATE: '/api/admin/complaints',
      DELETE: '/api/admin/complaints',
      ASSIGN: '/api/admin/complaints/assign',
      STATUS: '/api/admin/complaints/status',
      LOCATION: '/api/admin/complaints/location',
    },
    REPORTS: {
      DASHBOARD: '/api/admin/analytics/dashboard',
      COMPLAINTS: '/api/admin/analytics/complaints',
      USERS: '/api/admin/analytics/users',
      EXPORT: '/api/admin/analytics/export',
    },
    NOTIFICATIONS: {
      LIST: '/api/notifications',
      SEND: '/api/notifications/send',
      BROADCAST: '/api/notifications/broadcast',
      TEMPLATES: '/api/notifications/templates',
    },
    SETTINGS: {
      GENERAL: '/api/settings/general',
      SYSTEM: '/api/settings/system',
      SECURITY: '/api/settings/security',
      INTEGRATIONS: '/api/settings/integrations',
    },
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;