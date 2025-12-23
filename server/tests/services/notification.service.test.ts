import notificationService, { NotificationService, NotificationMetadata } from '../../src/services/notification.service';
import prisma from '../../src/utils/prisma';
import { Notification } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}));

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createStatusChangeNotification', () => {
        it('should create notification for IN_PROGRESS status', async () => {
            const mockNotification: Notification = {
                id: 1,
                userId: 100,
                complaintId: 50,
                title: 'Complaint In Progress',
                message: 'Your complaint has been accepted and is currently being processed by our team.',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_IN_PROGRESS',
                metadata: null,
                isRead: false,
                createdAt: new Date()
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.createStatusChangeNotification(
                50,
                100,
                'IN_PROGRESS'
            );

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 100,
                    complaintId: 50,
                    title: 'Complaint In Progress',
                    message: 'Your complaint has been accepted and is currently being processed by our team.',
                    type: 'STATUS_CHANGE',
                    statusChange: 'TO_IN_PROGRESS',
                    metadata: null,
                    isRead: false
                }
            });

            expect(result).toEqual(mockNotification);
        });

        it('should create notification for RESOLVED status with metadata', async () => {
            const metadata: NotificationMetadata = {
                resolutionNote: 'Issue has been fixed',
                resolutionImages: ['https://example.com/image1.jpg'],
                adminName: 'Admin #5'
            };

            const mockNotification: Notification = {
                id: 2,
                userId: 100,
                complaintId: 50,
                title: 'Complaint Resolved',
                message: 'Your complaint has been resolved. Issue has been fixed',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_RESOLVED',
                metadata: JSON.stringify(metadata),
                isRead: false,
                createdAt: new Date()
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.createStatusChangeNotification(
                50,
                100,
                'RESOLVED',
                metadata
            );

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 100,
                    complaintId: 50,
                    title: 'Complaint Resolved',
                    message: 'Your complaint has been resolved. Issue has been fixed',
                    type: 'STATUS_CHANGE',
                    statusChange: 'TO_RESOLVED',
                    metadata: JSON.stringify(metadata),
                    isRead: false
                }
            });

            expect(result).toEqual(mockNotification);
        });

        it('should create notification for OTHERS status with category info', async () => {
            const metadata: NotificationMetadata = {
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: 'Engineering',
                adminName: 'Admin #3'
            };

            const mockNotification: Notification = {
                id: 3,
                userId: 100,
                complaintId: 50,
                title: 'Complaint Categorized',
                message: 'Your complaint has been categorized as Corporation Internal - Engineering. It will be forwarded to the appropriate authority.',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_OTHERS',
                metadata: JSON.stringify(metadata),
                isRead: false,
                createdAt: new Date()
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.createStatusChangeNotification(
                50,
                100,
                'OTHERS',
                metadata
            );

            expect(result.title).toBe('Complaint Categorized');
            expect(result.message).toContain('Corporation Internal - Engineering');
        });

        it('should handle errors during notification creation', async () => {
            (prisma.notification.create as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                notificationService.createStatusChangeNotification(50, 100, 'IN_PROGRESS')
            ).rejects.toThrow('Failed to create notification');
        });
    });

    describe('getUserNotifications', () => {
        it('should fetch paginated notifications with default options', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    userId: 100,
                    complaintId: 50,
                    title: 'Test Notification',
                    message: 'Test message',
                    type: 'STATUS_CHANGE',
                    statusChange: 'TO_IN_PROGRESS',
                    metadata: null,
                    isRead: false,
                    createdAt: new Date(),
                    complaint: {
                        id: 50,
                        title: 'Test Complaint',
                        status: 'IN_PROGRESS'
                    }
                }
            ];

            (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
            (prisma.notification.count as jest.Mock)
                .mockResolvedValueOnce(25) // total count
                .mockResolvedValueOnce(5); // unread count

            const result = await notificationService.getUserNotifications(100, {
                page: 1,
                limit: 20
            });

            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId: 100 },
                skip: 0,
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    complaint: {
                        select: {
                            id: true,
                            title: true,
                            status: true
                        }
                    }
                }
            });

            expect(result.notifications).toHaveLength(1);
            expect(result.pagination.total).toBe(25);
            expect(result.pagination.totalPages).toBe(2);
            expect(result.unreadCount).toBe(5);
        });

        it('should filter unread notifications only', async () => {
            (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.notification.count as jest.Mock)
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(5);

            await notificationService.getUserNotifications(100, {
                page: 1,
                limit: 20,
                unreadOnly: true
            });

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 100, isRead: false }
                })
            );
        });

        it('should parse metadata correctly', async () => {
            const metadata = { resolutionNote: 'Fixed' };
            const mockNotifications = [
                {
                    id: 1,
                    userId: 100,
                    complaintId: 50,
                    title: 'Test',
                    message: 'Test',
                    type: 'STATUS_CHANGE',
                    statusChange: 'TO_RESOLVED',
                    metadata: JSON.stringify(metadata),
                    isRead: false,
                    createdAt: new Date(),
                    complaint: null
                }
            ];

            (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
            (prisma.notification.count as jest.Mock)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(1);

            const result = await notificationService.getUserNotifications(100, {
                page: 1,
                limit: 20
            });

            expect(result.notifications[0].metadata).toEqual(metadata);
        });

        it('should handle pagination correctly', async () => {
            (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.notification.count as jest.Mock)
                .mockResolvedValueOnce(50)
                .mockResolvedValueOnce(10);

            const result = await notificationService.getUserNotifications(100, {
                page: 2,
                limit: 20
            });

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 20
                })
            );

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPrevPage).toBe(true);
        });

        it('should handle errors during fetch', async () => {
            (prisma.notification.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                notificationService.getUserNotifications(100, { page: 1, limit: 20 })
            ).rejects.toThrow('Failed to fetch notifications');
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const mockNotification: Notification = {
                id: 1,
                userId: 100,
                complaintId: 50,
                title: 'Test',
                message: 'Test',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_IN_PROGRESS',
                metadata: null,
                isRead: true,
                createdAt: new Date()
            };

            (prisma.notification.update as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.markAsRead(1);

            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isRead: true }
            });

            expect(result.isRead).toBe(true);
        });

        it('should handle errors during update', async () => {
            (prisma.notification.update as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                notificationService.markAsRead(1)
            ).rejects.toThrow('Failed to mark notification as read');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all user notifications as read', async () => {
            (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

            const result = await notificationService.markAllAsRead(100);

            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: 100,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });

            expect(result).toBe(5);
        });

        it('should return 0 when no unread notifications', async () => {
            (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            const result = await notificationService.markAllAsRead(100);

            expect(result).toBe(0);
        });

        it('should handle errors during bulk update', async () => {
            (prisma.notification.updateMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                notificationService.markAllAsRead(100)
            ).rejects.toThrow('Failed to mark all notifications as read');
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread notification count', async () => {
            (prisma.notification.count as jest.Mock).mockResolvedValue(7);

            const result = await notificationService.getUnreadCount(100);

            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: {
                    userId: 100,
                    isRead: false
                }
            });

            expect(result).toBe(7);
        });

        it('should return 0 when no unread notifications', async () => {
            (prisma.notification.count as jest.Mock).mockResolvedValue(0);

            const result = await notificationService.getUnreadCount(100);

            expect(result).toBe(0);
        });

        it('should handle errors during count', async () => {
            (prisma.notification.count as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                notificationService.getUnreadCount(100)
            ).rejects.toThrow('Failed to get unread count');
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid metadata JSON gracefully', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    userId: 100,
                    complaintId: 50,
                    title: 'Test',
                    message: 'Test',
                    type: 'STATUS_CHANGE',
                    statusChange: 'TO_RESOLVED',
                    metadata: 'invalid json{',
                    isRead: false,
                    createdAt: new Date(),
                    complaint: null
                }
            ];

            (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
            (prisma.notification.count as jest.Mock)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(1);

            const result = await notificationService.getUserNotifications(100, {
                page: 1,
                limit: 20
            });

            // Should return null for invalid JSON
            expect(result.notifications[0].metadata).toBeNull();
        });

        it('should handle REJECTED status notification', async () => {
            const mockNotification: Notification = {
                id: 1,
                userId: 100,
                complaintId: 50,
                title: 'Complaint Rejected',
                message: 'Your complaint has been reviewed and rejected. Please contact support for more information.',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_REJECTED',
                metadata: null,
                isRead: false,
                createdAt: new Date()
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.createStatusChangeNotification(
                50,
                100,
                'REJECTED'
            );

            expect(result.title).toBe('Complaint Rejected');
        });

        it('should handle unknown status with default message', async () => {
            const mockNotification: Notification = {
                id: 1,
                userId: 100,
                complaintId: 50,
                title: 'Complaint Status Updated',
                message: 'Your complaint status has been updated to CUSTOM_STATUS.',
                type: 'STATUS_CHANGE',
                statusChange: 'TO_CUSTOM_STATUS',
                metadata: null,
                isRead: false,
                createdAt: new Date()
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await notificationService.createStatusChangeNotification(
                50,
                100,
                'CUSTOM_STATUS'
            );

            expect(result.message).toContain('CUSTOM_STATUS');
        });
    });
});
