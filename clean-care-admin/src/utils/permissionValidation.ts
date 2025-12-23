import type { Permissions, PermissionFeatures } from '../components/common/PermissionsModal';

/**
 * Validate permission structure on frontend
 * Ensures all required fields are present and have correct types
 */
export const validatePermissionStructure = (permissions: any): permissions is Permissions => {
    if (!permissions || typeof permissions !== 'object') {
        return false;
    }

    // Check zones array
    if (!Array.isArray(permissions.zones)) {
        return false;
    }

    // Check wards array
    if (!Array.isArray(permissions.wards)) {
        return false;
    }

    // Check categories array
    if (!Array.isArray(permissions.categories)) {
        return false;
    }

    // Check features object
    if (!permissions.features || typeof permissions.features !== 'object') {
        return false;
    }

    // Check all required feature flags
    const requiredFeatures: (keyof PermissionFeatures)[] = [
        // Complaint Management
        'canViewComplaints',
        'canApproveComplaints',
        'canRejectComplaints',
        'canMarkComplaintsPending',
        'canEditComplaints',
        'canDeleteComplaints',

        // User Management
        'canViewUsers',
        'canEditUsers',
        'canDeleteUsers',
        'canAddUsers',

        // Admin Management
        'canViewAdmins',
        'canEditAdmins',
        'canDeleteAdmins',
        'canAddAdmins',

        // Messaging
        'canViewMessages',
        'canSendMessagesToUsers',
        'canSendMessagesToAdmins',

        // Analytics & Reports
        'canViewAnalytics',
        'canExportData',
        'canDownloadReports',

        // View Only Mode
        'viewOnlyMode',
    ];

    for (const feature of requiredFeatures) {
        if (typeof permissions.features[feature] !== 'boolean') {
            return false;
        }
    }

    return true;
};

/**
 * Detect permission conflicts
 * Returns array of conflict messages
 */
export const detectPermissionConflicts = (permissions: Permissions): string[] => {
    const conflicts: string[] = [];

    // View Only Mode conflicts
    if (permissions.features.viewOnlyMode) {
        // Check if any action permissions are enabled
        const actionPermissions = [
            'canApproveComplaints',
            'canRejectComplaints',
            'canMarkComplaintsPending',
            'canEditComplaints',
            'canDeleteComplaints',
            'canEditUsers',
            'canDeleteUsers',
            'canAddUsers',
            'canEditAdmins',
            'canDeleteAdmins',
            'canAddAdmins',
            'canSendMessagesToUsers',
            'canSendMessagesToAdmins',
            'canExportData',
            'canDownloadReports',
        ] as const;

        for (const permission of actionPermissions) {
            if (permissions.features[permission]) {
                conflicts.push(
                    `View Only Mode is enabled but "${permission}" is also enabled. View Only Mode should disable all action permissions.`
                );
            }
        }
    }

    // Delete without Edit conflicts
    if (permissions.features.canDeleteComplaints && !permissions.features.canEditComplaints) {
        conflicts.push(
            'Delete Complaints permission is enabled but Edit Complaints is disabled. Users typically need edit permission before delete.'
        );
    }

    if (permissions.features.canDeleteUsers && !permissions.features.canEditUsers) {
        conflicts.push(
            'Delete Users permission is enabled but Edit Users is disabled. Users typically need edit permission before delete.'
        );
    }

    if (permissions.features.canDeleteAdmins && !permissions.features.canEditAdmins) {
        conflicts.push(
            'Delete Admins permission is enabled but Edit Admins is disabled. Users typically need edit permission before delete.'
        );
    }

    // Send messages without view messages
    if (
        (permissions.features.canSendMessagesToUsers || permissions.features.canSendMessagesToAdmins) &&
        !permissions.features.canViewMessages
    ) {
        conflicts.push(
            'Send Messages permission is enabled but View Messages is disabled. Users need to view messages to send them.'
        );
    }

    // Export/Download without View Analytics
    if (
        (permissions.features.canExportData || permissions.features.canDownloadReports) &&
        !permissions.features.canViewAnalytics
    ) {
        conflicts.push(
            'Export/Download permission is enabled but View Analytics is disabled. Users typically need to view analytics before exporting.'
        );
    }

    // Complaint actions without view
    const complaintActions = [
        'canApproveComplaints',
        'canRejectComplaints',
        'canMarkComplaintsPending',
        'canEditComplaints',
        'canDeleteComplaints',
    ] as const;

    for (const action of complaintActions) {
        if (permissions.features[action] && !permissions.features.canViewComplaints) {
            conflicts.push(
                `${action} is enabled but View Complaints is disabled. Users need to view complaints to perform actions on them.`
            );
        }
    }

    // User actions without view
    const userActions = ['canEditUsers', 'canDeleteUsers', 'canAddUsers'] as const;

    for (const action of userActions) {
        if (permissions.features[action] && !permissions.features.canViewUsers) {
            conflicts.push(
                `${action} is enabled but View Users is disabled. Users need to view users to perform actions on them.`
            );
        }
    }

    // Admin actions without view
    const adminActions = ['canEditAdmins', 'canDeleteAdmins', 'canAddAdmins'] as const;

    for (const action of adminActions) {
        if (permissions.features[action] && !permissions.features.canViewAdmins) {
            conflicts.push(
                `${action} is enabled but View Admins is disabled. Users need to view admins to perform actions on them.`
            );
        }
    }

    return conflicts;
};

