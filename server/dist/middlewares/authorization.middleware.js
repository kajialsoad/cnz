"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyZoneFilter = exports.filterByAssignedZones = exports.requireSuperAdminManagementAccess = exports.requireAdminManagementAccess = exports.blockIfViewOnly = exports.requireAnyAdmin = exports.requireMasterOrSuperAdmin = exports.requireMasterAdmin = exports.authorize = exports.requirePermission = exports.validateWardAccess = exports.validateZoneAccess = exports.validateCityCorporationAccess = exports.requireRole = void 0;
const client_1 = require("@prisma/client");
const permission_service_1 = require("../services/permission.service");
/**
 * Enhanced Role-Based Authorization Middleware
 * Requirements: 12.3, 12.4, 12.19
 *
 * This middleware provides comprehensive authorization checks including:
 * - Role-based access control
 * - City Corporation-based data isolation
 * - Zone and Ward access validation
 * - Permission-based feature access
 */
/**
 * Role-based authorization middleware
 * Checks if user has one of the required roles
 *
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns Middleware function
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_TOKEN_MISSING',
                    message: 'Authentication required',
                },
            });
        }
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_ROLE_NOT_AUTHORIZED',
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                    details: {
                        userRole,
                        requiredRoles: allowedRoles,
                    },
                },
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * City Corporation access validation middleware
 * Ensures users can only access data from their assigned City Corporation
 *
 * Requirements: 12.4, 18.1-18.20
 *
 * Access Rules:
 * - MASTER_ADMIN: Can access all City Corporations
 * - SUPER_ADMIN: Can only access their assigned City Corporation
 * - ADMIN: Can only access their assigned City Corporation
 */
const validateCityCorporationAccess = (req, res, next) => {
    const userRole = req.user?.role;
    const userCityCorporationCode = req.user?.cityCorporationCode;
    // MASTER_ADMIN can access all City Corporations
    if (userRole === client_1.users_role.MASTER_ADMIN) {
        return next();
    }
    // Extract requested City Corporation from various sources
    const requestedCityCorporationCode = req.params.cityCorporationCode ||
        req.query.cityCorporationCode ||
        req.body.cityCorporationCode;
    // If no City Corporation is requested, allow (will be filtered by service layer)
    if (!requestedCityCorporationCode) {
        return next();
    }
    // Validate access for SUPER_ADMIN and ADMIN
    if (userCityCorporationCode !== requestedCityCorporationCode) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'AUTH_CITY_CORPORATION_MISMATCH',
                message: 'You do not have access to this City Corporation',
                details: {
                    userCityCorporation: userCityCorporationCode,
                    requestedCityCorporation: requestedCityCorporationCode,
                },
            },
        });
    }
    next();
};
exports.validateCityCorporationAccess = validateCityCorporationAccess;
/**
 * Zone access validation middleware
 * Ensures users can only access zones they are assigned to
 *
 * Requirements: 12.4, 20.1-20.20
 *
 * Access Rules:
 * - MASTER_ADMIN: Can access all zones
 * - SUPER_ADMIN: Can only access their assigned zone
 * - ADMIN: Cannot access zone-level data directly
 */
/**
 * Zone access validation middleware
 * Ensures users can only access zones they are assigned to
 *
 * Requirements: 12.4, 20.1-20.20
 *
 * Access Rules:
 * - MASTER_ADMIN: Can access all zones
 * - SUPER_ADMIN: Can only access their assigned zones (multi-zone support)
 * - ADMIN: Cannot access zone-level data directly
 */
