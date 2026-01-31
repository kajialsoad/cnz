import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { Calendar, CreateCalendarDto, UpdateCalendarDto, CalendarFilters, CalendarEvent } from '../types/calendar.types';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const calendarService = {
    // Get all calendars with filters
    async getCalendars(filters?: CalendarFilters): Promise<Calendar[]> {
        const params = new URLSearchParams();
        if (filters?.month) params.append('month', filters.month.toString());
        if (filters?.year) params.append('year', filters.year.toString());
        if (filters?.cityCorporationId) params.append('cityCorporationId', filters.cityCorporationId.toString());
        if (filters?.zoneId) params.append('zoneId', filters.zoneId.toString());
        if (filters?.wardId) params.append('wardId', filters.wardId.toString());
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const queryString = params.toString();
        const url = queryString ? `/api/calendars?${queryString}` : '/api/calendars';

        const response = await apiClient.get(url);
        return response.data.data || response.data;
    },

    // Get calendar by ID
    async getCalendarById(id: number): Promise<Calendar> {
        const response = await apiClient.get(`/api/calendars/${id}`);
        return response.data.data || response.data;
    },

    // Create calendar
    async createCalendar(data: CreateCalendarDto, imageFile: File): Promise<Calendar> {
        const formData = new FormData();
        formData.append('title', data.title);
        if (data.titleBn) formData.append('titleBn', data.titleBn);
        formData.append('month', data.month.toString());
        formData.append('year', data.year.toString());
        if (data.cityCorporationId) formData.append('cityCorporationId', data.cityCorporationId.toString());
        if (data.zoneId) formData.append('zoneId', data.zoneId.toString());
        if (data.wardId) formData.append('wardId', data.wardId.toString());
        if (data.events && data.events.length > 0) {
            formData.append('events', JSON.stringify(data.events));
        }
        formData.append('image', imageFile);

        const response = await apiClient.post('/api/calendars', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data || response.data;
    },

    // Update calendar
    async updateCalendar(id: number, data: UpdateCalendarDto, imageFile?: File): Promise<Calendar> {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.titleBn) formData.append('titleBn', data.titleBn);
        if (data.month) formData.append('month', data.month.toString());
        if (data.year) formData.append('year', data.year.toString());
        if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
        if (data.cityCorporationId !== undefined) {
            formData.append('cityCorporationId', data.cityCorporationId ? data.cityCorporationId.toString() : '');
        }
        if (data.zoneId !== undefined) {
            formData.append('zoneId', data.zoneId ? data.zoneId.toString() : '');
        }
        if (data.wardId !== undefined) {
            formData.append('wardId', data.wardId ? data.wardId.toString() : '');
        }
        if (imageFile) formData.append('image', imageFile);

        const response = await apiClient.put(`/api/calendars/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data || response.data;
    },

    // Delete calendar
    async deleteCalendar(id: number): Promise<void> {
        await apiClient.delete(`/api/calendars/${id}`);
    },

    // Event management
    async addEvent(calendarId: number, eventData: any): Promise<CalendarEvent> {
        const response = await apiClient.post(`/api/calendars/${calendarId}/events`, eventData);
        return response.data.data || response.data;
    },

    async updateEvent(calendarId: number, eventId: number, eventData: any): Promise<CalendarEvent> {
        const response = await apiClient.put(`/api/calendars/${calendarId}/events/${eventId}`, eventData);
        return response.data.data || response.data;
    },

    async deleteEvent(calendarId: number, eventId: number): Promise<void> {
        await apiClient.delete(`/api/calendars/${calendarId}/events/${eventId}`);
    },
};
