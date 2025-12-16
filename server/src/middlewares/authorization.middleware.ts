import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { users_role } from '@prisma/client';
import { permissionService, Permissions } from '../services/permission.service';

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
export const requireRole = (...allowedRoles: users_role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
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
export const validateCityCorporationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const userCityCorporationCode = req.user?.cityCorporationCode;

    // MASTER_ADMIN can access all City Corporations
    if (userRole === users_role.MASTER_ADMIN) {
        return next();
    }

    // Extract requested City Corporation from various sources
    const requestedCityCorporationCode =
        req.params.cityCorporationCode ||
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
export const validateZoneAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userRole = req.user?.role;
        const userZoneId = req.user?.zoneId;
        const userId = req.user?.id;

        // MASTER_ADMIN can access all zones
        if (userRole === users_role.MASTER_ADMIN) {
            return next();
        }

        // Extract requested zone ID from various sources
        const requestedZoneIdStr =
            req.params.zoneId ||
            req.query.zoneId ||
            req.body.zoneId;

        // If no zone is requested, allow (will be filtered by service layer using applyZoneFilter)
        if (!requestedZoneIdStr) {
            return next();
        }

        const requestedZoneId = parseInt(requestedZoneIdStr as string);

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
        if (userRole === users_role.ADMIN) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'Admins cannot access zone-level data',
                },
            });
        }

        // SUPER_ADMIN can only access their assigned zones
        if (userRole === users_role.SUPER_ADMIN && userId) {
            let allowedZones: number[] = [];

            // Check if already populated by filterByAssignedZones
            if (req.assignedZoneIds) {
                allowedZones = req.assignedZoneIds;
            } else {
                // Fetch from service if not populated
                // Use dynamic import to avoid circular dependencies
                const { multiZoneService } = await import('../services/multi-zone.service');
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
    } catch (error) {
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
export const validateWardAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const userWardId = req.user?.wardId;

    // MASTER_ADMIN can access all wards
    if (userRole === users_role.MASTER_ADMIN) {
        return next();
    }

    // Extract requested ward ID from various sources
    const requestedWardIdStr =
        req.params.wardId ||
        req.query.wardId ||
        req.body.wardId;

    // If no ward is requested, allow (will be filtered by service layer)
    if (!requestedWardIdStr) {
        return next();
    }

    const requestedWardId = parseInt(requestedWardIdStr as string);

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
    if (userRole === users_role.SUPER_ADMIN) {
        return next();
    }

    // ADMIN can only access their assigned ward
    if (userRole === users_role.ADMIN) {
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

/**
 * Permission-based feature access middleware
 * Checks if user has specific permission to perform an action
 * 
 * Requirements: 12.19, 8.1-8.20
 * 
 * @param permission - The permission feature to check
 * @returns Middleware function
 */
export const requirePermission = (permission: keyof Permissions['features']) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
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
            if (req.user?.role === users_role.MASTER_ADMIN) {
                return next();
            }

            // Check if user has the required permission
            const hasPermission = await permissionService.hasPermission(userId, permission);

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
        } catch (error) {
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

/**
 * Combined authorization middleware
 * Validates role, City Corporation, and optionally zone/ward access
 * 
 * @param options - Authorization options
 * @returns Middleware function
 */
export const authorize = (options: {
    roles?: users_role[];
    requireCityCorporation?: boolean;
    requireZone?: boolean;
    requireWard?: boolean;
    permission?: keyof Permissions['features'];
}) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
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
                const cityCorporationCheck = validateCityCorporationAccess(req, res, () => { });
                if (cityCorporationCheck) return cityCorporationCheck;
            }

            // Check zone access if required
            if (options.requireZone) {
                const zoneCheck = validateZoneAccess(req, res, () => { });
                if (zoneCheck) return zoneCheck;
            }

            // Check ward access if required
            if (options.requireWard) {
                const wardCheck = validateWardAccess(req, res, () => { });
                if (wardCheck) return wardCheck;
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
                if (req.user?.role !== users_role.MASTER_ADMIN) {
                    const hasPermission = await permissionService.hasPermission(userId, options.permission);
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
        } catch (error) {
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

/**
 * Middleware to ensure only MASTER_ADMIN can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN)
 */
export const requireMasterAdmin = requireRole(users_role.MASTER_ADMIN);

/**
 * Middleware to ensure only MASTER_ADMIN or SUPER_ADMIN can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN)
 */
export const requireMasterOrSuperAdmin = requireRole(
    users_role.MASTER_ADMIN,
    users_role.SUPER_ADMIN
);

/**
 * Middleware to ensure all admin roles can access
 * Shorthand for requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN, users_role.ADMIN)
 */
export const requireAnyAdmin = requireRole(
    users_role.MASTER_ADMIN,
    users_role.SUPER_ADMIN,
    users_role.ADMIN
);

/**
 * Middleware to block write operations in view-only mode
 * Requirements: 8.1-8.20
 */
export const blockIfViewOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        if (req.user?.role === users_role.MASTER_ADMIN) {
            return next();
        }

        const permissions = await permissionService.getPermissions(userId);

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
    } catch (error) {
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

/**
 * Middleware to validate that user can manage other admins
 * Requirements: 6.1-6.20
 * 
 * Access Rules:
 * - MASTER_ADMIN: Can manage all admins
 * - SUPER_ADMIN: Can manage admins in their zones
 * - ADMIN: Cannot manage other admins
 */
export const requireAdminManagementAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
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
        if (userRole === users_role.ADMIN) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'Admins cannot manage other admins',
                },
            });
        }

        // MASTER_ADMIN can manage all admins
        if (userRole === users_role.MASTER_ADMIN) {
            return next();
        }

        // SUPER_ADMIN needs permission to manage admins
        const hasPermission = await permissionService.hasPermission(userId, 'canViewAdmins');

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
    } catch (error) {
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

/**
 * Middleware to validate that user can manage super admins
 * Requirements: 5.1-5.15
 * 
 * Access Rules:
 * - MASTER_ADMIN: Can manage all super admins
 * - SUPER_ADMIN: Cannot manage other super admins
 * - ADMIN: Cannot manage super admins
 */
export const requireSuperAdminManagementAccess = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
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
    if (userRole !== users_role.MASTER_ADMIN) {
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
export const filterByAssignedZones = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;

        // SKIP if no user (should be handled by authGuard, but safe check)
        if (!userId || !userRole) {
            return next();
        }

        // MASTER_ADMIN: No filtering needed (can access all)
        if (userRole === users_role.MASTER_ADMIN) {
            return next();
        }

        // ADMIN: Handled by legacy single zone check (usually)
        // But for consistency we could populate assignedZoneIds with single ID
        if (userRole === users_role.ADMIN) {
            if (req.user?.zoneId) {
                req.assignedZoneIds = [req.user.zoneId];
            }
            return next();
        }

        // SUPER_ADMIN: Fetch assigned zones
        if (userRole === users_role.SUPER_ADMIN) {
            // Lazy load service to avoid circular dependency issues if any
            const { multiZoneService } = await import('../services/multi-zone.service');
            const assignedIds = await multiZoneService.getAssignedZoneIds(userId);

            // Should we fallback to legacy zoneId if no multi-zones? 
            // The legacy zoneId is likely one of them.
            // Requirement says "Service validates...". 
            // We'll trust multiZoneService.

            req.assignedZoneIds = assignedIds;

            // Check if specific zone requested
            const requestedZoneIdStr = req.params.zoneId || req.query.zoneId || req.body.zoneId;

            if (requestedZoneIdStr) {
                const requestedZoneId = parseInt(requestedZoneIdStr as string);
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
    } catch (error) {
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

/**
 * Helper to apply zone filter to Prisma queries
 * @param req AuthRequest
 * @returns Prisma query clause or undefined
 */
export const applyZoneFilter = (req: AuthRequest) => {
    const { user, assignedZoneIds } = req;

    if (!user) return {};

    if (user.role === users_role.MASTER_ADMIN) {
        return {}; // No filter
    }

    if (user.role === users_role.SUPER_ADMIN && assignedZoneIds && assignedZoneIds.length > 0) {
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

/**
 * Export all authorization middleware
 */
export default {
    requireRole,
    validateCityCorporationAccess,
    validateZoneAccess,
    validateWardAccess,
    requirePermission,
    authorize,
    requireMasterAdmin,
    requireMasterOrSuperAdmin,
    requireAnyAdmin,
    blockIfViewOnly,
    requireAdminManagementAccess,
    requireSuperAdminManagementAccess,
    filterByAssignedZones,
    applyZoneFilter
};