const validateZoneAccess = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        const userZoneId = req.user?.zoneId;
        const userId = req.user?.id;
        // MASTER_ADMIN can access all zones
        if (userRole === client_1.users_role.MASTER_ADMIN) {
            return next();
        }
        // Extract requested zone ID from various sources
        const requestedZoneIdStr = req.params.zoneId ||
            req.query.zoneId ||
            req.body.zoneId;
        // If no zone is requested, allow (will be filtered by service layer using applyZoneFilter)
        if (!requestedZoneIdStr) {
            return next();
        }
        const requestedZoneId = parseInt(requestedZoneIdStr);
        if (isNaN(requestedZoneId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Invalid zone ID format',
                },
            });
        }
        // ADMIN cannot access zone-level data
        if (userRole === client_1.users_role.ADMIN) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'Admins cannot access zone-level data',
                },
            });
        }
        // SUPER_ADMIN can only access their assigned zones
        if (userRole === client_1.users_role.SUPER_ADMIN && userId) {
            let allowedZones = [];
            // Check if already populated by filterByAssignedZones
            if (req.assignedZoneIds) {
                allowedZones = req.assignedZoneIds;
            }
            else {
                // Fetch from service if not populated
                // Use dynamic import to avoid circular dependencies
                const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
                allowedZones = await multiZoneService.getAssignedZoneIds(userId);
                // Cache it in request for subsequent use
                req.assignedZoneIds = allowedZones;
            }
            // Check if requested zone is in allow list
            if (!allowedZones.includes(requestedZoneId)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_ZONE_MISMATCH',
                        message: 'You do not have access to this zone',
                        details: {
                            assignedZones: allowedZones,
                            requestedZone: requestedZoneId,
                        },
                    },
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Zone access validation error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error validating zone access',
            },
        });
    }
};
exports.validateZoneAccess = validateZoneAccess;
/**
 * Ward access validation middleware
 * Ensures users can only access wards they are assigned to
 *
 * Requirements: 12.4, 20.1-20.20
 *
 * Access Rules:
 * - MASTER_ADMIN: Can access all wards
 * - SUPER_ADMIN: Can access all wards in their zone
 * - ADMIN: Can only access their assigned ward
 */
const validateWardAccess = (req, res, next) => {
    const userRole = req.user?.role;
    const userWardId = req.user?.wardId;
    // MASTER_ADMIN can access all wards
    if (userRole === client_1.users_role.MASTER_ADMIN) {
        return next();
    }
    // Extract requested ward ID from various sources
    const requestedWardIdStr = req.params.wardId ||
        req.query.wardId ||
        req.body.wardId;
    // If no ward is requested, allow (will be filtered by service layer)
    if (!requestedWardIdStr) {
        return next();
    }
    const requestedWardId = parseInt(requestedWardIdStr);
    if (isNaN(requestedWardId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_FAILED',
                message: 'Invalid ward ID format',
            },
        });
    }
    // SUPER_ADMIN can access wards in their zone (validated by service layer)
    if (userRole === client_1.users_role.SUPER_ADMIN) {
        return next();
    }
    // ADMIN can only access their assigned ward
    if (userRole === client_1.users_role.ADMIN) {
        if (userWardId !== requestedWardId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_WARD_MISMATCH',
                    message: 'You do not have access to this ward',
                    details: {
                        userWard: userWardId,
                        requestedWard: requestedWardId,
                    },
                },
            });
        }
    }
    next();
};
exports.validateWardAccess = validateWardAccess;
/**
 * Permission-based feature access middleware
 * Checks if user has specific permission to perform an action
 *
 * Requirements: 12.19, 8.1-8.20
 *
 * @param permission - The permission feature to check
 * @returns Middleware function
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
            // MASTER_ADMIN has all permissions
            if (req.user?.role === client_1.users_role.MASTER_ADMIN) {
                return next();
            }
            // Check if user has the required permission
            const hasPermission = await permission_service_1.permissionService.hasPermission(userId, permission);
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: `You do not have permission to ${permission}`,
                        details: {
                            requiredPermission: permission,
                        },
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
 * Combined authorization middleware
 * Validates role, City Corporation, and optionally zone/ward access
 *
 * @param options - Authorization options
 * @returns Middleware function
 */
