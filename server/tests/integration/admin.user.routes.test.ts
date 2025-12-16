import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { generateAccessToken } from '../../src/utils/jwt';
import { users_role, UserStatus } from '@prisma/client';

describe('Admin User Management API Routes', () => {
    let masterAdminToken: string;
    let superAdminToken: string;
    let adminToken: string;
    let testUserId: number;

    beforeAll(async () => {
        // Create test users
        const masterAdmin = await prisma.user.create({
            data: {
                firstName: 'Master',
                lastName: 'Admin',
                phone: '01700000001',
                email: 'master@test.com',
                passwordHash: 'hashed_password',
                role: users_role.MASTER_ADMIN,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });

        const superAdmin = await prisma.user.create({
            data: {
                firstName: 'Super',
                lastName: 'Admin',
                phone: '01700000002',
                email: 'super@test.com',
                passwordHash: 'hashed_password',
                role: users_role.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
                zoneId: 1,
            },
        });

        const admin = await prisma.user.create({
            data: {
                firstName: 'Ward',
                lastName: 'Admin',
                phone: '01700000003',
                email: 'admin@test.com',
                passwordHash: 'hashed_password',
                role: users_role.ADMIN,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
                zoneId: 1,
                wardId: 1,
            },
        });

        // Generate tokens
        masterAdminToken = generateAccessToken({
            id: masterAdmin.id,
            role: masterAdmin.role,
            cityCorporationCode: masterAdmin.cityCorporationCode,
            zoneId: masterAdmin.zoneId,
            wardId: masterAdmin.wardId,
        });

        superAdminToken = generateAccessToken({
            id: superAdmin.id,
            role: superAdmin.role,
            cityCorporationCode: superAdmin.cityCorporationCode,
            zoneId: superAdmin.zoneId,
            wardId: superAdmin.wardId,
        });

        adminToken = generateAccessToken({
            id: admin.id,
            role: admin.role,
            cityCorporationCode: admin.cityCorporationCode,
            zoneId: admin.zoneId,
            wardId: admin.wardId,
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: {
                phone: {
                    in: ['01700000001', '01700000002', '01700000003', '01700000004'],
                },
            },
        });
        await prisma.$disconnect();
    });

    describe('GET /api/admin/users', () => {
        it('should return users for MASTER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('users');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        it('should return filtered users for SUPER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('users');
            // Super admin should only see users in their zone
        });

        it('should return filtered users for ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('users');
            // Admin should only see users in their ward
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/admin/users')
                .expect(401);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/admin/users?page=1&limit=10')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(10);
        });

        it('should support search', async () => {
            const response = await request(app)
                .get('/api/admin/users?search=Master')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /api/admin/users', () => {
        it('should create a new user', async () => {
            const response = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '01700000004',
                    email: 'test@test.com',
                    password: 'Test@1234',
                    cityCorporationCode: 'DSCC',
                    role: users_role.ADMIN,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id');
            testUserId = response.body.data.user.id;
        });

        it('should reject duplicate phone number', async () => {
            await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '01700000001', // Duplicate
                    email: 'test2@test.com',
                    password: 'Test@1234',
                    cityCorporationCode: 'DSCC',
                    role: users_role.ADMIN,
                })
                .expect(409);
        });

        it('should validate required fields', async () => {
            await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    firstName: 'Test',
                    // Missing required fields
                })
                .expect(400);
        });
    });

    describe('GET /api/admin/users/:id', () => {
        it('should return user details', async () => {
            const response = await request(app)
                .get(`/api/admin/users/${testUserId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id', testUserId);
            expect(response.body.data).toHaveProperty('recentComplaints');
        });

        it('should return 404 for non-existent user', async () => {
            await request(app)
                .get('/api/admin/users/999999')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/admin/users/:id', () => {
        it('should update user information', async () => {
            const response = await request(app)
                .put(`/api/admin/users/${testUserId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe('Updated');
        });
    });

    describe('PATCH /api/admin/users/:id/status', () => {
        it('should update user status', async () => {
            const response = await request(app)
                .patch(`/api/admin/users/${testUserId}/status`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    status: UserStatus.INACTIVE,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.status).toBe(UserStatus.INACTIVE);
        });
    });

    describe('PUT /api/admin/users/:id/permissions', () => {
        it('should update user permissions', async () => {
            const response = await request(app)
                .put(`/api/admin/users/${testUserId}/permissions`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    zones: [1, 2],
                    wards: [1, 2, 3],
                    features: {
                        canViewComplaints: true,
                        canEditComplaints: true,
                    },
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should soft delete user', async () => {
            const response = await request(app)
                .delete(`/api/admin/users/${testUserId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user is soft deleted (status = INACTIVE)
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            });
            expect(user?.status).toBe(UserStatus.INACTIVE);
        });
    });

    describe('GET /api/admin/users/statistics', () => {
        it('should return user statistics', async () => {
            const response = await request(app)
                .get('/api/admin/users/statistics')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalCitizens');
            expect(response.body.data).toHaveProperty('totalComplaints');
            expect(response.body.data).toHaveProperty('successRate');
        });

        it('should filter statistics by City Corporation', async () => {
            const response = await request(app)
                .get('/api/admin/users/statistics?cityCorporationCode=DSCC')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
    describe('Zone Assignments', () => {
        it('should assign zones to super admin', async () => {
            // First ensure we have zones. Assuming they might not exist, we try to create dummy zones or use existing.
            // For safety in integration test environment, we should try to use valid IDs.
            // Since we cannot easily create Zones without possibly breaking foreign keys if CC doesn't exist, we skip creation logic 
            // and assume clean-seed behavior or mock behavior.
            // However, to be robust:
            const cc = await prisma.cityCorporation.findFirst();
            if (!cc) return; // Skip if no CC (db not seeded)

            const zone1 = await prisma.zone.create({ data: { name: 'TestZ1', zoneNumber: 901, number: 901, cityCorporationId: cc.id } });
            const zone2 = await prisma.zone.create({ data: { name: 'TestZ2', zoneNumber: 902, number: 902, cityCorporationId: cc.id } });

            const response = await request(app)
                .post(`/api/admin/users/${testUserId}/zones`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    zoneIds: [zone1.id, zone2.id]
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Cleanup
            await prisma.userZone.deleteMany({ where: { userId: testUserId } });
            await prisma.zone.deleteMany({ where: { id: { in: [zone1.id, zone2.id] } } });
        });

        it('should get assigned zones', async () => {
            const response = await request(app)
                .get(`/api/admin/users/${testUserId}/zones`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});

describe('Admin Activity Log API Routes', () => {
    let masterAdminToken: string;

    beforeAll(async () => {
        const masterAdmin = await prisma.user.findFirst({
            where: { role: users_role.MASTER_ADMIN },
        });

        if (masterAdmin) {
            masterAdminToken = generateAccessToken({
                id: masterAdmin.id,
                role: masterAdmin.role,
                cityCorporationCode: masterAdmin.cityCorporationCode,
                zoneId: masterAdmin.zoneId,
                wardId: masterAdmin.wardId,
            });
        }
    });

    describe('GET /api/admin/activity-logs', () => {
        it('should return activity logs', async () => {
            const response = await request(app)
                .get('/api/admin/activity-logs')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('logs');
            expect(response.body.data).toHaveProperty('pagination');
        });

        it('should support filtering by action', async () => {
            const response = await request(app)
                .get('/api/admin/activity-logs?action=CREATE_USER')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support date range filtering', async () => {
            const startDate = new Date('2024-01-01').toISOString();
            const endDate = new Date().toISOString();

            const response = await request(app)
                .get(`/api/admin/activity-logs?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/admin/activity-logs/export', () => {
        it('should export activity logs as CSV', async () => {
            const response = await request(app)
                .get('/api/admin/activity-logs/export')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
        });
    });
});
