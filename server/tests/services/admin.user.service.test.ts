import { adminUserService, GetUsersQuery, CreateUserDto, UpdateUserDto } from '../../src/services/admin.user.service';
import { users_role, UserStatus, ComplaintStatus } from '@prisma/client';
import prisma from '../../src/utils/prisma';
import { hash } from 'bcrypt';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        complaint: {
            count: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

describe('AdminUserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should return users with pagination', async () => {
            const mockUsers = [
                {
                    id: 1,
                    email: 'user1@test.com',
                    phone: '01712345678',
                    firstName: 'Test',
                    lastName: 'User1',
                    avatar: null,
                    address: null,
                    role: users_role.CUSTOMER,
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                    phoneVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLoginAt: new Date(),
                    cityCorporationCode: 'DSCC',
                    cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                    zoneId: 1,
                    zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                    wardId: 5,
                    ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                    wardImageCount: 0,
                    _count: { complaints: 10 },
                },
            ];

            const mockComplaintStats = [
                { userId: 1, status: ComplaintStatus.RESOLVED, _count: { id: 5 } },
                { userId: 1, status: ComplaintStatus.PENDING, _count: { id: 3 } },
                { userId: 1, status: ComplaintStatus.IN_PROGRESS, _count: { id: 2 } },
            ];

            (prisma.user.count as jest.Mock).mockResolvedValue(1);
            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue(mockComplaintStats);

            const query: GetUsersQuery = {
                page: 1,
                limit: 20,
            };

            const result = await adminUserService.getUsers(query);

            expect(result.users).toHaveLength(1);
            expect(result.users[0].statistics.totalComplaints).toBe(10);
            expect(result.users[0].statistics.resolvedComplaints).toBe(5);
            expect(result.users[0].statistics.pendingComplaints).toBe(3);
            expect(result.users[0].statistics.inProgressComplaints).toBe(2);
            expect(result.users[0].statistics.unresolvedComplaints).toBe(5);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            });
        });

        it('should filter by search term', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const query: GetUsersQuery = {
                search: 'john',
            };

            await adminUserService.getUsers(query);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { firstName: { contains: 'john' } },
                            { lastName: { contains: 'john' } },
                            { email: { contains: 'john' } },
                            { phone: { contains: 'john' } },
                        ]),
                    }),
                })
            );
        });

        it('should filter by role', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const query: GetUsersQuery = {
                role: users_role.ADMIN,
            };

            await adminUserService.getUsers(query);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        role: users_role.ADMIN,
                    }),
                })
            );
        });

        it('should filter by status', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const query: GetUsersQuery = {
                status: UserStatus.ACTIVE,
            };

            await adminUserService.getUsers(query);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: UserStatus.ACTIVE,
                    }),
                })
            );
        });

        it('should filter by city corporation', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const query: GetUsersQuery = {
                cityCorporationCode: 'DSCC',
            };

            await adminUserService.getUsers(query);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        cityCorporationCode: 'DSCC',
                    }),
                })
            );
        });

        it('should apply role-based filtering for MASTER_ADMIN (no filtering)', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const requestingUser = {
                id: 1,
                role: users_role.MASTER_ADMIN,
                zoneId: null,
                wardId: null,
            };

            await adminUserService.getUsers({}, requestingUser);

            // Should not add zone or ward filters
            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.not.objectContaining({
                        zoneId: expect.anything(),
                        wardId: expect.anything(),
                    }),
                })
            );
        });

        it('should apply role-based filtering for SUPER_ADMIN (zone filtering)', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const requestingUser = {
                id: 2,
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                wardId: null,
            };

            await adminUserService.getUsers({}, requestingUser);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        zoneId: 5,
                    }),
                })
            );
        });

        it('should apply role-based filtering for ADMIN (ward filtering)', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.complaint.groupBy as jest.Mock).mockResolvedValue([]);

            const requestingUser = {
                id: 3,
                role: users_role.ADMIN,
                zoneId: 5,
                wardId: 10,
            };

            await adminUserService.getUsers({}, requestingUser);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        wardId: 10,
                    }),
                })
            );
        });
    });

    describe('getUserById', () => {
        it('should return user with details and recent complaints', async () => {
            const mockUser = {
                id: 1,
                email: 'user@test.com',
                phone: '01712345678',
                firstName: 'Test',
                lastName: 'User',
                avatar: null,
                address: null,
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                phoneVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date(),
                cityCorporationCode: 'DSCC',
                cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                zoneId: 1,
                zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                wardId: 5,
                ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                wardImageCount: 0,
            };

            const mockComplaints = [
                {
                    id: 1,
                    title: 'Test Complaint',
                    status: ComplaintStatus.PENDING,
                    priority: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.complaint.count as jest.Mock)
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(5) // resolved
                .mockResolvedValueOnce(3) // pending
                .mockResolvedValueOnce(2); // in progress
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminUserService.getUserById(1);

            expect(result.user.id).toBe(1);
            expect(result.user.statistics.totalComplaints).toBe(10);
            expect(result.user.statistics.resolvedComplaints).toBe(5);
            expect(result.recentComplaints).toHaveLength(1);
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(adminUserService.getUserById(999)).rejects.toThrow('User not found');
        });
    });

    describe('getUserStatistics', () => {
        it('should calculate aggregate statistics correctly', async () => {
            (prisma.user.count as jest.Mock)
                .mockResolvedValueOnce(1000) // total citizens
                .mockResolvedValueOnce(800) // active users
                .mockResolvedValueOnce(50) // new users this month
                .mockResolvedValueOnce(700) // active status
                .mockResolvedValueOnce(200) // inactive status
                .mockResolvedValueOnce(50) // suspended status
                .mockResolvedValueOnce(50); // pending status

            (prisma.complaint.count as jest.Mock)
                .mockResolvedValueOnce(500) // total complaints
                .mockResolvedValueOnce(300); // resolved complaints

            const stats = await adminUserService.getUserStatistics();

            expect(stats.totalCitizens).toBe(1000);
            expect(stats.totalComplaints).toBe(500);
            expect(stats.resolvedComplaints).toBe(300);
            expect(stats.unresolvedComplaints).toBe(200);
            expect(stats.successRate).toBe(60); // 300/500 * 100
            expect(stats.activeUsers).toBe(800);
            expect(stats.newUsersThisMonth).toBe(50);
            expect(stats.statusBreakdown.active).toBe(700);
        });

        it('should filter statistics by city corporation', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            await adminUserService.getUserStatistics('DSCC');

            expect(prisma.user.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        cityCorporationCode: 'DSCC',
                    }),
                })
            );
        });

        it('should apply role-based filtering for SUPER_ADMIN', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(0);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            const requestingUser = {
                id: 2,
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                wardId: null,
            };

            await adminUserService.getUserStatistics(undefined, undefined, undefined, requestingUser);

            expect(prisma.user.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        zoneId: 5,
                    }),
                })
            );
        });
    });

    describe('createUser', () => {
        it('should create a new user successfully', async () => {
            const createDto: CreateUserDto = {
                firstName: 'New',
                lastName: 'User',
                phone: '01712345678',
                email: 'new@test.com',
                password: 'password123',
                cityCorporationCode: 'DSCC',
                zoneId: 1,
                wardId: 5,
                role: users_role.ADMIN,
            };

            const mockCreatedUser = {
                id: 10,
                email: 'new@test.com',
                phone: '01712345678',
                firstName: 'New',
                lastName: 'User',
                avatar: null,
                address: null,
                role: users_role.ADMIN,
                status: UserStatus.ACTIVE,
                emailVerified: false,
                phoneVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
                cityCorporationCode: 'DSCC',
                cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                zoneId: 1,
                zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                wardId: 5,
                ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                wardImageCount: 0,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
            (hash as jest.Mock).mockResolvedValue('hashedPassword');
            (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            const result = await adminUserService.createUser(createDto);

            expect(result.id).toBe(10);
            expect(result.email).toBe('new@test.com');
            expect(prisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        firstName: 'New',
                        lastName: 'User',
                        phone: '01712345678',
                        email: 'new@test.com',
                        passwordHash: 'hashedPassword',
                        role: users_role.ADMIN,
                        status: UserStatus.ACTIVE,
                    }),
                })
            );
        });

        it('should throw error if phone already exists', async () => {
            const createDto: CreateUserDto = {
                firstName: 'New',
                lastName: 'User',
                phone: '01712345678',
                password: 'password123',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, phone: '01712345678' });

            await expect(adminUserService.createUser(createDto)).rejects.toThrow('User already exists with this phone number');
        });

        it('should throw error if email already exists', async () => {
            const createDto: CreateUserDto = {
                firstName: 'New',
                lastName: 'User',
                phone: '01712345678',
                email: 'existing@test.com',
                password: 'password123',
            };

            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce(null) // Phone check
                .mockResolvedValueOnce({ id: 1, email: 'existing@test.com' }); // Email check

            await expect(adminUserService.createUser(createDto)).rejects.toThrow('User already exists with this email');
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const updateDto: UpdateUserDto = {
                firstName: 'Updated',
                lastName: 'Name',
            };

            const existingUser = {
                id: 1,
                phone: '01712345678',
                email: 'user@test.com',
            };

            const updatedUser = {
                id: 1,
                email: 'user@test.com',
                phone: '01712345678',
                firstName: 'Updated',
                lastName: 'Name',
                avatar: null,
                address: null,
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                phoneVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date(),
                cityCorporationCode: 'DSCC',
                cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                zoneId: 1,
                zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                wardId: 5,
                ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                wardImageCount: 0,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            const result = await adminUserService.updateUser(1, updateDto);

            expect(result.firstName).toBe('Updated');
            expect(result.lastName).toBe('Name');
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(adminUserService.updateUser(999, { firstName: 'Test' })).rejects.toThrow('User not found');
        });

        it('should throw error if new phone already exists', async () => {
            const existingUser = {
                id: 1,
                phone: '01712345678',
                email: 'user@test.com',
            };

            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce(existingUser) // User exists check
                .mockResolvedValueOnce({ id: 2, phone: '01798765432' }); // Duplicate phone check

            await expect(adminUserService.updateUser(1, { phone: '01798765432' })).rejects.toThrow('Phone number already in use');
        });

        it('should throw error if new email already exists', async () => {
            const existingUser = {
                id: 1,
                phone: '01712345678',
                email: 'user@test.com',
            };

            // First call: User exists check
            // Second call: Duplicate email check (since email is changing)
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce({ id: 2, email: 'duplicate@test.com' });

            await expect(adminUserService.updateUser(1, { email: 'duplicate@test.com' })).rejects.toThrow('Email already in use');
        });

        it('should hash password if provided', async () => {
            const existingUser = {
                id: 1,
                phone: '01712345678',
                email: 'user@test.com',
            };

            const updatedUser = {
                id: 1,
                email: 'user@test.com',
                phone: '01712345678',
                firstName: 'Test',
                lastName: 'User',
                avatar: null,
                address: null,
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                phoneVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date(),
                cityCorporationCode: 'DSCC',
                cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                zoneId: 1,
                zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                wardId: 5,
                ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                wardImageCount: 0,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
            (hash as jest.Mock).mockResolvedValue('newHashedPassword');
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            await adminUserService.updateUser(1, { password: 'newPassword123' });

            expect(hash).toHaveBeenCalledWith('newPassword123', 12);
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        passwordHash: 'newHashedPassword',
                    }),
                })
            );
        });
    });

    describe('updateUserStatus', () => {
        it('should update user status successfully', async () => {
            const existingUser = {
                id: 1,
                status: UserStatus.ACTIVE,
            };

            const updatedUser = {
                id: 1,
                email: 'user@test.com',
                phone: '01712345678',
                firstName: 'Test',
                lastName: 'User',
                avatar: null,
                address: null,
                role: users_role.CUSTOMER,
                status: UserStatus.SUSPENDED,
                emailVerified: true,
                phoneVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date(),
                cityCorporationCode: 'DSCC',
                cityCorporation: { code: 'DSCC', name: 'Dhaka South', minWard: 1, maxWard: 75 },
                zoneId: 1,
                zone: { id: 1, zoneNumber: 1, name: 'Zone 1', officerName: null, officerDesignation: null, officerSerialNumber: null, status: 'active' },
                wardId: 5,
                ward: { id: 5, wardNumber: 5, inspectorName: null, inspectorSerialNumber: null, status: 'active' },
                wardImageCount: 0,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
            (prisma.complaint.count as jest.Mock).mockResolvedValue(0);

            const result = await adminUserService.updateUserStatus(1, UserStatus.SUSPENDED);

            expect(result.status).toBe(UserStatus.SUSPENDED);
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: { status: UserStatus.SUSPENDED },
                })
            );
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(adminUserService.updateUserStatus(999, UserStatus.SUSPENDED)).rejects.toThrow('User not found');
        });
    });
});
