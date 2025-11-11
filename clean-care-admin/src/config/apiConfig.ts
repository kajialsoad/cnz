export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/admin/auth/login',
      LOGOUT: '/admin/auth/logout',
      REFRESH: '/admin/auth/refresh',
      PROFILE: '/admin/auth/me',
    },
    USERS: {
      LIST: '/users',
      CREATE: '/users',
      UPDATE: '/users',
      DELETE: '/users',
      DETAILS: '/users',
    },
    ADMINS: {
      LIST: '/admins',
      CREATE: '/admins',
      UPDATE: '/admins',
      DELETE: '/admins',
      ROLES: '/admins/roles',
      PERMISSIONS: '/admins/permissions',
    },
    COMPLAINTS: {
      LIST: '/complaints',
      CREATE: '/complaints',
      UPDATE: '/complaints',
      DELETE: '/complaints',
      ASSIGN: '/complaints/assign',
      STATUS: '/complaints/status',
      LOCATION: '/complaints/location',
    },
    REPORTS: {
      DASHBOARD: '/reports/dashboard',
      COMPLAINTS: '/reports/complaints',
      USERS: '/reports/users',
      EXPORT: '/reports/export',
    },
    NOTIFICATIONS: {
      LIST: '/notifications',
      SEND: '/notifications/send',
      BROADCAST: '/notifications/broadcast',
      TEMPLATES: '/notifications/templates',
    },
    SETTINGS: {
      GENERAL: '/settings/general',
      SYSTEM: '/settings/system',
      SECURITY: '/settings/security',
      INTEGRATIONS: '/settings/integrations',
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