const authorize = (options) => {
    return async (req, res, next) => {
        try {
            // Check role if specified
            if (options.roles && options.roles.length > 0) {
                const userRole = req.user?.role;
                if (!userRole || !options.roles.includes(userRole)) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'AUTH_ROLE_NOT_AUTHORIZED',
                            message: `Access denied. Required roles: ${options.roles.join(', ')}`,
                        },
                    });
                }
            }
            // Check City Corporation access if required
            if (options.requireCityCorporation) {
                const cityCorporationCheck = (0, exports.validateCityCorporationAccess)(req, res, () => { });
                if (cityCorporationCheck)
                    return cityCorporationCheck;
            }
            // Check zone access if required
            if (options.requireZone) {
                const zoneCheck = (0, exports.validateZoneAccess)(req, res, () => { });
                if (zoneCheck)
                    return zoneCheck;
            }
            // Check ward access if required
            if (options.requireWard) {
                const wardCheck = (0, exports.validateWardAccess)(req, res, () => { });
                if (wardCheck)
                    return wardCheck;
            }
            // Check permission if specified
            if (options.permission) {
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
                // MASTER_ADMIN has all permissions
                if (req.user?.role !== client_1.users_role.MASTER_ADMIN) {
                    const hasPermission = await permission_service_1.permissionService.hasPermission(userId, options.permission);
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            error: {
                                code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                                message: `You do not have permission to ${options.permission}`,
                            },
                        });
                    }
                }
            }
            next();
        }
        catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Error during authorization',
                },
            });
        }
    };
};
exports.authorize = authorize;
/**
 * Middleware to ensure only MASTER_ADMIN can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN)
 */
exports.requireMasterAdmin = (0, exports.requireRole)(client_1.users_role.MASTER_ADMIN);
/**
 * Middleware to ensure only MASTER_ADMIN or SUPER_ADMIN can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN)
 */
exports.requireMasterOrSuperAdmin = (0, exports.requireRole)(client_1.users_role.MASTER_ADMIN, client_1.users_role.SUPER_ADMIN);
/**
 * Middleware to ensure all admin roles can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN, users_role.ADMIN)
 */
exports.requireAnyAdmin = (0, exports.requireRole)(client_1.users_role.MASTER_ADMIN, client_1.users_role.SUPER_ADMIN, client_1.users_role.ADMIN);
/**
 * Middleware to block write operations in view-only mode
 * Requirements: 8.1-8.20
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
        // MASTER_ADMIN is never in view-only mode
        if (req.user?.role === client_1.users_role.MASTER_ADMIN) {
            return next();
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
 * Middleware to validate that user can manage other admins
 * Requirements: 6.1-6.20
 *
 * Access Rules:
 * - MASTER_ADMIN: Can manage all admins
 * - SUPER_ADMIN: Can manage admins in their zones
 * - ADMIN: Cannot manage other admins
 */
const requireAdminManagementAccess = async (req, res, next) => {
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
        // MASTER_ADMIN can manage all admins
        if (userRole === client_1.users_role.MASTER_ADMIN) {
            return next();
        }
        // SUPER_ADMIN needs permission to manage admins
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
        console.error('Admin management access check error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error checking admin management access',
            },
        });
    }
};
exports.requireAdminManagementAccess = requireAdminManagementAccess;
/**
 * Middleware to validate that user can manage super admins
 * Requirements: 5.1-5.15
 *
 * Access Rules:
 * - MASTER_ADMIN: Can manage all super admins
 * - SUPER_ADMIN: Cannot manage other super admins
 * - ADMIN: Cannot manage super admins
 */