/**
 * Auto-fix permission conflicts
 * Returns corrected permissions
 */
export const autoFixPermissionConflicts = (permissions: Permissions): Permissions => {
    const fixed = { ...permissions };

    // If View Only Mode is enabled, disable all action permissions
    if (fixed.features.viewOnlyMode) {
        fixed.features = {
            ...fixed.features,
            // Keep view permissions
            canViewComplaints: true,
            canViewUsers: true,
            canViewAdmins: true,
            canViewMessages: true,

            // Disable all action permissions
            canApproveComplaints: false,
            canRejectComplaints: false,
            canMarkComplaintsPending: false,
            canEditComplaints: false,
            canDeleteComplaints: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canAddUsers: false,
            canEditAdmins: false,
            canDeleteAdmins: false,
            canAddAdmins: false,
            canSendMessagesToUsers: false,
            canSendMessagesToAdmins: false,
            canViewAnalytics: false,
            canExportData: false,
            canDownloadReports: false,
            viewOnlyMode: true,
        };
        return fixed;
    }

    // Enable view permissions if action permissions are enabled
    if (
        fixed.features.canApproveComplaints ||
        fixed.features.canRejectComplaints ||
        fixed.features.canMarkComplaintsPending ||
        fixed.features.canEditComplaints ||
        fixed.features.canDeleteComplaints
    ) {
        fixed.features.canViewComplaints = true;
    }

    if (
        fixed.features.canEditUsers ||
        fixed.features.canDeleteUsers ||
        fixed.features.canAddUsers
    ) {
        fixed.features.canViewUsers = true;
    }

    if (
        fixed.features.canEditAdmins ||
        fixed.features.canDeleteAdmins ||
        fixed.features.canAddAdmins
    ) {
        fixed.features.canViewAdmins = true;
    }

    if (
        fixed.features.canSendMessagesToUsers ||
        fixed.features.canSendMessagesToAdmins
    ) {
        fixed.features.canViewMessages = true;
    }

    if (fixed.features.canExportData || fixed.features.canDownloadReports) {
        fixed.features.canViewAnalytics = true;
    }

    return fixed;
};

/**
 * Get permission warnings (non-critical issues)
 * Returns array of warning messages
 */
