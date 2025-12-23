import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { generateAccessToken } from '../helpers/test-utils';
import { users_role, UserStatus, Complaint_status } from '@prisma/client';

describe('Admin Others API Routes', () => {
    let adminToken: string;
    let userToken: string;
    let adminId: number;
    let userId: number;
    let complaintId: number;

    beforeAll(async () => {
        // Create admin user
        const admin = await prisma.user.create({
            data: {
                firstName: 'Admin',
                lastName: 'User',
                phone: '01700000301',
                email: 'othersadmin@test.com',
                passwordHash: 'hashed_password',
                role: users_role.ADMIN,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        adminId = admin.id;

        // Create regular user
        const user = await prisma.user.create({
            data: {
                firstName: 'Regular',
                lastName: 'User',
                phone: '01700000302',
                email: 'othersuser@test.com',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        userId = user.id;

        // Generate tokens
        adminToken = generateAccessToken({
            id: admin.id,
            role: admin.role,
            cityCorporationCode: admin.cityCorporationCode,
            zoneId: admin.zoneId,
            wardId: admin.wardId,
        });

        userToken = generateAccessToken({
            id: user.id,
            role: user.role,
            cityCorporationCode: user.cityCorporationCode,
            zoneId: user.zoneId,
            wardId: user.wardId,
        });

        // Create test complaint
        const complaint = await prisma.complaint.create({
            data: {
                userId: user.id,
                title: 'Test Complaint for Others',
                description: 'Test Description',
                category: 'WASTE_MANAGEMENT',
                subcategory: 'GARBAGE_NOT_COLLECTED',
                status: Complaint_status.PENDING,
                cityCorporationCode: 'DSCC',
                location: 'Test Location',
            },
        });
        complaintId = complaint.id;

        // Create some Others complaints for analytics
        await prisma.complaint.createMany({
            data: [
                {
                    userId: user.id,
                    title: 'Internal Others 1',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.OTHERS,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
                {
                    userId: user.id,
                    title: 'External Others 1',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.OTHERS,
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'WASA',
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
                {
                    userId: user.id,
                    title: 'External Others 2',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.OTHERS,
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'DPDC',
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
            ],
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.complaint.deleteMany({
            where: { userId: { in: [userId] } },
        });
        await prisma.user.deleteMany({
            where: {
                phone: { in: ['01700000301', '01700000302'] },
            },
        });
        await prisma.$disconnect();
    });

    describe('PATCH /api/admin/complaints/:id/mark-others', () => {
        it('should mark complaint as Others with Corporation Internal', async () => {
            const response = await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    note: 'This is an engineering department issue',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.complaint.status).toBe(Complaint_status.OTHERS);
            expect(response.body.data.complaint.othersCategory).toBe('CORPORATION_INTERNAL');
            expect(response.body.data.complaint.othersSubcategory).toBe('Engineering');

            // Verify in database
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
            });
            expect(complaint?.status).toBe(Complaint_status.OTHERS);
            expect(complaint?.othersCategory).toBe('CORPORATION_INTERNAL');
            expect(complaint?.othersSubcategory).toBe('Engineering');
        });

        it('should mark complaint as Others with Corporation External', async () => {
            // Create another complaint
            const newComplaint = await prisma.complaint.create({
                data: {
                    userId: userId,
                    title: 'Another Test Complaint',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.PENDING,
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
            });

            const response = await request(app)
                .patch(`/api/admin/complaints/${newComplaint.id}/mark-others`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'WASA',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.complaint.othersCategory).toBe('CORPORATION_EXTERNAL');
            expect(response.body.data.complaint.othersSubcategory).toBe('WASA');

            // Clean up
            await prisma.complaint.delete({ where: { id: newComplaint.id } });
        });

        it('should validate Others category', async () => {
            await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'INVALID_CATEGORY',
                    othersSubcategory: 'Engineering',
                })
                .expect(400);
        });

        it('should validate Corporation Internal subcategories', async () => {
            await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'WASA', // External subcategory
                })
                .expect(400);
        });

        it('should validate Corporation External subcategories', async () => {
            await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'Engineering', // Internal subcategory
                })
                .expect(400);
        });

        it('should require admin authentication', async () => {
            await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .expect(401);
        });

        it('should prevent non-admin access', async () => {
            await request(app)
                .patch(`/api/admin/complaints/${complaintId}/mark-others`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                })
                .expect(403);
        });

        it('should return 404 for non-existent complaint', async () => {
            await request(app)
                .patch('/api/admin/complaints/999999/mark-others')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                })
                .expect(404);
        });

        it('should accept all valid Corporation Internal subcategories', async () => {
            const validSubcategories = ['Engineering', 'Electricity', 'Health', 'Property (Eviction)'];

            for (const subcategory of validSubcategories) {
                const complaint = await prisma.complaint.create({
                    data: {
                        userId: userId,
                        title: `Test ${subcategory}`,
                        description: 'Test',
                        category: 'WASTE_MANAGEMENT',
                        subcategory: 'GARBAGE_NOT_COLLECTED',
                        status: Complaint_status.PENDING,
                        cityCorporationCode: 'DSCC',
                        location: 'Test Location',
                    },
                });

                const response = await request(app)
                    .patch(`/api/admin/complaints/${complaint.id}/mark-others`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        othersCategory: 'CORPORATION_INTERNAL',
                        othersSubcategory: subcategory,
                    })
                    .expect(200);

                expect(response.body.data.complaint.othersSubcategory).toBe(subcategory);

                // Clean up
                await prisma.complaint.delete({ where: { id: complaint.id } });
            }
        }, 60000); // 60 second timeout for loop-based test

        it('should accept all valid Corporation External subcategories', async () => {
            const validSubcategories = ['WASA', 'Titas', 'DPDC', 'DESCO', 'BTCL', 'Fire Service', 'Others'];

            for (const subcategory of validSubcategories) {
                const complaint = await prisma.complaint.create({
                    data: {
                        userId: userId,
                        title: `Test ${subcategory}`,
                        description: 'Test',
                        category: 'WASTE_MANAGEMENT',
                        subcategory: 'GARBAGE_NOT_COLLECTED',
                        status: Complaint_status.PENDING,
                        cityCorporationCode: 'DSCC',
                        location: 'Test Location',
                    },
                });

                const response = await request(app)
                    .patch(`/api/admin/complaints/${complaint.id}/mark-others`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        othersCategory: 'CORPORATION_EXTERNAL',
                        othersSubcategory: subcategory,
                    })
                    .expect(200);

                expect(response.body.data.complaint.othersSubcategory).toBe(subcategory);

                // Clean up
                await prisma.complaint.delete({ where: { id: complaint.id } });
            }
        }, 60000); // 60 second timeout for loop-based test
    });

    describe('GET /api/admin/complaints/analytics/others', () => {
        it('should return Others analytics', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalOthers');
            expect(response.body.data).toHaveProperty('byCategory');
            expect(response.body.data).toHaveProperty('bySubcategory');
            expect(response.body.data).toHaveProperty('topSubcategories');
            expect(response.body.data).toHaveProperty('averageResolutionTime');
            expect(response.body.data).toHaveProperty('trend');
        });

        it('should require admin authentication', async () => {
            await request(app)
                .get('/api/admin/complaints/analytics/others')
                .expect(401);
        });

        it('should prevent non-admin access', async () => {
            await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should return correct category breakdown', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.byCategory).toHaveProperty('CORPORATION_INTERNAL');
            expect(response.body.data.byCategory).toHaveProperty('CORPORATION_EXTERNAL');
            expect(typeof response.body.data.byCategory.CORPORATION_INTERNAL).toBe('number');
            expect(typeof response.body.data.byCategory.CORPORATION_EXTERNAL).toBe('number');
        });

        it('should return subcategory breakdown', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(typeof response.body.data.bySubcategory).toBe('object');
            expect(Object.keys(response.body.data.bySubcategory).length).toBeGreaterThan(0);
        });

        it('should return top subcategories', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data.topSubcategories)).toBe(true);
            expect(response.body.data.topSubcategories.length).toBeLessThanOrEqual(5);

            if (response.body.data.topSubcategories.length > 0) {
                const topItem = response.body.data.topSubcategories[0];
                expect(topItem).toHaveProperty('subcategory');
                expect(topItem).toHaveProperty('count');
            }
        });

        it('should support city corporation filter', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others?cityCorporationCode=DSCC')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support zone filter', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others?zoneId=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support date range filter', async () => {
            const startDate = new Date('2024-01-01').toISOString();
            const endDate = new Date().toISOString();

            const response = await request(app)
                .get(`/api/admin/complaints/analytics/others?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return trend data', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data.trend)).toBe(true);
            expect(response.body.data.trend.length).toBeLessThanOrEqual(30);

            if (response.body.data.trend.length > 0) {
                const trendItem = response.body.data.trend[0];
                expect(trendItem).toHaveProperty('date');
                expect(trendItem).toHaveProperty('count');
            }
        });

        it('should return average resolution time', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/others')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.averageResolutionTime).toHaveProperty('overall');
            expect(response.body.data.averageResolutionTime).toHaveProperty('bySubcategory');
            expect(typeof response.body.data.averageResolutionTime.overall).toBe('number');
        });
    });
});
