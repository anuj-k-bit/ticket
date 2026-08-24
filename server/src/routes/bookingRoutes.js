import express from 'express';
import {
  confirmBooking,
  cancelBooking,
  getUserBookings,
  getBookingById,
  verifyTicketByRef,
  checkInTicket
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody, schemas } from '../middleware/zodValidationMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/confirm', validateBody(schemas.confirmBooking), confirmBooking);
router.post('/:id/cancel', cancelBooking);
router.get('/my-bookings', getUserBookings);

// Organiser / Admin Ticket Verification & Check-In Routes
router.get('/verify/:ref', authorize('organiser', 'admin'), verifyTicketByRef);
router.post('/check-in', authorize('organiser', 'admin'), validateBody(schemas.checkInTicket), checkInTicket);

router.get('/:id', getBookingById);

export default router;
