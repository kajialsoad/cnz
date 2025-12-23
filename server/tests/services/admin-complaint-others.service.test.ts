import { AdminComplaintService, MarkOthersInput } from '../../src/services/admin-complaint.service';
import prisma from '../../src/utils/prisma';
import notificationService from '../../src/services/notification.service';
import { Complaint_status } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        complaint: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        statusHistory: {
            create: jest.fn(),
        },
        activityLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

// Mock NotificationService
jest.mock('../../src/services/notification.service', () => ({
    __esModule: true,
    default: {
        createStatusChangeNotification: jest.fn(),
    },
}));

describe('AdminComplaintService - Others Methods', () => {
    let adminComplaintService: AdminComplaintService;

    beforeEach(() => {
        jest.clearAllMocks();
        adminComplaintService = new AdminComplaintService();
    });

    describe('markComplaintAsOthers', () => {
        const validInput: MarkOthersInput = {
            othersCategory: 'CORPORATION_INTERNAL',
            othersSubcategory: 'Engineering',
            adminId: 5,
            note: 'Forwarding to Engineering department'
        };

        const mockCurrentComplaint = {
            id: 50,
            status: Complaint_status.PENDING,
            othersCategory: null,
            othersSubcategory: null,
            userId: 100,
            user: {
                id: 100,
                firstName: 'John',
                lastName: 'Doe'
            }
        };

        const mockUpdatedComplaint = {
            id: 50,
            status: Complaint_status.OTHERS,
            othersCategory: 'CORPORATION_INTERNAL',
            othersSubcategory: 'Engineering',
            userId: 100,
            updatedAt: new Date(),
            user: {
                id: 100,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890'
            }
        };

        it('should successfully mark complaint as Others with CORPORATION_INTERNAL', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback({
                    complaint: {
                        update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                    },
                    statusHistory: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const result = await adminComplaintService.markComplaintAsOthers(50, validInput);

            expect(prisma.complaint.findUnique).toHaveBeenCalledWith({
                where: { id: 50 },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            expect(notificationService.createStatusChangeNotification).toHaveBeenCalledWith(
                50,
                100,
                'OTHERS',
                {
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    adminName: 'Admin #5'
                }
            );
        });

        it('should successfully mark complaint as Others with CORPORATION_EXTERNAL', async () => {
            const externalInput: MarkOthersInput = {
                othersCategory: 'CORPORATION_EXTERNAL',
                othersSubcategory: 'WASA',
                adminId: 5
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback({
                    complaint: {
                        update: jest.fn().mockResolvedValue({
                            ...mockUpdatedComplaint,
                            othersCategory: 'CORPORATION_EXTERNAL',
                            othersSubcategory: 'WASA'
                        })
                    },
                    statusHistory: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            await adminComplaintService.markComplaintAsOthers(50, externalInput);

            expect(notificationService.createStatusChangeNotification).toHaveBeenCalledWith(
                50,
                100,
                'OTHERS',
                expect.objectContaining({
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'WASA'
                })
            );
        });

        it('should reject invalid Others category', async () => {
            const invalidInput = {
                ...validInput,
                othersCategory: 'INVALID_CATEGORY' as any
            };

            await expect(
                adminComplaintService.markComplaintAsOthers(50, invalidInput)
            ).rejects.toThrow('Invalid Others category');
        });

        it('should reject invalid subcategory for CORPORATION_INTERNAL', async () => {
            const invalidInput: MarkOthersInput = {
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: 'WASA', // This is for EXTERNAL
                adminId: 5
            };

            await expect(
                adminComplaintService.markComplaintAsOthers(50, invalidInput)
            ).rejects.toThrow('Invalid subcategory for CORPORATION_INTERNAL');
        });

        it('should reject invalid subcategory for CORPORATION_EXTERNAL', async () => {
            const invalidInput: MarkOthersInput = {
                othersCategory: 'CORPORATION_EXTERNAL',
                othersSubcategory: 'Engineering', // This is for INTERNAL
                adminId: 5
            };

            await expect(
                adminComplaintService.markComplaintAsOthers(50, invalidInput)
            ).rejects.toThrow('Invalid subcategory for CORPORATION_EXTERNAL');
        });

        it('should reject when complaint not found', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                adminComplaintService.markComplaintAsOthers(50, validInput)
            ).rejects.toThrow('Complaint not found');
        });

        it('should accept all valid CORPORATION_INTERNAL subcategories', async () => {
            const validSubcategories = ['Engineering', 'Electricity', 'Health', 'Property (Eviction)'];

            for (const subcategory of validSubcategories) {
                jest.clearAllMocks();

                const input: MarkOthersInput = {
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: subcategory,
                    adminId: 5
                };

                (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
                (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                    return callback({
                        complaint: {
                            update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                        },
                        statusHistory: {
                            create: jest.fn().mockResolvedValue({})
                        }
                    });
                });
                (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
                (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

                await expect(
                    adminComplaintService.markComplaintAsOthers(50, input)
                ).resolves.not.toThrow();
            }
        });

        it('should accept all valid CORPORATION_EXTERNAL subcategories', async () => {
            const validSubcategories = ['WASA', 'Titas', 'DPDC', 'DESCO', 'BTCL', 'Fire Service', 'Others'];

            for (const subcategory of validSubcategories) {
                jest.clearAllMocks();

                const input: MarkOthersInput = {
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: subcategory,
                    adminId: 5
                };

                (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
                (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                    return callback({
                        complaint: {
                            update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                        },
                        statusHistory: {
                            create: jest.fn().mockResolvedValue({})
                        }
                    });
                });
                (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
                (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

                await expect(
                    adminComplaintService.markComplaintAsOthers(50, input)
                ).resolves.not.toThrow();
            }
        });

        it('should create status history entry', async () => {
            const mockTx = {
                complaint: {
                    update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                },
                statusHistory: {
                    create: jest.fn().mockResolvedValue({})
                }
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback(mockTx);
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            await adminComplaintService.markComplaintAsOthers(50, validInput);

            expect(mockTx.statusHistory.create).toHaveBeenCalledWith({
                data: {
                    complaintId: 50,
                    oldStatus: Complaint_status.PENDING,
                    newStatus: Complaint_status.OTHERS,
                    changedBy: 5,
                    note: 'Forwarding to Engineering department'
                }
            });
        });

        it('should create activity log entry', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback({
                    complaint: {
                        update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                    },
                    statusHistory: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            await adminComplaintService.markComplaintAsOthers(50, validInput);

            expect(prisma.activityLog.create).toHaveBeenCalledWith({
                data: {
                    userId: 5,
                    action: 'MARK_AS_OTHERS',
                    entityType: 'Complaint',
                    entityId: 50,
                    oldValue: expect.stringContaining('PENDING'),
                    newValue: expect.stringContaining('OTHERS')
                }
            });
        });

        it('should continue operation even if notification creation fails', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback({
                    complaint: {
                        update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                    },
                    statusHistory: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockRejectedValue(
                new Error('Notification service error')
            );
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            // Should not throw error
            await expect(
                adminComplaintService.markComplaintAsOthers(50, validInput)
            ).resolves.not.toThrow();
        });

        it('should continue operation even if activity log creation fails', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback({
                    complaint: {
                        update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                    },
                    statusHistory: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockRejectedValue(
                new Error('Activity log error')
            );

            // Should not throw error
            await expect(
                adminComplaintService.markComplaintAsOthers(50, validInput)
            ).resolves.not.toThrow();
        });

        it('should use default note when note not provided', async () => {
            const inputWithoutNote: MarkOthersInput = {
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: 'Engineering',
                adminId: 5
            };

            const mockTx = {
                complaint: {
                    update: jest.fn().mockResolvedValue(mockUpdatedComplaint)
                },
                statusHistory: {
                    create: jest.fn().mockResolvedValue({})
                }
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockCurrentComplaint);
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback(mockTx);
            });
            (notificationService.createStatusChangeNotification as jest.Mock).mockResolvedValue({});
            (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

            await adminComplaintService.markComplaintAsOthers(50, inputWithoutNote);

            expect(mockTx.statusHistory.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    note: 'Marked as Others: CORPORATION_INTERNAL - Engineering'
                })
            });
        });
    });

    describe('getOthersAnalytics', () => {
        it('should return comprehensive analytics for Others complaints', async () => {
            const mockOthersComplaints = [
                {
                    id: 1,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    createdAt: new Date('2024-12-01'),
                    updatedAt: new Date('2024-12-05'),
                    status: Complaint_status.RESOLVED
                },
                {
                    id: 2,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    createdAt: new Date('2024-12-02'),
                    updatedAt: new Date('2024-12-06'),
                    status: Complaint_status.RESOLVED
                },
                {
                    id: 3,
                    othersCategory: 'CORPORATION_EXTERNAL',
                    othersSubcategory: 'WASA',
                    createdAt: new Date('2024-12-03'),
                    updatedAt: new Date('2024-12-07'),
                    status: Complaint_status.OTHERS
                }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockOthersComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.totalOthers).toBe(3);
            expect(result.byCategory.CORPORATION_INTERNAL).toBe(2);
            expect(result.byCategory.CORPORATION_EXTERNAL).toBe(1);
            expect(result.bySubcategory.Engineering).toBe(2);
            expect(result.bySubcategory.WASA).toBe(1);
        });

        it('should calculate top subcategories correctly', async () => {
            const mockComplaints = [
                { id: 1, othersCategory: 'CORPORATION_INTERNAL', othersSubcategory: 'Engineering', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS },
                { id: 2, othersCategory: 'CORPORATION_INTERNAL', othersSubcategory: 'Engineering', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS },
                { id: 3, othersCategory: 'CORPORATION_INTERNAL', othersSubcategory: 'Engineering', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS },
                { id: 4, othersCategory: 'CORPORATION_EXTERNAL', othersSubcategory: 'WASA', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS },
                { id: 5, othersCategory: 'CORPORATION_EXTERNAL', othersSubcategory: 'WASA', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS },
                { id: 6, othersCategory: 'CORPORATION_INTERNAL', othersSubcategory: 'Electricity', createdAt: new Date(), updatedAt: new Date(), status: Complaint_status.OTHERS }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.topSubcategories).toHaveLength(3);
            expect(result.topSubcategories[0]).toEqual({ subcategory: 'Engineering', count: 3 });
            expect(result.topSubcategories[1]).toEqual({ subcategory: 'WASA', count: 2 });
            expect(result.topSubcategories[2]).toEqual({ subcategory: 'Electricity', count: 1 });
        });

        it('should limit top subcategories to 5', async () => {
            const mockComplaints = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: `Subcategory${i}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: Complaint_status.OTHERS
            }));

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.topSubcategories).toHaveLength(5);
        });

        it('should calculate average resolution time correctly', async () => {
            const now = new Date();
            const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

            const mockComplaints = [
                {
                    id: 1,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    createdAt: fourHoursAgo,
                    updatedAt: now,
                    status: Complaint_status.RESOLVED
                }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.averageResolutionTime.overall).toBeCloseTo(4, 1);
        });

        it('should return 0 average resolution time when no resolved complaints', async () => {
            const mockComplaints = [
                {
                    id: 1,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: Complaint_status.OTHERS
                }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.averageResolutionTime.overall).toBe(0);
        });

        it('should apply city corporation filter', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await adminComplaintService.getOthersAnalytics({
                cityCorporationCode: 'DSCC'
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.OTHERS,
                    user: {
                        cityCorporationCode: 'DSCC'
                    }
                },
                select: expect.any(Object)
            });
        });

        it('should apply zone filter', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await adminComplaintService.getOthersAnalytics({
                zoneId: 5
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.OTHERS,
                    user: {
                        zoneId: 5
                    }
                },
                select: expect.any(Object)
            });
        });

        it('should apply date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await adminComplaintService.getOthersAnalytics({
                startDate,
                endDate
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.OTHERS,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: expect.any(Object)
            });
        });

        it('should generate 30-day trend data', async () => {
            const mockComplaints = [
                {
                    id: 1,
                    othersCategory: 'CORPORATION_INTERNAL',
                    othersSubcategory: 'Engineering',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: Complaint_status.OTHERS
                }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.trend).toHaveLength(30);
            expect(result.trend[0]).toHaveProperty('date');
            expect(result.trend[0]).toHaveProperty('count');
        });

        it('should return empty analytics when no Others complaints', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            const result = await adminComplaintService.getOthersAnalytics();

            expect(result.totalOthers).toBe(0);
            expect(result.byCategory.CORPORATION_INTERNAL).toBe(0);
            expect(result.byCategory.CORPORATION_EXTERNAL).toBe(0);
            expect(result.topSubcategories).toEqual([]);
            expect(result.averageResolutionTime.overall).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            (prisma.complaint.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                adminComplaintService.getOthersAnalytics()
            ).rejects.toThrow();
        });
    });
});
