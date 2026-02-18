import { cloudUploadService } from './cloud-upload.service';
import prisma from '../utils/prisma';

export interface CreateCalendarDto {
    title: string;
    titleBn?: string;
    month: number;
    year: number;
    cityCorporationId?: number;
    zoneId?: number;
    wardId?: number;
    createdBy: number;
    events?: CreateCalendarEventDto[];
}

export interface CreateCalendarEventDto {
    title: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    eventDate: Date;
    eventType?: string;
    category?: string;
}

export interface UpdateCalendarDto {
    title?: string;
    titleBn?: string;
    month?: number;
    year?: number;
    isActive?: boolean;
    cityCorporationId?: number;
    zoneId?: number;
    wardId?: number;
    events?: CreateCalendarEventDto[]; // Add events support
}

export const calendarService = {
    // Helper method to extract public_id from Cloudinary URL
    extractPublicIdFromUrl(url: string): string | null {
        try {
            // Example URL: https://res.cloudinary.com/demo/image/upload/v123/folder/image.jpg
            // Extract: folder/image
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting public_id from URL:', error);
            return null;
        }
    },

    // Helper to normalize date - ensures date stays the same across timezones
    normalizeEventDate(date: Date | string): Date {
        const d = new Date(date);
        // Get the UTC date components
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const day = d.getUTCDate();

        // Create a new date in local timezone with these components
        const localDate = new Date(year, month, day);

        // Convert back to UTC with the local date components
        return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0));
    },

    // Create calendar with image upload
    async createCalendar(
        data: CreateCalendarDto,
        imageFile?: Express.Multer.File
    ) {
        let imageUrl = '';

        if (imageFile) {
            const uploadResult = await cloudUploadService.uploadImage(
                imageFile,
                'calendars'
            );
            imageUrl = uploadResult.secure_url;
        }

        const { events, ...calendarData } = data;

        const calendar = await prisma.calendar.create({
            data: {
                ...calendarData,
                imageUrl,
                events: events
                    ? {
                        create: events.map((event) => ({
                            ...event,
                            eventDate: this.normalizeEventDate(event.eventDate),
                        })),
                    }
                    : undefined,
            },
            include: {
                events: {
                    where: { isActive: true },
                    orderBy: { eventDate: 'asc' },
                },
                cityCorporation: true,
                zone: true,
                ward: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return calendar;
    },

    // Get all calendars with filters
    async getCalendars(filters: {
        month?: number;
        year?: number;
        cityCorporationId?: number;
        zoneId?: number;
        wardId?: number;
        isActive?: boolean;
    }) {
        const where: any = {};

        if (filters.month) where.month = filters.month;
        if (filters.year) where.year = filters.year;
        if (filters.cityCorporationId)
            where.cityCorporationId = filters.cityCorporationId;
        if (filters.zoneId) where.zoneId = filters.zoneId;
        if (filters.wardId) where.wardId = filters.wardId;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;

        const calendars = await prisma.calendar.findMany({
            where,
            include: {
                events: {
                    where: { isActive: true },
                    orderBy: { eventDate: 'asc' },
                },
                cityCorporation: true,
                zone: true,
                ward: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        });

        return calendars;
    },

    // Get current month calendar for user
    async getCurrentCalendar(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Find calendar matching user's location (most specific first)
        const calendar = await prisma.calendar.findFirst({
            where: {
                month: currentMonth,
                year: currentYear,
                isActive: true,
                OR: [
                    // Ward-specific
                    {
                        wardId: user.wardId || undefined,
                        zoneId: user.zoneId || undefined,
                    },
                    // Zone-specific
                    {
                        zoneId: user.zoneId || undefined,
                        wardId: null,
                    },
                    // City corporation-specific
                    {
                        cityCorporation: user.cityCorporationCode
                            ? { code: user.cityCorporationCode }
                            : undefined,
                        zoneId: null,
                        wardId: null,
                    },
                    // General (no location)
                    {
                        cityCorporationId: null,
                        zoneId: null,
                        wardId: null,
                    },
                ],
            },
            include: {
                events: {
                    where: { isActive: true },
                    orderBy: { eventDate: 'asc' },
                },
            },
            orderBy: [
                { wardId: 'desc' },
                { zoneId: 'desc' },
                { cityCorporationId: 'desc' },
            ],
        });

        return calendar;
    },

    // Get calendar by ID
    async getCalendarById(id: number) {
        const calendar = await prisma.calendar.findUnique({
            where: { id },
            include: {
                events: {
                    where: { isActive: true },
                    orderBy: { eventDate: 'asc' },
                },
                cityCorporation: true,
                zone: true,
                ward: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!calendar) {
            throw new Error('Calendar not found');
        }

        return calendar;
    },

    // Update calendar
    async updateCalendar(
        id: number,
        data: UpdateCalendarDto,
        imageFile?: Express.Multer.File
    ) {
        const existingCalendar = await prisma.calendar.findUnique({
            where: { id },
            include: { events: true },
        });

        if (!existingCalendar) {
            throw new Error('Calendar not found');
        }

        let imageUrl = existingCalendar.imageUrl;

        if (imageFile) {
            const uploadResult = await cloudUploadService.uploadImage(
                imageFile,
                'calendars'
            );
            imageUrl = uploadResult.secure_url;

            // Delete old image if it exists
            if (existingCalendar.imageUrl) {
                try {
                    // Extract public_id from Cloudinary URL
                    const publicId = this.extractPublicIdFromUrl(existingCalendar.imageUrl);
                    if (publicId) {
                        await cloudUploadService.deleteFile(publicId);
                    }
                } catch (error) {
                    console.error('Error deleting old calendar image:', error);
                }
            }
        }

        const { events, ...updateData } = data;

        // Update calendar and handle events
        const calendar = await prisma.calendar.update({
            where: { id },
            data: {
                ...updateData,
                imageUrl,
                // If events are provided, replace all events
                ...(events !== undefined && {
                    events: {
                        // Delete all existing events
                        deleteMany: {},
                        // Create new events with normalized dates
                        create: events.map((event: any) => {
                            // Strip out auto-generated fields that Prisma doesn't accept in create
                            const { id, calendarId, createdAt, updatedAt, ...eventData } = event;
                            return {
                                ...eventData,
                                eventDate: this.normalizeEventDate(event.eventDate),
                            };
                        }),
                    },
                }),
            },
            include: {
                events: {
                    where: { isActive: true },
                    orderBy: { eventDate: 'asc' },
                },
                cityCorporation: true,
                zone: true,
                ward: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return calendar;
    },

    // Delete calendar
    async deleteCalendar(id: number) {
        const calendar = await prisma.calendar.findUnique({
            where: { id },
        });

        if (!calendar) {
            throw new Error('Calendar not found');
        }

        // Delete image from cloud
        if (calendar.imageUrl) {
            try {
                // Extract public_id from Cloudinary URL
                const publicId = this.extractPublicIdFromUrl(calendar.imageUrl);
                if (publicId) {
                    await cloudUploadService.deleteFile(publicId);
                }
            } catch (error) {
                console.error('Error deleting calendar image:', error);
            }
        }

        await prisma.calendar.delete({
            where: { id },
        });

        return { message: 'Calendar deleted successfully' };
    },

    // Calendar Events Management
    async addEvent(calendarId: number, eventData: CreateCalendarEventDto) {
        const event = await prisma.calendarEvent.create({
            data: {
                ...eventData,
                calendarId,
                eventDate: this.normalizeEventDate(eventData.eventDate),
            },
        });

        return event;
    },

    async updateEvent(eventId: number, eventData: Partial<CreateCalendarEventDto>) {
        const event = await prisma.calendarEvent.update({
            where: { id: eventId },
            data: {
                ...eventData,
                eventDate: eventData.eventDate ? this.normalizeEventDate(eventData.eventDate) : undefined,
            },
        });

        return event;
    },

    async deleteEvent(eventId: number) {
        await prisma.calendarEvent.delete({
            where: { id: eventId },
        });

        return { message: 'Event deleted successfully' };
    },

    async getUpcomingEvents(userId: number, limit: number = 10) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const now = new Date();

        const events = await prisma.calendarEvent.findMany({
            where: {
                isActive: true,
                eventDate: {
                    gte: now,
                },
                calendar: {
                    isActive: true,
                    OR: [
                        { wardId: user.wardId || undefined },
                        { zoneId: user.zoneId || undefined, wardId: null },
                        {
                            cityCorporation: user.cityCorporationCode
                                ? { code: user.cityCorporationCode }
                                : undefined,
                            zoneId: null,
                            wardId: null,
                        },
                        { cityCorporationId: null, zoneId: null, wardId: null },
                    ],
                },
            },
            include: {
                calendar: {
                    select: {
                        title: true,
                        titleBn: true,
                        month: true,
                        year: true,
                    },
                },
            },
            orderBy: { eventDate: 'asc' },
            take: limit,
        });

        return events;
    },
};
