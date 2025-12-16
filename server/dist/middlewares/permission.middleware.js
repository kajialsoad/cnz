"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminManagementPermission = exports.validatePermissionUpdate = exports.blockIfViewOnly = exports.requireCategoryAccess = exports.requireWardAccess = exports.requireZoneAccess = exports.requirePermission = void 0;
const permission_service_1 = require("../services/permission.service");
const client_1 = require("@prisma/client");
/**
 * Middleware to check if user has a specific permission
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_TOKEN_MISSING',
                        message: 'Authentication required',
                    },
                });
            }
            const hasPermission = await permission_service_1.permissionService.hasPermission(userId, permission);
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: `You do not have permission to ${permission}`,
                    },
                });
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Error checking permissions',
                },
            });
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has access to a specific zone
 */
const requireZoneAccess = (zoneIdParam = 'zoneId') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const zoneId = parseInt(req.params[zoneIdParam] || req.body[zoneIdParam] || req.query[zoneIdParam]);
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_TOKEN_MISSING',
                        message: 'Authentication required',
                    },
                });
            }
            if (!zoneId || isNaN(zoneId)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Valid zone ID required',
                    },
                });
            }
            const hasAccess = await permission_service_1.permissionService.hasZoneAccess(userId, zoneId);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_ZONE_MISMATCH',
                        message: 'You do not have access to this zone',
                    },
                });
            }
            next();
        }
        catch (error) {
            console.error('Zone access check error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Error checking zone access',
                },
            });
        }
    };
};
exports.requireZoneAccess = requireZoneAccess;
/**
 * Middleware to check if user has access to a specific ward
 */
const requireWardAccess = (wardIdParam = 'wardId') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const wardId = parseInt(req.params[wardIdParam] || req.body[wardIdParam] || req.query[wardIdParam]);
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_TOKEN_MISSING',
                        message: 'Authentication required',
                    },
                });
            }
            if (!wardId || isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Valid ward ID required',
                    },
                });
            }
            const hasAccess = await permission_service_1.permissionService.hasWardAccess(userId, wardId);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_WARD_MISMATCH',
                        message: 'You do not have access to this ward',
                    },
                });
            }
            next();
        }
        catch (error) {
            console.error('Ward access check error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Error checking ward access',
                },
            });
        }
    };
};
exports.requireWardAccess = requireWardAccess;
/**
 * Middleware to check if user has access to a specific category
 */
const requireCategoryAccess = (categoryParam = 'category') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const category = req.params[categoryParam] || req.body[categoryParam] || req.query[categoryParam];
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_TOKEN_MISSING',
                        message: 'Authentication required',
                    },
                });
            }
            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Category required',
                    },
                });
            }
            const hasAccess = await permission_service_1.permissionService.hasCategoryAccess(userId, category);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: 'You do not have access to this category',
                    },
                });
            }
            next();
        }
        catch (error) {
            console.error('Category access check error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Error checking category access',
                },
            });
        }
    };
};
exports.requireCategoryAccess = requireCategoryAccess;
/**
 * Middleware to check if user is in view-only mode
 * Blocks all write operations if view-only mode is enabled
 */
const blockIfViewOnly = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_TOKEN_MISSING',
                    message: 'Authentication required',
                },
            });
        }
        const permissions = await permission_service_1.permissionService.getPermissions(userId);
        if (permissions?.features.viewOnlyMode) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_VIEW_ONLY_MODE',
                    message: 'This action is not allowed in view-only mode',
                },
            });
        }
        next();
    }
    catch (error) {
        console.error('View-only check error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error checking view-only mode',
            },
        });
    }
};
exports.blockIfViewOnly = blockIfViewOnly;
/**
 * Middleware to validate permission updates
 * Ensures permission structure is valid before saving
 */
const validatePermissionUpdate = (req, res, next) => {
    try {
        const permissions = req.body.permissions;
        if (!permissions) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Permissions object required',
                },
            });
        }
        // Validate structure
        if (!permission_service_1.permissionService.validatePermissions(permissions)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Invalid permission structure',
                },
            });
        }
        // Check for conflicts
        const conflicts = detectPermissionConflicts(permissions);
        if (conflicts.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PERMISSION_CONFLICT',
                    message: 'Permission conflicts detected',
                    details: conflicts,
                },
            });
        }
        next();
    }
    catch (error) {
        console.error('Permission validation error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error validating permissions',
            },
        });
    }
};
exports.validatePermissionUpdate = validatePermissionUpdate;
/**
 * Detect permission conflicts on backend
 */
function detectPermissionConflicts(permissions) {
    const conflicts = [];
    // View Only Mode conflicts
    if (permissions.features.viewOnlyMode) {
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
        ];
        for (const permission of actionPermissions) {
            if (permissions.features[permission]) {
                conflicts.push(`View Only Mode is enabled but "${permission}" is also enabled`);
            }
        }
    }
    // Action without view conflicts
    if ((permissions.features.canApproveComplaints ||
        permissions.features.canRejectComplaints ||
        permissions.features.canMarkComplaintsPending ||
        permissions.features.canEditComplaints ||
        permissions.features.canDeleteComplaints) &&
        !permissions.features.canViewComplaints) {
        conflicts.push('Complaint actions enabled without View Complaints permission');
    }
    if ((permissions.features.canEditUsers ||
        permissions.features.canDeleteUsers ||
        permissions.features.canAddUsers) &&
        !permissions.features.canViewUsers) {
        conflicts.push('User actions enabled without View Users permission');
    }
    if ((permissions.features.canEditAdmins ||
        permissions.features.canDeleteAdmins ||
        permissions.features.canAddAdmins) &&
        !permissions.features.canViewAdmins) {
        conflicts.push('Admin actions enabled without View Admins permission');
    }
    if ((permissions.features.canSendMessagesToUsers || permissions.features.canSendMessagesToAdmins) &&
        !permissions.features.canViewMessages) {
        conflicts.push('Send Messages enabled without View Messages permission');
    }
    return conflicts;
}
/**
 * Middleware to check if user can manage other admins
 * MASTER_ADMIN can manage all admins
 * SUPER_ADMIN can manage admins in their zones
 * ADMIN cannot manage other admins
 */
const requireAdminManagementPermission = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_TOKEN_MISSING',
                    message: 'Authentication required',
                },
            });
        }
        // ADMIN cannot manage other admins
        if (userRole === client_1.users_role.ADMIN) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'Admins cannot manage other admins',
                },
            });
        }
        // Check permission
        const hasPermission = await permission_service_1.permissionService.hasPermission(userId, 'canViewAdmins');
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to manage admins',
                },
            });
        }
        next();
    }
    catch (error) {
        console.error('Admin management permission check error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error checking admin management permission',
            },
        });
    }
};
exports.requireAdminManagementPermission = requireAdminManagementPermission;