export const getPermissionWarnings = (permissions: Permissions): string[] => {
    const warnings: string[] = [];

    // Warn if no permissions are enabled
    const hasAnyPermission = Object.values(permissions.features).some(
        (value) => value === true && value !== permissions.features.viewOnlyMode
    );

    if (!hasAnyPermission && !permissions.features.viewOnlyMode) {
        warnings.push('No permissions are enabled. User will not be able to perform any actions.');
    }

    // Warn if only view permissions are enabled (similar to view-only mode)
    const viewPermissions = [
        'canViewComplaints',
        'canViewUsers',
        'canViewAdmins',
        'canViewMessages',
        'canViewAnalytics',
    ] as const;

    const actionPermissions = [
        'canApproveComplaints',
        'canRejectComplaints',
        'canMarkComplaintsPending',
        'canEditComplaints',
        'canDeleteComplaints',
        'canEditUsers',
        'canDeleteUsers',
        'canAddUsers',
        'canEditAdmins',
        'canDeleteAdmins',
        'canAddAdmins',
        'canSendMessagesToUsers',
        'canSendMessagesToAdmins',
        'canExportData',
        'canDownloadReports',
    ] as const;

    const hasViewPermissions = viewPermissions.some((p) => permissions.features[p]);
    const hasActionPermissions = actionPermissions.some((p) => permissions.features[p]);

    if (hasViewPermissions && !hasActionPermissions && !permissions.features.viewOnlyMode) {
        warnings.push(
            'Only view permissions are enabled. Consider enabling "View Only Mode" for clarity.'
        );
    }

    // Warn if delete is enabled without edit
    if (permissions.features.canDeleteComplaints && !permissions.features.canEditComplaints) {
        warnings.push('Delete Complaints is enabled without Edit Complaints. This is unusual.');
    }

    if (permissions.features.canDeleteUsers && !permissions.features.canEditUsers) {
        warnings.push('Delete Users is enabled without Edit Users. This is unusual.');
    }

    if (permissions.features.canDeleteAdmins && !permissions.features.canEditAdmins) {
        warnings.push('Delete Admins is enabled without Edit Admins. This is unusual.');
    }

    return warnings;
};

/**
 * Validate permissions before save
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export const validatePermissionsBeforeSave = (
    permissions: Permissions
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check structure
    if (!validatePermissionStructure(permissions)) {
        errors.push('Invalid permission structure. Please check all fields.');
        return { valid: false, errors, warnings };
    }

    // Check for conflicts
    const conflicts = detectPermissionConflicts(permissions);
    if (conflicts.length > 0) {
        errors.push(...conflicts);
    }

    // Get warnings
    const permissionWarnings = getPermissionWarnings(permissions);
    warnings.push(...permissionWarnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Compare two permission objects
 * Returns array of changes
 */
export const comparePermissions = (
    oldPermissions: Permissions,
    newPermissions: Permissions
): string[] => {
    const changes: string[] = [];

    // Compare features
    const featureKeys = Object.keys(newPermissions.features) as (keyof PermissionFeatures)[];

    for (const key of featureKeys) {
        if (oldPermissions.features[key] !== newPermissions.features[key]) {
            const oldValue = oldPermissions.features[key] ? 'enabled' : 'disabled';
            const newValue = newPermissions.features[key] ? 'enabled' : 'disabled';
            changes.push(`${key}: ${oldValue} → ${newValue}`);
        }
    }

    // Compare zones
    const oldZones = new Set(oldPermissions.zones);
    const newZones = new Set(newPermissions.zones);

    const addedZones = [...newZones].filter((z) => !oldZones.has(z));
    const removedZones = [...oldZones].filter((z) => !newZones.has(z));

    if (addedZones.length > 0) {
        changes.push(`Added zones: ${addedZones.join(', ')}`);
    }

    if (removedZones.length > 0) {
        changes.push(`Removed zones: ${removedZones.join(', ')}`);
    }

    // Compare wards
    const oldWards = new Set(oldPermissions.wards);
    const newWards = new Set(newPermissions.wards);

    const addedWards = [...newWards].filter((w) => !oldWards.has(w));
    const removedWards = [...oldWards].filter((w) => !newWards.has(w));

    if (addedWards.length > 0) {
        changes.push(`Added wards: ${addedWards.join(', ')}`);
    }

    if (removedWards.length > 0) {
        changes.push(`Removed wards: ${removedWards.join(', ')}`);
    }

    return changes;
};
