import { PrismaClient, users_role } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { MultiZoneService } from '../../src/services/multi-zone.service';
import prisma from '../../src/utils/prisma';
import { activityLogService } from '../../src/services/activity-log.service';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

// Mock Activity Log Service
jest.mock('../../src/services/activity-log.service', () => ({
    activityLogService: {
        logActivity: jest.fn(),
    },
    ActivityActions: {
        UPDATE_USER: 'UPDATE_USER',
        UPDATE_ZONE_ASSIGNMENTS: 'UPDATE_ZONE_ASSIGNMENTS',
        UPDATE_USER_PERMISSIONS: 'UPDATE_USER_PERMISSIONS'
    },
    EntityTypes: { USER: 'USER' }
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('MultiZoneService', () => {
    let service: MultiZoneService;

    beforeEach(() => {
        service = new MultiZoneService();
        jest.clearAllMocks();
    });

    describe('assignZonesToSuperAdmin', () => {
        const userId = 1;
        const assignerId = 99;
        const zoneIds = [101, 102];

        it('should assign zones to super admin successfully', async () => {
            // Mock User
            prismaMock.user.findUnique.mockResolvedValue({
                id: userId,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'CC1'
            } as any);

            // Mock Zones
            prismaMock.zone.findMany.mockResolvedValue([
                { id: 101, cityCorporationId: 1, cityCorporation: { code: 'CC1' } },
                { id: 102, cityCorporationId: 1, cityCorporation: { code: 'CC1' } }
            ] as any);

            // Mock counting existing assignments
            prismaMock.userZone.count.mockResolvedValue(0);

            // Mock Transaction
            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return callback(prismaMock);
            });

            await service.assignZonesToSuperAdmin({ userId, zoneIds }, assignerId);

            expect(prismaMock.userZone.upsert).toHaveBeenCalledTimes(2);
            expect(activityLogService.logActivity).toHaveBeenCalled();
        });

        it('should throw error if zone count is less than 2', async () => {
            await expect(service.assignZonesToSuperAdmin({ userId, zoneIds: [101] }, assignerId))
                .rejects.toThrow('Super Admin must be assigned between 2 and 5 zones');
        });

        it('should throw error if user is not SUPER_ADMIN', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: userId,
                role: 'ADMIN', // Not SUPER_ADMIN
                cityCorporationCode: 'CC1'
            } as any);

            await expect(service.assignZonesToSuperAdmin({ userId, zoneIds }, assignerId))
                .rejects.toThrow('Zones can only be assigned to Super Admins');
        });

        it('should throw error if zones belong to different City Corporations', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: userId,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'CC1'
            } as any);

            prismaMock.zone.findMany.mockResolvedValue([
                { id: 101, cityCorporationId: 1, cityCorporation: { code: 'CC1' } },
                { id: 102, cityCorporationId: 2, cityCorporation: { code: 'CC2' } } // Different CC
            ] as any);

            await expect(service.assignZonesToSuperAdmin({ userId, zoneIds }, assignerId))
                .rejects.toThrow('All assigned zones must belong to the same City Corporation');
        });
    });

    describe('updateZoneAssignments', () => {
        const userId = 1;
        const updaterId = 99;
        const zoneIds = [101, 102, 103];

        it('should update zone assignments successfully', async () => {
            prismaMock.zone.findMany.mockResolvedValue([
                { id: 101, cityCorporationId: 1 },
                { id: 102, cityCorporationId: 1 },
                { id: 103, cityCorporationId: 1 }
            ] as any);

            prismaMock.user.findUnique.mockResolvedValue({
                id: userId,
                role: users_role.SUPER_ADMIN
            } as any);

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return callback(prismaMock);
            });

            await service.updateZoneAssignments(userId, zoneIds, updaterId);

            expect(prismaMock.userZone.deleteMany).toHaveBeenCalledWith({ where: { userId } });
            expect(prismaMock.userZone.createMany).toHaveBeenCalled();
        });
    });
});
