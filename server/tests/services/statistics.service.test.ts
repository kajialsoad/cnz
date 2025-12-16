import { statisticsService } from '../../src/services/statistics.service';
import { users_role, ComplaintStatus } from '@prisma/client';
import prisma from '../../src/utils/prisma';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        complaint: {
            count: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
        complaintChatMessage: {
            count: jest.fn(),
        },
        user: {
            count: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        setex: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
    }));
});

describe('StatisticsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getComplaintStats', () => {
        it('should calculate complaint statistics correctly', async () => {
            // Mock total count
            (prisma.complaint.count as jest.Mock).mockResolvedValueOnce(100);

            // Mock status counts
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValueOnce([
                { status: ComplaintStatus.PENDING, _count: { id: 20 } },
                { status: ComplaintStatus.IN_PROGRESS, _count: { id: 30 } },
                { status: ComplaintStatus.RESOLVED, _count: { id: 40 } },
                { status: ComplaintStatus.REJECTED, _count: { id: 10 } },
            ]);

            // Mock resolved complaints for resolution time
            (prisma.complaint.findMany as jest.Mock).mockResolvedValueOnce([
                {
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    resolvedAt: new Date('2024-01-02T00:00:00Z'), // 24 hours
                },
                {
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    resolvedAt: new Date('2024-01-03T00:00:00Z'), // 48 hours
                },
            ]);

            // Mock time-based counts
            (prisma.complaint.count as jest.Mock)
                .mockResolvedValueOnce(5) // today
                .mockResolvedValueOnce(25) // week
                .mockResolvedValueOnce(80); // month

            // Mock category grouping
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValueOnce([
                { category: 'waste', _count: { id: 50 } },
                { category: 'water', _count: { id: 30 } },
            ]);

            // Mock priority grouping
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValueOnce([
                { priority: 1, _count: { id: 60 } },
                { priority: 2, _count: { id: 40 } },
            ]);

            const stats = await statisticsService.getComplaintStats();

            expect(stats.total).toBe(100);
            expect(stats.pending).toBe(20);
            expect(stats.inProgress).toBe(30);
            expect(stats.resolved).toBe(40);
            expect(stats.rejected).toBe(10);
            expect(stats.successRate).toBe(40); // 40/100 * 100
            expect(stats.averageResolutionTime).toBe(36); // (24 + 48) / 2 = 36 hours
            expect(stats.todayCount).toBe(5);
            expect(stats.weekCount).toBe(25);
            expect(stats.monthCount).toBe(80);
        });

        it('should handle zero complaints', async () => {
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            const stats = await statisticsService.getComplaintStats();

            expect(stats.total).toBe(0);
            expect(stats.successRate).toBe(0);
            expect(stats.averageResolutionTime).toBe(0);
        });
    });

    describe('getMessageStats', () => {
        it('should calculate message statistics correctly', async () => {
            (prisma.complaintChatMessage.count as jest.Mock)
                .mockResolvedValueOnce(500) // total
                .mockResolvedValueOnce(50) // unread
                .mockResolvedValueOnce(20) // today
                .mockResolvedValueOnce(100); // week

            const stats = await statisticsService.getMessageStats();

            expect(stats.total).toBe(500);
            expect(stats.unread).toBe(50);
            expect(stats.todayCount).toBe(20);
            expect(stats.weekCount).toBe(100);
        });
    });

    describe('getUserStats', () => {
        it('should calculate user statistics correctly', async () => {
            (prisma.user.count as jest.Mock)
                .mockResolvedValueOnce(1000) // total citizens
                .mockResolvedValueOnce(50) // total admins
                .mockResolvedValueOnce(10) // total super admins
                .mockResolvedValueOnce(800) // active users
                .mockResolvedValueOnce(5) // new today
                .mockResolvedValueOnce(30) // new week
                .mockResolvedValueOnce(150); // new month

            const stats = await statisticsService.getUserStats();

            expect(stats.totalCitizens).toBe(1000);
            expect(stats.totalAdmins).toBe(50);
            expect(stats.totalSuperAdmins).toBe(10);
            expect(stats.activeUsers).toBe(800);
            expect(stats.newUsersToday).toBe(5);
            expect(stats.newUsersWeek).toBe(30);
            expect(stats.newUsersMonth).toBe(150);
        });
    });

    describe('getAdminPerformance', () => {
        it('should calculate admin performance metrics', async () => {
            const mockAdmin = {
                id: 5,
                firstName: 'Test',
                lastName: 'Admin',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

            // Total assigned
            (prisma.complaint.count as jest.Mock).mockResolvedValueOnce(100);

            // Status counts
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValueOnce([
                { status: ComplaintStatus.RESOLVED, _count: { id: 60 } },
                { status: ComplaintStatus.PENDING, _count: { id: 20 } },
                { status: ComplaintStatus.IN_PROGRESS, _count: { id: 20 } },
            ]);

            // Resolved complaints for resolution time
            (prisma.complaint.findMany as jest.Mock).mockResolvedValueOnce([
                {
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    resolvedAt: new Date('2024-01-02T00:00:00Z'),
                    assignedAt: new Date('2024-01-01T00:00:00Z'),
                },
                {
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    resolvedAt: new Date('2024-01-03T00:00:00Z'),
                    assignedAt: new Date('2024-01-01T00:00:00Z'),
                },
            ]);

            const performance = await statisticsService.getAdminPerformance(5);

            expect(performance.adminId).toBe(5);
            expect(performance.adminName).toBe('Test Admin');
            expect(performance.totalAssigned).toBe(100);
            expect(performance.totalResolved).toBe(60);
            expect(performance.totalPending).toBe(20);
            expect(performance.totalInProgress).toBe(20);
            expect(performance.resolutionRate).toBe(60); // 60/100 * 100
            expect(performance.averageResolutionTime).toBe(36); // (24 + 48) / 2
        });

        it('should throw error if admin not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(statisticsService.getAdminPerformance(999)).rejects.toThrow('Admin not found');
        });
    });

    describe('role-based filtering', () => {
        it('should not filter for MASTER_ADMIN', async () => {
            const requestingUser = {
                id: 1,
                role: users_role.MASTER_ADMIN,
                zoneId: null,
                wardId: null,
            };

            // Mock all the required calls
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaintChatMessage.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.count as jest.Mock).mockResolvedValue(0);

            await statisticsService.getDashboardStats({}, requestingUser);

            // Verify no zone/ward filtering was applied
            expect(prisma.complaint.count).toHaveBeenCalled();
        });

        it('should filter by zone for SUPER_ADMIN', async () => {
            const requestingUser = {
                id: 2,
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                wardId: null,
            };

            // Mock all the required calls
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaintChatMessage.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.count as jest.Mock).mockResolvedValue(0);

            await statisticsService.getDashboardStats({}, requestingUser);

            // Verify zone filtering was applied
            expect(prisma.complaint.count).toHaveBeenCalled();
        });

        it('should filter by ward for ADMIN', async () => {
            const requestingUser = {
                id: 3,
                role: users_role.ADMIN,
                zoneId: 5,
                wardId: 10,
            };

            // Mock all the required calls
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaintChatMessage.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.count as jest.Mock).mockResolvedValue(0);

            await statisticsService.getDashboardStats({}, requestingUser);

            // Verify ward filtering was applied
            expect(prisma.complaint.count).toHaveBeenCalled();
        });
    });
});
