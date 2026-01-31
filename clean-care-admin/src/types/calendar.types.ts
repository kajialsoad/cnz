export interface Calendar {
    id: number;
    title: string;
    titleBn?: string;
    imageUrl: string;
    month: number;
    year: number;
    isActive: boolean;
    cityCorporationId?: number;
    zoneId?: number;
    wardId?: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    events?: CalendarEvent[];
    cityCorporation?: {
        id: number;
        name: string;
        code: string;
    };
    zone?: {
        id: number;
        name: string;
        number: number;
    };
    ward?: {
        id: number;
        number: number;
    };
    creator?: {
        id: number;
        firstName: string;
        lastName: string;
        email?: string;
    };
}

export interface CalendarEvent {
    id: number;
    calendarId: number;
    title: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    eventDate: string;
    eventType: string;
    category: EventCategory;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type EventCategory = 'wasteCollection' | 'publicHoliday' | 'communityEvent';

export interface CreateCalendarDto {
    title: string;
    titleBn?: string;
    month: number;
    year: number;
    cityCorporationId?: number;
    zoneId?: number;
    wardId?: number;
    events?: CreateCalendarEventDto[];
}

export interface CreateCalendarEventDto {
    title: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    eventDate: string;
    eventType?: string;
    category?: EventCategory;
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
}

export interface CalendarFilters {
    month?: number;
    year?: number;
    cityCorporationId?: number;
    zoneId?: number;
    wardId?: number;
    isActive?: boolean;
}
