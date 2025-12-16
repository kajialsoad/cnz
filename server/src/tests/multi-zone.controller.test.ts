import { Request, Response } from 'express';
import {
    assignZonesToSuperAdmin,
    getAssignedZones,
    updateZoneAssignments,
    removeZoneFromSuperAdmin
} from '../controllers/admin.user.controller';
import { multiZoneService } from '../services/multi-zone.service';

// Mock the multi-zone service
jest.mock('../services/multi-zone.service', () => ({
    multiZoneService: {
        assignZonesToSuperAdmin: jest.fn(),
        getAssignedZones: jest.fn(),
        updateZoneAssignments: jest.fn(),
        removeZoneFromSuperAdmin: jest.fn(),
    }
}));

// Mock Request and Response
const mockRequest = (body = {}, params = {}, user = {}) => {
    return {
        body,
        params,
        user,
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest-test'),
    } as unknown as Request;
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('Multi-Zone Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assignZonesToSuperAdmin', () => {
        it('should assign zones successfully', async () => {
            const req = mockRequest({ zoneIds: [1, 2] }, { id: '123' }, { id: 999, role: 'MASTER_ADMIN' });
            const res = mockResponse();

            (multiZoneService.assignZonesToSuperAdmin as jest.Mock).mockResolvedValue(undefined);

            await assignZonesToSuperAdmin(req, res);

            expect(multiZoneService.assignZonesToSuperAdmin).toHaveBeenCalledWith(
                { userId: 123, zoneIds: [1, 2] },
                999,
                '127.0.0.1',
                'jest-test'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Zones assigned successfully'
            }));
        });

        it('should return 400 if zoneIds is invalid', async () => {
            const req = mockRequest({ zoneIds: 'invalid' }, { id: '123' });
            const res = mockResponse();

            await assignZonesToSuperAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(multiZoneService.assignZonesToSuperAdmin).not.toHaveBeenCalled();
        });
    });

    describe('getAssignedZones', () => {
        it('should return assigned zones', async () => {
            const req = mockRequest({}, { id: '123' }, { id: 999, role: 'MASTER_ADMIN' });
            const res = mockResponse();

            const mockZones = [{ id: 1, name: 'Zone 1' }];
            (multiZoneService.getAssignedZones as jest.Mock).mockResolvedValue(mockZones);

            await getAssignedZones(req, res);

            expect(multiZoneService.getAssignedZones).toHaveBeenCalledWith(123);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockZones
            }));
        });

        it('should prevent Super Admin from viewing others zones', async () => {
            const req = mockRequest({}, { id: '123' }, { id: 456, role: 'SUPER_ADMIN' });
            const res = mockResponse();

            await getAssignedZones(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(multiZoneService.getAssignedZones).not.toHaveBeenCalled();
        });

        it('should allow Super Admin to view their own zones', async () => {
            const req = mockRequest({}, { id: '456' }, { id: 456, role: 'SUPER_ADMIN' });
            const res = mockResponse();

            const mockZones = [{ id: 1, name: 'Zone 1' }];
            (multiZoneService.getAssignedZones as jest.Mock).mockResolvedValue(mockZones);

            await getAssignedZones(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(multiZoneService.getAssignedZones).toHaveBeenCalledWith(456);
        });
    });

    describe('updateZoneAssignments', () => {
        it('should update zones successfully', async () => {
            const req = mockRequest({ zoneIds: [3, 4] }, { id: '123' }, { id: 999, role: 'MASTER_ADMIN' });
            const res = mockResponse();

            (multiZoneService.updateZoneAssignments as jest.Mock).mockResolvedValue(undefined);

            await updateZoneAssignments(req, res);

            expect(multiZoneService.updateZoneAssignments).toHaveBeenCalledWith(
                123,
                [3, 4],
                999,
                '127.0.0.1',
                'jest-test'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('removeZoneFromSuperAdmin', () => {
        it('should remove zone successfully', async () => {
            const req = mockRequest({}, { id: '123', zoneId: '5' }, { id: 999, role: 'MASTER_ADMIN' });
            const res = mockResponse();

            (multiZoneService.removeZoneFromSuperAdmin as jest.Mock).mockResolvedValue(undefined);

            await removeZoneFromSuperAdmin(req, res);

            expect(multiZoneService.removeZoneFromSuperAdmin).toHaveBeenCalledWith(
                123,
                5,
                999,
                '127.0.0.1',
                'jest-test'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
