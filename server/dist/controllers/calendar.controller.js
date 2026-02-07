"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarController = void 0;
const calendar_service_1 = require("../services/calendar.service");
// Helper function to convert camelCase category to UPPERCASE format
function convertCategoryToUppercase(category) {
    if (category === 'wasteCollection')
        return 'WASTE_COLLECTION';
    if (category === 'publicHoliday')
        return 'PUBLIC_HOLIDAY';
    if (category === 'communityEvent')
        return 'COMMUNITY_EVENT';
    return category; // Return as-is if already in correct format
}
// Helper function to convert events array categories and dates
function convertEventCategories(events) {
    return events.map(event => ({
        ...event,
        category: event.category ? convertCategoryToUppercase(event.category) : event.category,
        eventDate: event.eventDate ? new Date(event.eventDate) : event.eventDate
    }));
}
exports.calendarController = {
    // Create calendar
    async createCalendar(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Parse events and convert categories
            let events = req.body.events ? JSON.parse(req.body.events) : undefined;
            if (events && events.length > 0) {
                events = convertEventCategories(events);
            }
            const calendarData = {
                ...req.body,
                createdBy: userId,
                month: parseInt(req.body.month),
                year: parseInt(req.body.year),
                cityCorporationId: req.body.cityCorporationId
                    ? parseInt(req.body.cityCorporationId)
                    : undefined,
                zoneId: req.body.zoneId ? parseInt(req.body.zoneId) : undefined,
                wardId: req.body.wardId ? parseInt(req.body.wardId) : undefined,
                events,
            };
            const imageFile = req.file;
            if (!imageFile) {
                return res.status(400).json({ error: 'Calendar image is required' });
            }
            const calendar = await calendar_service_1.calendarService.createCalendar(calendarData, imageFile);
            res.status(201).json(calendar);
        }
        catch (error) {
            console.error('Error creating calendar:', error);
            res.status(500).json({ error: error.message || 'Failed to create calendar' });
        }
    },
    // Get all calendars (admin)
    async getCalendars(req, res) {
        try {
            const filters = {
                month: req.query.month ? parseInt(req.query.month) : undefined,
                year: req.query.year ? parseInt(req.query.year) : undefined,
                cityCorporationId: req.query.cityCorporationId
                    ? parseInt(req.query.cityCorporationId)
                    : undefined,
                zoneId: req.query.zoneId ? parseInt(req.query.zoneId) : undefined,
                wardId: req.query.wardId ? parseInt(req.query.wardId) : undefined,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            };
            const calendars = await calendar_service_1.calendarService.getCalendars(filters);
            res.json({ success: true, data: calendars });
        }
        catch (error) {
            console.error('Error fetching calendars:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch calendars' });
        }
    },
    // Get current calendar for user
    async getCurrentCalendar(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const calendar = await calendar_service_1.calendarService.getCurrentCalendar(userId);
            if (!calendar) {
                return res.json({ success: false, message: 'No calendar found for current month', data: null });
            }
            res.json({ success: true, data: calendar });
        }
        catch (error) {
            console.error('Error fetching current calendar:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch calendar' });
        }
    },
    // Get calendar by ID
    async getCalendarById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const calendar = await calendar_service_1.calendarService.getCalendarById(id);
            res.json({ success: true, data: calendar });
        }
        catch (error) {
            console.error('Error fetching calendar:', error);
            res.status(404).json({ success: false, error: error.message || 'Calendar not found' });
        }
    },
    // Update calendar
    async updateCalendar(req, res) {
        try {
            console.log('🔍 [calendar.controller] updateCalendar called');
            console.log('📝 [calendar.controller] Request params:', req.params);
            console.log('📝 [calendar.controller] Request body:', req.body);
            console.log('🖼️ [calendar.controller] Request file:', req.file ? 'Present' : 'None');
            const id = parseInt(req.params.id);
            console.log('📝 [calendar.controller] Calendar ID:', id);
            // Parse events and convert categories
            let events = req.body.events ? JSON.parse(req.body.events) : undefined;
            console.log('📋 [calendar.controller] Parsed events:', events);
            if (events && events.length > 0) {
                console.log('🔄 [calendar.controller] Converting event categories and dates');
                events = convertEventCategories(events);
                console.log('✅ [calendar.controller] Converted events:', events);
            }
            const updateData = {
                ...req.body,
                month: req.body.month ? parseInt(req.body.month) : undefined,
                year: req.body.year ? parseInt(req.body.year) : undefined,
                cityCorporationId: req.body.cityCorporationId
                    ? parseInt(req.body.cityCorporationId)
                    : undefined,
                zoneId: req.body.zoneId ? parseInt(req.body.zoneId) : undefined,
                wardId: req.body.wardId ? parseInt(req.body.wardId) : undefined,
                events,
            };
            console.log('📦 [calendar.controller] Update data prepared:', updateData);
            const imageFile = req.file;
            console.log('🚀 [calendar.controller] Calling calendarService.updateCalendar');
            const calendar = await calendar_service_1.calendarService.updateCalendar(id, updateData, imageFile);
            console.log('✅ [calendar.controller] Update successful:', calendar);
            res.json(calendar);
        }
        catch (error) {
            console.error('❌ [calendar.controller] Error updating calendar:', error);
            console.error('❌ [calendar.controller] Error stack:', error.stack);
            res.status(500).json({ error: error.message || 'Failed to update calendar' });
        }
    },
    // Delete calendar
    async deleteCalendar(req, res) {
        try {
            const id = parseInt(req.params.id);
            const result = await calendar_service_1.calendarService.deleteCalendar(id);
            res.json(result);
        }
        catch (error) {
            console.error('Error deleting calendar:', error);
            res.status(500).json({ error: error.message || 'Failed to delete calendar' });
        }
    },
    // Event management
    async addEvent(req, res) {
        try {
            const calendarId = parseInt(req.params.id);
            const event = await calendar_service_1.calendarService.addEvent(calendarId, req.body);
            res.status(201).json(event);
        }
        catch (error) {
            console.error('Error adding event:', error);
            res.status(500).json({ error: error.message || 'Failed to add event' });
        }
    },
    async updateEvent(req, res) {
        try {
            const eventId = parseInt(req.params.eventId);
            const event = await calendar_service_1.calendarService.updateEvent(eventId, req.body);
            res.json(event);
        }
        catch (error) {
            console.error('Error updating event:', error);
            res.status(500).json({ error: error.message || 'Failed to update event' });
        }
    },
    async deleteEvent(req, res) {
        try {
            const eventId = parseInt(req.params.eventId);
            const result = await calendar_service_1.calendarService.deleteEvent(eventId);
            res.json(result);
        }
        catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ error: error.message || 'Failed to delete event' });
        }
    },
    async getUpcomingEvents(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const events = await calendar_service_1.calendarService.getUpcomingEvents(userId, limit);
            res.json({ success: true, data: events });
        }
        catch (error) {
            console.error('Error fetching upcoming events:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch events' });
        }
    },
};
