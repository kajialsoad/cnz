// Activity Log Types

export interface ActivityLog {
    id: number;
    userId: number;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: any;
    newValue: any;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Date;
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string | null;
        role: string;
    };
}

export interface ActivityLogQuery {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    cityCorporationCode?: string;
}

export interface ActivityLogResponse {
    logs: ActivityLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Action constants
export const ActivityActions = {
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    UPDATE_USER_STATUS: 'UPDATE_USER_STATUS',
    UPDATE_USER_PERMISSIONS: 'UPDATE_USER_PERMISSIONS',
    CREATE_COMPLAINT: 'CREATE_COMPLAINT',
    UPDATE_COMPLAINT: 'UPDATE_COMPLAINT',
    DELETE_COMPLAINT: 'DELETE_COMPLAINT',
    ASSIGN_COMPLAINT: 'ASSIGN_COMPLAINT',
    UPDATE_COMPLAINT_STATUS: 'UPDATE_COMPLAINT_STATUS',
    SEND_MESSAGE: 'SEND_MESSAGE',
    DELETE_MESSAGE: 'DELETE_MESSAGE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    FAILED_LOGIN: 'FAILED_LOGIN',
    CREATE_ZONE: 'CREATE_ZONE',
    UPDATE_ZONE: 'UPDATE_ZONE',
    DELETE_ZONE: 'DELETE_ZONE',
    CREATE_WARD: 'CREATE_WARD',
    UPDATE_WARD: 'UPDATE_WARD',
    DELETE_WARD: 'DELETE_WARD',
    EXPORT_DATA: 'EXPORT_DATA',
} as const;

// Entity type constants
export const EntityTypes = {
    USER: 'USER',
    COMPLAINT: 'COMPLAINT',
    MESSAGE: 'MESSAGE',
    ZONE: 'ZONE',
    WARD: 'WARD',
    CITY_CORPORATION: 'CITY_CORPORATION',
} as const;

// Helper function to get action label
export function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
        CREATE_USER: 'Created User',
        UPDATE_USER: 'Updated User',
        DELETE_USER: 'Deleted User',
        UPDATE_USER_STATUS: 'Updated User Status',
        UPDATE_USER_PERMISSIONS: 'Updated User Permissions',
        CREATE_COMPLAINT: 'Created Complaint',
        UPDATE_COMPLAINT: 'Updated Complaint',
        DELETE_COMPLAINT: 'Deleted Complaint',
        ASSIGN_COMPLAINT: 'Assigned Complaint',
        UPDATE_COMPLAINT_STATUS: 'Updated Complaint Status',
        SEND_MESSAGE: 'Sent Message',
        DELETE_MESSAGE: 'Deleted Message',
        LOGIN: 'Logged In',
        LOGOUT: 'Logged Out',
        FAILED_LOGIN: 'Failed Login',
        CREATE_ZONE: 'Created Zone',
        UPDATE_ZONE: 'Updated Zone',
        DELETE_ZONE: 'Deleted Zone',
        CREATE_WARD: 'Created Ward',
        UPDATE_WARD: 'Updated Ward',
        DELETE_WARD: 'Deleted Ward',
        EXPORT_DATA: 'Exported Data',
    };
    return labels[action] || action;
}

// Helper function to get action color
export function getActionColor(action: string): string {
    if (action.startsWith('CREATE')) return 'success';
    if (action.startsWith('UPDATE')) return 'info';
    if (action.startsWith('DELETE')) return 'error';
    if (action === 'LOGIN') return 'success';
    if (action === 'LOGOUT') return 'grey';
    if (action === 'FAILED_LOGIN') return 'error';
    return 'grey';
}
