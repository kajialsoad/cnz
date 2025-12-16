import { activityLogService, ActivityActions, EntityTypes } from '../../src/services/activity-log.service';
import { users_role } from '@prisma/client';
import prisma from '../../src/utils/prisma';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        activityLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
            deleteMany: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        },
    },
}));

describe('ActivityLogService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logActivity', () => {
        it('should create activity log entry', async () => {
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                action: ActivityActions.CREATE_USER,
                entityType: EntityTypes.USER,
                entityId: 2,
                timestamp: new Date(),
            });

            await activityLogService.logActivity({
                userId: 1,
                action: ActivityActions.CREATE_USER,
                entityType: EntityTypes.USER,
                entityId: 2,
                newValue: { name: 'Test User' },
                ipAddress: '127.0.0.1',
                userAgent: 'Test Agent',
            });

            expect(prisma.activityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 1,
                    action: ActivityActions.CREATE_USER,
                    entityType: EntityTypes.USER,
                    entityId: 2,
                    ipAddress: '127.0.0.1',
                    userAgent: 'Test Agent',
                }),
            });
        });

        it('should not throw error if logging fails', async () => {
            (prisma.activityLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Should not throw
            await expect(
                activityLogService.logActivity({
                    userId: 1,
                    action: ActivityActions.LOGIN,
                    entityType: EntityTypes.USER,
                    entityId: 1,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('getActivityLogs', () => {
        it('should return activity logs with pagination', async () => {
            const mockLogs = [
                {
                    id: 1,
                    userId: 1,
                    action: ActivityActions.CREATE_USER,
                    entityType: EntityTypes.USER,
                    entityId: 2,
                    timestamp: new Date(),
                    user: {
                        id: 1,
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@test.com',
                        role: users_role.MASTER_ADMIN,
                    },
                },
            ];

            (prisma.activityLog.count as jest.Mock).mockResolvedValue(1);
            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const result = await activityLogService.getActivityLogs({
                page: 1,
                limit: 50,
            });

            expect(result.logs).toEqual(mockLogs);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 50,
                total: 1,
                totalPages: 1,
            });
        });

        it('should filter by userId', async () => {
            (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);
            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);

            await activityLogService.getActivityLogs({
                userId: 5,
            });

            expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 5,
                    }),
                })
            );
        });

        it('should filter by action', async () => {
            (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);
            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);

            await activityLogService.getActivityLogs({
                action: ActivityActions.LOGIN,
            });

            expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        action: ActivityActions.LOGIN,
                    }),
                })
            );
        });

        it('should filter by date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);
            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);

            await activityLogService.getActivityLogs({
                startDate,
                endDate,
            });

            expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        timestamp: {
                            gte: startDate,
                            lte: endDate,
                        },
                    }),
                })
            );
        });
    });

    describe('getUserActivityLogs', () => {
        it('should return recent activity logs for user', async () => {
            const mockLogs = [
                {
                    id: 1,
                    userId: 5,
                    action: ActivityActions.LOGIN,
                    entityType: EntityTypes.USER,
                    entityId: 5,
                    timestamp: new Date(),
                    user: {
                        id: 5,
                        firstName: 'Test',
                        lastName: 'User',
                        email: 'test@test.com',
                        role: users_role.ADMIN,
                    },
                },
            ];

            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const result = await activityLogService.getUserActivityLogs(5, 10);

            expect(result).toEqual(mockLogs);
            expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 5 },
                    take: 10,
                })
            );
        });
    });

    describe('getEntityActivityLogs', () => {
        it('should return activity logs for specific entity', async () => {
            const mockLogs = [
                {
                    id: 1,
                    userId: 1,
                    action: ActivityActions.UPDATE_USER,
                    entityType: EntityTypes.USER,
                    entityId: 10,
                    timestamp: new Date(),
                    user: {
                        id: 1,
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@test.com',
                        role: users_role.MASTER_ADMIN,
                    },
                },
            ];

            (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const result = await activityLogService.getEntityActivityLogs(EntityTypes.USER, 10);

            expect(result).toEqual(mockLogs);
            expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        entityType: EntityTypes.USER,
                        entityId: 10,
                    },
                })
            );
        });
    });

    describe('logUserCreation', () => {
        it('should log user creation with proper formatting', async () => {
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const createdUser = {
                id: 10,
                firstName: 'New',
                lastName: 'User',
                email: 'new@test.com',
                phone: '01712345678',
                role: users_role.ADMIN,
                cityCorporationCode: 'DSCC',
                zoneId: 1,
                wardId: 5,
            };

            await activityLogService.logUserCreation(1, createdUser, '127.0.0.1', 'Test Agent');

            expect(prisma.activityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 1,
                    action: ActivityActions.CREATE_USER,
                    entityType: EntityTypes.USER,
                    entityId: 10,
                    newValue: expect.objectContaining({
                        id: 10,
                        name: 'New User',
                        email: 'new@test.com',
                        phone: '01712345678',
                        role: users_role.ADMIN,
                    }),
                }),
            });
        });
    });

    describe('logUserUpdate', () => {
        it('should log user update with old and new values', async () => {
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const oldUser = {
                id: 10,
                firstName: 'Old',
                lastName: 'Name',
                email: 'old@test.com',
                phone: '01712345678',
                role: users_role.ADMIN,
                status: 'ACTIVE',
                cityCorporationCode: 'DSCC',
                zoneId: 1,
                wardId: 5,
            };

            const newUser = {
                id: 10,
                firstName: 'New',
                lastName: 'Name',
                email: 'new@test.com',
                phone: '01712345678',
                role: users_role.ADMIN,
                status: 'ACTIVE',
                cityCorporationCode: 'DSCC',
                zoneId: 1,
                wardId: 5,
            };

            await activityLogService.logUserUpdate(1, oldUser, newUser, '127.0.0.1', 'Test Agent');

            expect(prisma.activityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 1,
                    action: ActivityActions.UPDATE_USER,
                    entityType: EntityTypes.USER,
                    entityId: 10,
                    oldValue: expect.objectContaining({
                        name: 'Old Name',
                        email: 'old@test.com',
                    }),
                    newValue: expect.objectContaining({
                        name: 'New Name',
                        email: 'new@test.com',
                    }),
                }),
            });
        });
    });

    describe('deleteOldLogs', () => {
        it('should delete logs older than specified days', async () => {
            (prisma.activityLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });

            const result = await activityLogService.deleteOldLogs(365);

            expect(result).toBe(100);
            expect(prisma.activityLog.deleteMany).toHaveBeenCalledWith({
                where: {
                    timestamp: {
                        lt: expect.any(Date),
                    },
                },
            });
        });
    });
});
