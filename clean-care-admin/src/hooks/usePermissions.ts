import { useAuth } from '../contexts/AuthContext';
import type { Permissions, PermissionFeatures } from '../components/common/PermissionsModal';

// Keep backward compatibility
export interface AdminPermissions extends Permissions { }

export const usePermissions = () => {
    const { user } = useAuth();

    // Get permissions from user object
    const permissions = user?.permissions as AdminPermissions | null | undefined;

    // Check if user is in view-only mode
    const isViewOnlyMode = permissions?.features?.viewOnlyMode ?? false;

    // Helper function to check any permission
    const hasPermission = (permission: keyof PermissionFeatures): boolean => {
        if (!user) return false;

        // If in view-only mode, only allow view permissions
        if (isViewOnlyMode) {
            const viewPermissions: (keyof PermissionFeatures)[] = [
                'canViewComplaints',
                'canViewUsers',
                'canViewAdmins',
                'canViewMessages',
            ];
            return viewPermissions.includes(permission);
        }

        // Master Admin has all permissions (unless in view-only mode)
        if (user.role === 'MASTER_ADMIN') {
            return true;
        }

        // Check user's specific permissions
        return permissions?.features?.[permission] ?? false;
    };

    // Complaint Management
    const canViewComplaints = () => hasPermission('canViewComplaints');
    const canApproveComplaints = () => hasPermission('canApproveComplaints');
    const canRejectComplaints = () => hasPermission('canRejectComplaints');
    const canMarkComplaintsPending = () => hasPermission('canMarkComplaintsPending');
    const canEditComplaints = () => hasPermission('canEditComplaints');
    const canDeleteComplaints = () => hasPermission('canDeleteComplaints');

    // User Management
    const canViewUsers = () => hasPermission('canViewUsers');
    const canEditUsers = () => hasPermission('canEditUsers');
    const canDeleteUsers = () => hasPermission('canDeleteUsers');
    const canAddUsers = () => hasPermission('canAddUsers');

    // Admin Management
    const canViewAdmins = () => hasPermission('canViewAdmins');
    const canEditAdmins = () => hasPermission('canEditAdmins');
    const canDeleteAdmins = () => hasPermission('canDeleteAdmins');
    const canAddAdmins = () => hasPermission('canAddAdmins');

    // Messaging
    const canViewMessages = () => hasPermission('canViewMessages');
    const canSendMessagesToUsers = () => hasPermission('canSendMessagesToUsers');
    const canSendMessagesToAdmins = () => hasPermission('canSendMessagesToAdmins');

    // Analytics & Reports
    const canViewAnalytics = () => hasPermission('canViewAnalytics');
    const canExportData = () => hasPermission('canExportData');
    const canDownloadReports = () => hasPermission('canDownloadReports');

    // Role-based helpers
    const canManageAdmins = () => {
        if (!user) return false;
        if (isViewOnlyMode) return false;
        // Only Master Admin and Super Admin can manage admins
        return user.role === 'MASTER_ADMIN' || user.role === 'SUPER_ADMIN';
    };

    const canManageSuperAdmins = () => {
        if (!user) return false;
        if (isViewOnlyMode) return false;
        // Only Master Admin can manage Super Admins
        return user.role === 'MASTER_ADMIN';
    };

    const canManageCityCorporations = () => {
        if (!user) return false;
        if (isViewOnlyMode) return false;
        // Only Master Admin can manage city corporations
        return user.role === 'MASTER_ADMIN';
    };

    return {
        permissions,
        hasPermission,
        isViewOnlyMode,

        // Complaint Management
        canViewComplaints,
        canApproveComplaints,
        canRejectComplaints,
        canMarkComplaintsPending,
        canEditComplaints,
        canDeleteComplaints,

        // User Management
        canViewUsers,
        canEditUsers,
        canDeleteUsers,
        canAddUsers,

        // Admin Management
        canViewAdmins,
        canEditAdmins,
        canDeleteAdmins,
        canAddAdmins,

        // Messaging
        canViewMessages,
        canSendMessagesToUsers,
        canSendMessagesToAdmins,

        // Analytics & Reports
        canViewAnalytics,
        canExportData,
        canDownloadReports,

        // Role-based helpers
        canManageAdmins,
        canManageSuperAdmins,
        canManageCityCorporations,
    };
};
