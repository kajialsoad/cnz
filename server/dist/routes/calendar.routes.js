"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendar_controller_1 = require("../controllers/calendar.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_config_1 = require("../config/upload.config");
const router = (0, express_1.Router)();
// Public routes (for mobile app users)
router.get('/current', auth_middleware_1.authGuard, calendar_controller_1.calendarController.getCurrentCalendar);
router.get('/events/upcoming', auth_middleware_1.authGuard, calendar_controller_1.calendarController.getUpcomingEvents);
router.get('/:id', auth_middleware_1.authGuard, calendar_controller_1.calendarController.getCalendarById);
// Admin routes
router.post('/', auth_middleware_1.authGuard, upload_config_1.uploadConfig.single('image'), calendar_controller_1.calendarController.createCalendar);
router.get('/', auth_middleware_1.authGuard, calendar_controller_1.calendarController.getCalendars);
router.put('/:id', auth_middleware_1.authGuard, upload_config_1.uploadConfig.single('image'), calendar_controller_1.calendarController.updateCalendar);
router.delete('/:id', auth_middleware_1.authGuard, calendar_controller_1.calendarController.deleteCalendar);
// Event management
router.post('/:id/events', auth_middleware_1.authGuard, calendar_controller_1.calendarController.addEvent);
router.put('/:id/events/:eventId', auth_middleware_1.authGuard, calendar_controller_1.calendarController.updateEvent);
router.delete('/:id/events/:eventId', auth_middleware_1.authGuard, calendar_controller_1.calendarController.deleteEvent);
exports.default = router;
