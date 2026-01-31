import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { uploadConfig } from '../config/upload.config';

const router = Router();

// Public routes (for mobile app users)
router.get('/current', authGuard, calendarController.getCurrentCalendar);
router.get('/events/upcoming', authGuard, calendarController.getUpcomingEvents);
router.get('/:id', authGuard, calendarController.getCalendarById);

// Admin routes
router.post(
    '/',
    authGuard,
    uploadConfig.single('image'),
    calendarController.createCalendar
);

router.get('/', authGuard, calendarController.getCalendars);

router.put(
    '/:id',
    authGuard,
    uploadConfig.single('image'),
    calendarController.updateCalendar
);

router.delete('/:id', authGuard, calendarController.deleteCalendar);

// Event management
router.post('/:id/events', authGuard, calendarController.addEvent);
router.put('/:id/events/:eventId', authGuard, calendarController.updateEvent);
router.delete('/:id/events/:eventId', authGuard, calendarController.deleteEvent);

export default router;