const requireSuperAdminManagementAccess = (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_TOKEN_MISSING',
                message: 'Authentication required',
            },
        });
    }
    // Only MASTER_ADMIN can manage super admins
    if (userRole !== client_1.users_role.MASTER_ADMIN) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                message: 'Only Master Admins can manage Super Admins',
            },
        });
    }
    next();
};
exports.requireSuperAdminManagementAccess = requireSuperAdminManagementAccess;
/**
 * Middleware to populate assignedZoneIds for SUPER_ADMIN
 * Requirements: 12.4, 20.1-20.20
 *
 * This middleware:
 * 1. Checks if user is SUPER_ADMIN
 * 2. Fetches their assigned zones from MultiZoneService
 * 3. Attaches zones to req.assignedZoneIds
 * 4. Verifies if requested zoneId is allowed
 */
const filterByAssignedZones = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
        // SKIP if no user (should be handled by authGuard, but safe check)
        if (!userId || !userRole) {
            return next();
        }
        // MASTER_ADMIN: No filtering needed (can access all)
        if (userRole === client_1.users_role.MASTER_ADMIN) {
            return next();
        }
        // ADMIN: Handled by legacy single zone check (usually)
        // But for consistency we could populate assignedZoneIds with single ID
        if (userRole === client_1.users_role.ADMIN) {
            if (req.user?.zoneId) {
                req.assignedZoneIds = [req.user.zoneId];
            }
            return next();
        }
        // SUPER_ADMIN: Fetch assigned zones
        if (userRole === client_1.users_role.SUPER_ADMIN) {
            // Lazy load service to avoid circular dependency issues if any
            const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
            const assignedIds = await multiZoneService.getAssignedZoneIds(userId);
            // Should we fallback to legacy zoneId if no multi-zones? 
            // The legacy zoneId is likely one of them.
            // Requirement says "Service validates...". 
            // We'll trust multiZoneService.
            req.assignedZoneIds = assignedIds;
            // Check if specific zone requested
            const requestedZoneIdStr = req.params.zoneId || req.query.zoneId || req.body.zoneId;
            if (requestedZoneIdStr) {
                const requestedZoneId = parseInt(requestedZoneIdStr);
                if (!isNaN(requestedZoneId)) {
                    if (!assignedIds.includes(requestedZoneId)) {
                        return res.status(403).json({
                            success: false,
                            error: {
                                code: 'AUTH_ZONE_MISMATCH',
                                message: 'You do not have access to this zone'
                            },
                        });
                    }
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('Zone filter middleware error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error processing zone authorization',
            },
        });
    }
};
exports.filterByAssignedZones = filterByAssignedZones;
/**
 * Helper to apply zone filter to Prisma queries
 * @param req AuthRequest
 * @returns Prisma query clause or undefined
 */
const applyZoneFilter = (req) => {
    const { user, assignedZoneIds } = req;
    if (!user)
        return {};
    if (user.role === client_1.users_role.MASTER_ADMIN) {
        return {}; // No filter
    }
    if (user.role === client_1.users_role.SUPER_ADMIN && assignedZoneIds && assignedZoneIds.length > 0) {
        return {
            zoneId: { in: assignedZoneIds }
        };
    }
    // Fallback for single zone roles (ADMIN)
    if (user.zoneId) {
        return {
            zoneId: user.zoneId
        };
    }
    return {};
};
exports.applyZoneFilter = applyZoneFilter;
/**
 * Export all authorization middleware
 */
exports.default = {
    requireRole: exports.requireRole,
    validateCityCorporationAccess: exports.validateCityCorporationAccess,
    validateZoneAccess: exports.validateZoneAccess,
    validateWardAccess: exports.validateWardAccess,
    requirePermission: exports.requirePermission,
    authorize: exports.authorize,
    requireMasterAdmin: exports.requireMasterAdmin,
    requireMasterOrSuperAdmin: exports.requireMasterOrSuperAdmin,
    requireAnyAdmin: exports.requireAnyAdmin,
    blockIfViewOnly: exports.blockIfViewOnly,
    requireAdminManagementAccess: exports.requireAdminManagementAccess,
    requireSuperAdminManagementAccess: exports.requireSuperAdminManagementAccess,
    filterByAssignedZones: exports.filterByAssignedZones,
    applyZoneFilter: exports.applyZoneFilter
};
