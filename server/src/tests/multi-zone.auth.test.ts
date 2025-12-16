
import { Request, Response, NextFunction } from 'express';
import { filterByAssignedZones, validateZoneAccess } from '../middlewares/authorization.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { users_role } from '@prisma/client';

// Mock the service
const mockGetAssignedZoneIds = jest.fn();

jest.mock('../../services/multi-zone.service', () => ({
    multiZoneService: {
        getAssignedZoneIds: (...args: any[]) => mockGetAssignedZoneIds(...args)
    }
}));

describe('Multi-Zone Authorization Middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        mockReq = {
            user: {
                id: 1,
                role: users_role.SUPER_ADMIN,
                sub: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                status: 'ACTIVE',
                iat: 1234567890,
                exp: 1234567890,
                phone: '1234567890',
                emailVerified: true,
                phoneVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                passwordHash: 'hash',
                wardImageCount: 0,
                isOnline: true,
                twoFactorEnabled: false
            } as any,
            params: {},
            query: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        mockGetAssignedZoneIds.mockReset();
    });

    describe('filterByAssignedZones', () => {
        it('should populate assignedZoneIds for SUPER_ADMIN', async () => {
            mockGetAssignedZoneIds.mockResolvedValue([10, 20]);

            await filterByAssignedZones(mockReq as AuthRequest, mockRes as Response, next);

            expect(mockGetAssignedZoneIds).toHaveBeenCalledWith(1);
            expect(mockReq.assignedZoneIds).toEqual([10, 20]);
            expect(next).toHaveBeenCalled();
        });

        it('should allow MASTER_ADMIN without fetching zones', async () => {
            mockReq.user!.role = users_role.MASTER_ADMIN;

            await filterByAssignedZones(mockReq as AuthRequest, mockRes as Response, next);

            expect(mockGetAssignedZoneIds).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should block SUPER_ADMIN accessing unassigned zone', async () => {
            mockGetAssignedZoneIds.mockResolvedValue([10, 20]);
            mockReq.params = { zoneId: '99' }; // Unassigned

            await filterByAssignedZones(mockReq as AuthRequest, mockRes as Response, next);

            expect(mockReq.assignedZoneIds).toEqual([10, 20]);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateZoneAccess', () => {
        it('should fetch zones if not populated and allow valid zone', async () => {
            mockGetAssignedZoneIds.mockResolvedValue([1, 2]);
            mockReq.params = { zoneId: '1' };

            await validateZoneAccess(mockReq as AuthRequest, mockRes as Response, next);

            expect(mockGetAssignedZoneIds).toHaveBeenCalledWith(1);
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 for invalid zone assignment', async () => {
            mockGetAssignedZoneIds.mockResolvedValue([1, 2]);
            mockReq.params = { zoneId: '99' };

            await validateZoneAccess(mockReq as AuthRequest, mockRes as Response, next);

            expect(mockGetAssignedZoneIds).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
