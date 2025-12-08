/**
 * Role Configuration for Admin Panel
 * Defines visual styling and metadata for each admin role
 * 
 * This configuration supports:
 * - Role-specific colors and gradients for UI elements
 * - Multilingual labels (English and Bangla)
 * - Permission descriptions for each role
 * - Utility functions for role formatting and display
 */

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';

export interface RoleConfig {
    label: string;
    labelBangla: string;
    designation: string;
    designationBangla: string;
    color: string;
    gradient: string;
    icon: string;
    badgeColor: string;
    permissions: string[];
    permissionDescriptions: {
        [key: string]: string;
    };
}

export const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
    MASTER_ADMIN: {
        label: 'Master Admin',
        labelBangla: 'মাস্টার অ্যাডমিন',
        designation: 'Chief Controller',
        designationBangla: 'প্রধান নিয়ন্ত্রক',
        color: '#9333EA',
        gradient: 'linear-gradient(135deg, #9333EA 0%, #F59E0B 100%)',
        icon: '👑',
        badgeColor: '#9333EA',
        permissions: [
            'Full System Access',
            'User Management',
            'System Configuration',
            'All Admin Functions',
        ],
        permissionDescriptions: {
            'Full System Access': 'Complete control over all system features and settings',
            'User Management': 'Create, edit, and delete all user accounts including admins',
            'System Configuration': 'Modify system-wide settings and configurations',
            'All Admin Functions': 'Access to all administrative functions without restrictions',
        },
    },
    SUPER_ADMIN: {
        label: 'Super Admin',
        labelBangla: 'সুপার অ্যাডমিন',
        designation: 'Senior Controller',
        designationBangla: 'সিনিয়র নিয়ন্ত্রক',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        icon: '⭐',
        badgeColor: '#3B82F6',
        permissions: [
            'User Management',
            'Complaint Management',
            'Analytics Access',
            'Report Generation',
        ],
        permissionDescriptions: {
            'User Management': 'Manage regular users and basic admin accounts',
            'Complaint Management': 'Full access to complaint handling and resolution',
            'Analytics Access': 'View and analyze system analytics and statistics',
            'Report Generation': 'Generate and export system reports',
        },
    },
    ADMIN: {
        label: 'Admin',
        labelBangla: 'অ্যাডমিন',
        designation: 'Controller',
        designationBangla: 'নিয়ন্ত্রক',
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        icon: '🛡️',
        badgeColor: '#10B981',
        permissions: [
            'Complaint Management',
            'Basic Analytics',
            'User Support',
        ],
        permissionDescriptions: {
            'Complaint Management': 'Handle and respond to user complaints',
            'Basic Analytics': 'View basic statistics and complaint trends',
            'User Support': 'Provide support to users through chat and messaging',
        },
    },
};

// Cache for role configs to avoid repeated lookups
const roleConfigCache = new Map<string, RoleConfig>();

/**
 * Get role configuration for a given role (cached for performance)
 */
export const getRoleConfig = (role?: string): RoleConfig => {
    const cacheKey = role?.toUpperCase() || 'ADMIN';

    // Check cache first
    if (roleConfigCache.has(cacheKey)) {
        return roleConfigCache.get(cacheKey)!;
    }

    const normalizedRole = cacheKey as AdminRole;
    const config = ROLE_CONFIGS[normalizedRole] || ROLE_CONFIGS.ADMIN;

    // Store in cache
    roleConfigCache.set(cacheKey, config);

    return config;
};

/**
 * Format role label for display
 */
export const formatRoleLabel = (role?: string, useBangla: boolean = false): string => {
    const config = getRoleConfig(role);
    return useBangla ? config.labelBangla : config.label;
};

/**
 * Format designation for display
 */
export const formatDesignation = (role?: string, useBangla: boolean = false): string => {
    const config = getRoleConfig(role);
    return useBangla ? config.designationBangla : config.designation;
};

/**
 * Get role color
 */
export const getRoleColor = (role?: string): string => {
    return getRoleConfig(role).color;
};

/**
 * Get role gradient
 */
export const getRoleGradient = (role?: string): string => {
    return getRoleConfig(role).gradient;
};

/**
 * Get role icon
 */
export const getRoleIcon = (role?: string): string => {
    return getRoleConfig(role).icon;
};

/**
 * Get role permissions
 */
export const getRolePermissions = (role?: string): string[] => {
    return getRoleConfig(role).permissions;
};

/**
 * Get role permission descriptions
 */
export const getRolePermissionDescriptions = (role?: string): { [key: string]: string } => {
    return getRoleConfig(role).permissionDescriptions;
};

/**
 * Get formatted permission description for a specific permission
 */
export const getPermissionDescription = (role: string, permission: string): string => {
    const config = getRoleConfig(role);
    return config.permissionDescriptions[permission] || permission;
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: string, permission: string): boolean => {
    const config = getRoleConfig(role);
    return config.permissions.includes(permission);
};

/**
 * Get badge color for role
 */
export const getRoleBadgeColor = (role?: string): string => {
    return getRoleConfig(role).badgeColor;
};

/**
 * Check if role is valid
 */
export const isValidRole = (role?: string): boolean => {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'MASTER_ADMIN';
};

/**
 * Get all available roles
 */
export const getAllRoles = (): AdminRole[] => {
    return ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'];
};

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export const getRoleLevel = (role?: string): number => {
    const normalizedRole = (role?.toUpperCase() || 'ADMIN') as AdminRole;
    const levels: Record<AdminRole, number> = {
        ADMIN: 1,
        SUPER_ADMIN: 2,
        MASTER_ADMIN: 3,
    };
    return levels[normalizedRole] || 1;
};

/**
 * Compare two roles (returns true if role1 has higher or equal permissions than role2)
 */
export const hasHigherOrEqualRole = (role1?: string, role2?: string): boolean => {
    return getRoleLevel(role1) >= getRoleLevel(role2);
};

/**
 * Format role for display with icon
 */
export const formatRoleWithIcon = (role?: string, useBangla: boolean = false): string => {
    const config = getRoleConfig(role);
    const label = useBangla ? config.labelBangla : config.label;
    return `${config.icon} ${label}`;
};

/**
 * Get role display name (label + designation)
 */
export const getRoleDisplayName = (role?: string, useBangla: boolean = false): string => {
    const config = getRoleConfig(role);
    const label = useBangla ? config.labelBangla : config.label;
    const designation = useBangla ? config.designationBangla : config.designation;
    return `${label} - ${designation}`;
};
